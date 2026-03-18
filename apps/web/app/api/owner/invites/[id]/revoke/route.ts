import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { revokeOwnerInvite } from "@/lib/owner/invite";
import { logOwnerAction } from "@/lib/owner/audit";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireOwner(request);
    const { id: inviteId } = await params;

    // Verify invite exists
    const invite = await prisma.slimyInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "not_found", message: "Invite not found" },
        { status: 404 }
      );
    }

    if (invite.revokedAt) {
      return NextResponse.json(
        { error: "already_revoked", message: "Invite already revoked" },
        { status: 400 }
      );
    }

    // Revoke it
    const success = await revokeOwnerInvite(inviteId);

    if (!success) {
      return NextResponse.json(
        { error: "revoke_failed" },
        { status: 500 }
      );
    }

    // Log action (non-blocking)
    try {
      await logOwnerAction({
        actorId: ctx.owner.id,
        action: "INVITE_REVOKE",
        resourceType: "invite",
        resourceId: inviteId,
        changes: {
          revokedAt: new Date().toISOString(),
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    } catch (auditErr) {
      console.error("[Revoke] Audit log failed (non-fatal):", auditErr);
    }

    return NextResponse.json({
      ok: true,
      message: "Invite revoked",
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("[/api/owner/invites/[id]/revoke] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
