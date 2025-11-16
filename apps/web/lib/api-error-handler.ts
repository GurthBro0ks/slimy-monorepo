/**
 * API Error Handler Middleware
 *
 * Provides utilities for consistent error handling in Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  AppError,
  ValidationError,
  toAppError,
  logError,
  isAppError,
} from './errors';

/**
 * API Handler type
 */
type RouteContext = {
  params?: Record<string, string> | Promise<Record<string, string>> | Promise<{}>;
};

export type APIHandler = (
  request: NextRequest,
  context?: RouteContext
) => Promise<NextResponse>;

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError): ValidationError {
  const errors = error.issues.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return new ValidationError(
    'Validation failed',
    { errors }
  );
}

/**
 * Wrap an API handler with error handling
 */
export function withErrorHandler(handler: APIHandler): APIHandler {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const validationError = handleZodError(error);
        logError(validationError, {
          method: request.method,
          url: request.url,
        });

        return NextResponse.json(
          validationError.toJSON(),
          { status: validationError.statusCode }
        );
      }

      // Handle AppError
      if (isAppError(error)) {
        logError(error, {
          method: request.method,
          url: request.url,
        });

        return NextResponse.json(
          error.toJSON(),
          { status: error.statusCode }
        );
      }

      // Handle unknown errors
      const appError = toAppError(error);
      logError(appError, {
        method: request.method,
        url: request.url,
        originalError: error,
      });

      return NextResponse.json(
        appError.toJSON(),
        { status: appError.statusCode }
      );
    }
  };
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  headers?: HeadersInit
): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      data,
      status,
    },
    {
      status,
      headers,
    }
  );
}

/**
 * Error response helper
 */
export function errorResponse(
  error: unknown,
  context?: Record<string, unknown>
): NextResponse {
  const appError = toAppError(error);

  // Log the error
  logError(appError, context);

  return NextResponse.json(
    appError.toJSON(),
    { status: appError.statusCode }
  );
}

/**
 * Helper to create paginated response
 */
export interface PaginatedResponse<T> {
  ok: true;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  status: number;
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
      },
      status,
    },
    { status }
  );
}

/**
 * Helper to parse and validate request body
 */
export async function parseRequestBody<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw handleZodError(error);
    }
    throw new ValidationError('Invalid request body');
  }
}

/**
 * Helper to parse and validate query parameters
 */
export function parseQueryParams<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): T {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw handleZodError(error);
    }
    throw new ValidationError('Invalid query parameters');
  }
}

/**
 * Helper to check if request method is allowed
 */
export function checkMethod(
  request: NextRequest,
  allowedMethods: string[]
): void {
  if (!allowedMethods.includes(request.method)) {
    throw new AppError(
      `Method ${request.method} not allowed`,
      'METHOD_NOT_ALLOWED',
      405
    );
  }
}

/**
 * Create a type-safe API route handler
 */
export function createAPIRoute(handler: APIHandler): APIHandler {
  return withErrorHandler(handler);
}
