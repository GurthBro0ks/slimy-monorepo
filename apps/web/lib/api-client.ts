/**
 * Centralized API Client for Admin API communication
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
    // FIX: Force empty base URL to use relative paths (proxied by Next.js)
    // This avoids issues with corrupted environment variables
    this.baseUrl = '';
    this.defaultTimeout = 10000;

    if (process.env.NODE_ENV === 'test') {
      this.retryConfig = { maxRetries: 0, baseDelay: 0, maxDelay: 0, backoffMultiplier: 1 };
    } else {
      this.retryConfig = { maxRetries: 3, baseDelay: 1000, maxDelay: 30000, backoffMultiplier: 2 };
    }

    this.addRequestInterceptor((config) => ({
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    }));
  }

  addRequestInterceptor(interceptor: (config: RequestInit) => RequestInit): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: (error: ApiError) => ApiError | Promise<ApiError>): void {
    this.errorInterceptors.push(interceptor);
  }

  private generateCacheKey(url: string, method: string, body?: string): string {
    return `${method}:${url}:${body || ''}`;
  }

  private isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private getCachedResponse<T>(key: string): ApiSuccess<T> | null {
    const entry = this.cache.get(key);
    if (entry && this.isCacheValid(entry)) {
      return { ok: true, data: entry.data as T, status: 200, headers: new Headers() };
    }
    return null;
  }

  private setCachedResponse<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) this.cache.delete(key);
    }
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRetryableError(error: ApiError): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR'];
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableCodes.includes(error.code) || (typeof error.status === 'number' && retryableStatuses.includes(error.status));
  }

  private async processRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) processedConfig = interceptor(processedConfig);
    return processedConfig;
  }

  private async processResponseInterceptors(response: Response): Promise<Response> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) processedResponse = await interceptor(processedResponse);
    return processedResponse;
  }

  private async processErrorInterceptors(error: ApiError): Promise<ApiError> {
    let processedError = error;
    for (const interceptor of this.errorInterceptors) processedError = await interceptor(processedError);
    return processedError;
  }

  private async handleError(error: unknown, status?: number): Promise<ApiError> {
    let apiError: ApiError;
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        apiError = { ok: false, code: 'TIMEOUT_ERROR', message: 'Request timed out', status: 408 };
      } else {
        apiError = { ok: false, code: 'NETWORK_ERROR', message: error.message || 'Network request failed', status, details: error };
      }
    } else {
      apiError = { ok: false, code: 'UNKNOWN_ERROR', message: 'An unknown error occurred', status, details: error };
    }
    return this.processErrorInterceptors(apiError);
  }

  private extractPath(url: string): string {
    if (url.startsWith(this.baseUrl) && this.baseUrl) return url.substring(this.baseUrl.length);
    if (url.startsWith('/')) return url;
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url.startsWith('/') ? url : `/${url}`;
    }
  }

  private async makeRequest<T>(url: string, config: RequestInit & RequestConfig): Promise<ApiResponse<T>> {
    const { timeout = this.defaultTimeout, retries = this.retryConfig.maxRetries, useCache = false, cacheTtl = 300000, ...requestConfig } = config;
    const path = this.extractPath(url);

    if (useCache && requestConfig.method === 'GET') {
      const cacheKey = this.generateCacheKey(path, requestConfig.method || 'GET', requestConfig.body as string);
      const cached = this.getCachedResponse<T>(cacheKey);
      if (cached) return cached;
    }

    const processedConfig = await this.processRequestInterceptors(requestConfig);
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.adminClient.request<T>(path, { ...processedConfig, timeout });
        if (!response.ok) {
          lastError = response as ApiError;
          if (attempt < retries && this.isRetryableError(lastError)) {
            await this.delay(this.calculateRetryDelay(attempt));
            continue;
          }
          return await this.processErrorInterceptors(lastError);
        }
        const result = response as ApiSuccess<T>;
        if (useCache && requestConfig.method === 'GET') {
          const cacheKey = this.generateCacheKey(path, requestConfig.method || 'GET', requestConfig.body as string);
          this.setCachedResponse(cacheKey, result.data, cacheTtl);
        }
        return result;
      } catch (error) {
        lastError = await this.handleError(error);
        if (attempt < retries && this.isRetryableError(lastError)) {
          await this.delay(this.calculateRetryDelay(attempt));
          continue;
        }
        return lastError;
      }
    }
    return lastError || { ok: false, code: 'UNKNOWN_ERROR', message: 'Request failed after all retries' };
  }

  async get<T = unknown>(path: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.baseUrl}${path}`, { method: 'GET', ...config });
  }

  async post<T = unknown>(path: string, data?: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.baseUrl}${path}`, { method: 'POST', body: data ? JSON.stringify(data) : undefined, ...config });
  }

  async put<T = unknown>(path: string, data?: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.baseUrl}${path}`, { method: 'PUT', body: data ? JSON.stringify(data) : undefined, ...config });
  }

  async patch<T = unknown>(path: string, data?: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.baseUrl}${path}`, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined, ...config });
  }

  async delete<T = unknown>(path: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.baseUrl}${path}`, { method: 'DELETE', ...config });
  }

  async request<T = unknown>(method: string, path: string, data?: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.baseUrl}${path}`, { method: method.toUpperCase(), body: data ? JSON.stringify(data) : undefined, ...config });
  }

  clearCache(): void { this.cache.clear(); }
  cleanExpiredCache(): void { this.cleanCache(); }
  getCacheStats() { return { size: this.cache.size, keys: Array.from(this.cache.keys()) }; }
}

export const apiClient = new ApiClient();

export async function proxyToAdminApi<T = unknown>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const method = options?.method || 'GET';
  const data = options?.body ? JSON.parse(options.body as string) : undefined;
  return apiClient.request<T>(method, path, data, { headers: options?.headers as Record<string, string> });
}
