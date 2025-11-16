import { adminApiClient } from '@/lib/api/admin-client';

export async function GET() {
  try {
    const response = await adminApiClient.stream('/api/stats/events/stream');

    if (!response.ok) {
      return new Response('Failed to connect to stats stream', { status: response.status });
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Stats Stream API] Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
