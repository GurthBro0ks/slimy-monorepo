import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    const { guildId } = params;

    if (!guildId) {
      return NextResponse.json(
        { error: 'Guild ID is required' },
        { status: 400 }
      );
    }

    // Proxy request to admin-api
    const response = await fetch(`${ADMIN_API_URL}/api/seasons/current?guildId=${guildId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth headers if present
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization') || '',
        }),
        ...(request.headers.get('cookie') && {
          'cookie': request.headers.get('cookie') || '',
        }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch current season' }));
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch current season:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
