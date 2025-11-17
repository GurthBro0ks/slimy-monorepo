import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

/**
 * GET /api/stats/summary
 *
 * Proxies to admin-api to get event counts by type
 *
 * Query params:
 *   - since: ISO date string (optional, defaults to 7 days ago)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    // Build query string for admin API
    const queryParams = new URLSearchParams();
    if (since) {
      queryParams.set('since', since);
    }

    // Call the admin-api events/summary endpoint
    const result = await adminApiClient.get(
      `/api/stats/events/summary?${queryParams.toString()}`
    );

    if (!result.ok) {
      console.error('[Stats Summary API] Admin API error:', result);
      return NextResponse.json(
        {
          success: false,
          error: result.data?.error || 'Failed to fetch stats summary'
        },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Stats Summary API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
