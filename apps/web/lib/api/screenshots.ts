/**
 * Screenshots API Client
 *
 * Client for fetching screenshot analysis data from Admin API.
 * Includes sandbox fallback for when Admin API is not configured.
 */

import { adminApiClient } from "./admin-client";

export type ScreenshotStatus = "parsed" | "pending" | "error";
export type ScreenshotType =
  | "snail_city"
  | "club_power"
  | "snail_stats"
  | "inventory"
  | "other";

export interface ScreenshotAnalysis {
  id: string;
  type: ScreenshotType | string;
  status: ScreenshotStatus | string;
  description?: string;
  source?: string;
  fileName?: string;
  createdAt?: string;
  updatedAt?: string;
  details?: Record<string, unknown> | null;
}

export interface ScreenshotListResponse {
  ok: boolean;
  screenshots: ScreenshotAnalysis[];
}

/**
 * Sandbox/demo data for when Admin API is not configured
 */
const SANDBOX_SCREENSHOTS: ScreenshotAnalysis[] = [
  {
    id: "sandbox-1",
    type: "snail_city",
    status: "parsed",
    description: "Sandbox city overview",
    source: "upload",
    fileName: "sandbox-city.png",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    details: {
      snailLevel: 100,
      cityLevel: 35,
      club: "Sandbox Club",
    },
  },
  {
    id: "sandbox-2",
    type: "club_power",
    status: "pending",
    description: "Sandbox weekly club power",
    source: "discord",
    fileName: "sandbox-club-power.png",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    details: null,
  },
  {
    id: "sandbox-3",
    type: "snail_stats",
    status: "parsed",
    description: "Sandbox snail stats",
    source: "upload",
    fileName: "sandbox-stats.png",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    details: {
      attack: 12500,
      defense: 8900,
      hp: 45000,
    },
  },
  {
    id: "sandbox-4",
    type: "inventory",
    status: "error",
    description: "Sandbox inventory (failed to parse)",
    source: "upload",
    fileName: "sandbox-inventory.png",
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    details: {
      error: "Could not extract item counts",
    },
  },
];

/**
 * Fetch screenshot analyses from Admin API.
 * Falls back to sandbox data if API is not configured or request fails.
 *
 * @returns {Promise<ScreenshotAnalysis[]>} Array of screenshot analysis records
 */
export async function fetchScreenshotAnalyses(): Promise<ScreenshotAnalysis[]> {
  // Check if Admin API is configured
  if (!adminApiClient.isConfigured()) {
    console.info(
      "[screenshots] Admin API not configured, using sandbox data"
    );
    return SANDBOX_SCREENSHOTS;
  }

  try {
    const response = await adminApiClient.get<ScreenshotListResponse>(
      "/api/screenshots"
    );

    // Check if request was successful
    if (!response.ok) {
      console.warn(
        "[screenshots] Failed to fetch from Admin API, using sandbox data:",
        "message" in response ? response.message : "Unknown error"
      );
      return SANDBOX_SCREENSHOTS;
    }

    // Validate response structure
    if (!response.data.ok || !Array.isArray(response.data.screenshots)) {
      console.warn(
        "[screenshots] Unexpected response format, using sandbox data"
      );
      return SANDBOX_SCREENSHOTS;
    }

    return response.data.screenshots;
  } catch (err) {
    console.error(
      "[screenshots] Failed to fetch analyses, using sandbox data",
      err
    );
    return SANDBOX_SCREENSHOTS;
  }
}
