/**
 * POST /api/session/login
 * Authenticates with email (or username) + password against SlimyUser table.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/slimy-auth/crypto";
import { createSession, getSessionCookieOptions } from "@/lib/slimy-auth/session";
import { checkLoginRateLimit, recordLoginAttempt } from "@/lib/slimy-auth/rate-limit";

export const dynamic = "force-dynamic";

function getClientIP(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || undefined;

    // Rate limit check
    const rateLimit = await checkLoginRateLimit(email, ipAddress);
    if (!rateLimit.allowed) {
      await recordLoginAttempt(email, ipAddress, false);
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          lockoutUntil: rateLimit.lockoutUntil?.toISOString(),
        },
        { status: 429 }
      );
    }

    // Find user by email (case-insensitive) OR username
    const user = await db.slimyUser.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase().trim() },
          { username: email },
        ],
      },
    });

    if (!user) {
      await recordLoginAttempt(email, ipAddress, false);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.disabled) {
      await recordLoginAttempt(email, ipAddress, false);
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 403 }
      );
    }

    if (!user.emailVerified) {
      await recordLoginAttempt(email, ipAddress, false);
      return NextResponse.json(
        { error: "Please verify your email address first" },
        { status: 403 }
      );
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordLoginAttempt(email, ipAddress, false);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Success
    await recordLoginAttempt(email, ipAddress, true, user.id);
    const session = await createSession(user.id, ipAddress, userAgent);

    const isSecure = request.headers.get("x-forwarded-proto") === "https";
    const cookieOpts = getSessionCookieOptions(isSecure);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(cookieOpts.name, session.token, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (error) {
    console.error("[SlimyAuth] Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
