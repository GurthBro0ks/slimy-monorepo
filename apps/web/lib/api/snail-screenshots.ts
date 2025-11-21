/**
 * Snail Screenshots API Client
 *
 * Handles fetching analyzed screenshot data from the admin API.
 * Supports both live mode (when admin-api is configured) and sandbox mode
 * (for development/testing without admin-api).
 */

import { adminApiClient } from "./admin-client";

/**
 * Individual screenshot analysis result
 */
export type SnailScreenshotResult = {
  fileUrl: string;
  uploadedBy?: string;
  analyzedAt?: string;
  stats: Record<string, any>;
};

/**
 * Analysis payload containing run metadata and results
 */
export type SnailAnalysisPayload = {
  runId?: string | null;
  guildId?: string | null;
  userId?: string | null;
  results: SnailScreenshotResult[];
};

/**
 * API response wrapper for analysis data
 */
export type SnailAnalysisResponse = {
  analysis: SnailAnalysisPayload;
};

/**
 * Sandbox mock data for development/testing
 * Used when admin-api is not configured
 */
const SANDBOX_ANALYSIS: SnailAnalysisPayload = {
  runId: "sandbox-run",
  guildId: "sandbox-guild",
  userId: "sandbox-user",
  results: [
    {
      fileUrl: "https://example.com/sandbox-snail-1.png",
      uploadedBy: "SandboxUser#0001",
      analyzedAt: "2025-11-21T00:00:00.000Z",
      stats: {
        simPower: 1247893,
        cityLevel: 45,
        snailLevel: 80,
        tier: "B",
      },
    },
    {
      fileUrl: "https://example.com/sandbox-snail-2.png",
      uploadedBy: "SandboxUser#0001",
      analyzedAt: "2025-11-21T00:05:00.000Z",
      stats: {
        simPower: 980432,
        cityLevel: 38,
        snailLevel: 72,
        tier: "C",
      },
    },
  ],
};

/**
 * Fetch the latest screenshot analysis
 *
 * In sandbox mode (admin-api not configured), returns mock data.
 * In live mode, fetches from /api/snail/screenshots/latest endpoint.
 *
 * @returns {Promise<SnailAnalysisPayload>} Analysis data with runId, guildId, userId, and results
 * @throws {Error} If request fails in live mode
 */
export async function fetchLatestSnailAnalysis(): Promise<SnailAnalysisPayload> {
  // Check if admin-api is configured
  if (!adminApiClient.isConfigured()) {
    console.info("[snail-screenshots] Admin API not configured, using sandbox data");
    return SANDBOX_ANALYSIS;
  }

  try {
    const response = await adminApiClient.get<SnailAnalysisResponse>(
      "/api/snail/screenshots/latest"
    );

    if (!response.ok) {
      console.error("[snail-screenshots] API error:", response.message);
      throw new Error(response.message || "Failed to fetch screenshot analysis");
    }

    // Return analysis data, or empty structure if missing
    return response.data.analysis ?? {
      runId: null,
      guildId: null,
      userId: null,
      results: [],
    };
  } catch (error) {
    console.error("[snail-screenshots] Request failed:", error);
    throw error;
  }
}
