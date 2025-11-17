import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

/**
 * GET /api/slimecraft/status-history/recent?limit=100
 *
 * Proxies to admin-api to fetch recent Slimecraft server status pings.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';

    const result = await adminApiClient.get(
      `/api/slimecraft/status-history/recent?limit=${limit}`
    );

    if (!result.ok) {
      return NextResponse.json(
        result,
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Slimecraft Status History API] GET error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
