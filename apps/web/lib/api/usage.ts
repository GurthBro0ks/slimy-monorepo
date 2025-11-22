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

    // Handle non-OK HTTP responses
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode = "HTTP_ERROR";

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.code) {
          errorCode = errorData.code;
        }
      } catch {
        // If response body is not JSON, use default error message
      }

      throw new UsageApiError(errorMessage, errorCode, response.status);
    }

    const data: UsageApiResponse = await response.json();

    // Handle application-level errors
    if (!data.ok) {
      throw new UsageApiError(
        data.message || "Failed to fetch usage data",
        data.code || "API_ERROR"
      );
    }

    // Ensure data exists
    if (!data.data) {
      throw new UsageApiError(
        "No usage data returned from API",
        "NO_DATA"
      );
    }

    // Validate data structure (basic check)
    if (
      typeof data.data.currentSpend !== "number" ||
      typeof data.data.limit !== "number" ||
      !data.data.level ||
      !data.data.modelProbeStatus
    ) {
      throw new UsageApiError(
        "Invalid usage data structure",
        "INVALID_DATA"
      );
    }

    return data.data;
  } catch (error) {
    // Re-throw UsageApiError as-is
    if (error instanceof UsageApiError) {
      throw error;
    }

    // Handle fetch errors (network issues, etc.)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new UsageApiError(
        "Network error: Unable to connect to usage API",
        "NETWORK_ERROR"
      );
    }

    // Handle other errors
    throw new UsageApiError(
      error instanceof Error ? error.message : "Unknown error occurred",
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
