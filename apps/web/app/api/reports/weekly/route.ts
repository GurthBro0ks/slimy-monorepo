import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { AuthenticationError } from "@/lib/errors";

export const dynamic = "force-dynamic"; // no-store

/**
 * GET /api/reports/weekly
 * Generate and retrieve a weekly club report
 *
 * Query Parameters:
 * - guildId: Guild ID (required)
 * - weekStart: ISO date string for week start (optional)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get("guildId");
    const weekStart = searchParams.get("weekStart");

    // Validate required parameters
    if (!guildId) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "guildId is required",
        },
        { status: 400 }
      );
    }

    // Build query parameters for admin-api
    const queryParams = new URLSearchParams({
      guildId,
      ...(weekStart && { weekStart }),
    });

    // Proxy to admin-api
    const result = await apiClient.get(`/api/reports/weekly?${queryParams}`, {
      useCache: false, // Reports should always be fresh
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    console.error("Failed to generate weekly report:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly report", code: "REPORT_ERROR" },
      { status: 500 }
    );
  }
}
