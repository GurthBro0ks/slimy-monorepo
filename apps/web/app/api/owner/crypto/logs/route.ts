import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/owner/crypto/logs
// Returns recent activity logs from airdrop completions
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireOwner(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    const logs: any[] = [];

    // Airdrop completion logs (always included)
    if (category === "all" || category === "airdrop") {
      const completions = await prisma.airdropCompletion.findMany({
        take: limit,
        skip: offset,
        orderBy: { completedAt: "desc" },
        include: {
          task: {
            include: {
              airdrop: { select: { protocol: true, token: true, tier: true } },
            },
          },
        },
      });

      for (const c of completions) {
        logs.push({
          id: c.id,
          category: "airdrop",
          timestamp: c.completedAt,
          message: `${c.task.airdrop.protocol}: ${c.task.name}`,
          details: {
            protocol: c.task.airdrop.protocol,
            token: c.task.airdrop.token,
            tier: c.task.airdrop.tier,
            taskName: c.task.name,
            txLink: c.txLink,
            source: c.source,
            notes: c.notes,
          },
        });
      }
    }

    // System logs: settings changes (from updatedAt on DashboardSettings)
    if (category === "all" || category === "system") {
      const settings = await prisma.dashboardSettings.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      if (settings) {
        logs.push({
          id: "settings-updated",
          category: "system",
          timestamp: settings.updatedAt,
          message: "Dashboard settings updated",
          details: { farmingMode: settings.farmingMode },
        });
      }
    }

    // Sort all logs by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      logs: logs.slice(0, limit),
      total: logs.length,
      categories: ["all", "airdrop", "system"],
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/crypto/logs GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
