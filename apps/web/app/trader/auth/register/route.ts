/**
 * Trader Register API Route
 *
 * POST /trader/auth/register
 * Registers a new trader user with an invite code
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/trader/auth/crypto";
import { validateInviteCode, markInviteAsUsed } from "@/lib/trader/auth/invite";
import {
  createTraderSession,
  getSessionCookieOptions,
} from "@/lib/trader/auth/session";

export const dynamic = "force-dynamic";

function getClientIP(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invite_code, username, password } = body;

    // Validate inputs
    if (!invite_code || !username || !password) {
      return NextResponse.json(
        { error: "Invite code, username, and password are required" },
        { status: 400 }
      );
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters, alphanumeric with _ or -" },
        { status: 400 }
      );
    }

    // Password validation (minimum requirements)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate invite code
    const inviteResult = await validateInviteCode(invite_code);
    if (!inviteResult.valid) {
      const messages: Record<string, string> = {
        not_found: "Invalid invite code",
        expired: "Invite code has expired",
        max_uses_reached: "Invite code has already been used",
      };
      return NextResponse.json(
        { error: messages[inviteResult.error!] || "Invalid invite code" },
        { status: 400 }
      );
    }

    // Check if username is taken
    const existingUser = await db.traderUser.findUnique({
      where: { username },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await db.traderUser.create({
      data: {
        username,
        passwordHash,
      },
    });

    // Mark invite as used
    await markInviteAsUsed(inviteResult.inviteId!, user.id);

    // Create session
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || undefined;
    const session = await createTraderSession(user.id, ipAddress, userAgent);

    // Set cookie
    const isSecure = request.headers.get("x-forwarded-proto") === "https";
    const cookieOptions = getSessionCookieOptions(isSecure);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    });

    response.cookies.set(cookieOptions.name, session.token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
      // NO domain - scopes to trader.slimyai.xyz only
    });

    return response;
  } catch (error) {
    console.error("[TraderAuth] Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
