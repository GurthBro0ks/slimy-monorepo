import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

/**
 * Generate a random invite token
 * @param bytes - Number of random bytes (default 32 = 256-bit security)
 * @returns hex-encoded token
 */
export function generateInviteToken(bytes: number = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Hash an invite token using SHA256
 * Returns hex-encoded hash (always 64 chars)
 */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface CreateOwnerInviteOptions {
  expiresAt?: Date;
  maxUses?: number;
  note?: string;
}

export interface OwnerInviteCreated {
  inviteId: string;
  tokenPlaintext: string; // One-time display only
  codeHash: string;
  expiresAt?: Date;
  maxUses: number;
  note?: string;
}

/**
 * Create a new owner invite code
 * Returns both the plaintext token (to show user once) and the stored hash
 */
export async function createOwnerInvite(
  createdById: string,
  options: CreateOwnerInviteOptions = {}
): Promise<OwnerInviteCreated> {
  // Generate and hash the token
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);

  // Validate constraints
  const maxUses = Math.max(1, Math.min(options.maxUses || 1, 100)); // Bounded 1-100

  // Store only the hash in database
  const invite = await prisma.ownerInvite.create({
    data: {
      codeHash: tokenHash,
      createdById,
      expiresAt: options.expiresAt,
      maxUses,
      useCount: 0,
      note: options.note,
    },
  });

  return {
    inviteId: invite.id,
    tokenPlaintext: token, // Return ONCE to user
    codeHash: tokenHash,
    expiresAt: invite.expiresAt || undefined,
    maxUses: invite.maxUses,
    note: options.note,
  };
}

export interface ValidateOwnerInviteResult {
  valid: boolean;
  reason?: string;
  invite?: {
    id: string;
    codeHash: string;
    maxUses: number;
    useCount: number;
    expiresAt?: Date;
  };
}

/**
 * Validate an owner invite token
 * Returns detailed validation result
 */
export async function validateOwnerInvite(
  token: string
): Promise<ValidateOwnerInviteResult> {
  // Hash the provided token
  const tokenHash = hashInviteToken(token);

  // Find invite by hash
  const invite = await prisma.ownerInvite.findUnique({
    where: { codeHash: tokenHash },
  });

  // Fail closed: missing invite
  if (!invite) {
    return {
      valid: false,
      reason: "Invite not found",
    };
  }

  // Fail closed: revoked
  if (invite.revokedAt) {
    return {
      valid: false,
      reason: "Invite has been revoked",
    };
  }

  // Fail closed: expired
  if (invite.expiresAt && new Date() > invite.expiresAt) {
    return {
      valid: false,
      reason: "Invite has expired",
    };
  }

  // Fail closed: max uses exceeded
  if (invite.useCount >= invite.maxUses) {
    return {
      valid: false,
      reason: "Invite has reached maximum uses",
    };
  }

  return {
    valid: true,
    invite: {
      id: invite.id,
      codeHash: invite.codeHash,
      maxUses: invite.maxUses,
      useCount: invite.useCount,
      expiresAt: invite.expiresAt || undefined,
    },
  };
}

/**
 * Redeem an owner invite (incrementally)
 * MUST be called in a transaction to avoid race conditions
 */
export async function redeemOwnerInvite(
  inviteId: string,
  email: string,
  bootstrapCreatedBy?: string
): Promise<boolean> {
  // Try to increment use count atomically
  // If this fails (someone already redeemed it), we'll get 0 updates
  const updated = await prisma.ownerInvite.updateMany({
    where: {
      id: inviteId,
      useCount: { lt: prisma.ownerInvite.fields.maxUses }, // Use count < max_uses
      revokedAt: null,
      expiresAt: {
        // expires_at is null OR in the future
        or: [{ equals: null }, { gt: new Date() }],
      },
    },
    data: {
      useCount: { increment: 1 },
      usedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return false; // Could not redeem (race condition or validation failed)
  }

  // Add email to allowlist
  await prisma.ownerAllowlist.create({
    data: {
      email,
      createdBy: bootstrapCreatedBy || "invite-redemption",
      note: `Created via invite redemption: ${inviteId}`,
    },
  });

  return true;
}

/**
 * Revoke an owner invite
 */
export async function revokeOwnerInvite(inviteId: string): Promise<boolean> {
  const updated = await prisma.ownerInvite.updateMany({
    where: { id: inviteId },
    data: { revokedAt: new Date() },
  });
  return updated.count > 0;
}

/**
 * List owner invites (admin view)
 * Does NOT return plaintext tokens (obviously)
 */
export async function listOwnerInvites() {
  return prisma.ownerInvite.findMany({
    select: {
      id: true,
      codeHash: true,
      createdAt: true,
      expiresAt: true,
      maxUses: true,
      useCount: true,
      revokedAt: true,
      note: true,
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
