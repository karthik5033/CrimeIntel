import { NextResponse } from 'next/server';
import { translateText } from '@/lib/nlp/translate';
import { ContextManager } from '@/lib/ai/chat/contextManager';
import { IntentClassifier } from '@/lib/ai/chat/intentClassifier';
import { Coordinator } from '@/lib/ai/agents/coordinator';
import { CatalystQuickML } from '@/lib/catalyst/quickml';

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
    let quickMLResponse = await CatalystQuickML.generateResponse(parsedQuery.resolvedQuery, { 
      ragContext: evidence, 
      intent: parsedQuery.intent 
    });

    // Fallback if QuickML is unavailable
    if (!quickMLResponse) {
      quickMLResponse = "I retrieved the relevant data but the generative model is currently unavailable to summarize it.";
    }

    // 6. Translate response back to Kannada if necessary
    if (language === 'kn') {
      quickMLResponse = await translateText(quickMLResponse, 'en', 'kn');
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
      text_summary: quickMLResponse,
      data_table: dataTable.length > 0 ? dataTable : undefined,
      rag_context: evidence,
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}
