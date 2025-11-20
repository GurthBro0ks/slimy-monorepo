"use client";

/**
 * Discord OAuth and Session Management Client
 *
 * Provides client-side methods for Discord OAuth login, logout, and session management.
 */

const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || "http://localhost:3080";

// Discord OAuth configuration from environment variables
const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "";
const DISCORD_REDIRECT_URI = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || `${API_BASE}/api/auth/discord`;
const DISCORD_SCOPES = process.env.NEXT_PUBLIC_DISCORD_SCOPES || "identify guilds";

/**
 * Builds the Discord OAuth authorization URL and redirects the user
 *
 * @param {string} [state] - Optional state parameter for CSRF protection
 */
export function loginWithDiscord(state) {
  if (!DISCORD_CLIENT_ID) {
    console.error("[auth-client] DISCORD_CLIENT_ID not configured");
    throw new Error("Discord OAuth not configured");
  }

  // Generate random state if not provided
  const oauthState = state || generateRandomState();

  // Build Discord OAuth URL
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: DISCORD_SCOPES,
    state: oauthState,
    prompt: "consent",
  });

  const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

  // Redirect to Discord OAuth
  if (typeof window !== "undefined") {
    window.location.href = authUrl;
  } else {
    console.warn("[auth-client] loginWithDiscord called outside browser environment");
  }
}

/**
 * Logs out the current user by calling the logout endpoint
 *
 * @returns {Promise<{message: string}>} Logout response
 */
export async function logout() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Logout failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[auth-client] Logout failed:", error);
    throw error;
  }
}

/**
 * Fetches the current session/user information
 *
 * @returns {Promise<Object|null>} User session data or null if not authenticated
 */
export async function getSession() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated
        return null;
      }
      throw new Error(`Failed to fetch session: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[auth-client] Failed to fetch session:", error);
    return null;
  }
}

/**
 * Generates a random state string for CSRF protection
 *
 * @returns {string} Random state string
 */
function generateRandomState() {
  if (typeof window !== "undefined" && window.crypto) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
  }
  // Fallback for environments without crypto
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Checks if a user is currently authenticated
 *
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated() {
  const session = await getSession();
  return session !== null;
}

// Default export for convenience
export default {
  loginWithDiscord,
  logout,
  getSession,
  isAuthenticated,
};
