import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

/**
 * GET /api/slimecraft/updates/pinned
 *
 * Retrieve pinned Slime.craft server updates.
 * Proxies to admin-api.
 */
export async function GET(request: NextRequest) {
  try {
    const result = await adminApiClient.get('/api/slimecraft/updates/pinned');

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Slimecraft Updates API] GET /pinned error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
