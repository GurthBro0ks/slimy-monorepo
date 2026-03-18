import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner(request);

    const { id: inviteId } = await params;

    // Find the invite
    const invite = await prisma.slimyInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    // Only allow deletion of revoked invites
    if (!invite.revokedAt) {
      return NextResponse.json(
        { error: "Revoke the invite before deleting" },
        { status: 400 }
      );
    }

    // Delete the invite
    await prisma.slimyInvite.delete({
      where: { id: inviteId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("[/api/owner/invites/[id] DELETE] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
