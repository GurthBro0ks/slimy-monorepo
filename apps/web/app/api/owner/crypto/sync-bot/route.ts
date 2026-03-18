import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

const BOT_API = process.env.BOT_API_URL || "http://100.106.127.22:8510";

// POST /api/owner/crypto/sync-bot
// Fetches bot farming log from NUC1 and creates AirdropCompletion records
export async function POST(request: NextRequest) {
  try {
    // Auth check — owner only
    const ctx = await requireOwner(request);

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
      return NextResponse.json({ error: `Bot API unreachable: ${err.message}` }, { status: 502 });
    }

    if (botActions.length === 0) {
      return NextResponse.json({ synced: 0, skipped: 0, unmatched: 0, message: "No bot actions found" });
    }

    // 2. Get all tasks with botActionKey
    const tasks = await prisma.airdropTask.findMany({
      where: { botActionKey: { not: null } },
      select: { id: true, botActionKey: true, airdropId: true, name: true },
    });

    // Build a lookup: botActionKey → taskId
    // Also need to handle protocol-based matching for swaps
    const keyToTasks: Record<string, { id: string; airdropId: string; name: string }[]> = {};
    for (const t of tasks) {
      if (t.botActionKey) {
        if (!keyToTasks[t.botActionKey]) {
          keyToTasks[t.botActionKey] = [];
        }
        keyToTasks[t.botActionKey].push({ id: t.id, airdropId: t.airdropId, name: t.name });
      }
    }

    // 3. For each bot action, try to create a completion
    let synced = 0;
    let skipped = 0;
    let unmatched = 0;
    const details: any[] = [];

    for (const action of botActions) {
      // Extract action key and timestamp from the bot log entry
      // Bot log uses: type (e.g., "swap", "nft_mint", "aave_deposit"), protocol (e.g., "aerodrome", "uniswap_v3")
      const actionType = action.type || action.action || action.name || null;
      const protocol = action.protocol || action.chain || null;
      const actionTime = action.timestamp || action.date || action.created_at || action.time || null;

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
      const matchingTasks = keyToTasks[actionKey] || [];
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
      // Use a window of +/- 5 minutes to handle slight timestamp differences
      const windowMs = 5 * 60 * 1000;

      // For each matching task, check and create completion if not exists
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
        await prisma.airdropCompletion.create({
          data: {
            taskId: task.id,
            completedAt,
            source: "bot",
            notes: `Bot: ${actionType}${protocol ? ` (${protocol})` : ""}${txHash ? ` tx:${txHash.slice(0, 8)}...` : ""}`,
            txLink: txHash ? `https://basescan.org/tx/${txHash}` :
                    action.tx_link || action.txLink || null,
          },
        });

        synced++;
        details.push({ action: actionType, task: task.name, status: "synced", time: completedAt.toISOString() });
      }
    }

    return NextResponse.json({
      synced,
      skipped,
      unmatched,
      total: botActions.length,
      details: details.slice(0, 50), // Limit detail output
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
    const ctx = await requireOwner(request);

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