import { CatalystSignals } from '@/lib/catalyst/signals';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Catalyst Signals stream established.' })}\n\n`));

      const unsubscribe = CatalystSignals.subscribe((payload) => {
        try {
          const ssePayload = {
            id: `evt_${crypto.randomUUID()}`,
            type: payload.eventName,
            ...payload.data,
            timestamp: payload.timestamp || new Date().toISOString()
          };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(ssePayload)}\n\n`));
        } catch (e) {
          console.error("Error sending SSE event", e);
        }
      });

      request.signal.addEventListener('abort', () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, { headers });
}
