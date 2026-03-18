/**
 * POST /api/session/forgot-password
 * Sends a password reset email. Always returns success to prevent email enumeration.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/slimy-auth/crypto";
import { sendEmail, passwordResetEmailHtml } from "@/lib/slimy-auth/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://slimyai.xyz";
const RESET_TOKEN_TTL = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Always return the same success response to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: "If that email is registered, a password reset link has been sent.",
    });

    const user = await db.slimyUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.disabled) {
      return successResponse;
    }

    // Invalidate any existing unused reset tokens for this user
    await db.slimyPasswordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Create new reset token
    const resetToken = generateToken();
    const resetTokenHash = hashToken(resetToken);
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    await db.slimyPasswordReset.create({
      data: {
        tokenHash: resetTokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL),
        ipAddress,
      },
    });

    // Send reset email
    const resetUrl = `${BASE_URL}/auth/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset — SlimyAI",
      html: passwordResetEmailHtml(user.username, resetUrl),
    });

    return successResponse;
  } catch (error) {
    console.error("[SlimyAuth] Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
