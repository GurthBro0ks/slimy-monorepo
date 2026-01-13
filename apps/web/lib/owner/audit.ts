import { prisma } from "@/lib/db";

export type OwnerAuditAction =
  | "INVITE_CREATE"
  | "INVITE_REVOKE"
  | "SETTINGS_UPDATE"
  | "OWNER_ADD"
  | "OWNER_REVOKE";

export type OwnerAuditResourceType = "invite" | "settings" | "owner";

export interface LogOwnerActionOptions {
  actorId: string;
  action: OwnerAuditAction;
  resourceType: OwnerAuditResourceType;
  resourceId?: string;
  changes?: Record<string, unknown>; // What changed (but NO plaintext tokens)
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an owner action to the audit log
 * CRITICAL: Never log plaintext invite tokens or sensitive data
 */
export async function logOwnerAction(
  options: LogOwnerActionOptions
): Promise<void> {
  // Ensure changes don't contain sensitive plaintext
  if (options.changes) {
    // Sanitize changes object
    const sanitized = sanitizeChanges(options.changes);

    await prisma.ownerAuditLog.create({
      data: {
        actorId: options.actorId,
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        changes: JSON.stringify(sanitized),
        ipAddress: options.ipAddress?.substring(0, 45), // Cap IP length
        userAgent: options.userAgent?.substring(0, 500), // Cap user agent length
      },
    });
  } else {
    await prisma.ownerAuditLog.create({
      data: {
        actorId: options.actorId,
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        ipAddress: options.ipAddress?.substring(0, 45),
        userAgent: options.userAgent?.substring(0, 500),
      },
    });
  }
}

/**
 * Sanitize audit log changes to remove sensitive data
 */
function sanitizeChanges(
  changes: Record<string, unknown>
): Record<string, unknown> {
  const sanitized = { ...changes };

  // Remove plaintext tokens
  if ("token" in sanitized) {
    delete sanitized.token;
  }
  if ("tokenPlaintext" in sanitized) {
    delete sanitized.tokenPlaintext;
  }
  if ("code" in sanitized) {
    delete sanitized.code;
  }
  if ("password" in sanitized) {
    delete sanitized.password;
  }

  // Replace token hashes with just their length indication
  if ("codeHash" in sanitized && typeof sanitized.codeHash === "string") {
    sanitized.codeHash = `[64-char-hash]`;
  }

  return sanitized;
}

/**
 * Get recent audit logs for an owner
 */
export async function getOwnerAuditLogs(
  limit: number = 100,
  action?: OwnerAuditAction
) {
  return prisma.ownerAuditLog.findMany({
    where: action ? { action } : undefined,
    select: {
      id: true,
      actorId: true,
      actor: {
        select: {
          id: true,
          email: true,
        },
      },
      action: true,
      resourceType: true,
      resourceId: true,
      changes: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Parse changes JSON (safely)
 */
export function parseAuditChanges(
  changesJson: string | null
): Record<string, unknown> | null {
  if (!changesJson) return null;
  try {
    return JSON.parse(changesJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}
