/**
 * Club Analytics v2: Weekly Analytics API Route
 *
 * This Next.js API route proxies requests to the admin-api
 * for weekly club analytics data.
 */

import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const guildId = searchParams.get('guildId');
    const weekStart = searchParams.get('weekStart');
    const compute = searchParams.get('compute');

    if (!guildId) {
      return NextResponse.json(
        { error: 'Missing required parameter: guildId' },
        { status: 400 }
      );
    }

    // Build query parameters
    const params = new URLSearchParams();
    params.set('guildId', guildId);
    if (weekStart) params.set('weekStart', weekStart);
    if (compute) params.set('compute', compute);

    // Proxy request to admin-api
    const url = `${ADMIN_API_URL}/api/club-analytics/advanced/weekly?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[club-analytics/weekly] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch weekly analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guildId, weekStart } = body;

    if (!guildId) {
      return NextResponse.json(
        { error: 'Missing required field: guildId' },
        { status: 400 }
      );
    }

    // Proxy compute request to admin-api
    const url = `${ADMIN_API_URL}/api/club-analytics/advanced/compute`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, weekStart }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[club-analytics/weekly] Error in POST:', error);
    return NextResponse.json(
      {
        error: 'Failed to compute weekly analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
