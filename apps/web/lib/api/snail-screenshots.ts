/**
 * Snail Screenshot Analysis API Client
 *
 * Handles screenshot analysis requests and results.
 * Integrates with admin-api snail screenshot endpoints.
 */

import { adminApiClient, type ApiResponse } from './admin-client';

/**
 * Screenshot stats with tier suggestions
 */
export type SnailScreenshotStats = {
  snailLevel?: number;
  cityLevel?: number;
  simPower?: number;
  relicPower?: number;
  clubContribution?: number;
  suggestedTier?: string;      // NEW, optional (e.g., "S+", "A", etc.)
  suggestedScore?: number;     // NEW, optional (numeric score)
} & Record<string, unknown>;   // allow extra fields

/**
 * Confidence metrics for OCR/analysis
 */
export type ConfidenceMetrics = {
  snailLevel?: number;
  cityLevel?: number;
  simPower?: number;
  relicPower?: number;
  clubContribution?: number;
} & Record<string, number | undefined>;

/**
 * Individual screenshot result
 */
export type SnailScreenshotResult = {
  imageUrl: string;
  timestamp: string;
  stats: SnailScreenshotStats;
  confidence?: ConfidenceMetrics;
};

/**
 * Analysis payload from backend
 */
export type SnailAnalysisPayload = {
  guildId: string;
  results: SnailScreenshotResult[];
  timestamp: string;
};

/**
 * Fetch latest screenshot analysis for a guild
 */
export async function fetchLatestScreenshots(
  guildId: string
): Promise<ApiResponse<SnailAnalysisPayload>> {
  return adminApiClient.get<SnailAnalysisPayload>(
    `/api/snail/${guildId}/screenshots/latest`
  );
}

/**
 * Sandbox/mock data for development without admin-api
 */
export function getSandboxScreenshots(): SnailAnalysisPayload {
  return {
    guildId: 'sandbox-guild',
    timestamp: new Date().toISOString(),
    results: [
      {
        imageUrl: '/placeholder-screenshot-1.png',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        stats: {
          snailLevel: 45,
          cityLevel: 38,
          simPower: 125000,
          relicPower: 8500,
          clubContribution: 250,
          suggestedTier: 'A',
          suggestedScore: 650.5,
        },
        confidence: {
          snailLevel: 0.95,
          cityLevel: 0.92,
          simPower: 0.88,
          relicPower: 0.85,
          clubContribution: 0.90,
        },
      },
      {
        imageUrl: '/placeholder-screenshot-2.png',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        stats: {
          snailLevel: 52,
          cityLevel: 45,
          simPower: 180000,
          relicPower: 12000,
          clubContribution: 420,
          suggestedTier: 'S',
          suggestedScore: 904.8,
        },
        confidence: {
          snailLevel: 0.98,
          cityLevel: 0.94,
          simPower: 0.91,
          relicPower: 0.89,
          clubContribution: 0.93,
        },
      },
      {
        imageUrl: '/placeholder-screenshot-3.png',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        stats: {
          snailLevel: 38,
          cityLevel: 32,
          simPower: 95000,
          relicPower: 6200,
          clubContribution: 180,
          suggestedTier: 'B',
          suggestedScore: 485.2,
        },
        confidence: {
          snailLevel: 0.92,
          cityLevel: 0.88,
          simPower: 0.85,
          relicPower: 0.82,
          clubContribution: 0.87,
        },
      },
      {
        imageUrl: '/placeholder-screenshot-4.png',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        stats: {
          snailLevel: 60,
          cityLevel: 52,
          simPower: 250000,
          relicPower: 18000,
          clubContribution: 650,
          suggestedTier: 'S+',
          suggestedScore: 1150.3,
        },
        confidence: {
          snailLevel: 0.97,
          cityLevel: 0.95,
          simPower: 0.93,
          relicPower: 0.91,
          clubContribution: 0.96,
        },
      },
    ],
  };
}
