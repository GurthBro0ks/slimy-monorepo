/**
 * Central API Client Module
 *
 * Provides a fetch wrapper with:
 * - Automatic retries (2-3 attempts) with exponential backoff
 * - Authorization header support
 * - CRUD methods (get, post, put, delete)
 * - Request/response interceptors
 * - Optional caching
 */

import { apiCache } from './cache';
import {
  requestInterceptor,
  responseInterceptor,
  errorInterceptor,
  parseJsonResponse,
  type ApiError,
} from './interceptors';

export interface ApiSuccess<T = unknown> {
  ok: true;
  data: T;
  status: number;
  headers: Headers;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  useCache?: boolean;
  cacheTtl?: number;
  authToken?: string;
  skipInterceptors?: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * API Client for internal and external API calls
 */
export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private retryConfig: RetryConfig;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.defaultTimeout = 10000; // 10 seconds

    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
    };
  }

  /**
   * Set base URL for all requests
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Build full URL from path
   */
  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  /**
   * Calculate delay for retry attempt with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Wait for the specified delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: ApiError): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'RESPONSE_ERROR'];
    const retryableStatuses = [408, 429, 500, 502, 503, 504];

    return retryableCodes.includes(error.code) ||
           (typeof error.status === 'number' && retryableStatuses.includes(error.status));
  }

  /**
   * Handle fetch errors
   */
  private handleError(error: unknown, url: string): ApiError {
    if (error && typeof error === 'object' && 'ok' in error && error.ok === false) {
      return error as ApiError;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          ok: false,
          code: 'TIMEOUT_ERROR',
          message: 'Request timed out',
          status: 408,
        };
      }

      return {
        ok: false,
        code: 'NETWORK_ERROR',
        message: error.message || 'Network request failed',
        details: error,
      };
    }

    return {
      ok: false,
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: error,
    };
  }

  /**
   * Core request method with retries and interceptors
   */
  async request<T = unknown>(
    path: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.retryConfig.maxRetries,
      useCache = false,
      cacheTtl = 300000, // 5 minutes
      authToken,
      skipInterceptors = false,
      ...requestConfig
    } = config;

    const url = this.buildUrl(path);
    const method = (requestConfig.method || 'GET').toUpperCase();

    // Check cache for GET requests
    if (useCache && method === 'GET') {
      const cacheKey = apiCache.generateKey(url, method, requestConfig.body as string);
      const cached = apiCache.getFromCache<T>(cacheKey);

      if (cached !== null) {
        return {
          ok: true,
          data: cached,
          status: 200,
          headers: new Headers(),
        };
      }
    }

    let lastError: ApiError | null = null;

    // Retry loop (2-3 attempts)
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Apply request interceptor
        let processedConfig = requestConfig;
        if (!skipInterceptors) {
          processedConfig = requestInterceptor(url, requestConfig, {
            authToken,
            log: true,
          });
        }

        // Setup timeout
        const controller = new AbortController();
        const timeoutId = timeout > 0
          ? setTimeout(() => controller.abort(), timeout)
          : null;

        try {
          console.log(`[API] ${method} ${url} (attempt ${attempt + 1}/${retries + 1})`);

          // Make fetch request
          const response = await fetch(url, {
            ...processedConfig,
            signal: controller.signal,
          });

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          // Apply response interceptor
          let processedResponse = response;
          if (!skipInterceptors) {
            processedResponse = await responseInterceptor(url, response, {
              log: true,
              validate: true,
            });
          } else if (!response.ok) {
            // Even without interceptors, handle non-ok responses
            const errorData = await response.text();
            throw {
              ok: false,
              code: 'RESPONSE_ERROR',
              message: errorData || `HTTP ${response.status}`,
              status: response.status,
            } as ApiError;
          }

          // Parse response
          const data = await parseJsonResponse<T>(processedResponse);

          // Cache successful GET responses
          if (useCache && method === 'GET') {
            const cacheKey = apiCache.generateKey(url, method, requestConfig.body as string);
            apiCache.setCache(cacheKey, data, cacheTtl);
          }

          return {
            ok: true,
            data,
            status: processedResponse.status,
            headers: processedResponse.headers,
          };

        } catch (fetchError) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          throw fetchError;
        }

      } catch (error) {
        lastError = this.handleError(error, url);

        // Apply error interceptor
        if (!skipInterceptors) {
          lastError = errorInterceptor(url, lastError, { log: true });
        }

        // Check if we should retry
        if (attempt < retries && this.isRetryableError(lastError)) {
          const delayMs = this.calculateRetryDelay(attempt);
          console.log(`[API] Retrying in ${delayMs}ms...`);
          await this.delay(delayMs);
          continue;
        }

        // No more retries or non-retryable error
        return lastError;
      }
    }

    // Should never reach here, but return last error just in case
    return lastError || {
      ok: false,
      code: 'UNKNOWN_ERROR',
      message: 'Request failed after all retries',
    };
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    path: string,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...config,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    path: string,
    data?: unknown,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    path: string,
    data?: unknown,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    path: string,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...config,
      method: 'DELETE',
    });
  }
}

// Export default instance
export const apiClient = new ApiClient();

// Re-export types and utilities
export { apiCache, type ApiError } from './interceptors';
export * from './cache';
