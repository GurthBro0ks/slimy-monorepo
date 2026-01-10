/**
 * Trader Invite Code Management
 *
 * Handles creation, validation, and usage tracking of invite codes.
 * Invite codes are stored as hashes (never plaintext).
 */

import { db } from "@/lib/db";
import { generateInviteCode, hashToken } from "./crypto";

export interface ValidateInviteResult {
  valid: boolean;
  inviteId: string | null;
  error?: "not_found" | "expired" | "max_uses_reached";
}

export interface CreateInviteOptions {
  expiresInDays?: number;
  maxUses?: number;
  note?: string;
}

/**
 * Create a new invite code
 * Returns the plaintext code (shown once) and the invite ID
 */
export async function createInviteCode(
  options?: CreateInviteOptions
): Promise<{ code: string; id: string }> {
  const code = generateInviteCode();
  // Hash without dashes for storage consistency
  const codeHash = hashToken(code.replace(/-/g, ""));

  const expiresAt = options?.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const invite = await db.traderInvite.create({
    data: {
      codeHash,
      expiresAt,
      maxUses: options?.maxUses ?? 1,
      note: options?.note,
    },
  });

  return { code, id: invite.id };
}

/**
 * Validate an invite code
 */
export async function validateInviteCode(
  code: string
): Promise<ValidateInviteResult> {
  // Normalize: remove dashes, uppercase
  const normalizedCode = code.replace(/-/g, "").toUpperCase();
  const codeHash = hashToken(normalizedCode);

  const invite = await db.traderInvite.findUnique({
    where: { codeHash },
  });

  if (!invite) {
    return { valid: false, inviteId: null, error: "not_found" };
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return { valid: false, inviteId: invite.id, error: "expired" };
  }

  if (invite.useCount >= invite.maxUses) {
    return { valid: false, inviteId: invite.id, error: "max_uses_reached" };
  }

  return { valid: true, inviteId: invite.id };
}

/**
 * Mark an invite as used (called after successful registration)
 */
export async function useInviteCode(
  inviteId: string,
  userId: string
): Promise<void> {
  await db.traderInvite.update({
    where: { id: inviteId },
    data: {
      useCount: { increment: 1 },
      usedAt: new Date(),
      usedById: userId,
    },
  });
}

/**
 * Get invite stats (for admin purposes)
 */
export async function getInviteStats(): Promise<{
  total: number;
  used: number;
  expired: number;
  available: number;
}> {
  const now = new Date();

  const [total, used, expired] = await Promise.all([
    db.traderInvite.count(),
    db.traderInvite.count({
      where: { useCount: { gt: 0 } },
    }),
    db.traderInvite.count({
      where: {
        expiresAt: { lt: now },
        useCount: 0,
      },
    }),
  ]);

  return {
    total,
    used,
    expired,
    available: total - used - expired,
  };
}
