import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { execSync } from "child_process";

const DATA_DIR = process.env.TRADING_DATA_DIR || "/opt/slimy/pm_updown_bot_bundle";
const PNL_DB = `${DATA_DIR}/paper_trading/pnl.db`;

function queryDb(sql: string): any[] {
  try {
    const out = execSync(`sqlite3 -json "${PNL_DB}"`, { input: sql, encoding: "utf8" });
    if (!out.trim()) return [];
    return JSON.parse(out.trim());
  } catch {
    return [];
  }
}

// GET /api/owner/crypto/trading/kalshi
export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    // Summary stats
    const totalRow: any = queryDb(`
      SELECT
        COUNT(*) as totalTrades,
        COALESCE(SUM(pnl_usd), 0) as totalPnl,
        COALESCE(AVG(pnl_usd), 0) as avgPnl,
        COALESCE(SUM(CASE WHEN pnl_usd > 0 THEN 1 ELSE 0 END), 0) as wins
      FROM trades
    `)[0] || {};

    const totalTrades = Number(totalRow.totalTrades || 0);
    const wins = Number(totalRow.wins || 0);
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    // Payoff ratio
    const payoffRow: any = queryDb(`
      SELECT
        COALESCE(AVG(CASE WHEN pnl_usd > 0 THEN pnl_usd END), 0) as avgWin,
        COALESCE(ABS(AVG(CASE WHEN pnl_usd < 0 THEN pnl_usd END)), 0) as avgLoss
      FROM trades WHERE pnl_usd != 0
    `)[0] || {};
    const payoffRatio = Number(payoffRow.avgLoss || 0) > 0
      ? Number(payoffRow.avgWin) / Number(payoffRow.avgLoss)
      : 0;

    // Phase breakdown
    const phaseRows: any[] = queryDb(`
      SELECT phase, COUNT(*) as count FROM trades GROUP BY phase
    `);
    const shadowTrades = phaseRows.find((r: any) => r.phase === "shadow")?.count || 0;
    const liveTrades = phaseRows.find((r: any) => r.phase === "live")?.count || 0;

    // Cumulative PnL ordered by timestamp
    const cumulativeRows: any[] = queryDb(`
      SELECT timestamp, pnl_usd, phase
      FROM trades
      ORDER BY timestamp ASC
    `);
    let cumPnl = 0;
    const cumulativePnl = cumulativeRows.map((r: any) => {
      cumPnl += Number(r.pnl_usd || 0);
      return {
        timestamp: r.timestamp,
        pnl: Number(r.pnl_usd || 0),
        cumPnl: Math.round(cumPnl * 100) / 100,
        source: r.phase,
      };
    });

    // PnL distribution (histogram buckets)
    const buckets = [
      { bucket: "<-$10", count: 0 },
      { bucket: "-$10 to -$1", count: 0 },
      { bucket: "-$1 to $0", count: 0 },
      { bucket: "$0 to $1", count: 0 },
      { bucket: "$1 to $10", count: 0 },
      { bucket: ">$10", count: 0 },
    ];
    for (const r of cumulativeRows) {
      const pnl = Number(r.pnl_usd || 0);
      if (pnl < -10) buckets[0].count++;
      else if (pnl < -1) buckets[1].count++;
      else if (pnl < 0) buckets[2].count++;
      else if (pnl < 1) buckets[3].count++;
      else if (pnl < 10) buckets[4].count++;
      else buckets[5].count++;
    }

    // Recent trades (last 50)
    const recentTrades: any[] = queryDb(`
      SELECT timestamp, ticker as marketId, action as side, price as entryPrice, pnl_usd as pnlUsd, phase as source
      FROM trades
      ORDER BY timestamp DESC
      LIMIT 50
    `);

    return NextResponse.json({
      summary: {
        totalTrades,
        winRate: Math.round(winRate * 10) / 10,
        totalPnl: Math.round(Number(totalRow.totalPnl || 0) * 100) / 100,
        avgPnl: Math.round(Number(totalRow.avgPnl || 0) * 100) / 100,
        payoffRatio: Math.round(payoffRatio * 100) / 100,
        shadowTrades,
        liveTrades,
      },
      cumulativePnl,
      pnlDistribution: buckets,
      recentTrades: recentTrades.map((r: any) => ({
        timestamp: r.timestamp,
        marketId: r.marketId,
        side: r.side,
        entryPrice: Number(r.entryPrice || 0),
        pnlUsd: Math.round(Number(r.pnlUsd || 0) * 100) / 100,
        source: r.source,
      })),
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/owner/crypto/trading/kalshi GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
