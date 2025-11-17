/**
 * Stats API - Refactored to use Gateway Pattern
 *
 * This route demonstrates how the API Gateway simplifies proxy routes:
 * - Uses adminApiClient directly with standardized error handling
 * - Leverages built-in retry logic for 5xx errors
 * - Consistent response format
 * - Reduced boilerplate
 *
 * For new routes, consider using /api/gateway/* directly instead of creating
 * dedicated proxy routes like this one.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

export const dynamic = 'force-dynamic';

/**
 * Standardized error response helper
 */
function createErrorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message, status, details },
    },
    { status }
  );
}

/**
 * Standardized success response helper
 */
function createSuccessResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    { status }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pathname = new URL(request.url).pathname;

    // Handle Server-Sent Events stream (special case, can't use standard gateway)
    if (pathname.endsWith('/events/stream')) {
      try {
        const streamResponse = await adminApiClient.stream('/api/stats/events/stream');

        if (!streamResponse.ok) {
          return new Response('Failed to connect to stats stream', {
            status: streamResponse.status || 500,
          });
        }

        // Return the stream directly
        return new Response(streamResponse.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error) {
        console.error('[Stats API] Stream error:', error);
        return createErrorResponse(
          'STREAM_ERROR',
          'Failed to connect to stats stream',
          500,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Standard GET - use adminApiClient with retry enabled
    const queryParams = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      queryParams.set(key, value);
    }

    const result = await adminApiClient.get(`/api/stats?${queryParams.toString()}`, {
      retryOn5xx: true, // Enable automatic retry for 5xx errors
      maxRetries: 2,
    });

    if (!result.ok) {
      return createErrorResponse(
        result.code,
        result.message,
        result.status || 500,
        result.details
      );
    }

    return createSuccessResponse(result.data);
  } catch (error) {
    console.error('[Stats API] GET error:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Internal server error',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await adminApiClient.post('/api/stats', body, {
      retryOn5xx: true,
      maxRetries: 2,
    });

    if (!result.ok) {
      return createErrorResponse(
        result.code,
        result.message,
        result.status || 500,
        result.details
      );
    }

    return createSuccessResponse(result.data);
  } catch (error) {
    console.error('[Stats API] POST error:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Internal server error',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await adminApiClient.put('/api/stats', body, {
      retryOn5xx: true,
      maxRetries: 2,
    });

    if (!result.ok) {
      return createErrorResponse(
        result.code,
        result.message,
        result.status || 500,
        result.details
      );
    }

    return createSuccessResponse(result.data);
  } catch (error) {
    console.error('[Stats API] PUT error:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Internal server error',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
