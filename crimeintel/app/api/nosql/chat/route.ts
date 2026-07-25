import { NextResponse } from 'next/server';
import { CatalystNoSQL } from '@/lib/catalyst/nosql';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, sessionData } = body;
    
    if (!sessionId || !sessionData) {
      return NextResponse.json({ error: "Missing sessionId or sessionData" }, { status: 400 });
    }

    const success = await CatalystNoSQL.saveChatSession(sessionId, sessionData);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to save to Catalyst NoSQL" }, { status: 500 });
    }
  } catch (error) {
    console.error("NoSQL Chat API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
