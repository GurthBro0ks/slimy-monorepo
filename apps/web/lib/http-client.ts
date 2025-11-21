/**
 * Centralized HTTP Client
 *
 * Wrapper around AdminApiClient for convenience.
 * Provides simple get/post/put/patch/delete functions.
 */

import { adminApiClient, type ApiResponse } from './api/admin-client';

/**
 * Check if Admin API is configured
 */
export function isConfigured(): boolean {
  return adminApiClient.isConfigured();
}

/**
 * GET request
 */
export async function get<T = unknown>(
  path: string,
  config?: RequestInit
): Promise<ApiResponse<T>> {
  return adminApiClient.get<T>(path, config);
}

/**
 * POST request
 */
export async function post<T = unknown>(
  path: string,
  data?: unknown,
  config?: RequestInit
): Promise<ApiResponse<T>> {
  return adminApiClient.post<T>(path, data, config);
}

/**
 * PUT request
 */
export async function put<T = unknown>(
  path: string,
  data?: unknown,
  config?: RequestInit
): Promise<ApiResponse<T>> {
  return adminApiClient.put<T>(path, data, config);
}

/**
 * PATCH request
 */
export async function patch<T = unknown>(
  path: string,
  data?: unknown,
  config?: RequestInit
): Promise<ApiResponse<T>> {
  return adminApiClient.patch<T>(path, data, config);
}

/**
 * DELETE request
 */
export async function deleteRequest<T = unknown>(
  path: string,
  config?: RequestInit
): Promise<ApiResponse<T>> {
  return adminApiClient.delete<T>(path, config);
}
