import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

export const dynamic = "force-dynamic";

/**
 * GET /api/slimecraft/players
 * List all Slime.craft players
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") || undefined;

    const queryParams = new URLSearchParams({
      ...(activeOnly && { activeOnly }),
    });

    const result = await apiClient.get(
      `/api/slimecraft/players?${queryParams}`,
      {
        useCache: true,
        cacheTtl: 60000, // 1 minute TTL
      }
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 503 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Failed to fetch Slime.craft players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players", code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}
