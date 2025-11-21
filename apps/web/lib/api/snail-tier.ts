/**
 * Snail Tier Calculator API Client
 *
 * Handles tier calculation requests.
 * Integrates with admin-api snail tier endpoints.
 */

import { adminApiClient, type ApiResponse } from './admin-client';

/**
 * Request payload for tier calculation
 */
export type SnailTierRequest = {
  level: number;
  cityLevel: number;
  relicPower: number;
  clubContribution: number;
  simPower?: number; // Optional but included in scoring
};

/**
 * Response from tier calculation
 */
export type SnailTierResponse = {
  tier: string;
  score: number;
  summary: string;
  details: string[];
};

/**
 * Calculate snail tier from stats
 */
export async function calculateTier(
  stats: SnailTierRequest
): Promise<ApiResponse<SnailTierResponse>> {
  return adminApiClient.post<SnailTierResponse>('/api/snail/tier', stats);
}

/**
 * Sandbox/mock tier calculation for development
 */
export function getSandboxTier(stats: SnailTierRequest): SnailTierResponse {
  // Simple scoring formula for sandbox mode
  const score =
    (stats.level || 0) * 10 +
    (stats.cityLevel || 0) * 8 +
    (stats.relicPower || 0) / 100 +
    (stats.clubContribution || 0) * 2 +
    (stats.simPower || 0) / 1000;

  let tier: string;
  let summary: string;

  if (score >= 1000) {
    tier = 'S+';
    summary = 'Endgame monster snail. You dominate the meta!';
  } else if (score >= 800) {
    tier = 'S';
    summary = 'Late-game powerhouse. Exceptional progress!';
  } else if (score >= 600) {
    tier = 'A';
    summary = 'Strong and efficient. Great mid-to-late game snail!';
  } else if (score >= 400) {
    tier = 'B';
    summary = 'Solid mid-game snail. Keep pushing!';
  } else if (score >= 200) {
    tier = 'C';
    summary = 'Early/mid-game snail. Needs work but on the right track.';
  } else if (score >= 100) {
    tier = 'D';
    summary = 'Starter snail with lots of room for growth.';
  } else {
    tier = 'F';
    summary = 'Fresh slime! Just getting started on your journey.';
  }

  const details = [
    `Snail Level: ${stats.level}`,
    `City Level: ${stats.cityLevel}`,
    `Relic Power: ${stats.relicPower.toLocaleString()}`,
    `Club Contribution: ${stats.clubContribution.toLocaleString()}`,
  ];

  if (stats.simPower) {
    details.push(`Sim Power: ${stats.simPower.toLocaleString()}`);
  }

  return {
    tier,
    score: Math.round(score * 10) / 10,
    summary,
    details,
  };
}
