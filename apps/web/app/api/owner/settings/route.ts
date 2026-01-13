import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { logOwnerAction } from "@/lib/owner/audit";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateSettingsSchema = z.object({
  refreshRateCapMs: z
    .number()
    .int()
    .min(100)
    .max(3600000)
    .optional(),
  debugDockEnabled: z.boolean().optional(),
  artifactSourceDisplay: z
    .enum(["icon", "text", "both"])
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    // Get or create singleton AppSettings
    let settings = await prisma.appSettings.findFirst();

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          refreshRateCapMs: 5000,
          debugDockEnabled: false,
          artifactSourceDisplay: "icon",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      settings: {
        id: settings.id,
        refreshRateCapMs: settings.refreshRateCapMs,
        debugDockEnabled: settings.debugDockEnabled,
        artifactSourceDisplay: settings.artifactSourceDisplay,
        updatedAt: settings.updatedAt,
        updatedById: settings.updatedById,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("[/api/owner/settings GET] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await requireOwner(request);

    const body = await request.json();
    const parsed = UpdateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "validation_error",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Get or create singleton
    let settings = await prisma.appSettings.findFirst();

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          refreshRateCapMs: 5000,
          debugDockEnabled: false,
          artifactSourceDisplay: "icon",
          updatedById: ctx.owner.id,
        },
      });
    }

    // Track what changed
    const changes: Record<string, unknown> = {};
    if (data.refreshRateCapMs !== undefined) {
      changes.refreshRateCapMs = {
        from: settings.refreshRateCapMs,
        to: data.refreshRateCapMs,
      };
    }
    if (data.debugDockEnabled !== undefined) {
      changes.debugDockEnabled = {
        from: settings.debugDockEnabled,
        to: data.debugDockEnabled,
      };
    }
    if (data.artifactSourceDisplay !== undefined) {
      changes.artifactSourceDisplay = {
        from: settings.artifactSourceDisplay,
        to: data.artifactSourceDisplay,
      };
    }

    // Update
    await prisma.appSettings.updateMany({
      data: {
        ...data,
        updatedById: ctx.owner.id,
      },
    });

    // Log action
    await logOwnerAction({
      actorId: ctx.owner.id,
      action: "SETTINGS_UPDATE",
      resourceType: "settings",
      resourceId: settings.id,
      changes,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    // Fetch updated
    const latest = await prisma.appSettings.findFirst();

    return NextResponse.json({
      ok: true,
      settings: {
        id: latest?.id,
        refreshRateCapMs: latest?.refreshRateCapMs,
        debugDockEnabled: latest?.debugDockEnabled,
        artifactSourceDisplay: latest?.artifactSourceDisplay,
        updatedAt: latest?.updatedAt,
        updatedById: latest?.updatedById,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("[/api/owner/settings PUT] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
