import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/owner/crypto/settings
// Returns dashboard settings for the authenticated owner
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireOwner(request);

    let settings = await prisma.dashboardSettings.findUnique({
      where: { userId: ctx.owner.id },
    });

    if (!settings) {
      settings = await prisma.dashboardSettings.create({
        data: { userId: ctx.owner.id },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/crypto/settings GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

// PATCH /api/owner/crypto/settings
// Update dashboard settings
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireOwner(request);

    const body = await request.json();

    // Whitelist allowed fields
    const allowedFields = [
      "kellyFraction",
      "maxPositionPct",
      "minEdge",
      "maxDrawdown",
      "maxConcurrent",
      "minPositionUsd",
      "farmingBudget",
      "farmingMode",
      "cronInterval",
      "ethRpc",
      "baseRpc",
      "mainWalletAddress",
      "trackedWallets",
    ];

    const data: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) {
        data[key] = body[key];
      }
    }

    // Handle farmingMode enum validation
    if (data.farmingMode && !["dry_run", "live"].includes(data.farmingMode)) {
      return NextResponse.json(
        { error: "validation_error", message: "farmingMode must be 'dry_run' or 'live'" },
        { status: 400 }
      );
    }

    const settings = await prisma.dashboardSettings.upsert({
      where: { userId: ctx.owner.id },
      create: { userId: ctx.owner.id, ...data },
      update: data,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/crypto/settings PATCH] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
