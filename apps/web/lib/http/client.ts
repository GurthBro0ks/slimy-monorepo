/**
 * General-Purpose HTTP Client
 *
 * A well-typed, safe wrapper around the Fetch API with:
 * - Unified error handling (HttpError)
 * - Automatic retries with exponential backoff
 * - Integrated structured logging
 * - Safe JSON parsing
 * - Timeout support
 * - Environment-safe (browser + Node/Next.js server)
 *
 * Usage:
 *   import { httpClient, HttpError, isHttpError } from '@/lib/http/client';
 *
 *   try {
 *     const data = await httpClient.get<MyType>('/api/endpoint');
 *   } catch (error) {
 *     if (isHttpError(error)) {
 *       console.error(`HTTP ${error.status}: ${error.message}`);
 *     }
 *   }
 */

import { getLogger, Logger } from '../monitoring/logger';

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryableStatusCodes?: number[];
  headers?: Record<string, string>;
  logger?: Logger;
}

/**
 * Request options
 */
export interface HttpOptions extends Omit<RequestInit, 'body' | 'method'> {
  timeout?: number;
  retries?: number;
  retryableStatusCodes?: number[];
  parseJson?: boolean; // default true
  body?: unknown; // Will be JSON.stringify'd if object
}

/**
 * HTTP Error class
 *
 * Thrown when HTTP requests fail. Includes status code, error code,
 * and contextual information for debugging.
 */
export class HttpError extends Error {
  readonly name = 'HttpError';

  constructor(
    message: string,
    public readonly status: number | null,
    public readonly code: string,
    public readonly url: string,
    public readonly method: string,
    public readonly isNetworkError: boolean = false,
    public readonly details?: unknown
  ) {
    super(message);
    Error.captureStackTrace(this, HttpError);
  }

  /**
   * Convert to JSON for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      url: this.url,
      method: this.method,
      isNetworkError: this.isNetworkError,
      details: this.details,
    };
  }
}

/**
 * Type guard for HttpError
 */
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

/**
 * HTTP Client
 */
export class HttpClient {
  private config: Required<HttpClientConfig>;
  private logger: Logger;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout ?? 30000, // 30 seconds default
      retries: config.retries ?? 2,
      retryableStatusCodes: config.retryableStatusCodes ?? [408, 429, 500, 502, 503, 504],
      headers: config.headers || {},
      logger: config.logger || getLogger({ module: 'HttpClient' }),
    };
    this.logger = this.config.logger;
  }

  /**
   * Build full URL from base + path
   */
  private buildUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url; // Already absolute
    }

    if (!this.config.baseUrl) {
      return url; // No base URL, return as-is
    }

    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    const normalizedBase = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;

    return `${normalizedBase}${normalizedPath}`;
  }

  /**
   * Merge headers
   */
  private buildHeaders(options?: HttpOptions): HeadersInit {
    const headers = new Headers();

    // Add default headers
    Object.entries(this.config.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });

    // Add JSON content-type if body is an object
    if (options?.body && typeof options.body === 'object') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }

    // Add/override with request-specific headers
    if (options?.headers) {
      const reqHeaders = new Headers(options.headers);
      reqHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    return headers;
  }

  /**
   * Prepare request body
   */
  private prepareBody(body: unknown): string | FormData | undefined {
    if (!body) {
      return undefined;
    }

    if (typeof body === 'string') {
      return body;
    }

    if (body instanceof FormData) {
      return body;
    }

    // Assume JSON serializable
    return JSON.stringify(body);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, baseDelay: number = 1000): number {
    const maxDelay = 30000; // 30 seconds
    const delay = baseDelay * Math.pow(2, attempt);
    return Math.min(delay, maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: HttpError, retryableStatusCodes: number[]): boolean {
    // Network errors are retryable
    if (error.isNetworkError) {
      return true;
    }

    // Check if status is in retryable list
    if (error.status && retryableStatusCodes.includes(error.status)) {
      return true;
    }

    return false;
  }

  /**
   * Parse response body
   */
  private async parseResponse<T>(
    response: Response,
    parseJson: boolean = true,
    method: HttpMethod = 'GET'
  ): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    // If not JSON or parseJson disabled, return text
    if (!parseJson || !contentType.includes('application/json')) {
      const text = await response.text();
      return text as unknown as T;
    }

    // Parse JSON safely
    try {
      const text = await response.text();
      if (!text.trim()) {
        return undefined as unknown as T;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      throw new HttpError(
        'Failed to parse JSON response',
        response.status,
        'JSON_PARSE_ERROR',
        response.url,
        method,
        false,
        { parseError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Core request method
   */
  async request<T>(
    method: HttpMethod,
    url: string,
    options: HttpOptions = {}
  ): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const timeout = options.timeout ?? this.config.timeout;
    const retries = options.retries ?? this.config.retries;
    const retryableStatusCodes = options.retryableStatusCodes ?? this.config.retryableStatusCodes;
    const parseJson = options.parseJson ?? true;

    const headers = this.buildHeaders(options);
    const body = this.prepareBody(options.body);

    // Extract fetch options (excluding our custom options)
    const { timeout: _, retries: __, retryableStatusCodes: ___, parseJson: ____, body: _____, ...fetchOptions } = options;

    let lastError: HttpError | null = null;

    // Retry loop
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;

      try {
        // Set timeout
        if (timeout > 0) {
          timeoutId = setTimeout(() => controller.abort(), timeout);
        }

        // Log request (debug level)
        this.logger.debug(`${method} ${fullUrl}`, {
          attempt: attempt + 1,
          maxAttempts: retries + 1,
        });

        // Make request
        const response = await fetch(fullUrl, {
          ...fetchOptions,
          method,
          headers,
          body,
          signal: controller.signal,
        });

        // Clear timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Handle non-2xx responses
        if (!response.ok) {
          let errorDetails: unknown;
          try {
            errorDetails = await this.parseResponse(response, parseJson, method);
          } catch {
            errorDetails = await response.text();
          }

          const errorMessage =
            typeof errorDetails === 'object' && errorDetails !== null && 'message' in errorDetails
              ? String((errorDetails as { message: unknown }).message)
              : `HTTP ${response.status}: ${response.statusText}`;

          const errorCode =
            typeof errorDetails === 'object' && errorDetails !== null && 'code' in errorDetails
              ? String((errorDetails as { code: unknown }).code)
              : `HTTP_${response.status}`;

          lastError = new HttpError(
            errorMessage,
            response.status,
            errorCode,
            fullUrl,
            method,
            false, // Not a network error
            errorDetails
          );

          // Log error
          this.logger.error('HTTP request failed', undefined, {
            method,
            url: fullUrl,
            status: response.status,
            code: errorCode,
            attempt: attempt + 1,
            willRetry: attempt < retries && this.isRetryableError(lastError, retryableStatusCodes),
          });

          // Check if we should retry
          if (attempt < retries && this.isRetryableError(lastError, retryableStatusCodes)) {
            const delay = this.calculateRetryDelay(attempt);
            this.logger.debug(`Retrying after ${delay}ms`, { attempt, delay });
            await this.delay(delay);
            continue;
          }

          // No more retries, throw error
          throw lastError;
        }

        // Success! Parse and return response
        const data = await this.parseResponse<T>(response, parseJson, method);
        return data;

      } catch (error) {
        // Clear timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // If it's already an HttpError we threw, re-throw it
        if (error instanceof HttpError) {
          throw error;
        }

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new HttpError(
            'Request timeout',
            null,
            'TIMEOUT',
            fullUrl,
            method,
            true,
            { timeout }
          );
        }
        // Handle network errors
        else if (error instanceof Error) {
          lastError = new HttpError(
            error.message || 'Network request failed',
            null,
            'NETWORK_ERROR',
            fullUrl,
            method,
            true,
            { originalError: error.name }
          );
        }
        // Handle unknown errors
        else {
          lastError = new HttpError(
            'Unknown error occurred',
            null,
            'UNKNOWN_ERROR',
            fullUrl,
            method,
            true,
            { error: String(error) }
          );
        }

        // Log error
        this.logger.error('HTTP request error', error instanceof Error ? error : undefined, {
          method,
          url: fullUrl,
          code: lastError.code,
          attempt: attempt + 1,
          willRetry: attempt < retries && this.isRetryableError(lastError, retryableStatusCodes),
        });

        // Check if we should retry
        if (attempt < retries && this.isRetryableError(lastError, retryableStatusCodes)) {
          const delay = this.calculateRetryDelay(attempt);
          this.logger.debug(`Retrying after ${delay}ms`, { attempt, delay });
          await this.delay(delay);
          continue;
        }

        // No more retries, throw error
        throw lastError;
      }
    }

    // Should never reach here, but TypeScript doesn't know that
    throw lastError || new HttpError(
      'Request failed after all retries',
      null,
      'MAX_RETRIES_EXCEEDED',
      fullUrl,
      method,
      false
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string, options?: Omit<HttpOptions, 'body'>): Promise<T> {
    return this.request<T>('GET', url, options);
  }

  /**
   * POST request
   */
  async post<T, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: Omit<HttpOptions, 'body'>
  ): Promise<T> {
    return this.request<T>('POST', url, { ...options, body });
  }

  /**
   * PUT request
   */
  async put<T, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: Omit<HttpOptions, 'body'>
  ): Promise<T> {
    return this.request<T>('PUT', url, { ...options, body });
  }

  /**
   * PATCH request
   */
  async patch<T, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: Omit<HttpOptions, 'body'>
  ): Promise<T> {
    return this.request<T>('PATCH', url, { ...options, body });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, options?: Omit<HttpOptions, 'body'>): Promise<T> {
    return this.request<T>('DELETE', url, options);
  }
}

/**
 * Default HTTP client instance
 */
export const httpClient = new HttpClient();

/**
 * Create a configured HTTP client
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
