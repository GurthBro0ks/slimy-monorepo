/**
 * Centralized API Client for Admin API communication
 * Features:
 * - Automatic retry with exponential backoff
 * - Request/response interceptors
 * - Authentication handling (cookies)
 * - Request caching
 * - Comprehensive error handling
 * - Request logging
 * 
 * This client wraps AdminApiClient with additional features.
 * AdminApiClient is the single source of truth for proxy logic.
 */

import { adminApiClient, type ApiResponse as AdminApiResponse } from './api/admin-client';

export interface ApiError {
  ok: false;
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  ok: true;
  data: T;
  status: number;
  headers: Headers;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  useCache?: boolean;
  cacheTtl?: number;
  headers?: Record<string, string>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private retryConfig: RetryConfig;
  private cache = new Map<string, CacheEntry>();
  private requestInterceptors: Array<(config: RequestInit) => RequestInit> = [];
  private responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];
  private errorInterceptors: Array<(error: ApiError) => ApiError | Promise<ApiError>> = [];
  private adminClient = adminApiClient;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_ADMIN_API_BASE || '';
    this.defaultTimeout = 10000; // 10 seconds

    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
    };

    // Add default request interceptor for JSON content-type
    this.addRequestInterceptor((config) => ({
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    }));
  }

  /**
   * Add a request interceptor that modifies the request config
   */
  addRequestInterceptor(interceptor: (config: RequestInit) => RequestInit): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor that can modify the response
   */
  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add an error interceptor that can modify error responses
   */
  addErrorInterceptor(interceptor: (error: ApiError) => ApiError | Promise<ApiError>): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(url: string, method: string, body?: string): string {
    return `${method}:${url}:${body || ''}`;
  }

  /**
   * Check if cached response is still valid
   */
  private isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get cached response if available and valid
   */
  private getCachedResponse<T>(key: string): ApiSuccess<T> | null {
    const entry = this.cache.get(key);
    if (entry && this.isCacheValid(entry)) {
      console.log(`[ApiClient] Cache hit for ${key}`);
      return {
        ok: true,
        data: entry.data as T,
        status: 200,
        headers: new Headers(),
      };
    }
    return null;
  }

  /**
   * Cache a successful response
   */
  private setCachedResponse<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Calculate delay for retry attempt
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
    // Retry on network errors, 5xx server errors, and specific 4xx errors
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR'];
    const retryableStatuses = [408, 429, 500, 502, 503, 504];

    return retryableCodes.includes(error.code) ||
           (typeof error.status === 'number' && retryableStatuses.includes(error.status));
  }

  /**
   * Process request through interceptors
   */
  private async processRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      processedConfig = interceptor(processedConfig);
    }
    return processedConfig;
  }

  /**
   * Process response through interceptors
   */
  private async processResponseInterceptors(response: Response): Promise<Response> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    return processedResponse;
  }

  /**
   * Process error through interceptors
   */
  private async processErrorInterceptors(error: ApiError): Promise<ApiError> {
    let processedError = error;
    for (const interceptor of this.errorInterceptors) {
      processedError = await interceptor(processedError);
    }
    return processedError;
  }

  /**
   * Handle API errors consistently
   */
  private async handleError(error: unknown, status?: number): Promise<ApiError> {
    let apiError: ApiError;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        apiError = {
          ok: false,
          code: 'TIMEOUT_ERROR',
          message: 'Request timed out',
          status: 408,
        };
      } else {
        apiError = {
          ok: false,
          code: 'NETWORK_ERROR',
          message: error.message || 'Network request failed',
          status,
          details: error,
        };
      }
    } else {
      apiError = {
        ok: false,
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        status,
        details: error,
      };
    }

    return this.processErrorInterceptors(apiError);
  }

  /**
   * Extract path from full URL (removes base URL)
   */
  private extractPath(url: string): string {
    // If URL starts with baseUrl, extract the path
    if (url.startsWith(this.baseUrl)) {
      return url.substring(this.baseUrl.length);
    }
    // If it's already a path, return as-is
    if (url.startsWith('/')) {
      return url;
    }
    // Otherwise, try to extract path from URL
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      // If URL parsing fails, assume it's a path
      return url.startsWith('/') ? url : `/${url}`;
    }
  }

  /**
   * Make HTTP request with retry logic
   * Uses AdminApiClient internally as the single source of truth for proxy logic
   */
  private async makeRequest<T>(
    url: string,
    config: RequestInit & RequestConfig
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.retryConfig.maxRetries,
      useCache = false,
      cacheTtl = 300000, // 5 minutes default
      ...requestConfig
    } = config;

    // Extract path from URL for AdminApiClient
    const path = this.extractPath(url);

    // Check cache first if enabled
    if (useCache && requestConfig.method === 'GET') {
      const cacheKey = this.generateCacheKey(path, requestConfig.method || 'GET', requestConfig.body as string);
      const cached = this.getCachedResponse<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Process request through interceptors
    const processedConfig = await this.processRequestInterceptors(requestConfig);

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`[ApiClient] ${requestConfig.method || 'GET'} ${path} (attempt ${attempt + 1}/${retries + 1})`);

        // Use AdminApiClient for the actual request (single source of truth for proxy logic)
        const response = await this.adminClient.request<T>(path, {
          ...processedConfig,
          timeout,
        });

        // Handle error responses
        if (!response.ok) {
          lastError = response as ApiError;

          // Check if we should retry
          if (attempt < retries && this.isRetryableError(lastError)) {
            const delay = this.calculateRetryDelay(attempt);
            console.log(`[ApiClient] Retrying in ${delay}ms...`);
            await this.delay(delay);
            continue;
          }

          return await this.processErrorInterceptors(lastError);
        }

        // Success - response is already parsed by AdminApiClient
        const result = response as ApiSuccess<T>;

        // Cache successful GET responses
        if (useCache && requestConfig.method === 'GET') {
          const cacheKey = this.generateCacheKey(path, requestConfig.method || 'GET', requestConfig.body as string);
          this.setCachedResponse(cacheKey, result.data, cacheTtl);
        }

        return result;

      } catch (error) {
        lastError = await this.handleError(error);

        // Check if we should retry
        if (attempt < retries && this.isRetryableError(lastError)) {
          const delay = this.calculateRetryDelay(attempt);
          console.log(`[ApiClient] Retrying in ${delay}ms...`);
          await this.delay(delay);
          continue;
        }

        return lastError;
      }
    }

    // Should never reach here, but just in case
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
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    return this.makeRequest<T>(url, {
      method: 'GET',
      ...config,
    });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    path: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    path: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    path: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    return this.makeRequest<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    path: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    return this.makeRequest<T>(url, {
      method: 'DELETE',
      ...config,
    });
  }

  /**
   * Generic request method
   */
  async request<T = unknown>(
    method: string,
    path: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    return this.makeRequest<T>(url, {
      method: method.toUpperCase(),
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache(): void {
    this.cleanCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create default instance
export const apiClient = new ApiClient();

// Export legacy function for backward compatibility
// Now delegates to AdminApiClient through apiClient
export async function proxyToAdminApi<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const method = options?.method || 'GET';
  const data = options?.body ? JSON.parse(options.body as string) : undefined;

  return apiClient.request<T>(method, path, data, {
    headers: options?.headers as Record<string, string>,
  });
}
