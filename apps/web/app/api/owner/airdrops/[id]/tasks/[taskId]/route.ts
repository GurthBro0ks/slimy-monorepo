import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_FREQUENCIES = ["daily", "weekly", "biweekly", "monthly", "one-time"];

// PATCH /api/owner/airdrops/[id]/tasks/[taskId] — Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    await requireOwner(request);
    const { taskId } = await params;

    const body = await request.json();

    const updateData: Record<string, any> = {};
    if (body.name) updateData.name = body.name;
    if (body.frequency && VALID_FREQUENCIES.includes(body.frequency)) {
      updateData.frequency = body.frequency;
    }
    if (body.botActionKey !== undefined) {
      updateData.botActionKey = body.botActionKey || null;
    }

    const task = await prisma.airdropTask.update({
      where: { id: taskId },
      data: updateData,
    });

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops/[id]/tasks/[taskId] PATCH] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

// DELETE /api/owner/airdrops/[id]/tasks/[taskId] — Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    await requireOwner(request);
    const { taskId } = await params;

    await prisma.airdropTask.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops/[id]/tasks/[taskId] DELETE] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
