/**
 * Screenshots API Client
 *
 * Fetches screenshot analysis data from admin-api.
 * Falls back to sandbox data when admin-api is not configured.
 */

import { adminApiClient } from "@/lib/api/admin-client";

export type ScreenshotStatus = "parsed" | "pending" | "error";
export type ScreenshotType = "snail_city" | "club_power" | "snail_stats" | "other";

export type ScreenshotAnalysis = {
  id: string;
  type: ScreenshotType | string;
  status: ScreenshotStatus | string;
  description?: string;
  source?: string;
  fileName?: string;
  createdAt?: string;
  updatedAt?: string;
  details?: Record<string, unknown> | null;
};

export type ScreenshotListResponse = {
  ok: boolean;
  screenshots: ScreenshotAnalysis[];
};

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
    details: { snailLevel: 100, cityLevel: 35 },
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
];

/**
 * Fetch screenshot analyses from admin-api.
 * Falls back to sandbox data if admin-api is not configured or request fails.
 *
 * @returns {Promise<ScreenshotAnalysis[]>} Array of screenshot analyses
 */
export async function fetchScreenshotAnalyses(): Promise<ScreenshotAnalysis[]> {
  if (!adminApiClient.isConfigured()) {
    console.info("[screenshots] Admin API not configured, using sandbox data");
    return SANDBOX_SCREENSHOTS;
  }

  try {
    const response = await adminApiClient.get<ScreenshotListResponse>("/api/screenshots");

    if (!response.ok) {
      console.warn("[screenshots] Admin API error, using sandbox data", response);
      return SANDBOX_SCREENSHOTS;
    }

    if (!Array.isArray(response.data.screenshots)) {
      console.warn("[screenshots] Unexpected response format, using sandbox data");
      return SANDBOX_SCREENSHOTS;
    }

    return response.data.screenshots;
  } catch (err) {
    console.error("[screenshots] Failed to fetch analyses, using sandbox data", err);
    return SANDBOX_SCREENSHOTS;
  }
}
