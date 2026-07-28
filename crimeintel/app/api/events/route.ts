import { CatalystSignals } from '@/lib/catalyst/signals';

import { ServerDataLoader } from '@/lib/api/serverDataLoader';

export const runtime = 'nodejs';

let cachedFIRs: any[] = [];
let cachedCases: any[] = [];

async function generateRealEvent() {
  if (cachedFIRs.length === 0 || cachedCases.length === 0) {
    try {
      cachedFIRs = await ServerDataLoader.getFIRs();
      cachedCases = await ServerDataLoader.getCases();
    } catch (e) {
    }
  }

  const isCase = Math.random() > 0.7 && cachedCases.length > 0;
  
  if (isCase) {
    const randomCase = cachedCases[Math.floor(Math.random() * cachedCases.length)];
    const type = randomCase.status === 'Closed' ? 'CASE_CLOSED' : 'ALERT_TRIGGERED';
    const message = type === 'CASE_CLOSED' 
      ? `Case ${randomCase.case_no} successfully closed in ${randomCase.district_id}`
      : `Update in case ${randomCase.case_no}: status changed to ${randomCase.status}`;
      
    const eventPayload = {
      id: `evt_${randomCase.id || crypto.randomUUID()}`,
      type,
      location: randomCase.district_id || 'Unknown',
      message,
      timestamp: new Date().toISOString()
    };
    
    CatalystSignals.publishEvent({ eventName: type, data: eventPayload });
    return eventPayload;
  } else if (cachedFIRs.length > 0) {
    const randomFIR = cachedFIRs[Math.floor(Math.random() * cachedFIRs.length)];
    const isSuspect = Math.random() > 0.8;
    
    const type = isSuspect ? 'SUSPECT_SPOTTED' : 'FIR_CREATED';
    const message = isSuspect
      ? `ANPR match for flagged vehicle related to FIR ${randomFIR.fir_no} near ${randomFIR.district_id}`
      : `New ${randomFIR.crime_type_en} FIR registered in ${randomFIR.district_id}`;
      
    const eventPayload = {
      id: `evt_${randomFIR.id || crypto.randomUUID()}`,
      type,
      location: randomFIR.district_id || 'Unknown',
      message,
      timestamp: new Date().toISOString()
    };

    CatalystSignals.publishEvent({ eventName: type, data: eventPayload });
    return eventPayload;
  }

  // Fallback if db is completely empty
  return {
    id: `evt_${crypto.randomUUID()}`,
    type: 'ALERT_TRIGGERED',
    location: 'System',
    message: 'System heart beat normal',
    timestamp: new Date().toISOString()
  };
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
          generateRealEvent().then((event) => {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
          });
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
