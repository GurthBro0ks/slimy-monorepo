import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { AuthenticationError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/slimecraft/player-stats/import
 * Import player stats (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const body = await request.json();

    const result = await apiClient.post(
      "/api/slimecraft/player-stats/import",
      body
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 503 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    console.error("Failed to import player stats:", error);
    return NextResponse.json(
      { error: "Failed to import player stats", code: "IMPORT_ERROR" },
      { status: 500 }
    );
  }
}
