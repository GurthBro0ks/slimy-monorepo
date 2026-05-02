import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { verifyTx, detectChain } from "@/lib/tx-verify";

const BOT_API = process.env.BOT_API_URL || "http://100.106.127.22:8510";

/**
 * Fire a notification only if no identical one exists within the given time window.
 */
async function notifyIfNew(opts: {
  type: string;
  severity: string;
  title: string;
  message: string;
  windowMs?: number;
}) {
  const { type, severity, title, message, windowMs = 5 * 60 * 1000 } = opts;
  const recent = await prisma.slimyNotification.findFirst({
    where: { type },
    orderBy: { createdAt: "desc" },
  });
  const cutoff = new Date(Date.now() - windowMs);
  if (!recent || recent.createdAt < cutoff) {
    await createNotification({ type: type as any, severity: severity as any, title, message });
  }
}

/**
 * Check for broken streaks on automated tasks (those with botActionKey set).
 * A streak is considered broken if the last completion was more than 36 hours ago.
 * Dedup: one notification per task per 12 hours.
 */
async function checkStreakBreaks() {
  const TWELVE_HRS = 12 * 60 * 60 * 1000;
  const twelveHrsAgo = new Date(Date.now() - TWELVE_HRS);

  // Get all tasks with botActionKey
  const tasks = await prisma.airdropTask.findMany({
    where: { botActionKey: { not: null } },
    select: { id: true, name: true, botActionKey: true },
  });

  for (const task of tasks) {
    // Find most recent completion for this task
    const lastCompletion = await prisma.airdropCompletion.findFirst({
      where: { taskId: task.id },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    const lastTime = lastCompletion?.completedAt?.getTime() ?? 0;
    const hoursAgo = (Date.now() - lastTime) / (1000 * 60 * 60);

    if (lastTime > 0 && hoursAgo > 36) {
      // Check dedup: any streak_break notification for this task in the last 12h?
      const recentStreakNotif = await prisma.slimyNotification.findFirst({
        where: {
          type: "streak_break",
          createdAt: { gte: twelveHrsAgo },
          message: { contains: task.name },
        },
      });

      if (!recentStreakNotif) {
        await createNotification({
          type: "streak_break",
          severity: "warn",
          title: "Airdrop Streak Break",
          message: `Task "${task.name}" — last completed ${Math.round(hoursAgo)}h ago`,
        });
      }
    }
  }
}

// POST /api/owner/crypto/sync-bot
// Fetches bot farming log from NUC1 and creates AirdropCompletion records
export async function POST(request: NextRequest) {
  try {
    // Auth check — owner only
    await requireOwner(request);

    // 1. Fetch bot farming log from NUC1
    let botActions: any[] = [];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${BOT_API}/api/farming/log`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return NextResponse.json({ error: `Bot API returned ${res.status}` }, { status: 502 });
      }

      const data = await res.json();
      // Handle different response shapes
      botActions = Array.isArray(data) ? data :
                   data.actions || data.log || data.entries || [];
    } catch (err: any) {
      // Create notification for sync failure
      await notifyIfNew({
        type: "sync_fail",
        severity: "error",
        title: "Bot Sync Failed",
        message: `Could not reach bot API: ${err.message}`,
        windowMs: 5 * 60 * 1000,
      });
      return NextResponse.json({ error: `Bot API unreachable: ${err.message}` }, { status: 502 });
    }

    if (botActions.length === 0) {
      // Empty payload — may indicate a problem
      await notifyIfNew({
        type: "farming_quality",
        severity: "warn",
        title: "Empty Sync Payload",
        message: "Bot sync completed but no farming actions were returned.",
        windowMs: 5 * 60 * 1000,
      });
      return NextResponse.json({ synced: 0, skipped: 0, unmatched: 0, message: "No bot actions found" });
    }

    // 2. Get all tasks with botActionKey
    const tasks = await prisma.airdropTask.findMany({
      where: { botActionKey: { not: null } },
      select: { id: true, botActionKey: true, airdropId: true, name: true, airdrop: { select: { protocol: true, token: true } } },
    });

    // Build a lookup: botActionKey → taskId
    const keyToTasks: Record<string, { id: string; airdropId: string; name: string; airdrop: { protocol: string; token: string } }[]> = {};
    for (const t of tasks) {
      if (t.botActionKey) {
        if (!keyToTasks[t.botActionKey]) {
          keyToTasks[t.botActionKey] = [];
        }
        keyToTasks[t.botActionKey].push({ id: t.id, airdropId: t.airdropId, name: t.name, airdrop: t.airdrop });
      }
    }

    // 3. For each bot action, try to create a completion
    let synced = 0;
    let skipped = 0;
    let unmatched = 0;
    const details: any[] = [];
    const failedActions: string[] = [];

    for (const action of botActions) {
      // Extract action key and timestamp from the bot log entry
      const actionType = action.type || action.action || action.name || null;
      const protocol = action.protocol || action.chain || null;
      const actionTime = action.timestamp || action.date || action.created_at || action.time || null;
      const actionStatus = action.status || action.error || null;

      // Detect failed actions
      if (actionStatus === "failed" || actionStatus === "error") {
        failedActions.push(`${actionType}${protocol ? ` (${protocol})` : ""}`);
      }

      if (!actionType) {
        unmatched++;
        details.push({ action: actionType, status: "no_type" });
        continue;
      }

      // Determine the action key with protocol-aware matching for "swap" type
      let actionKey: string | null = null;
      if (actionType === "swap") {
        if (protocol === "aerodrome") {
          actionKey = "swap_aerodrome";
        } else if (protocol === "uniswap_v3") {
          actionKey = "swap_uniswap";
        } else {
          actionKey = "swap"; // generic swap fallback
        }
      } else {
        actionKey = actionType;
      }

      // Find matching task(s)
      const matchingTasks = actionKey ? keyToTasks[actionKey] || [] : [];
      if (matchingTasks.length === 0) {
        unmatched++;
        details.push({ action: actionType, protocol, status: "no_matching_task" });
        continue;
      }

      // Parse timestamp
      let completedAt: Date;
      if (actionTime) {
        completedAt = new Date(actionTime);
        if (isNaN(completedAt.getTime())) {
          completedAt = new Date(); // Fallback to now
        }
      } else {
        completedAt = new Date();
      }

      // 4. Dedup: check if a bot completion already exists for this task at this time
      const windowMs = 5 * 60 * 1000;

      for (const task of matchingTasks) {
        const existing = await prisma.airdropCompletion.findFirst({
          where: {
            taskId: task.id,
            source: "bot",
            completedAt: {
              gte: new Date(completedAt.getTime() - windowMs),
              lte: new Date(completedAt.getTime() + windowMs),
            },
          },
        });

        if (existing) {
          skipped++;
          details.push({ action: actionType, task: task.name, status: "duplicate" });
          continue;
        }

        // 5. Create completion
        const txHash = action.tx_hash || action.hash || null;
        const txLink = txHash ? `https://basescan.org/tx/${txHash}` :
                action.tx_link || action.txLink || null;
        const completion = await prisma.airdropCompletion.create({
          data: {
            taskId: task.id,
            completedAt,
            source: "bot",
            notes: `Bot: ${actionType}${protocol ? ` (${protocol})` : ""}${txHash ? ` tx:${txHash.slice(0, 8)}...` : ""}`,
            txLink,
          },
        });

        // Fire-and-forget TX verification
        if (txHash) {
          const chain = detectChain(task.airdrop.protocol, task.airdrop.token) as "ethereum" | "base";
          verifyTx(txHash, chain)
            .then((result) => {
              prisma.airdropCompletion.update({
                where: { id: completion.id },
                data: {
                  txVerified: result.verified,
                  txStatus: result.status,
                  txBlockNumber: result.blockNumber ?? null,
                  txChain: chain,
                  txVerifiedAt: new Date(),
                },
              }).catch(() => {});
            })
            .catch(() => {});
        }

        synced++;
        details.push({ action: actionType, task: task.name, status: "synced", time: completedAt.toISOString() });
      }
    }

    // 6. Notify on failed actions (aggregate into one notification)
    if (failedActions.length > 0) {
      await notifyIfNew({
        type: "farming_quality",
        severity: "warn",
        title: "Farming Action Failed",
        message: `Actions failed during sync: ${failedActions.join(", ")}`,
        windowMs: 5 * 60 * 1000,
      });
    }

    // 7. Check for broken streaks on automated tasks
    await checkStreakBreaks();

    return NextResponse.json({
      synced,
      skipped,
      unmatched,
      total: botActions.length,
      details: details.slice(0, 50),
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/crypto/sync-bot POST] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

// GET /api/owner/crypto/sync-bot
// Return sync status (last sync time, counts)
export async function GET(request: NextRequest) {
  try {
    // Auth check
    await requireOwner(request);

    // Count bot-sourced completions
    const botCompletions = await prisma.airdropCompletion.count({
      where: { source: "bot" },
    });

    const lastBotCompletion = await prisma.airdropCompletion.findFirst({
      where: { source: "bot" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, notes: true },
    });

    // Count tasks with botActionKey
    const mappedTasks = await prisma.airdropTask.count({
      where: { botActionKey: { not: null } },
    });

    return NextResponse.json({
      botCompletions,
      lastSync: lastBotCompletion?.createdAt || null,
      lastAction: lastBotCompletion?.notes || null,
      mappedTasks,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/crypto/sync-bot GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}