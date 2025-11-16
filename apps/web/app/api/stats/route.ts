import { NextRequest, NextResponse } from 'next/server';
import { adminApiClient } from '@/lib/api/admin-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pathname = new URL(request.url).pathname;

    // Handle Server-Sent Events stream
    if (pathname.endsWith('/events/stream')) {
      try {
        const streamResponse = await adminApiClient.stream('/api/stats/events/stream');

        if (!streamResponse.ok) {
          return new Response('Failed to connect to stats stream', { 
            status: streamResponse.status || 500 
          });
        }

        // Return the stream directly
        return new Response(streamResponse.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error) {
        console.error('[Stats API] Stream error:', error);
        return new Response('Failed to connect to stats stream', { status: 500 });
      }
    }

    // Build query string for admin API
    const queryParams = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      queryParams.set(key, value);
    }

    const result = await adminApiClient.get(`/api/stats?${queryParams.toString()}`);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Stats API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await adminApiClient.post('/api/stats', body);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Stats API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await adminApiClient.put('/api/stats', body);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Stats API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
