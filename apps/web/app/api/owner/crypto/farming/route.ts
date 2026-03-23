import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/owner/crypto/farming
// Returns farming stats derived from airdrop completions
export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Total counts
    const totalCompletions = await prisma.airdropCompletion.count();
    const weeklyCompletions = await prisma.airdropCompletion.count({
      where: { completedAt: { gte: sevenDaysAgo } },
    });
    const dailyCompletions = await prisma.airdropCompletion.count({
      where: { completedAt: { gte: oneDayAgo } },
    });
    const monthlyCompletions = await prisma.airdropCompletion.count({
      where: { completedAt: { gte: thirtyDaysAgo } },
    });

    // Active airdrops (not COMPLETED or DEAD)
    const activeAirdrops = await prisma.airdrop.count({
      where: {
        status: { notIn: ["COMPLETED", "DEAD"] },
      },
    });

    // Total tasks
    const totalTasks = await prisma.airdropTask.count();

    // Tasks completed today (unique tasks, not total completions)
    const todayCompletions = await prisma.airdropCompletion.findMany({
      where: { completedAt: { gte: oneDayAgo } },
      select: { taskId: true },
      distinct: ["taskId"],
    });

    // Tasks that are daily frequency
    const dailyTasks = await prisma.airdropTask.count({
      where: { frequency: "daily" },
    });

    const dailyTasksDoneToday = todayCompletions.length;

    // Farming quality rating
    let quality: string;
    if (dailyTasks === 0) {
      quality = "N/A";
    } else {
      const ratio = dailyTasksDoneToday / dailyTasks;
      if (ratio >= 0.8) quality = "HIGH";
      else if (ratio >= 0.5) quality = "MEDIUM";
      else if (ratio >= 0.2) quality = "LOW";
      else quality = "IDLE";
    }

    // Streak: consecutive days with at least 1 completion
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await prisma.airdropCompletion.count({
        where: {
          completedAt: { gte: dayStart, lte: dayEnd },
        },
      });

      if (count > 0) {
        streak++;
      } else {
        break;
      }
    }

    // Recent completions with details (for Overview quick list)
    const recentCompletions = await prisma.airdropCompletion.findMany({
      take: 5,
      orderBy: { completedAt: "desc" },
      include: {
        task: {
          include: {
            airdrop: { select: { protocol: true, token: true } },
          },
        },
      },
    });

    return NextResponse.json({
      farming: {
        quality,
        streak,
        totalActions: totalCompletions,
        dailyActions: dailyCompletions,
        weeklyActions: weeklyCompletions,
        monthlyActions: monthlyCompletions,
        activeAirdrops,
        totalTasks,
        dailyTasks,
        dailyTasksDoneToday,
      },
      recentCompletions: recentCompletions.map((c) => ({
        id: c.id,
        taskName: c.task.name,
        protocol: c.task.airdrop.protocol,
        token: c.task.airdrop.token,
        completedAt: c.completedAt,
        txLink: c.txLink,
        source: c.source,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/crypto/farming GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
