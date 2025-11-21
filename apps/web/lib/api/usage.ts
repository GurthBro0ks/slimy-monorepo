/**
 * Usage Metrics API Client
 *
 * Fetches real usage metrics from Admin API.
 *
 * ASSUMPTION: Admin API provides a usage endpoint at /api/usage or /api/stats.
 * Currently, the known endpoint is /api/guilds/:guildId/usage which requires a guildId.
 * For a global usage summary, we're using /api/usage/summary (to be implemented on admin-api).
 *
 * If this endpoint doesn't exist yet, the admin-api should implement it to aggregate
 * usage across all guilds or provide a default guild's usage.
 *
 * Response structure is inferred from the admin-api usage service:
 * - totalTokens: Total tokens consumed
 * - totalCostUsd: Total cost in USD
 * - totalImages: Total images generated
 * - totalRequests: Total API requests
 */

import { get, isConfigured } from '@/lib/http-client';

/**
 * Usage summary data structure
 */
export interface UsageSummary {
  totalTokens: number;
  totalCostUsd: number;
  totalImages: number;
  totalRequests: number;
}

/**
 * Raw usage response from Admin API
 * (Adjust based on actual API response)
 */
interface UsageApiResponse {
  aggregated?: {
    totalTokens?: number;
    totalCost?: number;
    totalImages?: number;
    totalRequests?: number;
  };
  // Fallback to top-level fields if aggregated doesn't exist
  totalTokens?: number;
  totalCost?: number;
  totalCostUsd?: number;
  totalImages?: number;
  totalRequests?: number;
}

/**
 * Fetch usage summary from Admin API
 *
 * @returns UsageSummary with real data if Admin API is configured, throws error otherwise
 */
export async function fetchUsageSummary(): Promise<UsageSummary> {
  if (!isConfigured()) {
    throw new Error('Admin API not configured');
  }

  // Try multiple potential endpoints in order of preference
  const endpoints = [
    '/api/usage/summary',  // Preferred: global usage summary
    '/api/usage',          // Fallback: generic usage endpoint
    '/api/stats/usage',    // Alternative: stats-namespaced endpoint
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await get<UsageApiResponse>(endpoint);

      if (response.ok) {
        return mapResponseToSummary(response.data);
      } else {
        lastError = new Error(response.message || 'Failed to fetch usage data');
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      // Continue to next endpoint
    }
  }

  // If all endpoints fail, throw the last error
  throw lastError || new Error('Failed to fetch usage data from all endpoints');
}

/**
 * Map API response to UsageSummary
 */
function mapResponseToSummary(data: UsageApiResponse): UsageSummary {
  // Try to extract from aggregated field first
  if (data.aggregated) {
    return {
      totalTokens: data.aggregated.totalTokens || 0,
      totalCostUsd: data.aggregated.totalCost || 0,
      totalImages: data.aggregated.totalImages || 0,
      totalRequests: data.aggregated.totalRequests || 0,
    };
  }

  // Fallback to top-level fields
  return {
    totalTokens: data.totalTokens || 0,
    totalCostUsd: data.totalCostUsd || data.totalCost || 0,
    totalImages: data.totalImages || 0,
    totalRequests: data.totalRequests || 0,
  };
}
