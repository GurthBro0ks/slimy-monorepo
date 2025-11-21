/**
 * Health Check Client
 *
 * Provides methods for checking Admin API health status and connectivity.
 */

import * as httpClient from '../http-client';

/**
 * Health check response from Admin API
 */
export interface HealthResponse {
  ok: boolean;
  service: string;
  version: string;
  uptimeSec: number;
  sessions?: {
    active: number;
  };
  config?: {
    oauthConfigured?: boolean;
    botTokenConfigured?: boolean;
  };
}

/**
 * Connection status derived from health check
 */
export type ConnectionStatus = 'connected' | 'degraded' | 'offline';

/**
 * Health check result with derived connection status
 */
export interface HealthCheckResult {
  status: ConnectionStatus;
  response?: HealthResponse;
  error?: Error;
  timestamp: Date;
}

/**
 * Fetch health status from Admin API
 *
 * @example
 * ```ts
 * const health = await fetchHealth();
 * console.log(health.ok ? 'API is healthy' : 'API has issues');
 * ```
 */
export async function fetchHealth(): Promise<HealthResponse> {
  return httpClient.get<HealthResponse>('/api/health', {
    timeout: 5000, // 5 second timeout for health checks
  });
}

/**
 * Check health and return connection status
 *
 * @example
 * ```ts
 * const result = await checkHealth();
 * if (result.status === 'connected') {
 *   console.log('✅ Admin API is healthy');
 * }
 * ```
 */
export async function checkHealth(): Promise<HealthCheckResult> {
  const timestamp = new Date();

  try {
    const response = await fetchHealth();

    // Determine status based on response
    let status: ConnectionStatus = 'connected';

    // Check if API reports issues
    if (!response.ok) {
      status = 'degraded';
    }

    // Check if OAuth is configured (important for auth)
    if (response.config && !response.config.oauthConfigured) {
      status = 'degraded';
    }

    return {
      status,
      response,
      timestamp,
    };
  } catch (error) {
    // API is unreachable or returned an error
    return {
      status: 'offline',
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp,
    };
  }
}

/**
 * Check if Admin API is configured and reachable
 *
 * @returns true if API base URL is configured
 */
export function isConfigured(): boolean {
  return httpClient.isConfigured();
}

/**
 * Get the Admin API base URL
 */
export function getBaseUrl(): string {
  return httpClient.getBaseUrl();
}
