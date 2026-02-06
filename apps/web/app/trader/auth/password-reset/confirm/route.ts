/**
 * Trader Password Reset Confirm API Route
 *
 * POST /trader/auth/password-reset/confirm
 * Completes the password reset flow by setting a new password.
 * Requires: { token: string, newPassword: string }
 *
 * On success, all existing sessions are revoked (forces re-login).
 */

import { NextRequest, NextResponse } from "next/server";
import { executePasswordReset } from "@/lib/trader/auth/password-reset";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const result = await executePasswordReset(token, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Password reset failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Password has been reset successfully. All sessions have been revoked. Please log in with your new password.",
    });
  } catch (error) {
    console.error("[TraderAuth] Password reset confirm error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
