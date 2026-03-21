import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { execSync } from "child_process";

const DATA_DIR = process.env.TRADING_DATA_DIR || "/opt/slimy/pm_updown_bot_bundle";
const BONUSES_DB = `${DATA_DIR}/paper_trading/bonuses.db`;

function queryDb(sql: string): any[] {
  try {
    const out = execSync(`sqlite3 -json "${BONUSES_DB}"`, { input: sql, encoding: "utf8" });
    if (!out.trim()) return [];
    return JSON.parse(out.trim());
  } catch {
    return [];
  }
}

// GET /api/owner/crypto/trading/matched
export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    // Sportsbooks
    const sportsbooks: any[] = queryDb(`
      SELECT id, name, signup_bonus_type as bonusType, signup_bonus_amount as amount,
             rollover_multiplier as rollover, status, notes
      FROM sportsbooks
      ORDER BY amount DESC
    `);

    // Conversions
    const conversions = queryDb(`
      SELECT c.id, c.bonus_amount as bonusAmount, c.conversion_rate as conversionRate,
             c.guaranteed_profit as guaranteedProfit, c.actual_profit as actualProfit,
             c.completed_at as completedAt, s.name as sportsbookName
      FROM conversions c
      JOIN sportsbooks s ON c.sportsbook_id = s.id
      ORDER BY c.completed_at DESC
    `);

    // Summary
    const summaryRow = queryDb(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'available' THEN signup_bonus_amount END), 0) as totalAvailable,
        COALESCE(SUM(CASE WHEN status = 'claimed' THEN signup_bonus_amount END), 0) as totalClaimed,
        COUNT(CASE WHEN status = 'available' END) as availableCount,
        COUNT(CASE WHEN status = 'claimed' END) as claimedCount,
        COUNT(CASE WHEN status = 'completed' END) as completedCount
      FROM sportsbooks
    `)[0] || {};

    const profitRow = queryDb(`SELECT COALESCE(SUM(actual_profit), 0) as totalProfit FROM conversions`)[0] || {};

    const totalEstimatedEV = Number(summaryRow.totalAvailable || 0) * 0.70;
    const bestConversionRow: any = queryDb(`
      SELECT MAX(conversion_rate) as best FROM conversions WHERE conversion_rate > 0
    `)[0] || {};
    const bestConversionRate = Number(bestConversionRow.best || 0);

    // Add rolloverEV to each sportsbook
    const sportsbooksWithEV = sportsbooks.map((b: any) => {
      const rolloverEV = b.amount - (b.amount * b.rollover * 0.045);
      return { ...b, rolloverEV: Math.round(rolloverEV * 100) / 100 };
    });

    return NextResponse.json({
      summary: {
        totalEstimatedEV: Math.round(totalEstimatedEV * 100) / 100,
        bonusesClaimed: Number(summaryRow.claimedCount || 0),
        bonusesAvailable: Number(summaryRow.availableCount || 0),
        totalProfitRealized: Math.round(Number(profitRow.totalProfit || 0) * 100) / 100,
        bestConversionRate: Math.round(bestConversionRate * 10) / 10,
      },
      sportsbooks: sportsbooksWithEV,
      conversions: conversions.map((c: any) => ({
        ...c,
        bonusAmount: Math.round(Number(c.bonusAmount || 0) * 100) / 100,
        conversionRate: Math.round(Number(c.conversionRate || 0) * 10) / 10,
        guaranteedProfit: Math.round(Number(c.guaranteedProfit || 0) * 100) / 100,
        actualProfit: Math.round(Number(c.actualProfit || 0) * 100) / 100,
      })),
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/owner/crypto/trading/matched GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
