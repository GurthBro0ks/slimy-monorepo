/**
 * Snail Tier Calculator API Client
 *
 * Provides tier calculation for Super Snail game stats.
 * Supports sandbox mode (local fallback) and live mode (admin-api).
 */

import { adminApiClient } from "./admin-client";

/**
 * Input statistics for tier calculation
 */
export type SnailTierInput = {
  level: number;
  cityLevel: number;
  relicPower: number;
  clubContribution: number;
};

/**
 * Result of tier calculation
 */
export type SnailTierResult = {
  tier: "S+" | "S" | "A" | "B" | "C" | "D" | "F";
  score: number;
  summary: string;
  details: string[];
};

/**
 * Sandbox mode result used when admin-api is not configured
 */
const SANDBOX_RESULT: SnailTierResult = {
  tier: "B",
  score: 900,
  summary:
    "Sandbox mode: using local example tier result (tier B, score 900). Configure admin-api to get real calculations.",
  details: [
    "This is a sandbox placeholder.",
    "Admin API base URL is not configured.",
    "Set NEXT_PUBLIC_ADMIN_API_BASE to enable live tier calculations.",
  ],
};

/**
 * Calculate snail tier based on stats
 *
 * In sandbox mode (no admin-api configured), returns a placeholder result.
 * In live mode, calls the admin-api for real tier calculation.
 *
 * @param input - Snail statistics
 * @returns Calculated tier result
 */
export async function calculateSnailTier(
  input: SnailTierInput
): Promise<SnailTierResult> {
  // Sandbox mode: no admin-api configured
  if (!adminApiClient.isConfigured()) {
    console.log("[snail-tier] Sandbox mode: using local fallback");
    return SANDBOX_RESULT;
  }

  // Live mode: call admin-api
  try {
    const response = await adminApiClient.post<SnailTierResult>(
      "/api/snail/tier",
      input
    );

    if (!response.ok) {
      console.error("[snail-tier] API error:", response);
      throw new Error(response.message || "Failed to calculate tier");
    }

    return response.data;
  } catch (error) {
    console.error("[snail-tier] Request failed:", error);
    // Fallback to sandbox result on error
    return {
      ...SANDBOX_RESULT,
      summary: "Error connecting to admin-api. Using sandbox fallback.",
      details: [
        "Failed to connect to admin API.",
        "Check network connection and admin-api configuration.",
        error instanceof Error ? error.message : String(error),
      ],
    };
  }
}
