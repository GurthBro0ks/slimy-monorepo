import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/owner/notifications/[id] — Mark read/dismiss
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner(req);
    const { id } = await params;

    const body = await req.json();
    const data: any = {};

    if (typeof body.read === "boolean") data.read = body.read;
    if (typeof body.dismissed === "boolean") data.dismissed = body.dismissed;

    const notification = await prisma.slimyNotification.update({
      where: { id },
      data,
    });

    return NextResponse.json(notification);
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/notifications/[id] PATCH] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

// DELETE /api/owner/notifications/[id] — Delete notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner(req);
    const { id } = await params;

    await prisma.slimyNotification.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/notifications/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
