import { NextRequest, NextResponse } from "next/server";
import { getAggregator, filterByScope, searchCodes } from "@/lib/codes-aggregator";

export const runtime = "nodejs";
export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const scope = searchParams.get("scope") || "active";
    const query = searchParams.get("q") || "";
    const includeMetadata = searchParams.get("metadata") === "true";
    const health = searchParams.get("health") === "true";

    const aggregator = getAggregator();

    // Health check endpoint
    if (health) {
      const healthStatus = await aggregator.getHealthStatus();
      return NextResponse.json({
        status: healthStatus.overall,
        timestamp: new Date().toISOString(),
        ...healthStatus,
      });
    }

    // Aggregate codes from all sources
    const result = await aggregator.aggregateCodes();

    // Filter by scope
    let filteredCodes = filterByScope(result.codes, scope);

    // Search if query provided
    if (query.trim()) {
      filteredCodes = searchCodes(filteredCodes, query);
    }

    // Build response
    const response: Record<string, unknown> = {
      codes: filteredCodes,
      sources: result.sources,
      scope,
      query: query || undefined,
      count: filteredCodes.length,
      timestamp: result.metadata.timestamp,
    };

    // Include metadata if requested
    if (includeMetadata) {
      response.metadata = result.metadata;
    }

    // Determine cache headers based on data freshness
    const cacheHeaders = getCacheHeaders(result.metadata.cache);

    // Add processing time
    const processingTime = Date.now() - startTime;
    response._processingTime = processingTime;

    return NextResponse.json(response, {
      headers: {
        ...cacheHeaders,
        "X-Processing-Time": `${processingTime}ms`,
        "X-Data-Freshness": result.metadata.cache.stale ? "stale" : "fresh",
        "X-Sources-Total": result.metadata.totalSources.toString(),
        "X-Sources-Successful": result.metadata.successfulSources.toString(),
        "X-Sources-Failed": result.metadata.failedSources.toString(),
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error("Codes API error:", error);

    // Enhanced error response
    const errorResponse = {
      ok: false,
      code: "AGGREGATION_ERROR",
      message: "Failed to aggregate codes",
      details: error instanceof Error ? error.message : String(error),
      codes: [],
      timestamp: new Date().toISOString(),
      _processingTime: processingTime,
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        "X-Processing-Time": `${processingTime}ms`,
        "X-Error-Code": "AGGREGATION_ERROR",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
}

/**
 * Determine cache headers based on data freshness
 */
function getCacheHeaders(cacheMetadata: { hit: boolean; stale: boolean; age?: number }) {
  const baseHeaders = {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
  };

  // If we have stale data, reduce cache time
  if (cacheMetadata.stale) {
    return {
      ...baseHeaders,
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      "X-Cache-Status": "stale",
    };
  }

  // Fresh data
  return {
    ...baseHeaders,
    "X-Cache-Status": "fresh",
  };
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
