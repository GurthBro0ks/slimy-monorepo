/**
 * General-Purpose HTTP Client
 *
 * A robust, well-typed HTTP wrapper for both browser and Node.js environments.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Timeout support
 * - Structured logging integration
 * - Type-safe error handling
 * - JSON parsing with error recovery
 * - Works in browser and Next.js server components
 * - Streaming response support
 *
 * Usage:
 * ```ts
 * import { httpClient } from '@/lib/http/client';
 *
 * // Simple GET
 * const response = await httpClient.get<User>('/api/user');
 * if (response.ok) {
 *   console.log(response.data);
 * }
 *
 * // POST with options
 * const response = await httpClient.post('/api/login', { email, password }, {
 *   timeout: 5000,
 *   retries: 2
 * });
 * ```
 */

import { getLogger } from '@/lib/monitoring/logger';
import { AppError } from '@/lib/errors';

const logger = getLogger({ module: 'HttpClient' });

/**
 * HTTP-specific error with request context
 */
export class HttpError extends AppError {
  constructor(
    message: string,
    public url: string,
    public method: string,
    public status: number | null = null,
    code?: string,
    details?: unknown
  ) {
    super(message, code || 'HTTP_ERROR', status || 500, details);
    this.name = 'HttpError';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      url: this.url,
      method: this.method,
    };
  }
}

/**
 * HTTP request configuration
 */
export interface HttpRequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retry attempts (default: 0) */
  retries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  retryDelay?: number;
  /** Maximum delay between retries in ms (default: 10000) */
  maxRetryDelay?: number;
  /** Enable request/response logging (default: true) */
  enableLogging?: boolean;
  /** Skip automatic JSON parsing (for streaming, etc.) (default: false) */
  skipJsonParsing?: boolean;
  /** Custom headers */
  headers?: HeadersInit;
  /** Request method (GET, POST, etc.) - typically set by helper methods */
  method?: string;
  /** Request body - will be stringified automatically for POST/PUT/PATCH */
  body?: string;
}

/**
 * Successful HTTP response
 */
export interface HttpResponse<T = unknown> {
  ok: true;
  status: number;
  statusText: string;
  headers: Headers;
  data: T;
  url: string;
  method: string;
}

/**
 * Failed HTTP response
 */
export interface HttpErrorResponse {
  ok: false;
  status: number | null;
  statusText?: string;
  error: HttpError;
  url: string;
  method: string;
}

/**
 * Union type for all HTTP responses
 */
export type HttpResult<T = unknown> = HttpResponse<T> | HttpErrorResponse;

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  currentAttempt: number;
}

/**
 * Check if error is retryable
 */
function isRetryableError(status: number | null, code?: string): boolean {
  // Network errors
  if (!status) return true;

  // Retryable status codes
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  if (retryableStatuses.includes(status)) return true;

  // Retryable error codes
  const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'ECONNRESET'];
  if (code && retryableCodes.includes(code)) return true;

  return false;
}

/**
 * Calculate delay for next retry with exponential backoff
 */
function calculateRetryDelay(config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(2, config.currentAttempt);
  return Math.min(exponentialDelay, config.maxDelay);
}

/**
 * Wait for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parse JSON with error recovery
 */
async function safeJsonParse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';

  // If not JSON, return text as data
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return text as unknown as T;
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sanitize URL for logging (remove sensitive query params)
 */
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const sensitiveParams = ['token', 'apiKey', 'api_key', 'password', 'secret'];

    sensitiveParams.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '***');
      }
    });

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * General-purpose HTTP Client
 */
export class HttpClient {
  /**
   * Make an HTTP request with automatic retry and error handling
   */
  async request<T = unknown>(
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResult<T>> {
    const {
      timeout = 30000,
      retries = 0,
      retryDelay = 1000,
      maxRetryDelay = 10000,
      enableLogging = true,
      skipJsonParsing = false,
      headers: customHeaders,
      ...fetchOptions
    } = options;

    const method = (options.method || 'GET').toUpperCase();
    const sanitizedUrl = enableLogging ? sanitizeUrl(url) : url;

    const retryConfig: RetryConfig = {
      maxRetries: retries,
      baseDelay: retryDelay,
      maxDelay: maxRetryDelay,
      currentAttempt: 0,
    };

    // Setup headers
    const headers = new Headers(customHeaders);
    if (!headers.has('Content-Type') && fetchOptions.body) {
      headers.set('Content-Type', 'application/json');
    }

    let lastError: HttpError | null = null;

    // Retry loop
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      retryConfig.currentAttempt = attempt;

      if (enableLogging && attempt > 0) {
        logger.info(`Retrying HTTP request (attempt ${attempt + 1}/${retryConfig.maxRetries + 1})`, {
          method,
          url: sanitizedUrl,
        });
      }

      // Setup abort controller for timeout
      const controller = new AbortController();
      const timeoutId = timeout > 0
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      try {
        const startTime = Date.now();

        if (enableLogging) {
          logger.debug(`HTTP ${method} ${sanitizedUrl}`, {
            method,
            url: sanitizedUrl,
            attempt: attempt + 1,
          });
        }

        // Make the request
        const response = await fetch(url, {
          ...fetchOptions,
          method,
          headers,
          signal: controller.signal,
        });

        // Clear timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const duration = Date.now() - startTime;

        // Handle non-OK responses
        if (!response.ok) {
          let errorData: unknown;
          let errorMessage: string;

          try {
            const errorText = await response.text();
            errorData = errorText ? JSON.parse(errorText) : null;
            errorMessage = (errorData as { message?: string })?.message
              || (errorData as { error?: string })?.error
              || `HTTP ${response.status}: ${response.statusText}`;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }

          const httpError = new HttpError(
            errorMessage,
            url,
            method,
            response.status,
            (errorData as { code?: string })?.code || 'HTTP_ERROR',
            errorData
          );

          lastError = httpError;

          if (enableLogging) {
            logger.warn(`HTTP request failed`, {
              method,
              url: sanitizedUrl,
              status: response.status,
              duration,
              error: errorMessage,
            });
          }

          // Check if we should retry
          if (attempt < retryConfig.maxRetries && isRetryableError(response.status, httpError.code)) {
            const delayMs = calculateRetryDelay(retryConfig);
            if (enableLogging) {
              logger.debug(`Retrying in ${delayMs}ms...`, { method, url: sanitizedUrl });
            }
            await delay(delayMs);
            continue;
          }

          // No more retries
          return {
            ok: false,
            status: response.status,
            statusText: response.statusText,
            error: httpError,
            url,
            method,
          };
        }

        // Success!
        let data: T;

        if (skipJsonParsing) {
          // Return the raw response for streaming, etc.
          data = response as unknown as T;
        } else {
          // Parse JSON response
          data = await safeJsonParse<T>(response);
        }

        if (enableLogging) {
          logger.debug(`HTTP ${method} ${sanitizedUrl} completed`, {
            method,
            url: sanitizedUrl,
            status: response.status,
            duration,
          });
        }

        return {
          ok: true,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data,
          url,
          method,
        };

      } catch (error) {
        // Clear timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Handle timeout
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new HttpError(
            `Request timeout after ${timeout}ms`,
            url,
            method,
            408,
            'TIMEOUT_ERROR'
          );
        }
        // Handle network errors
        else if (error instanceof Error) {
          lastError = new HttpError(
            `Network error: ${error.message}`,
            url,
            method,
            null,
            'NETWORK_ERROR',
            error
          );
        }
        // Handle unknown errors
        else {
          lastError = new HttpError(
            'Unknown error occurred',
            url,
            method,
            null,
            'UNKNOWN_ERROR',
            error
          );
        }

        if (enableLogging) {
          logger.error(`HTTP request error`, lastError, {
            method,
            url: sanitizedUrl,
            attempt: attempt + 1,
          });
        }

        // Check if we should retry
        if (attempt < retryConfig.maxRetries && isRetryableError(null, lastError.code)) {
          const delayMs = calculateRetryDelay(retryConfig);
          await delay(delayMs);
          continue;
        }

        // No more retries
        return {
          ok: false,
          status: lastError.status,
          statusText: lastError.message,
          error: lastError,
          url,
          method,
        };
      }
    }

    // Should never reach here, but TypeScript needs it
    return {
      ok: false,
      status: lastError?.status || null,
      error: lastError || new HttpError('Unknown error', url, method),
      url,
      method,
    };
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpResult<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    options?: HttpRequestOptions
  ): Promise<HttpResult<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    options?: HttpRequestOptions
  ): Promise<HttpResult<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    options?: HttpRequestOptions
  ): Promise<HttpResult<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpResult<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * HEAD request - useful for checking if a resource exists
   */
  async head(
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpResult<void>> {
    return this.request<void>(url, {
      ...options,
      method: 'HEAD',
      skipJsonParsing: true,
    });
  }

  /**
   * Validate if a URL is accessible
   */
  async validateUrl(url: string, options?: HttpRequestOptions): Promise<boolean> {
    const result = await this.head(url, {
      ...options,
      enableLogging: false,
    });
    return result.ok;
  }
}

/**
 * Default HTTP client instance
 */
export const httpClient = new HttpClient();

/**
 * Convenience functions for common operations
 */
export const httpGet = <T = unknown>(url: string, options?: HttpRequestOptions) =>
  httpClient.get<T>(url, options);

export const httpPost = <T = unknown>(url: string, data?: unknown, options?: HttpRequestOptions) =>
  httpClient.post<T>(url, data, options);

export const httpPut = <T = unknown>(url: string, data?: unknown, options?: HttpRequestOptions) =>
  httpClient.put<T>(url, data, options);

export const httpPatch = <T = unknown>(url: string, data?: unknown, options?: HttpRequestOptions) =>
  httpClient.patch<T>(url, data, options);

export const httpDelete = <T = unknown>(url: string, options?: HttpRequestOptions) =>
  httpClient.delete<T>(url, options);

/**
 * Type guard to check if response is successful
 */
export function isHttpSuccess<T>(result: HttpResult<T>): result is HttpResponse<T> {
  return result.ok === true;
}

/**
 * Type guard to check if response is an error
 */
export function isHttpError<T>(result: HttpResult<T>): result is HttpErrorResponse {
  return result.ok === false;
}

/**
 * Unwrap HTTP result or throw error
 * Useful when you want to work with traditional try/catch
 */
export function unwrapHttp<T>(result: HttpResult<T>): T {
  if (result.ok) {
    return result.data;
  }
  throw result.error;
}
