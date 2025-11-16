/**
 * Legacy API Proxy - Uses AdminApiClient internally
 * 
 * This file maintains backward compatibility for existing code.
 * New code should use AdminApiClient directly from @/lib/api/admin-client
 */

import { adminApiClient, type ApiResponse } from './api/admin-client';

// Re-export types for backward compatibility
export type { ApiResponse } from './api/admin-client';

export interface ApiError {
  ok: false;
  code: string;
  message: string;
}

export interface ApiSuccess<T = unknown> {
  ok: true;
  data: T;
}

/**
 * Legacy proxy function - delegates to AdminApiClient
 * @deprecated Use adminApiClient directly from @/lib/api/admin-client
 */
export async function proxyToAdminApi<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const method = (options?.method || 'GET').toUpperCase();
  
  // Extract body if present
  let data: unknown = undefined;
  if (options?.body) {
    if (typeof options.body === 'string') {
      try {
        data = JSON.parse(options.body);
      } catch {
        // If not JSON, pass as-is
        data = options.body;
      }
    } else {
      data = options.body;
    }
  }

  // Use appropriate method based on HTTP verb
  switch (method) {
    case 'GET':
      return adminApiClient.get<T>(path, { headers: options?.headers as Record<string, string> });
    case 'POST':
      return adminApiClient.post<T>(path, data, { headers: options?.headers as Record<string, string> });
    case 'PUT':
      return adminApiClient.put<T>(path, data, { headers: options?.headers as Record<string, string> });
    case 'PATCH':
      return adminApiClient.patch<T>(path, data, { headers: options?.headers as Record<string, string> });
    case 'DELETE':
      return adminApiClient.delete<T>(path, { headers: options?.headers as Record<string, string> });
    default:
      return adminApiClient.request<T>(path, {
        ...options,
        method,
        body: data ? JSON.stringify(data) : undefined,
      });
  }
}
