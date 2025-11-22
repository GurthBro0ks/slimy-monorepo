import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

export const runtime = 'edge';

/**
 * POST /api/club/rescan
 *
 * Proxy to admin-api: POST /api/guilds/:guildId/club/rescan
 * Triggers a rescan of club metrics from the database.
 */
export async function POST(request: NextRequest) {
  try {
    // Extract guildId from query params
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');

    if (!guildId) {
      return NextResponse.json(
        {
          ok: false,
          code: 'MISSING_GUILD_ID',
          message: 'Guild ID is required',
        },
        { status: 400 }
      );
    }

    // Check if admin API is configured
    if (!adminApiClient.isConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          code: 'CONFIG_ERROR',
          message: 'Admin API not configured - use sandbox mode',
        },
        { status: 503 }
      );
    }

    // Call admin-api endpoint
    const adminPath = `/api/guilds/${encodeURIComponent(guildId)}/club/rescan`;
    console.log(`[ClubAPI] Proxying to admin-api: ${adminPath}`);

    const response = await adminApiClient.post(adminPath);

    if (!response.ok) {
      console.error(`[ClubAPI] Admin API error:`, response);
      return NextResponse.json(
        {
          ok: false,
          code: response.code || 'ADMIN_API_ERROR',
          message: response.message || 'Failed to trigger rescan',
        },
        { status: response.status || 500 }
      );
    }

    // Return the data from admin-api
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('[ClubAPI] Error in /api/club/rescan:', error);

    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
