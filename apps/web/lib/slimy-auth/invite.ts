/**
 * Slimy Auth — Invite code management
 * Invite-only registration. Codes are hashed before storage.
 */

import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";

interface InviteValidationResult {
  valid: boolean;
  inviteId?: string;
  role?: string;
  error?: string;
}

/**
 * Hash an invite code for storage/comparison
 */
function hashInviteCode(code: string): string {
  const normalized = code.toUpperCase().replace(/[-\s]/g, "");
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Create a new invite code. Returns the plaintext code (show once) and the DB record ID.
 */
export async function createInviteCode(
  createdBy?: string,
  maxUses: number = 1,
  expiresInHours?: number,
  note?: string,
  role: string = "member"
): Promise<{ code: string; inviteId: string }> {
  const raw = randomBytes(8).toString("hex").toUpperCase();
  const code = raw.replace(/(.{4})/g, "$1-").slice(0, 19);

  const codeHash = hashInviteCode(code);
  const expiresAt = expiresInHours
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    : null;

  const inviteRole = role === "owner" ? "owner" : "member";

  const invite = await db.slimyInvite.create({
    data: {
      codeHash,
      createdBy: createdBy || null,
      role: inviteRole,
      maxUses,
      expiresAt,
      note: note || null,
    },
  });

  return { code, inviteId: invite.id };
}

/**
 * Validate an invite code. Returns { valid, inviteId } or { valid: false, error }.
 */
export async function validateInviteCode(
  code: string
): Promise<InviteValidationResult> {
  const codeHash = hashInviteCode(code);

  const invite = await db.slimyInvite.findUnique({
    where: { codeHash },
  });

  if (!invite) {
    return { valid: false, error: "not_found" };
  }

  if (invite.revokedAt) {
    return { valid: false, error: "revoked" };
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return { valid: false, error: "expired" };
  }

  if (invite.useCount >= invite.maxUses) {
    return { valid: false, error: "max_uses_reached" };
  }

  return { valid: true, inviteId: invite.id, role: invite.role || "member" };
}

/**
 * Mark an invite code as used (increment useCount).
 */
export async function markInviteAsUsed(
  inviteId: string,
  _userId?: string
): Promise<void> {
  await db.slimyInvite.update({
    where: { id: inviteId },
    data: {
      useCount: { increment: 1 },
    },
  });
}
