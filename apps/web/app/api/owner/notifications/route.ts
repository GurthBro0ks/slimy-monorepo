import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/owner/notifications — List all notifications
export async function GET(req: NextRequest) {
  try {
    await requireOwner(req);

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = { dismissed: false };
    if (unreadOnly) where.read = false;

    const [notifications, unreadCount] = await Promise.all([
      prisma.slimyNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 100),
      }),
      prisma.slimyNotification.count({
        where: { read: false, dismissed: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/notifications GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
