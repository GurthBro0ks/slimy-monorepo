import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_TIERS = ["S", "A", "B", "C", "F"];
const VALID_STATUSES = ["EXPLORING", "CONFIRMED", "SEASON_1", "SEASON_2", "SEASON_3", "SEASON_4", "SEASON_5", "SEASON_6", "SEASON_7", "SEASON_8", "SEASON_9", "COMPLETED", "DEAD"];
const VALID_FREQUENCIES = ["daily", "weekly", "biweekly", "monthly", "one-time"];

// GET /api/owner/airdrops — List all airdrops with task counts and recent completions
export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const airdrops = await prisma.airdrop.findMany({
      orderBy: [{ tier: 'asc' }, { protocol: 'asc' }],
      include: {
        tasks: {
          include: {
            _count: { select: { completions: true } },
            completions: {
              orderBy: { completedAt: 'desc' },
              take: 30,
              select: { completedAt: true },
            },
          },
        },
      },
    });

    // Compute progress and per-task stats
    const enriched = airdrops.map((airdrop) => {
      const totalTasks = airdrop.tasks.length;
      let completedToday = 0;

      const tasksWithStats = airdrop.tasks.map((task) => {
        const lastCompletion = task.completions[0]?.completedAt ?? null;

        // Check if completed today (UTC)
        const isCompletedToday = task.completions.some((c) => {
          const d = new Date(c.completedAt);
          d.setUTCHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });
        if (isCompletedToday) completedToday++;

        // Calculate streak: consecutive days backwards from today
        const completionDates = [...new Set(
          task.completions.map((c) => {
            const d = new Date(c.completedAt);
            d.setUTCHours(0, 0, 0, 0);
            return d.getTime();
          })
        )].sort((a, b) => b - a); // newest first

        let streakDays = 0;
        let checkDate = today.getTime();
        for (const dateMs of completionDates) {
          if (dateMs === checkDate) {
            streakDays++;
            checkDate -= 24 * 60 * 60 * 1000;
          } else if (dateMs < checkDate) {
            break; // gap in streak
          }
        }

        return {
          id: task.id,
          name: task.name,
          frequency: task.frequency,
          botActionKey: task.botActionKey,
          completionCount: task._count.completions,
          completedToday: isCompletedToday,
          lastCompleted: lastCompletion ? lastCompletion.toISOString() : null,
          streakDays,
        };
      });

      const completionRate = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;

      return {
        ...airdrop,
        tasks: tasksWithStats,
        progress: {
          totalTasks,
          completedToday,
          completionRate,
        },
      };
    });

    return NextResponse.json({ airdrops: enriched });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

// POST /api/owner/airdrops — Create a new airdrop
export async function POST(request: NextRequest) {
  try {
    await requireOwner(request);

    const body = await request.json();
    const { protocol, token, tier, status, frequency, notes } = body;

    if (!protocol || !token) {
      return NextResponse.json({ error: "protocol and token are required" }, { status: 400 });
    }

    const airdrop = await prisma.airdrop.create({
      data: {
        protocol,
        token,
        tier: VALID_TIERS.includes(tier) ? tier : "B",
        status: VALID_STATUSES.includes(status) ? status : "EXPLORING",
        frequency: VALID_FREQUENCIES.includes(frequency) ? frequency : "daily",
        notes: notes || null,
      },
    });

    return NextResponse.json({ airdrop }, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops POST] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
