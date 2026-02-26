import { NextRequest, NextResponse } from "next/server";
import { getGuildFlags, updateGuildFlags, type GuildFlags } from "@/lib/feature-flags";

export const runtime = "nodejs";

/**
 * GET /api/guilds/:id/flags
 * Get feature flags for a guild
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guildId } = await params;

    const flags = getGuildFlags(guildId);

    return NextResponse.json(flags);
  } catch (error) {
    console.error("Failed to get guild flags:", error);

    return NextResponse.json(
      {
        ok: false,
        code: "FLAGS_ERROR",
        message: "Failed to get guild flags",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/guilds/:id/flags
 * Update feature flags for a guild
 * Requires admin role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guildId } = await params;

    // TODO: Verify admin role from session/token
    // For now, allow all updates (add auth later)

    const body: Partial<Omit<GuildFlags, "guildId" | "updatedAt">> = await request.json();

    // Validate updates
    if (body.theme?.colorPrimary && !/^#[0-9A-F]{6}$/i.test(body.theme.colorPrimary)) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_COLOR",
          message: "Invalid color format (must be #RRGGBB)",
        },
        { status: 400 }
      );
    }

    const updated = updateGuildFlags(guildId, body);

    return NextResponse.json({
      ok: true,
      flags: updated,
    });
  } catch (error) {
    console.error("Failed to update guild flags:", error);

    return NextResponse.json(
      {
        ok: false,
        code: "UPDATE_ERROR",
        message: "Failed to update guild flags",
      },
      { status: 500 }
    );
  }
}
