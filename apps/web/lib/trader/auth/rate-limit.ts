/**
 * Trader Auth Rate Limiting
 *
 * Protects against brute force attacks by limiting login attempts
 * per username and per IP address.
 */

import { db } from "@/lib/db";

const MAX_ATTEMPTS_PER_USERNAME = 5;
const MAX_ATTEMPTS_PER_IP = 20;
const LOCKOUT_WINDOW_MINUTES = 15;

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockoutUntil: Date | null;
  reason?: "username_locked" | "ip_locked";
}

/**
 * Check if a login attempt should be rate limited
 */
export async function checkLoginRateLimit(
  username: string,
  ipAddress: string
): Promise<RateLimitResult> {
  const windowStart = new Date(
    Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000
  );

  // Count recent failed attempts by username
  const usernameAttempts = await db.traderLoginAttempt.count({
    where: {
      username,
      success: false,
      attemptedAt: { gte: windowStart },
    },
  });

  if (usernameAttempts >= MAX_ATTEMPTS_PER_USERNAME) {
    const oldestAttempt = await db.traderLoginAttempt.findFirst({
      where: {
        username,
        success: false,
        attemptedAt: { gte: windowStart },
      },
      orderBy: { attemptedAt: "asc" },
    });

    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutUntil: oldestAttempt
        ? new Date(
            oldestAttempt.attemptedAt.getTime() +
              LOCKOUT_WINDOW_MINUTES * 60 * 1000
          )
        : null,
      reason: "username_locked",
    };
  }

  // Count recent failed attempts by IP
  const ipAttempts = await db.traderLoginAttempt.count({
    where: {
      ipAddress,
      success: false,
      attemptedAt: { gte: windowStart },
    },
  });

  if (ipAttempts >= MAX_ATTEMPTS_PER_IP) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutUntil: new Date(
        Date.now() + LOCKOUT_WINDOW_MINUTES * 60 * 1000
      ),
      reason: "ip_locked",
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.min(
      MAX_ATTEMPTS_PER_USERNAME - usernameAttempts,
      MAX_ATTEMPTS_PER_IP - ipAttempts
    ),
    lockoutUntil: null,
  };
}

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(
  username: string,
  ipAddress: string,
  success: boolean
): Promise<void> {
  await db.traderLoginAttempt.create({
    data: {
      username,
      ipAddress: ipAddress.substring(0, 45),
      success,
    },
  });

  // Clean up old attempts (older than 24 hours) - fire and forget
  const cleanupThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  db.traderLoginAttempt
    .deleteMany({
      where: { attemptedAt: { lt: cleanupThreshold } },
    })
    .catch(() => {
      /* ignore */
    });
}
