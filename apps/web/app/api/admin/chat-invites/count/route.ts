// Chat Invites Count API
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrAdmin } from "@/lib/auth/owner";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/chat-invites/count - Count active chat invite codes
export async function GET(request: NextRequest) {
  try {
    await requireOwnerOrAdmin(request);

    const count = await db.chatRegistrationCode.count({
      where: {
        usedBy: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return NextResponse.json({
      ok: true,
      count,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/admin/chat-invites/count] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
