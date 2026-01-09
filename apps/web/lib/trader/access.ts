// Trader access control - server-side check for trader.slimyai.xyz

import { cookies } from "next/headers";

export interface TraderAccessResult {
  authenticated: boolean;
  hasAccess: boolean;
  userId: string | null;
  username: string | null;
  reason?: "not_logged_in" | "no_trader_access" | "settings_fetch_failed";
}

/**
 * Check if the current user has access to the Trader UI.
 * This is a server-side function that should be called from server components.
 *
 * Access requires:
 * 1. User is authenticated (has valid session)
 * 2. User has trader.access = true in their settings
 */
export async function checkTraderAccess(): Promise<TraderAccessResult> {
  try {
    const cookieStore = await cookies();

    // Get session cookie
    const explicitCookieName = String(
      process.env.ADMIN_TOKEN_COOKIE || ""
    ).trim();
    const sessionToken =
      (explicitCookieName ? cookieStore.get(explicitCookieName) : undefined) ||
      cookieStore.get("slimy_admin") ||
      cookieStore.get("slimy_admin_token") ||
      cookieStore.get("slimy_session") ||
      cookieStore.get("connect.sid");

    if (!sessionToken) {
      console.log("[TraderAccess] No session cookie found");
      return {
        authenticated: false,
        hasAccess: false,
        userId: null,
        username: null,
        reason: "not_logged_in",
      };
    }

    const cookieHeader = `${sessionToken.name}=${sessionToken.value}`;
    const adminApiBase =
      process.env.INTERNAL_ADMIN_API_URL || "http://admin-api:3080";

    // Fetch user info from admin-api
    const authRes = await fetch(`${adminApiBase}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });

    if (!authRes.ok) {
      console.log(
        `[TraderAccess] Auth check failed: ${authRes.status}`
      );
      return {
        authenticated: false,
        hasAccess: false,
        userId: null,
        username: null,
        reason: "not_logged_in",
      };
    }

    const authData = await authRes.json();
    const user = authData.user || authData;

    if (!user?.id && !user?.discordId) {
      console.log("[TraderAccess] Invalid user data from auth");
      return {
        authenticated: false,
        hasAccess: false,
        userId: null,
        username: null,
        reason: "not_logged_in",
      };
    }

    const userId = user.discordId || user.id;
    const username = user.username || user.globalName || "Unknown";

    console.log(`[TraderAccess] User authenticated: ${username} (${userId})`);

    // Check if user has admin role - admins bypass trader access check
    const role = user.role || user.globalRole;
    if (role === "admin" || role === "owner") {
      console.log(`[TraderAccess] Admin/owner bypass for ${username}`);
      return {
        authenticated: true,
        hasAccess: true,
        userId,
        username,
      };
    }

    // Fetch user settings to check trader access
    const settingsRes = await fetch(`${adminApiBase}/api/me/settings`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });

    if (!settingsRes.ok) {
      console.log(
        `[TraderAccess] Settings fetch failed: ${settingsRes.status}`
      );
      // Don't block access if settings fetch fails - be permissive
      return {
        authenticated: true,
        hasAccess: false,
        userId,
        username,
        reason: "settings_fetch_failed",
      };
    }

    const settingsData = await settingsRes.json();
    const settings = settingsData.settings || settingsData;

    const hasAccess = settings?.trader?.access === true;

    console.log(
      `[TraderAccess] ${username} trader.access = ${hasAccess}`
    );

    return {
      authenticated: true,
      hasAccess,
      userId,
      username,
      reason: hasAccess ? undefined : "no_trader_access",
    };
  } catch (error) {
    console.error("[TraderAccess] Error checking access:", error);
    return {
      authenticated: false,
      hasAccess: false,
      userId: null,
      username: null,
      reason: "not_logged_in",
    };
  }
}
