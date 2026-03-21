import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/owner/notifications/read-all — Mark all as read
export async function POST(req: NextRequest) {
  try {
    await requireOwner(req);

    const result = await prisma.slimyNotification.updateMany({
      where: { read: false },
      data: { read: true },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/notifications/read-all POST] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
