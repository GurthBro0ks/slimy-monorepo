import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";

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

// GET /api/owner/crypto/bot
// Proxies requests to the bot API on NUC1 via Tailscale
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const ctx = await requireOwner(request);

    // Fetch all bot endpoints in parallel
    const [status, health, farming, farmingLog, signals] = await Promise.all([
      fetchBot("/api/trading/status"),
      fetchBot("/api/trading/health"),
      fetchBot("/api/farming/status"),
      fetchBot("/api/farming/log"),
      fetchBot("/api/trading/signals"),
    ]);

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
        ok: !health.error && !health.degraded,
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
