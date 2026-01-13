import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import {
  createOwnerInvite,
  listOwnerInvites,
} from "@/lib/owner/invite";
import { logOwnerAction } from "@/lib/owner/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateInviteSchema = z.object({
  expiresIn: z.number().int().positive().optional(), // milliseconds from now
  maxUses: z.number().int().min(1).max(100).optional(),
  note: z.string().max(255).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    const invites = await listOwnerInvites();

    return NextResponse.json({
      ok: true,
      invites: invites.map((inv) => ({
        id: inv.id,
        codeHash: inv.codeHash,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        maxUses: inv.maxUses,
        useCount: inv.useCount,
        revokedAt: inv.revokedAt,
        note: inv.note,
        createdBy: {
          id: inv.createdBy.id,
          email: inv.createdBy.email,
        },
      })),
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("[/api/owner/invites GET] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireOwner(request);

    // Parse and validate request
    const body = await request.json();
    const parsed = CreateInviteSchema.safeParse(body);

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

    // Create invite
    const result = await createOwnerInvite(ctx.owner.id, {
      expiresAt: data.expiresIn
        ? new Date(Date.now() + data.expiresIn)
        : undefined,
      maxUses: data.maxUses,
      note: data.note,
    });

    // Log action
    await logOwnerAction({
      actorId: ctx.owner.id,
      action: "INVITE_CREATE",
      resourceType: "invite",
      resourceId: result.inviteId,
      changes: {
        maxUses: result.maxUses,
        expiresAt: result.expiresAt,
        note: result.note,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return NextResponse.json(
      {
        ok: true,
        inviteId: result.inviteId,
        tokenPlaintext: result.tokenPlaintext, // One-time display
        codeHash: result.codeHash,
        expiresAt: result.expiresAt,
        maxUses: result.maxUses,
        note: result.note,
        message:
          "Token displayed above - save it now, you will not see it again",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("[/api/owner/invites POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
