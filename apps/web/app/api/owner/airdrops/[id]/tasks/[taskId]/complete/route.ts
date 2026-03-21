import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/owner/airdrops/[id]/tasks/[taskId]/complete — Log a completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    await requireOwner(request);
    const { taskId } = await params;

    const body = await request.json();
    const { txLink, source, notes, completedAt } = body;

    // Validate txLink if provided — must start with https://
    if (txLink && !txLink.startsWith("https://")) {
      return NextResponse.json({ error: "txLink must be a valid HTTPS URL" }, { status: 400 });
    }

    // Verify task exists and belongs to this airdrop
    const task = await prisma.airdropTask.findFirst({
      where: { id: taskId },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const completion = await prisma.airdropCompletion.create({
      data: {
        taskId: taskId,
        txLink: txLink || null,
        source: source === "bot" ? "bot" : "manual",
        notes: notes || null,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      },
    });

    return NextResponse.json({ completion }, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops/[id]/tasks/[taskId]/complete POST] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

// GET /api/owner/airdrops/[id]/tasks/[taskId]/complete — List completions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    await requireOwner(request);
    const { taskId } = await params;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    const where: Record<string, any> = { taskId };
    if (from || to) {
      where.completedAt = {};
      if (from) where.completedAt.gte = new Date(from);
      if (to) where.completedAt.lte = new Date(to);
    }

    const completions = await prisma.airdropCompletion.findMany({
      where,
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ completions });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops/[id]/tasks/[taskId]/complete GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
