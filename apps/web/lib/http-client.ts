/**
 * Centralized HTTP Client for Admin API
 *
 * Thin wrapper over fetch with:
 * - Automatic base URL from env (NEXT_PUBLIC_ADMIN_API_BASE)
 * - Normalized error shape: { status, code, message, details }
 * - Optional requestId header for tracing
 * - Type-safe get/post methods
 *
 * Built on AdminApiClient as the single source of truth for proxy logic.
 */

import { adminApiClient, type ApiResponse, type ApiError, type ApiSuccess } from './api/admin-client';

/**
 * HTTP Error - thrown when response is not ok
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
    // Capture stack trace (V8/Node.js specific)
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, HttpError);
    }
  }

  toJSON() {
    return {
      ok: false,
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Request options
 */
export interface HttpOptions {
  /** Optional request ID for tracing (auto-generated if not provided) */
  requestId?: string;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Skip JSON parsing and return raw response */
  skipJsonParsing?: boolean;
}

/**
 * Convert ApiResponse to typed result or throw HttpError
 */
function handleResponse<T>(response: ApiResponse<T>): T {
  if (!response.ok) {
    const error = response as ApiError;
    throw new HttpError(
      error.message,
      error.status || 500,
      error.code,
      error.details
    );
  }
  return (response as ApiSuccess<T>).data;
}

/**
 * Build headers with optional requestId
 */
function buildHeaders(options?: HttpOptions): Record<string, string> {
  const headers: Record<string, string> = {
    ...options?.headers,
  };

  // Add request ID for tracing if provided or generate one
  if (options?.requestId) {
    headers['X-Request-ID'] = options.requestId;
  }

  return headers;
}

/**
 * GET request
 *
 * @example
 * ```ts
 * const health = await get<HealthResponse>('/api/health');
 * ```
 */
export async function get<T = unknown>(
  path: string,
  options?: HttpOptions
): Promise<T> {
  const headers = buildHeaders(options);
  const response = await adminApiClient.get<T>(path, {
    headers,
    timeout: options?.timeout,
    skipJsonParsing: options?.skipJsonParsing,
  });
  return handleResponse(response);
}

/**
 * POST request
 *
 * @example
 * ```ts
 * const result = await post<Response, Body>('/api/chat', { message: 'Hello' });
 * ```
 */
export async function post<T = unknown, B = unknown>(
  path: string,
  body: B,
  options?: HttpOptions
): Promise<T> {
  const headers = buildHeaders(options);
  const response = await adminApiClient.post<T>(path, body, {
    headers,
    timeout: options?.timeout,
    skipJsonParsing: options?.skipJsonParsing,
  });
  return handleResponse(response);
}

/**
 * PUT request
 */
export async function put<T = unknown, B = unknown>(
  path: string,
  body: B,
  options?: HttpOptions
): Promise<T> {
  const headers = buildHeaders(options);
  const response = await adminApiClient.put<T>(path, body, {
    headers,
    timeout: options?.timeout,
    skipJsonParsing: options?.skipJsonParsing,
  });
  return handleResponse(response);
}

/**
 * PATCH request
 */
export async function patch<T = unknown, B = unknown>(
  path: string,
  body: B,
  options?: HttpOptions
): Promise<T> {
  const headers = buildHeaders(options);
  const response = await adminApiClient.patch<T>(path, body, {
    headers,
    timeout: options?.timeout,
    skipJsonParsing: options?.skipJsonParsing,
  });
  return handleResponse(response);
}

/**
 * DELETE request
 */
export async function del<T = unknown>(
  path: string,
  options?: HttpOptions
): Promise<T> {
  const headers = buildHeaders(options);
  const response = await adminApiClient.delete<T>(path, {
    headers,
    timeout: options?.timeout,
    skipJsonParsing: options?.skipJsonParsing,
  });
  return handleResponse(response);
}

/**
 * Check if Admin API is configured
 */
export function isConfigured(): boolean {
  return adminApiClient.isConfigured();
}

/**
 * Get the base URL for Admin API
 */
export function getBaseUrl(): string {
  return adminApiClient.getBaseUrl();
}

/**
 * Generate a unique request ID
 * Uses crypto.randomUUID if available, falls back to timestamp + random
 */
export function generateRequestId(): string {
  // Use crypto.randomUUID if available (Node 14.17+, modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random string
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
}

// Re-export types for convenience
export type { ApiResponse, ApiError, ApiSuccess };
