/**
 * Trader Access Control - Isolated Auth for trader.slimyai.xyz
 *
 * This is a server-side function that checks the isolated trader session.
 * It does NOT share authentication with the main SlimyAI app.
 */

import { validateTraderSession } from "./auth/session";

export interface TraderAccessResult {
  authenticated: boolean;
  hasAccess: boolean;
  userId: string | null;
  username: string | null;
  sessionId: string | null;
  reason?:
    | "not_logged_in"
    | "session_expired"
    | "session_revoked"
    | "account_disabled";
}

/**
 * Check if the current user has access to the Trader UI.
 * This is a server-side function that should be called from server components.
 *
 * Uses isolated trader authentication - NOT shared with main SlimyAI auth.
 */
export async function checkTraderAccess(): Promise<TraderAccessResult> {
  const result = await validateTraderSession();

  if (!result.authenticated) {
    let reason: TraderAccessResult["reason"] = "not_logged_in";
    if (result.error === "expired") reason = "session_expired";
    if (result.error === "revoked") reason = "session_revoked";
    if (result.error === "disabled") reason = "account_disabled";

    return {
      authenticated: false,
      hasAccess: false,
      userId: null,
      username: null,
      sessionId: result.sessionId,
      reason,
    };
  }

  // All authenticated trader users have access
  // Future: could add role-based access here
  return {
    authenticated: true,
    hasAccess: true,
    userId: result.user!.id,
    username: result.user!.username,
    sessionId: result.sessionId,
  };
}
