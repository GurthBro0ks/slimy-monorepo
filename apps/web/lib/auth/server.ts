import { NextRequest } from "next/server";
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
 * Minimal server-side auth helper that trusts upstream headers.
 * Throws when the caller is unauthenticated.
 */
export async function requireAuth(request: NextRequest): Promise<ServerAuthUser> {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    throw new AuthenticationError("User not authenticated");
  }

  const primaryRole = normalizeRole(request.headers.get("x-user-role"));
  const roles = parseRoles(request.headers.get("x-user-roles"), primaryRole);

  return {
    id: userId,
    name: request.headers.get("x-username") || userId,
    role: primaryRole,
    roles,
    guilds: [],
  };
}
