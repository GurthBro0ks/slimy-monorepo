// Chat Invite Codes API - for admin/owner to create chat registration codes
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrAdmin } from "@/lib/auth/owner";
import { db } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET /api/admin/chat-invites - List chat invite codes
export async function GET(request: NextRequest) {
  try {
    await requireOwnerOrAdmin(request);

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
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/admin/chat-invites GET] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/chat-invites - Create a new chat invite code
export async function POST(request: NextRequest) {
  try {
    await requireOwnerOrAdmin(request);

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
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/admin/chat-invites POST] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/chat-invites - Revoke all chat invite codes
export async function DELETE(request: NextRequest) {
  try {
    await requireOwnerOrAdmin(request);

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
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/admin/chat-invites DELETE] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
