/**
 * Slimy Auth — Login rate limiting
 * Tracks failed login attempts in DB. Locks out after threshold.
 */

import { db } from "@/lib/db";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 15;

interface RateLimitResult {
  allowed: boolean;
  attemptsRemaining?: number;
  lockoutUntil?: Date;
}

/**
 * Check if a login attempt is allowed for a given identifier and IP.
 */
export async function checkLoginRateLimit(
  identifier: string,
  ipAddress: string
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const recentFailures = await db.slimyLoginAttempt.count({
    where: {
      success: false,
      createdAt: { gte: windowStart },
      OR: [
        { identifier: identifier.toLowerCase() },
        { ipAddress },
      ],
    },
  });

  if (recentFailures >= MAX_ATTEMPTS) {
    const lastFailure = await db.slimyLoginAttempt.findFirst({
      where: {
        success: false,
        OR: [
          { identifier: identifier.toLowerCase() },
          { ipAddress },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const lockoutUntil = lastFailure
      ? new Date(lastFailure.createdAt.getTime() + LOCKOUT_MINUTES * 60 * 1000)
      : new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);

    if (lockoutUntil > new Date()) {
      return { allowed: false, attemptsRemaining: 0, lockoutUntil };
    }
  }

  return {
    allowed: true,
    attemptsRemaining: MAX_ATTEMPTS - recentFailures,
  };
}

/**
 * Record a login attempt (success or failure).
 */
export async function recordLoginAttempt(
  identifier: string,
  ipAddress: string,
  success: boolean,
  userId?: string
): Promise<void> {
  await db.slimyLoginAttempt.create({
    data: {
      identifier: identifier.toLowerCase(),
      ipAddress,
      success,
      userId: userId || null,
    },
  });
}
