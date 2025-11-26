import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AuthenticationError } from "@/lib/errors";
import type { AuthUser } from "./types";
import type { Role } from "@/slimy.config";

export interface ServerAuthUser extends AuthUser {
  roles?: string[];
  email?: string;
}

const DEFAULT_ROLE: Role = "user";

function normalizeRole(value: string | null): Role {
  if (!value) return DEFAULT_ROLE;
  const lowered = value.toLowerCase() as Role;
  return ["admin", "club", "user"].includes(lowered) ? lowered : DEFAULT_ROLE;
}

function parseRoles(value: string | null, fallback: Role): string[] {
  if (!value) {
    return [fallback];
  }
  const roles = value
    .split(",")
    .map(role => role.trim())
    .filter(Boolean);

  if (!roles.includes(fallback)) {
    roles.push(fallback);
  }

  return roles;
}

/**
 * SECURITY FIX: Server-side auth that validates JWT from secure HTTP-only cookies.
 * Previously trusted x-user-* headers which could be injected by attackers.
 * Now properly verifies JWT signature and extracts user info.
 *
 * Throws when the caller is unauthenticated or token is invalid.
 */
export async function requireAuth(request: NextRequest): Promise<ServerAuthUser> {
  // SECURITY: Never trust x-user-* headers - they can be injected by clients
  // Instead, read and verify the JWT from secure HTTP-only cookies

  const cookieStore = await cookies();
  const token = cookieStore.get("slimy_admin_token")?.value ||
                cookieStore.get("slimy_admin")?.value ||
                cookieStore.get("slimy_session")?.value;

  if (!token) {
    console.warn("[requireAuth] No authentication cookie found");
    throw new AuthenticationError("User not authenticated - no session cookie");
  }

  // TODO: Add JWT verification here using the JWT secret
  // For now, we'll make a request to the admin-api /api/auth/me endpoint
  // which will verify the token and return user info
  // This is not ideal but provides proper verification until we implement
  // JWT verification in the Next.js app

  try {
    const baseUrl = process.env.ADMIN_API_INTERNAL_URL || 'http://localhost:3080';
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: `slimy_admin_token=${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error("[requireAuth] Admin API auth check failed", { status: response.status });
      throw new AuthenticationError("Invalid or expired session");
    }

    const user = await response.json();

    if (!user || !user.id) {
      console.error("[requireAuth] Admin API returned invalid user data");
      throw new AuthenticationError("Invalid user session data");
    }

    return {
      id: user.id,
      name: user.username || user.globalName || user.id,
      role: normalizeRole(user.role),
      roles: user.roles || [normalizeRole(user.role)],
      guilds: user.guilds || [],
      email: user.email,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    console.error("[requireAuth] Error verifying authentication", error);
    throw new AuthenticationError("Failed to verify authentication");
  }
}
