/**
 * Typed HTTP Client Wrapper
 *
 * A well-typed HTTP client wrapper with unified error handling, logging,
 * and safe usage for both browser and Node.js/Next.js server environments.
 *
 * Features:
 * - Result type pattern for consistent error handling
 * - Automatic retry with exponential backoff
 * - Configurable timeouts via AbortController
 * - Safe JSON parsing with detailed error messages
 * - Structured logging integration
 * - Environment-safe (browser + Node.js)
 * - TypeScript strict mode compatible
 */

import { AppError, ErrorCode } from '@/lib/errors';
import { getLogger, type Logger } from '@/lib/monitoring/logger';
import type { HTTPMethod } from '@/lib/types/common';

// ============================================================================
// Types
// ============================================================================

/**
 * HTTP client configuration options
 */
export interface HttpClientConfig {
  /** Base URL to prepend to all requests */
  baseUrl?: string;
  /** Default timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum retry attempts for failed requests (default: 0) */
  retries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  retryDelay?: number;
  /** Default headers to include in all requests */
  headers?: HeadersInit;
  /** Logger instance for structured logging */
  logger?: Logger;
}

/**
 * Per-request options (extends RequestInit but excludes body/method)
 */
export interface HttpRequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  /** Override default timeout for this request */
  timeout?: number;
  /** Override default retries for this request */
  retries?: number;
  /** Override default retry delay for this request */
  retryDelay?: number;
  /** Skip JSON parsing and return raw Response */
  skipJsonParsing?: boolean;
  /** Skip logging errors (useful for expected failures) */
  skipErrorLogging?: boolean;
  /** Override base URL for this request */
  baseUrl?: string;
}

/**
 * HTTP-specific error class
 */
export class HttpError extends AppError {
  readonly url: string;
  readonly method: string;
  readonly isNetworkError: boolean;
  readonly requestDetails?: {
    headers?: Record<string, string>;
    timeout?: number;
  };

  constructor(params: {
    message: string;
    code: string;
    url: string;
    method: string;
    status?: number;
    details?: unknown;
    isNetworkError?: boolean;
    requestDetails?: {
      headers?: Record<string, string>;
      timeout?: number;
    };
  }) {
    super(params.message, params.code, params.status || 500, params.details);
    this.name = 'HttpError';
    this.url = params.url;
    this.method = params.method;
    this.isNetworkError = params.isNetworkError || false;
    this.requestDetails = params.requestDetails;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      url: this.url,
      method: this.method,
      isNetworkError: this.isNetworkError,
    };
  }
}

/**
 * Success result
 */
export interface HttpSuccess<T> {
  ok: true;
  data: T;
  status: number;
  headers: Headers;
}

/**
 * Error result
 */
export interface HttpFailure {
  ok: false;
  error: HttpError;
}

/**
 * HTTP result type (discriminated union)
 */
export type HttpResult<T> = HttpSuccess<T> | HttpFailure;

// ============================================================================
// HTTP Client Class
// ============================================================================

/**
 * HTTP Client with unified error handling and logging
 */
export class HttpClient {
  private config: Required<Omit<HttpClientConfig, 'baseUrl' | 'headers' | 'logger'>> & {
    baseUrl?: string;
    headers?: HeadersInit;
    logger?: Logger;
  };
  private logger: Logger;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl,
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 0,
      retryDelay: config.retryDelay ?? 1000,
      headers: config.headers,
      logger: config.logger,
    };

    this.logger = config.logger || getLogger({ component: 'HttpClient' });
  }

  /**
   * Build full URL from base URL and path
   */
  private buildUrl(url: string, baseUrl?: string): string {
    const base = baseUrl ?? this.config.baseUrl;

    // If no base URL or url is already absolute, return as-is
    if (!base || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Normalize slashes
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;

    return `${normalizedBase}${normalizedPath}`;
  }

  /**
   * Merge headers with defaults
   */
  private mergeHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(this.config.headers);

    if (customHeaders) {
      const custom = new Headers(customHeaders);
      custom.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    return headers;
  }

  /**
   * Create HttpError from various error types
   */
  private createHttpError(
    error: unknown,
    url: string,
    method: string,
    status?: number
  ): HttpError {
    // Handle AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      return new HttpError({
        message: 'Request timed out',
        code: ErrorCode.NETWORK_ERROR,
        url,
        method,
        status: 408,
        isNetworkError: true,
        details: { reason: 'timeout' },
      });
    }

    // Handle network errors (fetch failures)
    if (error instanceof TypeError) {
      return new HttpError({
        message: `Network request failed: ${error.message}`,
        code: ErrorCode.NETWORK_ERROR,
        url,
        method,
        status: null,
        isNetworkError: true,
        details: { originalError: error.message },
      });
    }

    // Handle generic errors
    if (error instanceof Error) {
      return new HttpError({
        message: error.message,
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        url,
        method,
        status: status || null,
        details: { originalError: error.name },
      });
    }

    // Unknown error type
    return new HttpError({
      message: 'An unknown error occurred',
      code: ErrorCode.UNKNOWN_ERROR,
      url,
      method,
      status: status || null,
      details: { error: String(error) },
    });
  }

  /**
   * Parse response body safely
   */
  private async parseResponseBody<T>(
    response: Response,
    url: string,
    method: string
  ): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    // Handle JSON responses
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (error) {
        throw new HttpError({
          message: 'Failed to parse JSON response',
          code: 'JSON_PARSE_ERROR',
          url,
          method,
          status: response.status,
          details: {
            contentType,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    // Handle text responses
    if (contentType.includes('text/')) {
      return (await response.text()) as T;
    }

    // Default: try JSON, fallback to text
    try {
      return await response.json();
    } catch {
      return (await response.text()) as T;
    }
  }

  /**
   * Execute a fetch request with retry logic
   */
  private async executeWithRetry(
    url: string,
    method: string,
    init: RequestInit,
    options: {
      retries: number;
      retryDelay: number;
      timeout: number;
      skipErrorLogging?: boolean;
    }
  ): Promise<Response> {
    let lastError: unknown;
    const maxAttempts = options.retries + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = options.timeout > 0
        ? setTimeout(() => controller.abort(), options.timeout)
        : null;

      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        return response;
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        lastError = error;

        // Don't retry on abort (timeout) - it's a final error
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        // Only retry network errors, not application errors
        const isRetryable = error instanceof TypeError;

        if (isRetryable && attempt < options.retries) {
          const delay = options.retryDelay * Math.pow(2, attempt);

          if (!options.skipErrorLogging) {
            this.logger.warn(
              `HTTP request failed, retrying (${attempt + 1}/${options.retries})`,
              {
                url,
                method,
                attempt: attempt + 1,
                maxRetries: options.retries,
                delayMs: delay,
                error: error instanceof Error ? error.message : String(error),
              }
            );
          }

          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Core request method
   */
  async request<TResponse = unknown>(
    method: HTTPMethod,
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResult<TResponse>> {
    const startTime = Date.now();
    const fullUrl = this.buildUrl(url, options.baseUrl);
    const headers = this.mergeHeaders(options.headers);

    // Extract our custom options
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      retryDelay = this.config.retryDelay,
      skipJsonParsing = false,
      skipErrorLogging = false,
      baseUrl: _baseUrl,
      ...fetchOptions
    } = options;

    // Set default Content-Type for requests with body
    if (!headers.has('Content-Type') && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await this.executeWithRetry(
        fullUrl,
        method,
        {
          ...fetchOptions,
          method,
          headers,
        },
        {
          retries,
          retryDelay,
          timeout,
          skipErrorLogging,
        }
      );

      const duration = Date.now() - startTime;

      // Handle non-2xx responses
      if (!response.ok) {
        let errorData: unknown;
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        // Try to extract error details from response body
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            errorData = await response.json();
            errorMessage = (errorData as { message?: string })?.message || errorMessage;
          } else {
            const text = await response.text();
            if (text) {
              errorData = text;
              errorMessage = text.length > 100 ? text.substring(0, 100) + '...' : text;
            }
          }
        } catch {
          // Ignore parsing errors for error responses
        }

        const error = new HttpError({
          message: errorMessage,
          code: this.mapStatusToErrorCode(response.status),
          url: fullUrl,
          method,
          status: response.status,
          details: errorData,
        });

        if (!skipErrorLogging) {
          this.logger.error(
            `HTTP request failed: ${method} ${fullUrl}`,
            error,
            {
              status: response.status,
              duration,
            }
          );
        }

        return {
          ok: false,
          error,
        };
      }

      // Handle successful response
      if (skipJsonParsing) {
        return {
          ok: true,
          data: response as unknown as TResponse,
          status: response.status,
          headers: response.headers,
        };
      }

      const data = await this.parseResponseBody<TResponse>(response, fullUrl, method);

      this.logger.debug(
        `HTTP request succeeded: ${method} ${fullUrl}`,
        {
          status: response.status,
          duration,
        }
      );

      return {
        ok: true,
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const httpError = this.createHttpError(error, fullUrl, method);

      if (!skipErrorLogging) {
        this.logger.error(
          `HTTP request error: ${method} ${fullUrl}`,
          httpError,
          {
            duration,
            isNetworkError: httpError.isNetworkError,
          }
        );
      }

      return {
        ok: false,
        error: httpError,
      };
    }
  }

  /**
   * Map HTTP status codes to error codes
   */
  private mapStatusToErrorCode(status: number): string {
    if (status === 401) return ErrorCode.UNAUTHORIZED;
    if (status === 403) return ErrorCode.FORBIDDEN;
    if (status === 404) return ErrorCode.NOT_FOUND;
    if (status === 409) return ErrorCode.CONFLICT;
    if (status === 429) return ErrorCode.RATE_LIMIT_EXCEEDED;
    if (status >= 400 && status < 500) return ErrorCode.VALIDATION_ERROR;
    if (status >= 500) return ErrorCode.EXTERNAL_SERVICE_ERROR;
    return ErrorCode.UNKNOWN_ERROR;
  }

  /**
   * GET request
   */
  async get<TResponse = unknown>(
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpResult<TResponse>> {
    return this.request<TResponse>('GET', url, options);
  }

  /**
   * POST request
   */
  async post<TBody = unknown, TResponse = unknown>(
    url: string,
    body?: TBody,
    options?: HttpRequestOptions
  ): Promise<HttpResult<TResponse>> {
    return this.request<TResponse>('POST', url, {
      ...options,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<TBody = unknown, TResponse = unknown>(
    url: string,
    body?: TBody,
    options?: HttpRequestOptions
  ): Promise<HttpResult<TResponse>> {
    return this.request<TResponse>('PUT', url, {
      ...options,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<TBody = unknown, TResponse = unknown>(
    url: string,
    body?: TBody,
    options?: HttpRequestOptions
  ): Promise<HttpResult<TResponse>> {
    return this.request<TResponse>('PATCH', url, {
      ...options,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<TResponse = unknown>(
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpResult<TResponse>> {
    return this.request<TResponse>('DELETE', url, options);
  }

  /**
   * Stream request - returns raw Response for streaming scenarios
   * Throws errors instead of returning Result type
   */
  async stream(
    method: HTTPMethod,
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<Response> {
    const fullUrl = this.buildUrl(url, options.baseUrl);
    const headers = this.mergeHeaders(options.headers);

    const {
      timeout = this.config.timeout,
      retries = 0, // No retries for streams by default
      retryDelay = this.config.retryDelay,
      skipErrorLogging = false,
      baseUrl: _baseUrl,
      skipJsonParsing: _skipJsonParsing,
      ...fetchOptions
    } = options;

    try {
      const response = await this.executeWithRetry(
        fullUrl,
        method,
        {
          ...fetchOptions,
          method,
          headers,
        },
        {
          retries,
          retryDelay,
          timeout,
          skipErrorLogging,
        }
      );

      if (!response.ok) {
        const error = new HttpError({
          message: `Stream request failed: ${response.status} ${response.statusText}`,
          code: this.mapStatusToErrorCode(response.status),
          url: fullUrl,
          method,
          status: response.status,
        });

        if (!skipErrorLogging) {
          this.logger.error(`Stream request failed: ${method} ${fullUrl}`, error);
        }

        throw error;
      }

      return response;
    } catch (error) {
      const httpError = this.createHttpError(error, fullUrl, method);

      if (!skipErrorLogging) {
        this.logger.error(`Stream request error: ${method} ${fullUrl}`, httpError);
      }

      throw httpError;
    }
  }
}

// ============================================================================
// Default Singleton Instance
// ============================================================================

let defaultClient: HttpClient | null = null;

/**
 * Get or create the default HTTP client instance
 */
function getDefaultClient(): HttpClient {
  if (!defaultClient) {
    defaultClient = new HttpClient();
  }
  return defaultClient;
}

/**
 * Create a new HTTP client with custom configuration
 */
export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}

/**
 * Get the default HTTP client instance
 */
export function getHttpClient(): HttpClient {
  return getDefaultClient();
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Convenience function for GET requests using default client
 */
export function httpGet<TResponse = unknown>(
  url: string,
  options?: HttpRequestOptions
): Promise<HttpResult<TResponse>> {
  return getDefaultClient().get<TResponse>(url, options);
}

/**
 * Convenience function for POST requests using default client
 */
export function httpPost<TBody = unknown, TResponse = unknown>(
  url: string,
  body?: TBody,
  options?: HttpRequestOptions
): Promise<HttpResult<TResponse>> {
  return getDefaultClient().post<TBody, TResponse>(url, body, options);
}

/**
 * Convenience function for PUT requests using default client
 */
export function httpPut<TBody = unknown, TResponse = unknown>(
  url: string,
  body?: TBody,
  options?: HttpRequestOptions
): Promise<HttpResult<TResponse>> {
  return getDefaultClient().put<TBody, TResponse>(url, body, options);
}

/**
 * Convenience function for PATCH requests using default client
 */
export function httpPatch<TBody = unknown, TResponse = unknown>(
  url: string,
  body?: TBody,
  options?: HttpRequestOptions
): Promise<HttpResult<TResponse>> {
  return getDefaultClient().patch<TBody, TResponse>(url, body, options);
}

/**
 * Convenience function for DELETE requests using default client
 */
export function httpDelete<TResponse = unknown>(
  url: string,
  options?: HttpRequestOptions
): Promise<HttpResult<TResponse>> {
  return getDefaultClient().delete<TResponse>(url, options);
}

/**
 * Convenience function for streaming requests using default client
 */
export function httpStream(
  method: HTTPMethod,
  url: string,
  options?: HttpRequestOptions
): Promise<Response> {
  return getDefaultClient().stream(method, url, options);
}
