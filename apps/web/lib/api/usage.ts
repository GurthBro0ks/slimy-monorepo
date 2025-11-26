/**
 * Usage API Client
 *
 * Client-side helper for fetching usage data from the /api/usage endpoint.
 * Includes error handling and type safety.
 */

import { UsageData } from "@/lib/usage-thresholds";

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
  try {
    const response = await fetch("/api/usage", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    let payload: UsageApiResponse | null = null;

    try {
      payload = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw new UsageApiError(
          `Failed to fetch usage data: ${response.status} ${response.statusText}`,
          "USAGE_FETCH_ERROR",
          response.status
        );
      }

      throw new UsageApiError(
        "Invalid usage response",
        "INVALID_USAGE_RESPONSE",
        response.status
      );
    }

    if (!response.ok) {
      throw new UsageApiError(
        payload?.message || `${response.status} ${response.statusText}`,
        payload?.code || "USAGE_FETCH_ERROR",
        response.status
      );
    }

    if (!payload?.ok) {
      throw new UsageApiError(
        payload?.message || "Failed to fetch usage data",
        payload?.code || "USAGE_FETCH_ERROR",
        response.status
      );
    }

    if (!payload.data) {
      throw new UsageApiError(
        "No usage data returned",
        "INVALID_USAGE_DATA",
        response.status
      );
    }

    const { level, currentSpend, limit, modelProbeStatus } = payload.data;

    if (
      typeof level !== "string" ||
      typeof currentSpend !== "number" ||
      typeof limit !== "number" ||
      typeof modelProbeStatus !== "string"
    ) {
      throw new UsageApiError(
        "Invalid usage data",
        "INVALID_USAGE_DATA",
        response.status
      );
    }

    return payload.data;
  } catch (error) {
    if (error instanceof UsageApiError) {
      throw error;
    }

    throw new UsageApiError(
      error instanceof Error ? error.message : "Unknown error",
      "UNKNOWN_ERROR"
    );
  }
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
