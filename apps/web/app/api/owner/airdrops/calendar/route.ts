import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/owner/airdrops/calendar?year=2026&month=3
// Returns completions grouped by date for the given month
export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || now.getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString());

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const completions = await prisma.airdropCompletion.findMany({
      where: {
        completedAt: { gte: startDate, lte: endDate },
      },
      include: {
        task: {
          include: {
            airdrop: { select: { protocol: true, token: true, tier: true } },
          },
        },
      },
      orderBy: { completedAt: 'asc' },
    });

    // Group by date string (YYYY-MM-DD)
    const days: Record<string, any[]> = {};
    for (const c of completions) {
      const dateKey = c.completedAt.toISOString().split("T")[0];
      if (!days[dateKey]) days[dateKey] = [];
      days[dateKey].push({
        completionId: c.id,
        taskId: c.taskId,
        taskName: c.task.name,
        airdropProtocol: c.task.airdrop.protocol,
        airdropToken: c.task.airdrop.token,
        airdropTier: c.task.airdrop.tier,
        txLink: c.txLink,
        source: c.source,
        notes: c.notes,
      });
    }

    return NextResponse.json({ year, month, days });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops/calendar GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
