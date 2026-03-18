/**
 * POST /api/session/register
 * Invite-only registration with email verification.
 * Creates an unverified user and sends a verification email.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, generateToken, hashToken } from "@/lib/slimy-auth/crypto";
import { validateInviteCode, markInviteAsUsed } from "@/lib/slimy-auth/invite";
import { checkLoginRateLimit, recordLoginAttempt } from "@/lib/slimy-auth/rate-limit";
import { sendEmail, verificationEmailHtml } from "@/lib/slimy-auth/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://slimyai.xyz";
const VERIFY_TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getClientIP(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invite_code, email, username, password } = body;

    // Validate all fields present
    if (!invite_code || !email || !username || !password) {
      return NextResponse.json(
        { error: "Invite code, email, username, and password are required" },
        { status: 400 }
      );
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters (letters, numbers, _ or -)" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const ipAddress = getClientIP(request);

    // Rate limit registration attempts too
    const rateLimit = await checkLoginRateLimit(email, ipAddress);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Validate invite code
    const inviteResult = await validateInviteCode(invite_code);
    if (!inviteResult.valid) {
      const messages: Record<string, string> = {
        not_found: "Invalid invite code",
        expired: "Invite code has expired",
        max_uses_reached: "Invite code has already been used",
        revoked: "Invite code has been revoked",
      };
      return NextResponse.json(
        { error: messages[inviteResult.error!] || "Invalid invite code" },
        { status: 400 }
      );
    }

    // Get the role from the invite (defaults to "member" if not set)
    const userRole = inviteResult.role || "member";

    // Check if email is taken
    const existingEmail = await db.slimyUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    // Check if username is taken
    const existingUsername = await db.slimyUser.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Create user (emailVerified = false — must verify before login)
    const passwordHash = await hashPassword(password);
    const user = await db.slimyUser.create({
      data: {
        email: email.toLowerCase().trim(),
        username,
        passwordHash,
        role: userRole,
        emailVerified: false,
      },
    });

    // Mark invite as used
    await markInviteAsUsed(inviteResult.inviteId!, user.id);

    // Create verification token
    const verifyToken = generateToken();
    const verifyTokenHash = hashToken(verifyToken);
    await db.slimyEmailVerification.create({
      data: {
        tokenHash: verifyTokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL),
      },
    });

    // Send verification email
    const verifyUrl = `${BASE_URL}/auth/verify?token=${verifyToken}`;
    const emailSent = await sendEmail({
      to: user.email,
      subject: "Verify your SlimyAI account",
      html: verificationEmailHtml(username, verifyUrl),
    });

    await recordLoginAttempt(email, ipAddress, true, user.id);

    return NextResponse.json({
      success: true,
      message: emailSent
        ? "Account created! Check your email to verify your account."
        : "Account created but verification email failed to send. Contact an admin.",
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("[SlimyAuth] Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
