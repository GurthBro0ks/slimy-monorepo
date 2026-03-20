import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { execSync } from "child_process";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const DATA_DIR = process.env.TRADING_DATA_DIR || "/opt/slimy/pm_updown_bot_bundle";
const PNL_DB = `${DATA_DIR}/paper_trading/pnl.db`;
const BONUSES_DB = `${DATA_DIR}/paper_trading/bonuses.db`;
const PROOF_DIR = join(DATA_DIR, "proofs");

function queryDb(db: string, sql: string): any[] {
  try {
    const out = execSync(`sqlite3 -json "${db}" "${sql}"`, { encoding: "utf8" });
    if (!out.trim()) return [];
    return out.trim().split("\n").map(line => JSON.parse(line));
  } catch {
    return [];
  }
}

// GET /api/owner/crypto/trading/overview
export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    // Kalshi PnL
    const kalshiRow: any = queryDb(PNL_DB, `
      SELECT COALESCE(SUM(pnl_usd), 0) as totalPnl, COUNT(*) as count
      FROM trades
    `)[0] || {};
    const kalshiPnl = Number(kalshiRow.totalPnl || 0);
    const kalshiTrades = Number(kalshiRow.count || 0);

    // Most recent trade = kalshi "balance"
    const latestTrade: any = queryDb(PNL_DB, `
      SELECT timestamp, pnl_usd FROM trades ORDER BY timestamp DESC LIMIT 1
    `)[0];

    // Matched betting EV
    const matchedRow: any = queryDb(BONUSES_DB, `
      SELECT COALESCE(SUM(CASE WHEN status = 'available' THEN signup_bonus_amount END), 0) as evRemaining,
             COUNT(CASE WHEN status = 'available' END) as available
      FROM sportsbooks
    `)[0] || {};
    const matchedProfitRow: any = queryDb(BONUSES_DB, `SELECT COALESCE(SUM(actual_profit), 0) as totalProfit FROM conversions`)[0] || {};
    const matchedEV = Number(matchedRow.evRemaining || 0) * 0.70;
    const matchedProfit = Number(matchedProfitRow.totalProfit || 0);

    // Bootstrap verdict
    let bootstrapVerdict = "INSUFFICIENT_DATA";
    try {
      const files = readdirSync(PROOF_DIR)
        .filter(f => f.startsWith("bootstrap_validation_") && f.endsWith(".json"))
        .sort()
        .reverse();
      if (files.length > 0) {
        const raw = readFileSync(join(PROOF_DIR, files[0]), "utf8");
        const latest = JSON.parse(raw);
        bootstrapVerdict = latest.verdict || "INSUFFICIENT_DATA";
      }
    } catch {
      /* Bootstrap not available */
    }

    // Recent activity (last 10 from trades)
    const recentTrades: any[] = queryDb(PNL_DB, `
      SELECT timestamp, ticker as market, 'shadow' as source, pnl_usd as pnl
      FROM trades ORDER BY timestamp DESC LIMIT 5
    `);

    // Active streams count
    const activeStreams = (kalshiTrades > 0 ? 1 : 0) + (matchedEV > 0 ? 1 : 0) + 1; // kalshi + matched + shadow

    return NextResponse.json({
      totalPnl: Math.round((kalshiPnl + matchedProfit) * 100) / 100,
      kalshiBalance: latestTrade ? Math.round(Number(latestTrade.pnl_usd || 0) * 100) / 100 : null,
      activeStreams,
      bootstrapVerdict,
      weeklyRevenue: [],
      recentActivity: recentTrades.map((r: any) => ({
        timestamp: r.timestamp,
        market: r.market,
        side: "N/A",
        pnl: Math.round(Number(r.pnl || 0) * 100) / 100,
        source: r.source,
      })),
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/owner/crypto/trading/overview GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
