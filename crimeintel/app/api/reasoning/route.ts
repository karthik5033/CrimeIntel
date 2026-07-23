import { NextResponse } from 'next/server';
import { ReasoningEngine } from '@/lib/reasoning/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Process the query through our Theory-Driven Reasoning Engine
    const reasoningOutput = await ReasoningEngine.processQuery(query);

    return NextResponse.json(reasoningOutput);
  } catch (error) {
    console.error("Reasoning API Error:", error);
    return NextResponse.json({ error: "Failed to process reasoning query" }, { status: 500 });
  }
}
