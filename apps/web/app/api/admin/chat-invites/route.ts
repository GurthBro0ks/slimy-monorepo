import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

const COOKIE_NAME = "slimy_chat_token";

// Helper to verify chat session and get user role
async function verifyChatSession(request: NextRequest) {
  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;

  if (!sessionToken) {
    throw new NextResponse(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const session = await db.chatSession.findUnique({
    where: { sessionToken },
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

// GET /api/admin/chat-invites - List chat invite codes (admin+)
export async function GET(request: NextRequest) {
  try {
    const session = await verifyChatSession(request);

    if (!["admin", "owner"].includes(session.user.role)) {
      throw new NextResponse(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const invites = await db.chatRegistrationCode.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        usedBy: true,
        usedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      invites,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/admin/chat-invites GET] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/chat-invites - Create a new chat invite code (admin+)
export async function POST(request: NextRequest) {
  try {
    const session = await verifyChatSession(request);

    if (!["admin", "owner"].includes(session.user.role)) {
      throw new NextResponse(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate a simple 8-character code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();

    const invite = await db.chatRegistrationCode.create({
      data: {
        code,
        // Default expiry: 30 days
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      ok: true,
      id: invite.id,
      code: invite.code,
      expiresAt: invite.expiresAt,
      message: "Chat invite code created successfully",
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/admin/chat-invites POST] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/chat-invites - Revoke all chat invite codes (owner only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifyChatSession(request);

    if (session.user.role !== "owner") {
      throw new NextResponse(
        JSON.stringify({ error: "Owner access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete all unused chat invite codes
    await db.chatRegistrationCode.deleteMany({
      where: {
        usedBy: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "All unused chat invite codes have been revoked",
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/admin/chat-invites DELETE] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
