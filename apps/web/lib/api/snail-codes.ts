/**
 * Snail Codes API Client
 *
 * Fetches snail codes from the admin-api backend when configured,
 * with fallback to sandbox/mock data for development and testing.
 */

import { adminApiClient } from "./admin-client";

export type SnailCodeSource = "snelp" | "reddit" | "twitter" | "discord" | "other";
export type SnailCodeStatus = "active" | "expired" | "unknown";

export interface SnailCode {
  id: string;
  code: string;
  source: SnailCodeSource;
  status: SnailCodeStatus;
  title?: string;
  foundAt?: string;
  expiresAt?: string | null;
}

export interface SnailCodesResponse {
  ok: boolean;
  codes: SnailCode[];
}

/**
 * Sandbox codes for development/testing when admin-api is not configured
 */
const SANDBOX_CODES: SnailCode[] = [
  {
    id: "sandbox-1",
    code: "SNAIL2025",
    source: "snelp",
    status: "active",
    title: "Sandbox launch bonus",
    foundAt: new Date().toISOString(),
    expiresAt: null,
  },
  {
    id: "sandbox-2",
    code: "SANDBOX100",
    source: "reddit",
    status: "active",
    title: "Sandbox test code",
    foundAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), // Next week
  },
  {
    id: "sandbox-3",
    code: "DEVMODE",
    source: "discord",
    status: "active",
    title: "Development mode code",
    foundAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
    expiresAt: null,
  },
  {
    id: "sandbox-4",
    code: "TESTEXPIRED",
    source: "twitter",
    status: "expired",
    title: "Expired test code",
    foundAt: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 days ago
    expiresAt: new Date(Date.now() - 7 * 86400000).toISOString(), // Week ago
  },
  {
    id: "sandbox-5",
    code: "UNKNOWN123",
    source: "other",
    status: "unknown",
    title: "Unknown status code",
    foundAt: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
    expiresAt: null,
  },
];

/**
 * Fetch snail codes from admin-api or return sandbox data
 *
 * This function:
 * 1. Checks if admin-api is configured
 * 2. If not configured, returns sandbox codes
 * 3. If configured, attempts to fetch from admin-api
 * 4. On error, falls back to sandbox codes
 *
 * @returns {Promise<SnailCode[]>} Array of snail codes
 */
export async function fetchSnailCodes(): Promise<SnailCode[]> {
  // If admin-api isn't configured, return sandbox codes
  if (!adminApiClient.isConfigured()) {
    console.info("[snail-codes] Admin API not configured, using sandbox data");
    return SANDBOX_CODES;
  }

  try {
    const response = await adminApiClient.get<SnailCodesResponse>("/api/snail/codes");

    if (!response.ok) {
      const errorMessage = "message" in response ? response.message : "Unknown error";
      console.warn("[snail-codes] Admin API request failed:", errorMessage);
      console.info("[snail-codes] Falling back to sandbox data");
      return SANDBOX_CODES;
    }

    const data = response.data;

    if (!data.ok || !Array.isArray(data.codes)) {
      console.warn("[snail-codes] Invalid response shape from admin-api");
      console.info("[snail-codes] Falling back to sandbox data");
      return SANDBOX_CODES;
    }

    console.info(`[snail-codes] Fetched ${data.codes.length} codes from admin-api`);
    return data.codes;
  } catch (err) {
    // On error, log and fall back to sandbox data
    console.error("[snail-codes] Failed to fetch from admin-api:", err);
    console.info("[snail-codes] Falling back to sandbox data");
    return SANDBOX_CODES;
  }
}

/**
 * Check if we're using sandbox data or live admin-api data
 *
 * @returns {boolean} True if using sandbox data
 */
export function isUsingSandbox(): boolean {
  return !adminApiClient.isConfigured();
}
