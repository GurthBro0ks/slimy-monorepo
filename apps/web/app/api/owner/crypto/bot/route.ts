import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const BOT_API = process.env.BOT_API_URL || "http://100.106.127.22:8510";
const BOT_TIMEOUT = 8000; // 8 second timeout

async function fetchBot(path: string): Promise<any> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BOT_TIMEOUT);

    const res = await fetch(`${BOT_API}${path}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) return { error: `Bot API returned ${res.status}` };
    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") return { error: "Bot API timeout" };
    return { error: err.message || "Bot API unreachable" };
  }
}

/**
 * Fire a notification only if no identical one exists within the given time window.
 * This prevents spamming the same notification every time the endpoint is polled.
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

// GET /api/owner/crypto/bot
// Proxies requests to the bot API on NUC1 via Tailscale
export async function GET(request: NextRequest) {
  try {
    // Auth check
    await requireOwner(request);

    // Fetch all bot endpoints in parallel
    const [status, health, farming, farmingLog, signals] = await Promise.all([
      fetchBot("/api/trading/status"),
      fetchBot("/api/trading/health"),
      fetchBot("/api/farming/status"),
      fetchBot("/api/farming/log"),
      fetchBot("/api/trading/signals"),
    ]);

    // Check health and create notification if unhealthy
    const isUnhealthy = health.error || health.degraded;
    if (isUnhealthy) {
      const healthError = health.error || health.degraded || "Unknown health issue";
      await notifyIfNew({
        type: "bot_error",
        severity: "warn",
        title: "Trading Bot Health Issue",
        message: `Bot health check failed: ${healthError}`,
        windowMs: 5 * 60 * 1000,
      });
    }

    // Also check if bot API is completely unreachable (all endpoints have errors)
    const totalErrors = [status, health, farming, farmingLog, signals].filter(
      (ep) => ep.error
    ).length;
    if (totalErrors >= 4) {
      await notifyIfNew({
        type: "bot_error",
        severity: "error",
        title: "Trading Bot Unreachable",
        message: `Bot API is not responding. ${totalErrors}/5 endpoints failed.`,
        windowMs: 5 * 60 * 1000,
      });
    }

    return NextResponse.json({
      trading: {
        bankroll: status.bankroll || null,
        positions: status.positions || [],
        phases: status.phases || {},
        recentTrades: status.recent_trades || [],
        mode: status.mode || "unknown",
        timestamp: status.timestamp || null,
        error: status.error || null,
      },
      health: {
        ok: !isUnhealthy,
        details: health,
        error: health.error || null,
      },
      farming: {
        stats: farming.farming || null,
        airdrops: farming.airdrops || [],
        error: farming.error || null,
      },
      farmingLog: {
        actions: Array.isArray(farmingLog) ? farmingLog :
                 farmingLog?.entries || farmingLog?.actions || farmingLog?.log || [],
        error: farmingLog?.error || null,
      },
      signals: {
        pending: signals.pending_actions || [],
        forceExits: signals.force_exits || [],
        error: signals.error || null,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/crypto/bot GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
