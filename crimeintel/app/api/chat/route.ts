import { NextResponse } from 'next/server';
import { translateText } from '@/lib/nlp/translate';
import { ContextManager } from '@/lib/ai/chat/contextManager';
import { IntentClassifier } from '@/lib/ai/chat/intentClassifier';
import { Coordinator } from '@/lib/ai/agents/coordinator';
import { GeminiService } from '@/lib/ai/gemini';
import { ReasoningEngine } from '@/lib/reasoning/engine';

export async function POST(request: Request) {
  try {
    const { message, language, sessionId } = await request.json();
    let query = message.trim();

    if (!query) {
      return NextResponse.json({ error: "Empty query" }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // 1. Translate from Kannada to English if necessary
    if (language === 'kn') {
      query = await translateText(query, 'kn', 'en');
    }

    // 2. Fetch or initialize Semantic Memory for this session
    const session = await ContextManager.getSession(sessionId);

    // 3. Classify intent and extract entities using QuickML
    const parsedQuery = await IntentClassifier.classify(query, session.context);
    
    // Update Context with newly extracted entities
    const mappedEntities: any = {};
    if (parsedQuery.entities?.district) mappedEntities.active_district = parsedQuery.entities.district;
    if (parsedQuery.entities?.crime_types) mappedEntities.active_crime_types = parsedQuery.entities.crime_types;
    if (parsedQuery.entities?.time_window) mappedEntities.active_time_window = parsedQuery.entities.time_window;
    if (parsedQuery.entities?.person_names) mappedEntities.active_entities = parsedQuery.entities.person_names;
    
    const updatedContext = ContextManager.updateContext(session.context, mappedEntities);
    updatedContext.last_query = parsedQuery.resolvedQuery;
    session.context = updatedContext;

    // 4. Dispatch to Coordinator for Multi-Agent Retrieval
    const evidence = await Coordinator.gatherEvidence(parsedQuery);
    
    // If no evidence found, return early (unless it's a conversational intent)
    if (evidence.length === 0 && parsedQuery.intent !== 'CONVERSATIONAL') {
      let failSummary = "I've searched the database but couldn't find specific intelligence matching your query. Try adjusting your search criteria.";
      if (language === 'kn') {
        failSummary = await translateText(failSummary, 'en', 'kn');
      }
      return NextResponse.json({ text_summary: failSummary });
    }

    // 5. Final LLM Response Composition
    const systemPrompt = `You are an AI intelligence assistant for Karnataka State Police CrimeIntel system.
Your role:
- Analyze FIR data from Karnataka State Police databases
- Identify crime patterns, suspect connections, and investigative leads
- Summarize complex intelligence data in clear, actionable insights
- Apply criminological frameworks when relevant
Guidelines:
- Be concise but thorough
- Highlight key FIR numbers, suspect names, and location patterns
- When data is incomplete, state confidence level and what's missing
- Use professional law enforcement terminology`;

    const userPrompt = `Query: ${parsedQuery.resolvedQuery}\n\nContext:\n${JSON.stringify({ 
      ragContext: evidence, 
      intent: parsedQuery.intent 
    }).substring(0, 8000)} // truncate to prevent context overflow if too large`;

    let finalResponse = null;
    try {
      finalResponse = await GeminiService.generateResponse(userPrompt, systemPrompt, 'gemini-2.5-flash');
    } catch (e) {
      console.warn("Gemini final response generation failed:", e);
    }

    if (finalResponse) {
      finalResponse = "*(Intelligence retrieved via Pre-computational RAG and Graph RAG)*\n\n" + finalResponse;
    }

    // 5.1 Trigger Reasoning Engine for analytical traces
    let reasoningBlockOutput = null;
    try {
      reasoningBlockOutput = await ReasoningEngine.processQuery(parsedQuery.resolvedQuery, evidence);
    } catch (e) {
      console.warn("Reasoning Engine failed to process query:", e);
    }
    // Fallback if Gemini is unavailable
    if (!finalResponse) {
      finalResponse = "I retrieved the relevant data but the generative model is currently unavailable to summarize it.";
    }

    // 6. Translate response back to Kannada if necessary
    if (language === 'kn') {
      finalResponse = await translateText(finalResponse, 'en', 'kn');
    }

    // 7. Save updated context to NoSQL
    await ContextManager.saveSession(session);

    // Flatten evidence for data tables if needed (exclude VectorAgent as it's rendered by SemanticSearchWidget)
    let dataTable: any[] = [];
    evidence.forEach(e => {
      if (e.source !== 'VectorAgent' && Array.isArray(e.data)) {
        dataTable = dataTable.concat(e.data);
      }
    });

    return NextResponse.json({
      text_summary: finalResponse,
      data_table: dataTable.length > 0 ? dataTable : undefined,
      rag_context: evidence,
      reasoning_block: reasoningBlockOutput,
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to process query", details: error.message, stack: error.stack }, { status: 500 });
  }
}
