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

// GET /api/owner/crypto/trading/timeseries
export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    // Weekly PnL by strategy type (kalshi_optimize, shadow, live)
    // Group by week (ISO week) and sum pnl_usd
    const rows: any[] = queryDb(`
      SELECT
        strftime('%Y-W%W', timestamp) as week,
        COALESCE(phase, 'kalshi_optimize') as strategy_type,
        SUM(pnl_usd) as pnl
      FROM trades
      GROUP BY week, strategy_type
      ORDER BY week ASC
    `);

    // Pivot to get columns: week, kalshi_optimize, shadow, live
    const weekMap = new Map<string, Record<string, number>>();
    for (const r of rows) {
      if (!weekMap.has(r.week)) {
        weekMap.set(r.week, { week: r.week, kalshi_optimize: 0, shadow: 0, live: 0 });
      }
      const entry = weekMap.get(r.week)!;
      const strategy = r.strategy_type || "kalshi_optimize";
      if (strategy in entry) {
        entry[strategy] = Math.round((entry[strategy] + Number(r.pnl || 0)) * 100) / 100;
      }
    }

    const series = Array.from(weekMap.values());

    return NextResponse.json({ series });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/owner/crypto/trading/timeseries GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
