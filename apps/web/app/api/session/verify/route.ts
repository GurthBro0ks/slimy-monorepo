/**
 * GET /api/session/verify?token=xxx
 * Verifies email address. Activates account and auto-logs the user in.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/slimy-auth/crypto";
import { createSession, getSessionCookieOptions } from "@/lib/slimy-auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://slimyai.xyz";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${BASE_URL}/?error=missing_token`);
    }

    const tokenHash = hashToken(token);
    const verification = await db.slimyEmailVerification.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verification) {
      return NextResponse.redirect(`${BASE_URL}/?error=invalid_token`);
    }

    if (verification.usedAt) {
      return NextResponse.redirect(`${BASE_URL}/?error=already_verified`);
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.redirect(`${BASE_URL}/?error=token_expired`);
    }

    // Mark email as verified
    await db.slimyUser.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    });

    // Mark verification token as used
    await db.slimyEmailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    });

    // Auto-login: create session and set cookie
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;
    const session = await createSession(verification.userId, ipAddress, userAgent);

    const isSecure = request.headers.get("x-forwarded-proto") === "https";
    const cookieOpts = getSessionCookieOptions(isSecure);

    const response = NextResponse.redirect(`${BASE_URL}/dashboard?verified=true`);

    response.cookies.set(cookieOpts.name, session.token, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (error) {
    console.error("[SlimyAuth] Verify error:", error);
    return NextResponse.redirect(`${BASE_URL}/?error=verification_failed`);
  }
}
