import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_TIERS = ["S", "A", "B", "C", "F"];
const VALID_FREQUENCIES = ["daily", "weekly", "biweekly", "monthly", "one-time"];

// GET /api/owner/airdrops/[id] — Single airdrop with all tasks and completions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner(request);
    const { id } = await params;

    const airdrop = await prisma.airdrop.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            completions: {
              orderBy: { completedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!airdrop) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ airdrop });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops/[id] GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

// PATCH /api/owner/airdrops/[id] — Update airdrop fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner(request);
    const { id } = await params;

    const body = await request.json();
    const { protocol, token, tier, status, frequency, notes } = body;

    const updateData: Record<string, any> = {};
    if (protocol) updateData.protocol = protocol;
    if (token) updateData.token = token;
    if (tier && VALID_TIERS.includes(tier)) updateData.tier = tier;
    if (status) updateData.status = status;
    if (frequency && VALID_FREQUENCIES.includes(frequency)) updateData.frequency = frequency;
    if (notes !== undefined) updateData.notes = notes;

    const airdrop = await prisma.airdrop.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ airdrop });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops/[id] PATCH] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

// DELETE /api/owner/airdrops/[id] — Delete airdrop (cascades to tasks/completions)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner(request);
    const { id } = await params;

    await prisma.airdrop.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
