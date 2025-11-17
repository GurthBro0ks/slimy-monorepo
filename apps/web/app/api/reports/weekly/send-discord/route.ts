import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { AuthenticationError } from "@/lib/errors";

export const dynamic = "force-dynamic"; // no-store

/**
 * POST /api/reports/weekly/send-discord
 * Generate a weekly report and send it to a Discord channel
 *
 * Body:
 * - guildId: Guild ID (required)
 * - channelId: Discord channel ID (required)
 * - weekStart: ISO date string for week start (optional)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const body = await request.json();
    const { guildId, channelId, weekStart } = body;

    // Validate required parameters
    if (!guildId || !channelId) {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "guildId and channelId are required",
        },
        { status: 400 }
      );
    }

    if (typeof guildId !== "string" || typeof channelId !== "string") {
      return NextResponse.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          message: "guildId and channelId must be strings",
        },
        { status: 400 }
      );
    }

    // Proxy to admin-api
    const result = await apiClient.post("/api/reports/weekly/send-discord", {
      guildId,
      channelId,
      ...(weekStart && { weekStart }),
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
    console.error("Failed to send Discord report:", error);
    return NextResponse.json(
      { error: "Failed to send Discord report", code: "DISCORD_SEND_ERROR" },
      { status: 500 }
    );
  }
}
