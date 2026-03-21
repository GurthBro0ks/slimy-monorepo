import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_FREQUENCIES = ["daily", "weekly", "biweekly", "monthly", "one-time"];

// GET /api/owner/airdrops/[id]/tasks — List tasks for an airdrop
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner(request);
    const { id } = await params;

    const tasks = await prisma.airdropTask.findMany({
      where: { airdropId: id },
      include: {
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 5,
        },
        _count: { select: { completions: true } },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops/[id]/tasks GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

// POST /api/owner/airdrops/[id]/tasks — Create a task for an airdrop
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner(request);
    const { id } = await params;

    const body = await request.json();
    const { name, frequency, botActionKey } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Get parent airdrop for default frequency
    const airdrop = await prisma.airdrop.findUnique({ where: { id } });
    if (!airdrop) {
      return NextResponse.json({ error: "Airdrop not found" }, { status: 404 });
    }

    const task = await prisma.airdropTask.create({
      data: {
        airdropId: id,
        name,
        frequency: VALID_FREQUENCIES.includes(frequency || "") ? frequency : airdrop.frequency,
        botActionKey: botActionKey || null,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops/[id]/tasks POST] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
