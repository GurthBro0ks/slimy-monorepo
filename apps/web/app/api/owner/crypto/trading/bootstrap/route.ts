import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const DATA_DIR = process.env.TRADING_DATA_DIR || "/opt/slimy/pm_updown_bot_bundle";
const PROOF_DIR = join(DATA_DIR, "proofs");

// GET /api/owner/crypto/trading/bootstrap
export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    // Find all bootstrap proof files
    let files: string[] = [];
    try {
      files = readdirSync(PROOF_DIR)
        .filter(f => f.startsWith("bootstrap_validation_") && f.endsWith(".json"))
        .sort()
        .reverse();
    } catch {
      return NextResponse.json({
        latest: null,
        history: [],
        error: "Proof directory not accessible",
      });
    }

    // Parse all proof files
    const history: any[] = [];
    for (const file of files) {
      try {
        const raw = readFileSync(join(PROOF_DIR, file), "utf8");
        const content = JSON.parse(raw);
        history.push({
          date: content.timestamp,
          verdict: content.verdict,
          trades: content.total_trades,
          pValue: content.p_value_no_edge,
          observedWinRate: content.observed_win_rate,
          ci95MeanPnl: content.ci_95_mean_pnl,
          strategyType: content.strategy_type,
          file,
          reason: content.verdict_reason,
        });
      } catch {
        // Skip malformed files
      }
    }

    const latest = history.length > 0 ? history[0] : null;

    return NextResponse.json({ latest, history });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/owner/crypto/trading/bootstrap GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
