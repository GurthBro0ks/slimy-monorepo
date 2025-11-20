/**
 * Structured error codes for API responses
 * Enables consistent error handling across the application
 */

import type { ApiError } from './types.js';

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  ABORT_ERROR = 'ABORT_ERROR',

  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',

  // Server errors (5xx)
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // Configuration
  CONFIG_ERROR = 'CONFIG_ERROR',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Map HTTP status codes to error codes
 */
export function statusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 408:
      return ErrorCode.TIMEOUT_ERROR;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.RATE_LIMIT_ERROR;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      if (status >= 500) {
        return ErrorCode.UPSTREAM_ERROR;
      }
      if (status >= 400) {
        return ErrorCode.BAD_REQUEST;
      }
      return ErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * Check if an error should trigger a retry attempt
 * @param error - The error to check
 * @returns true if the error is retryable
 */
export function isRetryableError(error: ApiError): boolean {
  // Network errors are retryable
  const retryableCodes = [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT_ERROR,
  ];

  // Certain HTTP status codes are retryable
  const retryableStatuses = [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ];

  return (
    retryableCodes.includes(error.code as ErrorCode) ||
    (error.status !== undefined && retryableStatuses.includes(error.status))
  );
}

/**
 * Create an ApiError from a thrown error
 * @param error - The error to convert
 * @param status - Optional HTTP status code
 * @returns Structured ApiError
 */
export function toApiError(error: unknown, status?: number): ApiError {
  if (error instanceof Error) {
    // Handle AbortError (from AbortController)
    if (error.name === 'AbortError') {
      return {
        ok: false,
        code: ErrorCode.ABORT_ERROR,
        message: 'Request was aborted',
        status: 499, // Non-standard: Client Closed Request
      };
    }

    // Handle TimeoutError
    if (error.name === 'TimeoutError') {
      return {
        ok: false,
        code: ErrorCode.TIMEOUT_ERROR,
        message: 'Request timed out',
        status: 408,
      };
    }

    // Generic network error
    return {
      ok: false,
      code: ErrorCode.NETWORK_ERROR,
      message: error.message || 'Network request failed',
      status,
      details: {
        name: error.name,
        message: error.message,
      },
    };
  }

  // Unknown error type
  return {
    ok: false,
    code: ErrorCode.UNKNOWN_ERROR,
    message: 'An unknown error occurred',
    status,
    details: error,
  };
}

/**
 * Create an ApiError from an HTTP error response
 * @param response - The HTTP response
 * @returns Structured ApiError
 */
export async function responseToApiError(response: Response): Promise<ApiError> {
  let errorData: unknown;
  let errorMessage = `Request failed with status ${response.status}`;

  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      errorData = await response.json();
      if (errorData && typeof errorData === 'object') {
        const data = errorData as Record<string, unknown>;
        errorMessage = (data.message as string) || errorMessage;
      }
    } else {
      const text = await response.text();
      if (text) {
        errorMessage = text;
        errorData = { text };
      }
    }
  } catch (parseError) {
    // Failed to parse error response, use default message
    errorData = { parseError: String(parseError) };
  }

  const code =
    (errorData && typeof errorData === 'object' && 'code' in errorData && typeof errorData.code === 'string')
      ? errorData.code
      : statusToErrorCode(response.status);

  return {
    ok: false,
    code,
    message: errorMessage,
    status: response.status,
    details: errorData,
  };
}
