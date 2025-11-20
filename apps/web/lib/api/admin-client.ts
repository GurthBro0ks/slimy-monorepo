/**
 * Centralized Admin API Client
 * 
 * Single source of truth for all Admin API proxy logic.
 * Consolidates proxy configuration, header handling, and error handling.
 * 
 * Features:
 * - Single configuration point for base URL
 * - Consistent header handling
 * - Unified error handling
 * - Support for streaming responses (SSE)
 * - Request/response interceptors
 */

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
  status?: number;
  headers?: Headers;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface RequestConfig extends RequestInit {
  timeout?: number;
  skipJsonParsing?: boolean;
  retryOn5xx?: boolean; // Enable automatic retry on 5xx errors
  maxRetries?: number; // Maximum number of retries (default: 2)
}

export class AdminApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_ADMIN_API_BASE || '';
    
    if (!this.baseUrl) {
      console.warn('[AdminApiClient] NEXT_PUBLIC_ADMIN_API_BASE not configured');
    }
  }

  /**
   * Get the base URL for Admin API
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Check if base URL is configured
   */
  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  /**
   * Build full URL from path
   */
  private buildUrl(path: string): string {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  /**
   * Get default headers for requests
   */
  private getDefaultHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers = new Headers(customHeaders);
    
    // Set Content-Type if not already set and body exists
    if (!headers.has('Content-Type') && !headers.has('content-type')) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  }

  /**
   * Handle API errors consistently
   */
  private async handleError(error: unknown, status?: number): Promise<ApiError> {
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
        status,
        details: error,
      };
    }

    return {
      ok: false,
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      status,
      details: error,
    };
  }

  /**
   * Check if status code is a 5xx server error
   */
  private is5xxError(status?: number): boolean {
    return typeof status === 'number' && status >= 500 && status < 600;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Core request method - single source of truth for proxy logic
   * Supports optional retry for 5xx errors with exponential backoff
   */
  async request<T = unknown>(
    path: string,
    options: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    if (!this.baseUrl) {
      return {
        ok: false,
        code: 'CONFIG_ERROR',
        message: 'Admin API base URL not configured',
      };
    }

    const {
      timeout = 30000, // 30 seconds default
      skipJsonParsing = false,
      retryOn5xx = false,
      maxRetries = 2,
      headers: customHeaders,
      ...fetchOptions
    } = options;

    const url = this.buildUrl(path);
    const headers = this.getDefaultHeaders(customHeaders);

    const attemptLimit = retryOn5xx ? maxRetries + 1 : 1;

    for (let attempt = 0; attempt < attemptLimit; attempt++) {
      // Add timeout support
      const controller = new AbortController();
      const timeoutId = timeout > 0
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          let errorData: unknown;
          try {
            const errorText = await response.text();
            errorData = errorText ? JSON.parse(errorText) : { message: errorText };
          } catch {
            errorData = { message: `Request failed with status ${response.status}` };
          }

          const apiError: ApiError = {
            ok: false,
            code: (errorData as { code?: string })?.code || 'UPSTREAM_ERROR',
            message: (errorData as { message?: string })?.message || `Admin API returned ${response.status}`,
            status: response.status,
            details: errorData,
          };

          // Retry on 5xx if enabled and attempts remain
          if (retryOn5xx && this.is5xxError(response.status) && attempt < attemptLimit - 1) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5 seconds
            console.warn(`[AdminApiClient] 5xx error (${response.status}), retrying in ${delay}ms (attempt ${attempt + 1}/${attemptLimit})`);
            await this.sleep(delay);
            continue;
          }

          return apiError;
        }

        // Handle streaming responses (SSE, etc.)
        if (skipJsonParsing || response.headers.get('content-type')?.includes('text/event-stream')) {
          return {
            ok: true,
            data: response as unknown as T,
            status: response.status,
            headers: response.headers,
          };
        }

        // Parse JSON response
        const contentType = response.headers.get('content-type') || '';
        let data: T;

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as T;
        }

        return {
          ok: true,
          data,
          status: response.status,
          headers: response.headers,
        };
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        console.error('[AdminApiClient] Request error:', error);

        // Don't retry on network errors
        return this.handleError(error);
      }
    }

    // Should never reach here, but just in case
    return {
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
    config: RequestConfig = {}
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
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
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
    return this.request<T>(path, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    path: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...config,
      method: 'DELETE',
    });
  }

  /**
   * Stream request - for Server-Sent Events (SSE)
   * Returns the raw Response object for streaming
   */
  async stream(
    path: string,
    config: RequestConfig = {}
  ): Promise<Response> {
    if (!this.baseUrl) {
      throw new Error('Admin API base URL not configured');
    }

    const url = this.buildUrl(path);
    const headers = this.getDefaultHeaders({
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...config.headers,
    });

    const {
      timeout = 0, // No timeout for streams
      ...fetchOptions
    } = config;

    const controller = new AbortController();
    const timeoutId = timeout > 0 
      ? setTimeout(() => controller.abort(), timeout)
      : null;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
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
      throw error;
    }
  }
}

// Create and export default instance
export const adminApiClient = new AdminApiClient();
