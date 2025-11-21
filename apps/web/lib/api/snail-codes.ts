/**
 * Snail Codes API Client
 *
 * Provides access to the aggregated Super Snail codes from the admin-api.
 * Supports sandbox mode with fallback data when admin-api is not configured.
 */

import { adminApiClient, type ApiResponse } from "./admin-client";

/**
 * Valid source types for snail codes
 */
export type SnailCodeSource =
  | "snelp"
  | "reddit"
  | "discord"
  | "twitter"
  | "other";

/**
 * Status of a snail code
 */
export type SnailCodeStatus = "active" | "expired" | "unknown";

/**
 * Individual snail code object
 */
export interface SnailCode {
  code: string;
  source: SnailCodeSource;
  status: SnailCodeStatus;
  notes?: string;
  discoveredAt?: string;
  lastCheckedAt?: string;
}

/**
 * Response structure from the API
 */
export interface SnailCodesResponse {
  codes: SnailCode[];
}

/**
 * Filter options for fetching snail codes
 */
export interface FetchSnailCodesFilters {
  source?: SnailCodeSource;
  status?: SnailCodeStatus;
}

/**
 * Sandbox/mock data for when admin-api is not configured
 */
const SANDBOX_CODES: SnailCode[] = [
  {
    code: "SNAIL2025",
    source: "snelp",
    status: "active",
    notes: "Sandbox example from Snelp wiki - New Year 2025 celebration",
  },
  {
    code: "SLIMYCLUB",
    source: "reddit",
    status: "unknown",
    notes: "Sandbox example from Reddit r/SuperSnail community",
  },
  {
    code: "DISCORDHYPE",
    source: "discord",
    status: "expired",
    notes: "Sandbox example from Discord server - expired Nov 18",
  },
  {
    code: "TWITTERDROP",
    source: "twitter",
    status: "active",
    notes: "Sandbox example from official Twitter account",
  },
  {
    code: "COMMUNITY99",
    source: "other",
    status: "unknown",
    notes: "Sandbox example from community forums",
  },
];

/**
 * Filter sandbox codes by source and status
 */
function filterSandboxCodes(
  codes: SnailCode[],
  filters: FetchSnailCodesFilters
): SnailCode[] {
  return codes.filter((code) => {
    if (filters.source && code.source !== filters.source) {
      return false;
    }
    if (filters.status && code.status !== filters.status) {
      return false;
    }
    return true;
  });
}

/**
 * Fetch snail codes from admin-api with optional filtering.
 * Falls back to sandbox data when admin-api is not configured.
 *
 * @param filters - Optional filters for source and status
 * @returns Promise resolving to array of snail codes
 * @throws Error if the API request fails (in non-sandbox mode)
 */
export async function fetchSnailCodes(
  filters: FetchSnailCodesFilters = {}
): Promise<SnailCode[]> {
  // Sandbox mode: no admin-api configured
  if (!adminApiClient.isConfigured()) {
    console.info(
      "[snail-codes] Admin API not configured, using sandbox data"
    );
    return filterSandboxCodes(SANDBOX_CODES, filters);
  }

  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (filters.source) {
      queryParams.set("source", filters.source);
    }
    if (filters.status) {
      queryParams.set("status", filters.status);
    }

    const queryString = queryParams.toString();
    const path =
      queryString.length > 0
        ? `/api/snail/codes?${queryString}`
        : "/api/snail/codes";

    // Make request to admin-api
    const response: ApiResponse<SnailCodesResponse> =
      await adminApiClient.get<SnailCodesResponse>(path);

    if (!response.ok) {
      console.error("[snail-codes] API request failed:", response);
      throw new Error(response.message || "Failed to fetch snail codes");
    }

    return response.data.codes ?? [];
  } catch (error) {
    console.error("[snail-codes] Error fetching codes:", error);
    // In production, you might want to return sandbox data as fallback
    // For now, we re-throw to let the caller handle it
    throw error;
  }
}

/**
 * Check if admin-api is configured (useful for UI logic)
 */
export function isConfigured(): boolean {
  return adminApiClient.isConfigured();
}
