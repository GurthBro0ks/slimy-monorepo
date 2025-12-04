import { cookies } from "next/headers";
import { AuthenticationError } from "@/lib/errors";
import { apiClient } from "@/lib/api-client";
import { getUserRole } from "@/slimy.config";
import type { AuthUser } from "./types";
import { AUTH_COOKIE_NAME, AUTH_ERRORS } from "./constants";
import { getRequestUser, setRequestUser } from "./request-context";

export interface ServerAuthUser extends AuthUser {
  roles?: string[];
  email?: string;
}

interface AdminApiMeResponse {
  user: {
    id: string;
    username?: string;
    globalName?: string;
    discordId: string;
    avatar?: string;
    role: string;
    lastActiveGuildId?: string;
  };
  role: string;
  guilds?: Array<{
    id: string;
    roles: string[];
  }>;
}

/**
 * Validates user session via cookie-based authentication.
 * Caches result per request to avoid multiple Admin API calls.
 *
 * @throws {AuthenticationError} If session is invalid or missing
 * @returns {Promise<ServerAuthUser>} Validated user information
 */
export async function requireAuth(): Promise<ServerAuthUser> {
  // Check request-scoped cache first
  const cachedUser = getRequestUser();
  if (cachedUser) {
    return cachedUser;
  }

  // Get cookies from Next.js headers
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!sessionCookie) {
    throw new AuthenticationError(AUTH_ERRORS.NO_COOKIE);
  }

  // Forward all cookies to Admin API for validation
  const cookieHeader = cookieStore.toString();

  const result = await apiClient.get<AdminApiMeResponse>("/api/auth/me", {
    useCache: false,
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!result.ok) {
    throw new AuthenticationError(
      AUTH_ERRORS.INVALID_SESSION,
      { code: result.code, status: result.status }
    );
  }

  // Extract user data and determine role
  const { user, guilds } = result.data;

  // Defensive check: ensure user object exists
  if (!user || !user.id) {
    throw new AuthenticationError(
      'Invalid session: user data missing',
      { received: result.data }
    );
  }

  const allRoles = guilds?.flatMap(g => g.roles) || [];
  const role = getUserRole(allRoles);

  const serverUser: ServerAuthUser = {
    id: user.id,
    name: user.globalName || user.username || user.id,
    email: undefined, // Email is not included in transformed response
    role,
    roles: allRoles,
    guilds: guilds || [],
  };

  // Cache for this request
  setRequestUser(serverUser);

  return serverUser;
}
