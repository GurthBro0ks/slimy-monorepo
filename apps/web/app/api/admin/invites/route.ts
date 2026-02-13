import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/admin/invites - Create admin invite code
export async function POST(request: NextRequest) {
  try {
    // Verify owner role
    const cookieName = process.env.CHAT_COOKIE_NAME || "chat_session";
    const sessionToken = request.cookies.get(cookieName)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const session = await db.chatSession.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }

    if (session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can create admin invites" },
        { status: 403 }
      );
    }

    // Generate unique invite code
    const code = `ADMIN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Store invite
    await db.adminInvite.create({
      data: {
        code,
        createdById: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return NextResponse.json({
      code,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Failed to create admin invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

// GET /api/admin/invites/count - Get count of active admin invites
export async function GET(request: NextRequest) {
  try {
    const cookieName = process.env.CHAT_COOKIE_NAME || "chat_session";
    const sessionToken = request.cookies.get(cookieName)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const session = await db.chatSession.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    if (session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can view admin invites" },
        { status: 403 }
      );
    }

    const count = await db.adminInvite.count({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to get admin invite count:", error);
    return NextResponse.json(
      { error: "Failed to get count" },
      { status: 500 }
    );
  }
}
