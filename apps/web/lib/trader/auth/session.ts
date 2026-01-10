/**
 * Trader Session Management
 *
 * Handles session creation, validation, and revocation.
 * Sessions use cookies scoped to trader.slimyai.xyz only.
 */

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "./crypto";

export const TRADER_SESSION_COOKIE = "trader_session";
export const SESSION_DURATION_HOURS = 24;

export interface TraderSessionUser {
  id: string;
  username: string;
  disabled: boolean;
}

export interface TraderAuthResult {
  authenticated: boolean;
  user: TraderSessionUser | null;
  sessionId: string | null;
  error?: "no_session" | "invalid_session" | "expired" | "revoked" | "disabled";
}

/**
 * Get session cookie configuration
 * CRITICAL: Do NOT set Domain - this ensures cookie is scoped to trader.slimyai.xyz only
 */
export function getSessionCookieOptions(secure: boolean = true) {
  return {
    name: TRADER_SESSION_COOKIE,
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
    // DO NOT SET domain - defaults to current host only (trader.slimyai.xyz)
  };
}

/**
 * Create a new trader session
 */
export async function createTraderSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000
  );

  await db.traderSession.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      ipAddress: ipAddress?.substring(0, 45),
      userAgent: userAgent?.substring(0, 500),
    },
  });

  return { token, expiresAt };
}

/**
 * Validate the current trader session from cookies
 */
export async function validateTraderSession(): Promise<TraderAuthResult> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(TRADER_SESSION_COOKIE);

    if (!sessionCookie?.value) {
      return {
        authenticated: false,
        user: null,
        sessionId: null,
        error: "no_session",
      };
    }

    const tokenHash = hashToken(sessionCookie.value);
    const session = await db.traderSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      return {
        authenticated: false,
        user: null,
        sessionId: null,
        error: "invalid_session",
      };
    }

    if (session.revokedAt) {
      return {
        authenticated: false,
        user: null,
        sessionId: session.id,
        error: "revoked",
      };
    }

    if (session.expiresAt < new Date()) {
      return {
        authenticated: false,
        user: null,
        sessionId: session.id,
        error: "expired",
      };
    }

    if (session.user.disabled) {
      return {
        authenticated: false,
        user: null,
        sessionId: session.id,
        error: "disabled",
      };
    }

    // Update last seen time (fire and forget)
    db.traderSession
      .update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      })
      .catch(() => {
        /* ignore */
      });

    return {
      authenticated: true,
      user: {
        id: session.user.id,
        username: session.user.username,
        disabled: session.user.disabled,
      },
      sessionId: session.id,
    };
  } catch (error) {
    console.error("[TraderAuth] Session validation error:", error);
    return {
      authenticated: false,
      user: null,
      sessionId: null,
      error: "invalid_session",
    };
  }
}

/**
 * Revoke a trader session
 */
export async function revokeTraderSession(sessionId: string): Promise<void> {
  await db.traderSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.traderSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
