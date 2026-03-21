/**
 * POST /api/session/reset-password
 * Accepts a reset token + new password. Revokes all existing sessions.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken, hashPassword } from "@/lib/slimy-auth/crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const resetRecord = await db.slimyPasswordReset.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid reset link" },
        { status: 400 }
      );
    }

    if (resetRecord.usedAt) {
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 }
      );
    }

    if (resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update password
    const newPasswordHash = await hashPassword(password);
    await db.slimyUser.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newPasswordHash },
    });

    // Mark reset token as used
    await db.slimyPasswordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    });

    // Revoke ALL existing sessions (force re-login with new password)
    await db.slimySession.updateMany({
      where: { userId: resetRecord.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated. Please log in with your new password.",
    });
  } catch (error) {
    console.error("[SlimyAuth] Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
