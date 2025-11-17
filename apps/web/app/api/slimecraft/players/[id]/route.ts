import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

export const dynamic = "force-dynamic";

/**
 * GET /api/slimecraft/players/[id]
 * Get player details with stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await apiClient.get(
      `/api/slimecraft/players/${params.id}`,
      {
        useCache: true,
        cacheTtl: 30000, // 30 seconds TTL
      }
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 503 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Failed to fetch player details:", error);
    return NextResponse.json(
      { error: "Failed to fetch player details", code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}
