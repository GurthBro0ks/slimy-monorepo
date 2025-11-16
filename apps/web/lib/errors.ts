/**
 * Centralized Error Handling
 *
 * This file provides custom error classes and utilities for consistent
 * error handling throughout the application.
 */

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      ok: false,
      code: this.code,
      message: this.message,
      status: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: unknown) {
    super(message, 'UNAUTHORIZED', 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: unknown) {
    super(message, 'FORBIDDEN', 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, details?: unknown) {
    super(`${resource} not found`, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number,
    details?: unknown
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
    this.name = 'RateLimitError';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * External Service Error (502)
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service unavailable',
    details?: unknown
  ) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, details);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: unknown) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Configuration Error (500)
 */
export class ConfigurationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Type guard to check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: unknown): AppError {
  // Already an AppError
  if (isAppError(error)) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    return new AppError(
      error.message,
      'INTERNAL_ERROR',
      500,
      { originalError: error.name }
    );
  }

  // Unknown error
  return new AppError(
    'An unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    { error: String(error) }
  );
}

/**
 * Error logger
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  const appError = toAppError(error);

  console.error('Error occurred:', {
    name: appError.name,
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    details: appError.details,
    stack: appError.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Error response helper for API routes
 */
export function errorResponse(error: unknown, context?: Record<string, unknown>) {
  const appError = toAppError(error);

  // Log the error
  logError(appError, context);

  // Return appropriate response
  return {
    body: appError.toJSON(),
    status: appError.statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Async error handler wrapper for API routes
 */
export function asyncHandler<T>(
  handler: (...args: T[]) => Promise<Response>
) {
  return async (...args: T[]): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      const { body, status, headers } = errorResponse(error);
      return Response.json(body, { status, headers });
    }
  };
}

/**
 * Error boundary for React components
 */
export class ErrorBoundary extends Error {
  constructor(
    message: string,
    public componentStack?: string
  ) {
    super(message);
    this.name = 'ErrorBoundary';
  }
}

/**
 * Error codes enum for type safety
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_FAILED = 'QUERY_FAILED',

  // Configuration
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  MISSING_ENV_VAR = 'MISSING_ENV_VAR',

  // Generic
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Helper to create error with specific code
 */
export function createError(
  code: ErrorCode,
  message: string,
  statusCode: number = 500,
  details?: unknown
): AppError {
  return new AppError(message, code, statusCode, details);
}
