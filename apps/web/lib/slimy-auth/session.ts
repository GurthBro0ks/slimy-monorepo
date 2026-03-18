/**
 * Slimy Auth — Session management
 * DB-backed sessions with SHA-256 hashed tokens stored in MySQL
 */

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "./crypto";

export const SESSION_COOKIE = "slimy_session";
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Create a new session for a user. Returns the plaintext token (set as cookie).
 * The DB stores only the SHA-256 hash.
 */
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await db.slimySession.create({
    data: {
      tokenHash,
      userId,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Validate the current session from the request cookie.
 * Reads the slimy_session cookie, hashes it, looks up in DB.
 */
export async function validateSession(cookieStoreOverride?: any) {
  try {
    const cookieStore = cookieStoreOverride
      ? await Promise.resolve(cookieStoreOverride)
      : await cookies();

    const cookie = cookieStore.get(SESSION_COOKIE);

    if (!cookie?.value) {
      return { authenticated: false as const, error: "no_session" };
    }

    const tokenHash = hashToken(cookie.value);
    const session = await db.slimySession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      return { authenticated: false as const, error: "invalid_session" };
    }

    if (session.revokedAt) {
      return { authenticated: false as const, error: "session_revoked" };
    }

    if (session.expiresAt < new Date()) {
      return { authenticated: false as const, error: "session_expired" };
    }

    if (session.user.disabled) {
      return { authenticated: false as const, error: "account_disabled" };
    }

    return {
      authenticated: true as const,
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
        role: session.user.role,
      },
    };
  } catch (error) {
    console.error("[SlimyAuth] Session validation error:", error);
    return { authenticated: false as const, error: "internal_error" };
  }
}

/**
 * Revoke a session by ID (sets revokedAt timestamp)
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await db.slimySession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

/**
 * Get cookie options. Detects HTTPS via x-forwarded-proto for reverse proxy setups.
 */
export function getSessionCookieOptions(isSecure: boolean) {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
