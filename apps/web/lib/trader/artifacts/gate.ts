/**
 * Artifact Access Gate - Fail-Closed Allowlist
 *
 * Checks if the authenticated trader user has access to artifacts.
 * FAIL-CLOSED: If check fails for any reason, access is denied.
 *
 * Access is granted if:
 * 1. User ID is in TRADER_ARTIFACTS_ALLOWED_USER_IDS environment variable
 *
 * Access is denied if:
 * - Environment variable is empty (fail-closed)
 * - User ID is not in the list
 * - Any error occurs during check
 */

import type { ArtifactAccessResult } from "./types";

/**
 * Parse allowlist from environment variable
 * Returns empty array if not configured (fail-closed)
 */
function parseAllowlist(): string[] {
  const envValue = process.env.TRADER_ARTIFACTS_ALLOWED_USER_IDS;
  if (!envValue || envValue.trim() === "") {
    return [];
  }
  return envValue
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

/**
 * Check if user has artifact access
 *
 * FAIL-CLOSED: Returns false if any error occurs or allowlist is not configured
 */
export async function checkArtifactAccess(
  userId: string
): Promise<ArtifactAccessResult> {
  try {
    // Check environment variable allowlist
    const allowlist = parseAllowlist();

    // If env var is empty, fail-closed
    if (allowlist.length === 0) {
      console.log(
        `[ArtifactGate] Deny user ${userId}: TRADER_ARTIFACTS_ALLOWED_USER_IDS not configured`
      );
      return { allowed: false, reason: "env_not_configured", userId };
    }

    // Check if user is in allowlist
    if (allowlist.includes(userId)) {
      return { allowed: true, userId };
    }

    console.log(
      `[ArtifactGate] Deny user ${userId}: not in allowlist (${allowlist.length} entries)`
    );
    return { allowed: false, reason: "not_in_allowlist", userId };
  } catch (error) {
    console.error("[ArtifactGate] Access check failed:", error);
    return { allowed: false, reason: "check_failed", userId };
  }
}

/**
 * Gate response type for API routes
 */
export interface GateResponse {
  status: number;
  body: { ok: false; error: string };
}

/**
 * Middleware-style gate for API routes
 * Returns null if allowed, or error response object if denied
 */
export async function gateArtifactAccess(
  userId: string | null
): Promise<GateResponse | null> {
  // No user = 401 Unauthorized
  if (!userId) {
    return {
      status: 401,
      body: { ok: false, error: "Authentication required" },
    };
  }

  const result = await checkArtifactAccess(userId);

  // Access denied = 403 Forbidden
  if (!result.allowed) {
    return {
      status: 403,
      body: { ok: false, error: "Artifact access not authorized" },
    };
  }

  // Access granted
  return null;
}

/**
 * Check if allowlist is configured (for debug purposes)
 */
export function isAllowlistConfigured(): boolean {
  return parseAllowlist().length > 0;
}
