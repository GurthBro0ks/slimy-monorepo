/**
 * Club Analytics API Route - Latest Snapshot
 *
 * Initial scaffolding for Club Analytics v1 - proxies requests to admin-api
 * to fetch the latest club power snapshot for a guild.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');

    if (!guildId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'missing_guild_id',
          message: 'guildId query parameter is required'
        },
        { status: 400 }
      );
    }

    // Proxy to admin-api
    const result = await adminApiClient.get(`/api/club-analytics/latest?guildId=${encodeURIComponent(guildId)}`);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Club Analytics API] GET latest error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'internal_error',
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
