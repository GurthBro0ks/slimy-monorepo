/**
 * Universal HTTP client for Node.js and Browser
 * Provides type-safe HTTP requests with retry logic and error handling
 */

import type {
  ApiResponse,
  HttpClientConfig,
  RequestConfig,
  RetryConfig,
} from './types.js';
import { toApiError, responseToApiError } from './errors.js';
import { DEFAULT_RETRY_CONFIG, withRetry } from './retry.js';

/**
 * HTTP Client with retry logic and structured error handling
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Structured ApiResponse<T> return type
 * - Timeout support
 * - Works in both Node.js and Browser
 * - TypeScript-first with full type safety
 *
 * @example
 * ```typescript
 * const client = new HttpClient({
 *   baseUrl: 'https://api.example.com',
 *   timeout: 10000,
 *   retry: { maxRetries: 3 }
 * });
 *
 * const result = await client.get('/users/123');
 * if (result.ok) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.code, result.message);
 * }
 * ```
 */
export class HttpClient {
  private config: Required<HttpClientConfig>;

  /**
   * Create a new HTTP client
   * @param config - Client configuration
   */
  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout ?? 30000, // 30 seconds default
      retry: config.retry || DEFAULT_RETRY_CONFIG,
      headers: config.headers || {},
    };
  }

  /**
   * Build full URL from path
   * Handles both relative paths (with baseUrl) and absolute URLs
   */
  private buildUrl(path: string): string {
    // Already absolute URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // No base URL - return path as-is
    if (!this.config.baseUrl) {
      return path;
    }

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.baseUrl}${normalizedPath}`;
  }

  /**
   * Parse response body based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    if (contentType.includes('text/')) {
      return response.text() as T;
    }

    // Try JSON first, fallback to text
    try {
      return await response.json();
    } catch {
      return response.text() as T;
    }
  }

  /**
   * Core request method - all HTTP methods go through here
   * @template T - Type of response data
   * @param method - HTTP method (GET, POST, etc.)
   * @param url - Request URL or path
   * @param config - Request configuration
   * @returns ApiResponse with structured success or error
   */
  async request<T = unknown>(
    method: string,
    url: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = this.buildUrl(url);
    const timeout = config.timeout ?? this.config.timeout;
    const retryConfig: RetryConfig | null =
      config.retry === false ? null : config.retry || this.config.retry;

    // Create the request function for potential retry
    const makeRequest = async (): Promise<ApiResponse<T>> => {
      // Set up timeout with AbortController
      const controller = new AbortController();
      const timeoutId =
        timeout > 0 ? setTimeout(() => controller.abort(), timeout) : null;

      try {
        // Prepare headers
        const headers: Record<string, string> = {
          ...this.config.headers,
          ...config.headers,
        };

        // Add Content-Type for requests with body
        if (config.body && !headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }

        // Prepare body
        const body =
          config.body !== undefined
            ? typeof config.body === 'string'
              ? config.body
              : JSON.stringify(config.body)
            : undefined;

        // Extract fetch-compatible options (exclude our custom options)
        const { timeout: _, retry: __, body: ___, ...fetchOptions } = config;

        // Make the request
        const response = await fetch(fullUrl, {
          method: method.toUpperCase(),
          headers,
          body,
          signal: config.signal || controller.signal,
          // Spread other fetch options
          ...fetchOptions,
        });

        // Clear timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Handle error response
        if (!response.ok) {
          return await responseToApiError(response);
        }

        // Success - parse response
        const data = await this.parseResponse<T>(response);

        return {
          ok: true,
          data,
          status: response.status,
          headers: response.headers,
        };
      } catch (error) {
        // Clear timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Convert error to ApiError
        return toApiError(error);
      }
    };

    // Apply retry logic if configured
    if (retryConfig) {
      return withRetry(makeRequest, retryConfig);
    }

    // No retry - execute once
    return makeRequest();
  }

  /**
   * GET request
   * @template T - Type of response data
   * @param url - Request URL or path
   * @param config - Request configuration
   * @returns ApiResponse with data or error
   */
  async get<T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, config);
  }

  /**
   * POST request
   * @template T - Type of response data
   * @param url - Request URL or path
   * @param data - Request body (will be JSON stringified)
   * @param config - Request configuration
   * @returns ApiResponse with data or error
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, {
      ...config,
      body: data,
    });
  }

  /**
   * PUT request
   * @template T - Type of response data
   * @param url - Request URL or path
   * @param data - Request body (will be JSON stringified)
   * @param config - Request configuration
   * @returns ApiResponse with data or error
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, {
      ...config,
      body: data,
    });
  }

  /**
   * PATCH request
   * @template T - Type of response data
   * @param url - Request URL or path
   * @param data - Request body (will be JSON stringified)
   * @param config - Request configuration
   * @returns ApiResponse with data or error
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, {
      ...config,
      body: data,
    });
  }

  /**
   * DELETE request
   * @template T - Type of response data
   * @param url - Request URL or path
   * @param config - Request configuration
   * @returns ApiResponse with data or error
   */
  async delete<T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, config);
  }

  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Check if base URL is configured
   */
  isConfigured(): boolean {
    return !!this.config.baseUrl;
  }
}
