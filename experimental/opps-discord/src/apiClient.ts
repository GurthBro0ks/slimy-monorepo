/**
 * HTTP client for opps-api
 *
 * This client is designed to be framework-agnostic and can be used
 * in any Node.js environment (Discord bot, CLI, etc.)
 */

import type { RadarSnapshot, RadarQueryParams, OppsApiError } from './types.js';

export class OppsApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.OPPS_API_BASE_URL || 'http://localhost:4010';
  }

  /**
   * Fetch a radar snapshot from the opps-api
   * @param params Query parameters for the radar endpoint
   * @returns RadarSnapshot containing scored opportunities by domain
   * @throws Error if the API request fails
   */
  async fetchRadarSnapshot(params: RadarQueryParams = {}): Promise<RadarSnapshot> {
    const queryParams = new URLSearchParams();

    if (params.mode) {
      queryParams.append('mode', params.mode);
    }
    if (params.maxPerDomain !== undefined) {
      queryParams.append('maxPerDomain', params.maxPerDomain.toString());
    }
    if (params.discordUserId) {
      queryParams.append('discordUserId', params.discordUserId);
    }

    const url = `${this.baseUrl}/radar?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorMessage = `opps-api request failed with status ${response.status}`;

        try {
          const errorJson = JSON.parse(errorText) as OppsApiError;
          errorMessage = errorJson.error || errorMessage;
          if (errorJson.details) {
            errorMessage += `: ${errorJson.details}`;
          }
        } catch {
          // Not JSON, use status text
          errorMessage += `: ${errorText}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json() as RadarSnapshot;
      return data;
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw with context
        throw new Error(`Failed to fetch radar snapshot: ${error.message}`);
      }
      throw new Error('Failed to fetch radar snapshot: Unknown error');
    }
  }

  /**
   * Health check for the opps-api
   * @returns true if the API is reachable, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Default singleton instance using environment configuration
 */
export const defaultApiClient = new OppsApiClient();

/**
 * Convenience function for fetching radar snapshots
 */
export async function fetchRadarSnapshot(params: RadarQueryParams = {}): Promise<RadarSnapshot> {
  return defaultApiClient.fetchRadarSnapshot(params);
}
