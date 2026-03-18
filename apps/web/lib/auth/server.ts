/**
 * Server-side auth — requireAuth()
 * Validates the slimy_session cookie via DB lookup (lib/slimy-auth).
 */

import { validateSession } from "@/lib/slimy-auth/session";

export interface ServerAuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  guilds: any[];
}

/**
 * Require authentication. Returns user or null.
 * Used by API routes: const user = await requireAuth(); if (!user) return 401;
 */
export async function requireAuth(
  cookieStoreOverride?: any
): Promise<ServerAuthUser | null> {
  try {
    const result = await validateSession(cookieStoreOverride);

    if (!result.authenticated) {
      return null;
    }

    return {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
      role: result.user.role,
      guilds: [],
    };
  } catch (error) {
    console.error("[Auth] requireAuth error:", error);
    return null;
  }
}
