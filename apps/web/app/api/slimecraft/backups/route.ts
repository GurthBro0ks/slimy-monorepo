import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

/**
 * GET /api/slimecraft/backups?limit=50
 *
 * Proxies to admin-api to fetch recent Slimecraft backup log entries.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';

    const result = await adminApiClient.get(
      `/api/slimecraft/backups?limit=${limit}`
    );

    if (!result.ok) {
      return NextResponse.json(
        result,
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Slimecraft Backups API] GET error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/slimecraft/backups
 *
 * Proxies to admin-api to create a new backup log entry.
 * Body: { label?, sizeMb?, notes?, triggeredBy? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await adminApiClient.post('/api/slimecraft/backups', body);

    if (!result.ok) {
      return NextResponse.json(
        result,
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Slimecraft Backups API] POST error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
