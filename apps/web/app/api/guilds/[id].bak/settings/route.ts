import { NextRequest, NextResponse } from "next/server";
import { getGuildFlags, updateGuildFlags, isExperimentEnabled } from "@/lib/feature-flags";

export const runtime = "nodejs";

/**
 * GET /api/guilds/:id/settings
 * Get guild settings (flags)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guildId } = await params;
    const flags = getGuildFlags(guildId);

    // Only expose relevant settings for the client
    return NextResponse.json({
      guildId,
      publicStatsEnabled: isExperimentEnabled(guildId, "publicStats"),
      theme: flags.theme,
    });
  } catch (error) {
    console.error("Failed to get guild settings:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "SETTINGS_FETCH_ERROR",
        message: "Failed to fetch guild settings",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/guilds/:id/settings
 * Update guild settings (requires admin role)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guildId } = await params;
    const body: { publicStatsEnabled?: boolean } = await request.json();

    // TODO: Implement server-side role verification (must be admin)
    // For now, assume admin role for simplicity

    const updates: any = {};
    if (typeof body.publicStatsEnabled === "boolean") {
      updates.experiments = { publicStats: body.publicStatsEnabled };
    }

    const updatedFlags = updateGuildFlags(guildId, updates);

    return NextResponse.json({
      ok: true,
      publicStatsEnabled: updatedFlags.experiments.publicStats,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Failed to update guild settings:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "SETTINGS_UPDATE_ERROR",
        message: "Failed to update guild settings",
      },
      { status: 500 }
    );
  }
}
