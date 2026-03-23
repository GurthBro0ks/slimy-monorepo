import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { getAggregator } from "@/lib/codes-aggregator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/owner/snail-codes
 * Returns codes categorized as "new" (from snelp) and "older" (from wiki)
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    await requireOwner(request);

    const aggregator = getAggregator();
    const result = await aggregator.aggregateCodes();

    // Categorize codes:
    // - "new" = codes from snelp source (official, known working)
    // - "older" = codes from wiki and reddit (may or may not still work)
    const newCodes: string[] = [];
    const olderCodes: string[] = [];

    for (const code of result.codes) {
      if (code.source === "snelp") {
        if (!newCodes.includes(code.code)) {
          newCodes.push(code.code);
        }
      } else {
        // wiki or reddit - considered older
        if (!olderCodes.includes(code.code)) {
          olderCodes.push(code.code);
        }
      }
    }

    // Sort alphabetically within each category
    newCodes.sort();
    olderCodes.sort();

    // Get last updated from metadata
    const lastUpdated = result.metadata.timestamp;
    const sources = Object.keys(result.sources);

    return NextResponse.json({
      new_codes: newCodes,
      older_codes: olderCodes,
      last_updated: lastUpdated,
      sources,
      stats: {
        total: result.codes.length,
        new: newCodes.length,
        older: olderCodes.length,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/snail-codes GET] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
