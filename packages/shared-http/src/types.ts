/**
 * Shared HTTP types for consistent API communication
 * Used across web and admin-api for type-safe HTTP requests
 */

/**
 * Successful API response
 * @template T - The type of the response data
 */
export interface ApiSuccess<T = unknown> {
  /** Discriminator for successful responses */
  ok: true;
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers (if available) */
  headers?: Headers;
}

/**
 * API error response
 * Contains structured error information for debugging and error handling
 */
export interface ApiError {
  /** Discriminator for error responses */
  ok: false;
  /** Structured error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** HTTP status code (if available) */
  status?: number;
  /** Additional error details (validation errors, stack traces, etc.) */
  details?: unknown;
}

/**
 * Discriminated union of success or error responses
 *
 * Usage with type narrowing:
 * ```typescript
 * const result = await client.get('/api/users');
 * if (result.ok) {
 *   // TypeScript knows result.data is available
 *   console.log(result.data);
 * } else {
 *   // TypeScript knows result.code and result.message are available
 *   console.error(result.code, result.message);
 * }
 * ```
 *
 * @template T - The type of the response data on success
 */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds before first retry */
  baseDelay: number;
  /** Maximum delay in milliseconds between retries */
  maxDelay: number;
  /** Multiplier for exponential backoff (e.g., 2 = double delay each time) */
  backoffMultiplier: number;
}

/**
 * Configuration for HTTP client instance
 */
export interface HttpClientConfig {
  /** Base URL for all requests (optional) */
  baseUrl?: string;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Default retry configuration */
  retry?: RetryConfig;
  /** Default headers to include in all requests */
  headers?: Record<string, string>;
}

/**
 * Configuration for individual requests
 */
export interface RequestConfig extends Omit<RequestInit, 'body'> {
  /** Request timeout in milliseconds (overrides default) */
  timeout?: number;
  /** Retry configuration (overrides default, false to disable) */
  retry?: RetryConfig | false;
  /** Additional headers for this request */
  headers?: Record<string, string>;
  /** Request body (will be JSON stringified if object) */
  body?: unknown;
}
