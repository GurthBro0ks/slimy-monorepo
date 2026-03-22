import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { getAggregator } from "@/lib/codes-aggregator";
import { getCache, CacheKeys } from "@/lib/codes/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/owner/snail-codes/scan
 * Forces a fresh scan of all code sources
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    await requireOwner(request);

    const aggregator = getAggregator();
    const cache = getCache();

    // Clear the cache to force a fresh fetch
    await cache.delete(CacheKeys.aggregatedCodes);

    // Run fresh aggregation
    const result = await aggregator.aggregateCodes();

    // Categorize codes
    const newCodes: string[] = [];
    const olderCodes: string[] = [];

    for (const code of result.codes) {
      if (code.source === "snelp") {
        if (!newCodes.includes(code.code)) {
          newCodes.push(code.code);
        }
      } else {
        if (!olderCodes.includes(code.code)) {
          olderCodes.push(code.code);
        }
      }
    }

    return NextResponse.json({
      success: true,
      new_codes: newCodes.length,
      older_codes: olderCodes.length,
      sources_scraped: result.metadata.totalSources,
      sources: Object.keys(result.sources),
      timestamp: result.metadata.timestamp,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/snail-codes/scan POST] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
