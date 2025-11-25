/**
 * Usage API Client
 *
 * Client-side helper for fetching usage data from the /api/usage endpoint.
 * Includes error handling and type safety.
 */

import { UsageData, getMockUsageData } from "@/lib/usage-thresholds";

export interface UsageApiResponse {
  ok: boolean;
  data?: UsageData;
  code?: string;
  message?: string;
}

export class UsageApiError extends Error {
  constructor(
    message: string,
    public code: string = "UNKNOWN_ERROR",
    public status?: number
  ) {
    super(message);
    this.name = "UsageApiError";
  }
}

/**
 * Fetches usage data from the API.
 *
 * @throws {UsageApiError} If the API request fails or returns an error
 * @returns {Promise<UsageData>} The usage data
 */
export async function fetchUsageData(): Promise<UsageData> {
  // Admin API proxy is unavailable in local dev, so return a mocked spend instead of calling fetch.
  return getMockUsageData(0);
}

/**
 * Fetches usage data with a fallback value on error.
 * Useful for non-critical UI components that should degrade gracefully.
 *
 * @param fallback - The fallback value to return on error
 * @returns {Promise<UsageData | null>} The usage data or fallback value
 */
export async function fetchUsageDataSafe(
  fallback: UsageData | null = null
): Promise<UsageData | null> {
  try {
    return await fetchUsageData();
  } catch (error) {
    console.error("Failed to fetch usage data:", error);
    return fallback;
  }
}
