/**
 * Trader Login API Route
 *
 * POST /trader/auth/login
 * Authenticates a trader user with username/password
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/trader/auth/crypto";
import {
  createTraderSession,
  getSessionCookieOptions,
} from "@/lib/trader/auth/session";
import {
  checkLoginRateLimit,
  recordLoginAttempt,
} from "@/lib/trader/auth/rate-limit";

export const dynamic = "force-dynamic";

function getClientIP(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || undefined;

    // Check rate limit
    const rateLimit = await checkLoginRateLimit(username, ipAddress);
    if (!rateLimit.allowed) {
      await recordLoginAttempt(username, ipAddress, false);
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          lockoutUntil: rateLimit.lockoutUntil?.toISOString(),
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await db.traderUser.findUnique({
      where: { username },
    });

    if (!user) {
      await recordLoginAttempt(username, ipAddress, false);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    if (user.disabled) {
      await recordLoginAttempt(username, ipAddress, false);
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      await recordLoginAttempt(username, ipAddress, false);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Record successful login
    await recordLoginAttempt(username, ipAddress, true);

    // Create session
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
    console.error("[TraderAuth] Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
