/**
 * Health Check API Client
 *
 * Provides health check functionality for the Admin API.
 */

import { get, isConfigured } from '@/lib/http-client';

export interface HealthResponse {
  ok: boolean;
  ts: string;
  env?: string;
  status?: 'operational' | 'degraded' | 'down' | 'sandbox';
  message?: string;
}

/**
 * Fetch health status from Admin API
 *
 * Returns:
 * - "sandbox" if Admin API is not configured
 * - "operational" if Admin API responds successfully
 * - "down" if Admin API fails to respond
 */
export async function fetchHealthStatus(): Promise<HealthResponse> {
  // Check if Admin API is configured
  if (!isConfigured()) {
    return {
      ok: true,
      ts: new Date().toISOString(),
      status: 'sandbox',
      message: 'Running in sandbox mode (Admin API not configured)',
    };
  }

  try {
    const response = await get<HealthResponse>('/api/health');

    if (response.ok) {
      return {
        ...response.data,
        status: 'operational',
        message: 'Admin API is operational',
      };
    } else {
      return {
        ok: false,
        ts: new Date().toISOString(),
        status: 'down',
        message: response.message || 'Admin API health check failed',
      };
    }
  } catch (error) {
    return {
      ok: false,
      ts: new Date().toISOString(),
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
