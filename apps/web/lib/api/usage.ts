/**
 * Usage API Client
 *
 * Front-end client for usage data, supporting both sandbox (mock) and live (admin-api) modes.
 *
 * Features:
 * - Usage summary (tokens, cost, requests, images)
 * - Usage breakdown by category (chat, snail, club, etc.)
 * - Timeseries data for visualization
 * - Sandbox mode with realistic mock data
 * - Live mode with admin-api integration
 */

import { adminApiClient } from "./admin-client";

// ============================================================================
// Types
// ============================================================================

export interface UsageSummary {
  totalTokens: number;
  totalCostUsd: number;
  totalImages: number;
  totalRequests: number;
}

export interface UsageBreakdown {
  category: string; // e.g., "chat", "snail", "club", "other"
  tokens: number;
  costUsd: number;
  requests: number;
}

export interface UsageTimeseriesPoint {
  ts: string; // ISO timestamp
  tokens: number;
  costUsd: number;
}

export interface GetUsageOptions {
  timeRange?: "24h" | "7d" | "30d";
}

// ============================================================================
// Sandbox Mode Detection
// ============================================================================

function isSandboxMode(): boolean {
  return !adminApiClient.isConfigured();
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function getMockUsageSummary(): UsageSummary {
  return {
    totalTokens: 1250000,
    totalCostUsd: 25.50,
    totalImages: 340,
    totalRequests: 1520,
  };
}

function getMockUsageBreakdown(): UsageBreakdown[] {
  // Mock breakdown showing typical usage distribution
  return [
    {
      category: "chat",
      tokens: 625000,
      costUsd: 12.75,
      requests: 850,
    },
    {
      category: "snail",
      tokens: 375000,
      costUsd: 7.65,
      requests: 420,
    },
    {
      category: "club",
      tokens: 187500,
      costUsd: 3.82,
      requests: 180,
    },
    {
      category: "other",
      tokens: 62500,
      costUsd: 1.28,
      requests: 70,
    },
  ];
}

function getMockUsageTimeseries(timeRange: "24h" | "7d" | "30d" = "7d"): UsageTimeseriesPoint[] {
  const now = new Date();
  const points: UsageTimeseriesPoint[] = [];

  let intervals: number;
  let intervalMs: number;

  switch (timeRange) {
    case "24h":
      intervals = 24; // Hourly data points
      intervalMs = 60 * 60 * 1000;
      break;
    case "7d":
      intervals = 7; // Daily data points
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case "30d":
      intervals = 30; // Daily data points
      intervalMs = 24 * 60 * 60 * 1000;
      break;
  }

  for (let i = intervals - 1; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * intervalMs);

    // Generate varied but realistic values
    // Higher usage during weekdays, lower on weekends
    const dayOfWeek = ts.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseTokens = isWeekend ? 30000 : 50000;

    // Add some randomness
    const variance = 0.3; // 30% variance
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;

    const tokens = Math.floor(baseTokens * randomFactor);
    const costUsd = parseFloat((tokens / 1000000 * 2.0).toFixed(2)); // ~$2 per 1M tokens

    points.push({
      ts: ts.toISOString(),
      tokens,
      costUsd,
    });
  }

  return points;
}

// ============================================================================
// Live Mode Helpers (Placeholder Logic)
// ============================================================================

/**
 * Derive a simple breakdown from the summary totals.
 *
 * TODO: Replace with real backend endpoint when available.
 * Currently uses fixed ratios to split totals across categories.
 */
function deriveLiveBreakdownFromSummary(summary: UsageSummary): UsageBreakdown[] {
  // Fixed distribution ratios (placeholder logic)
  const ratios = {
    chat: 0.50,    // 50% of usage
    snail: 0.30,   // 30% of usage
    club: 0.15,    // 15% of usage
    other: 0.05,   // 5% of usage
  };

  return Object.entries(ratios).map(([category, ratio]) => ({
    category,
    tokens: Math.floor(summary.totalTokens * ratio),
    costUsd: parseFloat((summary.totalCostUsd * ratio).toFixed(2)),
    requests: Math.floor(summary.totalRequests * ratio),
  }));
}

/**
 * Generate approximate timeseries from summary data.
 *
 * TODO: Replace with real backend endpoint when available.
 * Currently generates fake timeseries scaled from summary totals.
 */
function deriveLiveTimeseriesFromSummary(
  summary: UsageSummary,
  timeRange: "24h" | "7d" | "30d" = "7d"
): UsageTimeseriesPoint[] {
  const now = new Date();
  const points: UsageTimeseriesPoint[] = [];

  let intervals: number;
  let intervalMs: number;

  switch (timeRange) {
    case "24h":
      intervals = 24;
      intervalMs = 60 * 60 * 1000;
      break;
    case "7d":
      intervals = 7;
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case "30d":
      intervals = 30;
      intervalMs = 24 * 60 * 60 * 1000;
      break;
  }

  // Distribute total usage across intervals with variance
  const avgTokensPerInterval = summary.totalTokens / intervals;
  const avgCostPerInterval = summary.totalCostUsd / intervals;

  for (let i = intervals - 1; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * intervalMs);

    // Add variance (±30%)
    const variance = 0.3;
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;

    const tokens = Math.floor(avgTokensPerInterval * randomFactor);
    const costUsd = parseFloat((avgCostPerInterval * randomFactor).toFixed(2));

    points.push({
      ts: ts.toISOString(),
      tokens,
      costUsd,
    });
  }

  return points;
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Get usage summary
 *
 * - Sandbox: Returns mock data
 * - Live: Fetches from admin-api /api/usage/summary
 */
export async function getUsageSummary(): Promise<UsageSummary> {
  if (isSandboxMode()) {
    return getMockUsageSummary();
  }

  // Attempt to fetch from admin-api
  const response = await adminApiClient.get<UsageSummary>("/api/usage/summary");

  if (response.ok) {
    return response.data;
  }

  // Fallback to mock data on error
  console.warn("[UsageClient] Failed to fetch summary from admin-api, using mock data:", response.message);
  return getMockUsageSummary();
}

/**
 * Get usage breakdown by category
 *
 * - Sandbox: Returns mock breakdown data
 * - Live: Attempts to fetch from admin-api /api/usage/breakdown, falls back to derived data
 */
export async function getUsageBreakdown(options?: GetUsageOptions): Promise<UsageBreakdown[]> {
  if (isSandboxMode()) {
    return getMockUsageBreakdown();
  }

  // Try to fetch from dedicated breakdown endpoint
  const response = await adminApiClient.get<UsageBreakdown[]>("/api/usage/breakdown");

  if (response.ok) {
    return response.data;
  }

  // If breakdown endpoint doesn't exist, derive from summary
  // TODO: Remove this fallback once real backend endpoint is available
  console.warn("[UsageClient] No /api/usage/breakdown endpoint, deriving from summary (placeholder logic)");

  try {
    const summary = await getUsageSummary();
    return deriveLiveBreakdownFromSummary(summary);
  } catch (error) {
    console.error("[UsageClient] Failed to derive breakdown:", error);
    return getMockUsageBreakdown();
  }
}

/**
 * Get usage timeseries data
 *
 * - Sandbox: Returns mock timeseries covering the specified time range
 * - Live: Attempts to fetch from admin-api /api/usage/timeseries, falls back to approximate data
 */
export async function getUsageTimeseries(options?: GetUsageOptions): Promise<UsageTimeseriesPoint[]> {
  const timeRange = options?.timeRange || "7d";

  if (isSandboxMode()) {
    return getMockUsageTimeseries(timeRange);
  }

  // Try to fetch from dedicated timeseries endpoint
  const response = await adminApiClient.get<UsageTimeseriesPoint[]>(
    `/api/usage/timeseries?range=${timeRange}`
  );

  if (response.ok) {
    return response.data;
  }

  // If timeseries endpoint doesn't exist, derive approximate data from summary
  // TODO: Remove this fallback once real backend endpoint is available
  console.warn("[UsageClient] No /api/usage/timeseries endpoint, generating approximate data from summary");

  try {
    const summary = await getUsageSummary();
    return deriveLiveTimeseriesFromSummary(summary, timeRange);
  } catch (error) {
    console.error("[UsageClient] Failed to derive timeseries:", error);
    return getMockUsageTimeseries(timeRange);
  }
}
