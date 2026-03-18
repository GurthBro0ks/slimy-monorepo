import { gateway, connectGateway } from '../../../../src/lib/gateway';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Ensure gateway is connected
  if (!gateway.isConnected()) {
    try {
      await connectGateway();
    } catch (error) {
      return new Response('Gateway not available', { status: 503 });
    }
  }

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"status":"connected"}\n\n'));

      // Send data every 5 seconds
      intervalId = setInterval(async () => {
        try {
          const [sessions, presence] = await Promise.all([
            gateway.call('sessions.list', {}),
            gateway.call('system-presence', {}),
          ]);

          // Construct a clear payload with explicit type
          const payload = {
            type: 'state-update',
            timestamp: Date.now(),
            sessions: sessions || [],
            presence,
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch (error) {
          console.error('[Office Stream] Error:', error);
          const errorPayload = {
            type: 'error',
            message: (error as Error).message
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorPayload)}\n\n`));
        }
      }, 5000);
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
