/**
 * Trader Password Reset Request API Route
 *
 * POST /trader/auth/password-reset/request
 * Initiates a password reset flow by generating a time-limited token.
 * Requires: { username: string }
 *
 * Security: Always returns 200 OK regardless of whether the user exists,
 * to prevent username enumeration.
 */

import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/trader/auth/password-reset";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const result = await createPasswordResetToken(username);

    if (result) {
      // In production, send this token via email or secure channel.
      // For now, return it directly for testing.
      console.log(
        `[TraderAuth] Password reset token generated for ${username}`
      );

      return NextResponse.json({
        success: true,
        message:
          "If an account with that username exists, a reset token has been generated.",
        // Include token in response for dev/testing — remove in production
        resetToken: result.token,
        expiresAt: result.expiresAt.toISOString(),
      });
    }

    // User not found — return same message to prevent enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account with that username exists, a reset token has been generated.",
    });
  } catch (error) {
    console.error("[TraderAuth] Password reset request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
