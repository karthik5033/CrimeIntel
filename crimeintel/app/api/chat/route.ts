import { NextResponse } from 'next/server';
import { performSemanticSearch } from '@/lib/nlp/semantic-search';
import { CatalystQuickML } from '@/lib/catalyst/quickml';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const query = message.toLowerCase();

    // Perform Semantic RAG Search over records
    const searchResults = await performSemanticSearch(query, 3);
    
    // Attempt QuickML Generative Response if endpoint is active
    const quickMLResponse = await CatalystQuickML.generateResponse(message, { ragContext: searchResults });
    if (quickMLResponse) {
      return NextResponse.json({
        text_summary: quickMLResponse,
        rag_context: searchResults,
      });
    }

    // Default Fallback with RAG Semantic Search if QuickML returns nothing
    if (searchResults.length > 0) {
      return NextResponse.json({
        text_summary: "I found contextually relevant crime intelligence using semantic search, but the LLM is currently unavailable to generate a full response.",
        data_table: searchResults.map(r => ({
          'Type': r.type,
          'Title': r.title,
          'Snippet': r.snippet
        })),
        rag_context: searchResults
      });
    }

    return NextResponse.json({
      text_summary: "I've searched the database but couldn't find specific intelligence matching your query. Try asking about vehicle theft rings, cyber fraud money trails, or repeat offenders.",
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}
