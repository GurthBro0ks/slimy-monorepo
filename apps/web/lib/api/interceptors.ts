/**
 * API Request/Response Interceptors
 *
 * Provides logging, response validation, and error handling interceptors
 * for API requests and responses.
 */

export interface ApiError {
  ok: false;
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

/**
 * Request interceptor for logging outgoing requests
 */
export function logRequest(url: string, config: RequestInit): void {
  const method = config.method || 'GET';
  console.log(`[API Request] ${method} ${url}`, {
    headers: config.headers,
    body: config.body ? '(body present)' : '(no body)',
  });
}

/**
 * Response interceptor for logging successful responses
 */
export function logResponse(url: string, response: Response): void {
  console.log(`[API Response] ${response.status} ${url}`, {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type'),
  });
}

/**
 * Response interceptor for logging errors
 */
export function logError(url: string, error: ApiError): void {
  console.error(`[API Error] ${url}`, {
    code: error.code,
    message: error.message,
    status: error.status,
    details: error.details,
  });
}

/**
 * Check if response is successful (2xx status)
 */
export function isSuccessResponse(response: Response): boolean {
  return response.ok && response.status >= 200 && response.status < 300;
}

/**
 * Check if response has JSON content type
 */
export function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type');
  return contentType?.includes('application/json') ?? false;
}

/**
 * Validate response and throw error if not ok
 */
export async function validateResponse(response: Response): Promise<Response> {
  if (!isSuccessResponse(response)) {
    let errorData: unknown;

    try {
      const errorText = await response.text();
      errorData = errorText ? JSON.parse(errorText) : { message: errorText };
    } catch {
      errorData = { message: `Request failed with status ${response.status}` };
    }

    const error: ApiError = {
      ok: false,
      code: (errorData as { code?: string })?.code || 'RESPONSE_ERROR',
      message: (errorData as { message?: string })?.message || `HTTP ${response.status}`,
      status: response.status,
      details: errorData,
    };

    throw error;
  }

  return response;
}

/**
 * Parse JSON response safely
 */
export async function parseJsonResponse<T = unknown>(response: Response): Promise<T> {
  if (!isJsonResponse(response)) {
    throw {
      ok: false,
      code: 'PARSE_ERROR',
      message: 'Response is not JSON',
      status: response.status,
    } as ApiError;
  }

  try {
    return await response.json();
  } catch (error) {
    throw {
      ok: false,
      code: 'PARSE_ERROR',
      message: error instanceof Error ? error.message : 'Failed to parse JSON',
      status: response.status,
      details: error,
    } as ApiError;
  }
}

/**
 * Add authorization header to request config
 */
export function addAuthHeader(
  config: RequestInit,
  token: string,
  type: 'Bearer' | 'Basic' = 'Bearer'
): RequestInit {
  const headers = new Headers(config.headers);
  headers.set('Authorization', `${type} ${token}`);

  return {
    ...config,
    headers,
  };
}

/**
 * Add custom headers to request config
 */
export function addHeaders(
  config: RequestInit,
  customHeaders: Record<string, string>
): RequestInit {
  const headers = new Headers(config.headers);

  for (const [key, value] of Object.entries(customHeaders)) {
    headers.set(key, value);
  }

  return {
    ...config,
    headers,
  };
}

/**
 * Add JSON content-type header if not present
 */
export function ensureJsonContentType(config: RequestInit): RequestInit {
  const headers = new Headers(config.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return {
    ...config,
    headers,
  };
}

/**
 * Request interceptor that combines logging and common headers
 */
export function requestInterceptor(
  url: string,
  config: RequestInit,
  options?: {
    log?: boolean;
    authToken?: string;
    customHeaders?: Record<string, string>;
  }
): RequestInit {
  let processedConfig = config;

  // Add JSON content type
  processedConfig = ensureJsonContentType(processedConfig);

  // Add custom headers
  if (options?.customHeaders) {
    processedConfig = addHeaders(processedConfig, options.customHeaders);
  }

  // Add auth header
  if (options?.authToken) {
    processedConfig = addAuthHeader(processedConfig, options.authToken);
  }

  // Log request
  if (options?.log !== false) {
    logRequest(url, processedConfig);
  }

  return processedConfig;
}

/**
 * Response interceptor that combines validation and logging
 */
export async function responseInterceptor(
  url: string,
  response: Response,
  options?: {
    log?: boolean;
    validate?: boolean;
  }
): Promise<Response> {
  // Log response
  if (options?.log !== false) {
    logResponse(url, response);
  }

  // Validate response
  if (options?.validate !== false) {
    return validateResponse(response);
  }

  return response;
}

/**
 * Error interceptor that logs and optionally transforms errors
 */
export function errorInterceptor(
  url: string,
  error: ApiError,
  options?: {
    log?: boolean;
    transform?: (error: ApiError) => ApiError;
  }
): ApiError {
  // Log error
  if (options?.log !== false) {
    logError(url, error);
  }

  // Transform error if needed
  if (options?.transform) {
    return options.transform(error);
  }

  return error;
}
