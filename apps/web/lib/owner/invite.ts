/**
 * Owner Invite Management — Rewired to use SlimyInvite
 * This module provides the same API as before but uses the SlimyInvite model.
 */

import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

export function generateInviteToken(): string {
  const raw = randomBytes(8).toString("hex").toUpperCase();
  return raw.replace(/(.{4})/g, "$1-").slice(0, 19);
}

export function hashInviteToken(token: string): string {
  const normalized = token.toUpperCase().replace(/[-\s]/g, "");
  return createHash("sha256").update(normalized).digest("hex");
}

export interface CreateOwnerInviteOptions {
  expiresAt?: Date;
  maxUses?: number;
  note?: string;
  role?: string;
}

export interface OwnerInviteCreated {
  inviteId: string;
  tokenPlaintext: string; // One-time display only
  codeHash: string;
  code: string; // plaintext code for retrieval
  expiresAt?: Date;
  maxUses: number;
  note?: string;
  role: string;
}

/**
 * Create a new owner invite code using SlimyInvite model
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

  // Validate role - "owner", "leader", or "member" allowed, default to "member"
  const validRoles = ["owner", "leader", "member"];
  const role = validRoles.includes(options.role || "") ? options.role! : "member";

  // Store the hash AND plaintext code in database using SlimyInvite model
  const invite = await db.slimyInvite.create({
    data: {
      codeHash: tokenHash,
      code: token, // Store plaintext for owner to retrieve later
      createdBy: createdById,
      role,
      expiresAt: options.expiresAt || null,
      maxUses,
      note: options.note || null,
    },
  });

  return {
    inviteId: invite.id,
    tokenPlaintext: token, // Return ONCE to user
    codeHash: tokenHash,
    code: token, // Return for retrieval
    expiresAt: invite.expiresAt || undefined,
    maxUses: invite.maxUses,
    note: options.note,
    role: invite.role,
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
 * Validate an owner invite token using SlimyInvite model
 * Returns detailed validation result
 */
export async function validateOwnerInvite(
  token: string
): Promise<ValidateOwnerInviteResult> {
  // Hash the provided token
  const tokenHash = hashInviteToken(token);

  // Find invite by hash in SlimyInvite table
  const invite = await db.slimyInvite.findUnique({
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
 * Redeem an owner invite (incrementally) using SlimyInvite model
 */
export async function redeemOwnerInvite(
  inviteId: string,
  _email?: string,
  _bootstrapCreatedBy?: string
): Promise<boolean> {
  // Try to increment use count atomically
  try {
    await db.slimyInvite.update({
      where: {
        id: inviteId,
        useCount: { lt: db.slimyInvite.fields.maxUses },
        revokedAt: null,
      },
      data: {
        useCount: { increment: 1 },
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Revoke an owner invite using SlimyInvite model
 */
export async function revokeOwnerInvite(inviteId: string): Promise<boolean> {
  try {
    await db.slimyInvite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * List owner invites (admin view) using SlimyInvite model
 * Returns invites with creator info looked up from SlimyUser
 */
export async function listOwnerInvites() {
  const invites = await db.slimyInvite.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Get unique creator IDs
  const creatorIds = [...new Set(invites.map((i) => i.createdBy).filter(Boolean))] as string[];

  // Look up creator info from SlimyUser
  const creators = await db.slimyUser.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, email: true },
  });

  const creatorMap = new Map(creators.map((c) => [c.id, c]));

  // Map to expected format
  return invites.map((inv) => ({
    id: inv.id,
    codeHash: inv.codeHash,
    code: inv.code, // plaintext code for owner to view
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    maxUses: inv.maxUses,
    useCount: inv.useCount,
    revokedAt: inv.revokedAt,
    note: inv.note,
    role: inv.role,
    createdBy: inv.createdBy
      ? {
          id: inv.createdBy,
          email: creatorMap.get(inv.createdBy)?.email || "unknown",
        }
      : {
          id: "system",
          email: "system",
        },
  }));
}
