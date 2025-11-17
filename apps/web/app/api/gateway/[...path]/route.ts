/**
 * API Gateway - Centralized proxy to admin-api
 *
 * This gateway provides:
 * - Centralized proxying to admin-api
 * - Rate limiting (configurable via env)
 * - Optional auth checks
 * - Standardized error handling
 * - Request logging
 *
 * Routes under /api/gateway/* are forwarded to admin-api.
 *
 * Example:
 * - /api/gateway/stats -> admin-api/api/stats
 * - /api/gateway/guilds/123 -> admin-api/api/guilds/123
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';
import { rateLimit } from '@/lib/rate-limiter';
import { requireAuth } from '@/lib/auth/server';
import { AuthenticationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// Rate limit configuration from environment or defaults
const RATE_LIMIT_ENABLED = process.env.GATEWAY_RATE_LIMIT_ENABLED !== 'false';
const RATE_LIMIT_MAX = parseInt(process.env.GATEWAY_RATE_LIMIT_MAX || '100', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.GATEWAY_RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute

// Auth configuration
const AUTH_REQUIRED = process.env.GATEWAY_AUTH_REQUIRED === 'true';

/**
 * Standardized error response
 */
interface ErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
  };
}

/**
 * Standardized success response
 */
interface SuccessResponse<T = unknown> {
  ok: true;
  data: T;
}

/**
 * Create a standardized error response
 */
function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        status,
        details,
      },
    },
    { status }
  );
}

/**
 * Create a standardized success response
 */
function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    { status }
  );
}

/**
 * Extract the target path from gateway request
 * /api/gateway/stats -> /api/stats
 * /api/gateway/guilds/123 -> /api/guilds/123
 */
function extractTargetPath(request: NextRequest): string {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/gateway\/(.+)/);

  if (!pathMatch) {
    return '/';
  }

  // Reconstruct the path with query params
  const targetPath = `/api/${pathMatch[1]}`;
  const queryString = url.search;

  return targetPath + queryString;
}

/**
 * Forward headers from the original request
 */
function getForwardedHeaders(request: NextRequest): HeadersInit {
  const headers: Record<string, string> = {};

  // Forward auth headers
  const authHeaders = ['x-user-id', 'x-user-role', 'x-user-roles', 'authorization'];
  for (const header of authHeaders) {
    const value = request.headers.get(header);
    if (value) {
      headers[header] = value;
    }
  }

  // Forward correlation ID if present
  const correlationId = request.headers.get('x-correlation-id');
  if (correlationId) {
    headers['x-correlation-id'] = correlationId;
  }

  // Forward content-type
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['content-type'] = contentType;
  }

  return headers;
}

/**
 * Handle all HTTP methods through the gateway
 */
async function handleGatewayRequest(
  request: NextRequest
): Promise<NextResponse> {
  const startTime = Date.now();
  const method = request.method;
  const targetPath = extractTargetPath(request);

  console.log(`[Gateway] ${method} ${request.url} -> ${targetPath}`);

  try {
    // 1. Apply rate limiting if enabled
    if (RATE_LIMIT_ENABLED) {
      const rateLimitResult = rateLimit(request, {
        limit: RATE_LIMIT_MAX,
        windowMs: RATE_LIMIT_WINDOW,
      });

      if (!rateLimitResult.allowed) {
        console.warn(`[Gateway] Rate limit exceeded for ${request.headers.get('x-forwarded-for') || 'unknown'}`);

        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
              status: 429,
              details: {
                limit: rateLimitResult.limit,
                resetTime: rateLimitResult.resetTime,
              },
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            },
          }
        );
      }

      // Add rate limit headers to response
      request.headers.set('x-ratelimit-limit', rateLimitResult.limit.toString());
      request.headers.set('x-ratelimit-remaining', rateLimitResult.remaining.toString());
      request.headers.set('x-ratelimit-reset', new Date(rateLimitResult.resetTime).toISOString());
    }

    // 2. Optional auth check
    if (AUTH_REQUIRED) {
      try {
        await requireAuth(request);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
        }
        throw error;
      }
    }

    // 3. Extract request body if present
    let body: unknown = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          body = await request.json();
        } catch (e) {
          return createErrorResponse(
            'INVALID_JSON',
            'Invalid JSON in request body',
            400,
            e instanceof Error ? e.message : String(e)
          );
        }
      }
    }

    // 4. Forward to admin-api with retry enabled for 5xx errors
    const forwardedHeaders = getForwardedHeaders(request);

    const result = await adminApiClient.request(targetPath, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: forwardedHeaders,
      retryOn5xx: true, // Enable automatic retry for server errors
      maxRetries: 2,
    });

    // 5. Handle response
    if (!result.ok) {
      const processingTime = Date.now() - startTime;
      console.error(`[Gateway] Error: ${result.code} - ${result.message} (${processingTime}ms)`);

      return NextResponse.json(
        {
          ok: false,
          error: {
            code: result.code,
            message: result.message,
            status: result.status || 500,
            details: result.details,
          },
        },
        {
          status: result.status || 500,
          headers: {
            'X-Processing-Time': `${processingTime}ms`,
          },
        }
      );
    }

    // Success!
    const processingTime = Date.now() - startTime;
    console.log(`[Gateway] Success: ${method} ${targetPath} (${processingTime}ms)`);

    const headers: Record<string, string> = {
      'X-Processing-Time': `${processingTime}ms`,
    };

    // Add rate limit headers if enabled
    if (RATE_LIMIT_ENABLED) {
      headers['X-RateLimit-Limit'] = request.headers.get('x-ratelimit-limit') || '';
      headers['X-RateLimit-Remaining'] = request.headers.get('x-ratelimit-remaining') || '';
      headers['X-RateLimit-Reset'] = request.headers.get('x-ratelimit-reset') || '';
    }

    return NextResponse.json(
      {
        ok: true,
        data: result.data,
      },
      {
        status: result.status || 200,
        headers,
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[Gateway] Unexpected error:`, error);

    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      500,
      {
        message: error instanceof Error ? error.message : String(error),
        processingTime: `${processingTime}ms`,
      }
    );
  }
}

// Export handlers for all HTTP methods
export async function GET(request: NextRequest) {
  return handleGatewayRequest(request);
}

export async function POST(request: NextRequest) {
  return handleGatewayRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleGatewayRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleGatewayRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleGatewayRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID, X-User-Role',
      'Access-Control-Max-Age': '86400',
    },
  });
}
