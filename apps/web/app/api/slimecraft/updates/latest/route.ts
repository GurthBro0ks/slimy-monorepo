import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

/**
 * GET /api/slimecraft/updates/latest
 *
 * Retrieve the most recent Slime.craft server updates.
 * Proxies to admin-api.
 *
 * Query parameters:
 *   - limit: number (optional, default: 10) - Maximum number of updates to return
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build query string for admin API
    const queryParams = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      queryParams.set(key, value);
    }

    const result = await adminApiClient.get(`/api/slimecraft/updates/latest?${queryParams.toString()}`);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Slimecraft Updates API] GET /latest error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
