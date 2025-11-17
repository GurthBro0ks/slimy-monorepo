import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

/**
 * PATCH /api/slimecraft/updates/:id
 *
 * Update an existing Slime.craft server update.
 * Proxies to admin-api. Requires authentication and club/admin role.
 *
 * Request body (all optional):
 *   - type: string - Type of update
 *   - title: string - Update title
 *   - body: string - Main content
 *   - pinned: boolean - Whether to pin the update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = await adminApiClient.patch(`/api/slimecraft/updates/${id}`, body);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Slimecraft Updates API] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/slimecraft/updates/:id
 *
 * Delete a Slime.craft server update.
 * Proxies to admin-api. Requires authentication and admin role.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await adminApiClient.delete(`/api/slimecraft/updates/${id}`);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Slimecraft Updates API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
