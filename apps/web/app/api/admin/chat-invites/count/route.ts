// Chat Invites Count API
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const COOKIE_NAME = "slimy_chat_token";

async function verifyChatSession(request: NextRequest) {
  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;

  if (!sessionToken) {
    throw new NextResponse(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const session = await db.chatSession.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new NextResponse(
      JSON.stringify({ error: "Session expired" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return session;
}

// GET /api/admin/chat-invites/count - Count active chat invite codes (admin+)
export async function GET(request: NextRequest) {
  try {
    const session = await verifyChatSession(request);

    if (!["admin", "owner"].includes(session.user.role)) {
      throw new NextResponse(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

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
    if (error instanceof NextResponse) return error;
    console.error("[/api/admin/chat-invites/count] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
