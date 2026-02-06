/**
 * Trader Auth Password Reset Utilities
 *
 * Manages password reset token generation, validation, and execution.
 * Reset tokens are time-limited (1 hour) and single-use.
 *
 * NOTE: Tokens are stored in-memory for now. In production, these should
 * be persisted to the database (requires a TraderPasswordReset model).
 */

import { generateToken, hashToken, hashPassword } from "./crypto";
import { revokeAllUserSessions } from "./session";
import { db } from "@/lib/db";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface PendingReset {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

// In-memory store for reset tokens (replace with DB in production)
const pendingResets = new Map<string, PendingReset>();

/**
 * Create a password reset token for a given username.
 *
 * Returns the plaintext token (to be sent via email/secure channel)
 * or null if the user does not exist (deliberately vague for security).
 */
export async function createPasswordResetToken(
  username: string
): Promise<{ token: string; expiresAt: Date } | null> {
  const user = await db.traderUser.findUnique({
    where: { username },
  });

  if (!user || user.disabled) {
    // Return null but don't reveal whether user exists
    return null;
  }

  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  // Invalidate any previous reset tokens for this user
  for (const [key, reset] of pendingResets.entries()) {
    if (reset.userId === user.id) {
      pendingResets.delete(key);
    }
  }

  pendingResets.set(tokenHash, {
    userId: user.id,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
    used: false,
  });

  return { token, expiresAt };
}

/**
 * Validate a password reset token.
 *
 * Returns the userId if valid, or an error string.
 */
export function validateResetToken(
  token: string
): { valid: true; userId: string } | { valid: false; error: string } {
  const tokenHash = hashToken(token);
  const reset = pendingResets.get(tokenHash);

  if (!reset) {
    return { valid: false, error: "Invalid or expired reset token" };
  }

  if (reset.used) {
    return { valid: false, error: "Reset token has already been used" };
  }

  if (reset.expiresAt < new Date()) {
    pendingResets.delete(tokenHash);
    return { valid: false, error: "Reset token has expired" };
  }

  return { valid: true, userId: reset.userId };
}

/**
 * Execute a password reset: update the password and revoke all sessions.
 *
 * @param token  The plaintext reset token
 * @param newPassword  The new password
 * @returns Success/failure result
 */
export async function executePasswordReset(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const validation = validateResetToken(token);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const { userId } = validation;

  try {
    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password in database
    await db.traderUser.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all existing sessions (force re-login)
    await revokeAllUserSessions(userId);

    // Mark token as used
    const tokenHash = hashToken(token);
    const reset = pendingResets.get(tokenHash);
    if (reset) {
      reset.used = true;
    }

    return { success: true };
  } catch (error) {
    console.error("[TraderAuth] Password reset execution error:", error);
    return { success: false, error: "Failed to reset password" };
  }
}

/**
 * Cleanup expired reset tokens (call periodically)
 */
export function cleanupExpiredResets(): number {
  const now = new Date();
  let cleaned = 0;
  for (const [key, reset] of pendingResets.entries()) {
    if (reset.expiresAt < now || reset.used) {
      pendingResets.delete(key);
      cleaned++;
    }
  }
  return cleaned;
}
