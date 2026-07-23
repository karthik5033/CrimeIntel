import { CatalystSignals } from '@/lib/catalyst/signals';

export const runtime = 'nodejs';

const eventTypes = ['FIR_CREATED', 'ALERT_TRIGGERED', 'SUSPECT_SPOTTED', 'CASE_CLOSED'];
const locations = ['Bengaluru Urban', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi'];

function generateRandomEvent() {
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)] as any;
  const location = locations[Math.floor(Math.random() * locations.length)];
  const id = crypto.randomUUID();

  let message = '';
  switch (type) {
    case 'FIR_CREATED':
      message = `New Vehicle Theft FIR registered in ${location}`;
      break;
    case 'ALERT_TRIGGERED':
      message = `High anomaly score detected for Property Crime in ${location}`;
      break;
    case 'SUSPECT_SPOTTED':
      message = `ANPR match for flagged vehicle near ${location} checkpoint`;
      break;
    case 'CASE_CLOSED':
      message = `Case ${id.toUpperCase()} successfully closed in ${location}`;
      break;
  }

  const eventPayload = {
    id: `evt_${id}`,
    type,
    location,
    message,
    timestamp: new Date().toISOString()
  };

  // Publish to Catalyst Signals
  CatalystSignals.publishEvent({
    eventName: type,
    data: eventPayload
  });

  return eventPayload;
}

export async function GET(request: Request) {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Catalyst Signals stream established.' })}\n\n`));

      const interval = setInterval(() => {
        try {
          const event = generateRandomEvent();
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch (e) {
          clearInterval(interval);
        }
      }, 15000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, { headers });
}
