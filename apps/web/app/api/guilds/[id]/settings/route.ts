import { NextRequest, NextResponse } from "next/server";
import { getGuildFlags, updateGuildFlags, isExperimentEnabled } from "@/lib/feature-flags";
import { sendAuditEvent, AuditActions, ResourceTypes } from "@/lib/api/auditLog";

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
  const { id: guildId } = await params;

  try {
    const body: { publicStatsEnabled?: boolean } = await request.json();

    // TODO: Implement server-side role verification (must be admin)
    // For now, assume admin role for simplicity

    // Capture old values for audit trail
    const oldFlags = getGuildFlags(guildId);
    const oldPublicStats = oldFlags.experiments.publicStats;

    const updates: any = {};
    if (typeof body.publicStatsEnabled === "boolean") {
      updates.experiments = { publicStats: body.publicStatsEnabled };
    }

    const updatedFlags = updateGuildFlags(guildId, updates);

    // Log the settings update to audit log (non-blocking)
    sendAuditEvent({
      action: AuditActions.GUILD_SETTINGS_UPDATE,
      resourceType: ResourceTypes.GUILD,
      resourceId: guildId,
      details: {
        changed: ['publicStatsEnabled'],
        before: { publicStatsEnabled: oldPublicStats },
        after: { publicStatsEnabled: updatedFlags.experiments.publicStats },
      },
    }).catch(err => {
      console.error('[Audit] Failed to log guild settings update:', err);
    });

    return NextResponse.json({
      ok: true,
      publicStatsEnabled: updatedFlags.experiments.publicStats,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Failed to update guild settings:", error);

    // Log the failed attempt to audit log (non-blocking)
    sendAuditEvent({
      action: AuditActions.GUILD_SETTINGS_UPDATE,
      resourceType: ResourceTypes.GUILD,
      resourceId: guildId,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    }).catch(err => {
      console.error('[Audit] Failed to log failed guild settings update:', err);
    });

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
