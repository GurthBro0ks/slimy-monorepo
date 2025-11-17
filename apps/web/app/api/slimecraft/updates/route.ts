import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

/**
 * POST /api/slimecraft/updates
 *
 * Create a new Slime.craft server update.
 * Proxies to admin-api. Requires authentication and club/admin role.
 *
 * Request body:
 *   - type: string (optional, default: "info") - Type of update
 *   - title: string (optional) - Update title
 *   - body: string (required) - Main content
 *   - pinned: boolean (optional, default: false) - Whether to pin the update
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await adminApiClient.post('/api/slimecraft/updates', body);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Slimecraft Updates API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
