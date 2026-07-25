import { CatalystQuickML } from '@/lib/catalyst/quickml';
import { ChatContext } from './contextManager';

export type QueryIntent = 
  | 'DIRECT_RETRIEVAL'
  | 'AGGREGATE_ANALYTICAL'
  | 'RELATIONSHIP_QUERY'
  | 'REASONING_QUERY'
  | 'FOLLOW_UP';

export interface ParsedQuery {
  intent: QueryIntent;
  entities: {
    district?: string;
    crime_types?: string[];
    time_window?: string;
    person_names?: string[];
    fir_numbers?: string[];
  };
  resolvedQuery: string; // The query with anaphora resolved
}

export class IntentClassifier {
  /**
   * Parses the user's natural language query into a structured format
   * using Catalyst QuickML.
   */
  static async classify(query: string, context: ChatContext): Promise<ParsedQuery> {
    const prompt = `
      You are an investigative assistant intent classifier.
      Analyze the following user query and conversation context to determine the intent and extract entities.
      
      Query: "${query}"
      
      Current Context:
      District: ${context.active_district || 'None'}
      Crime Types: ${context.active_crime_types?.join(', ') || 'None'}
      Time Window: ${context.active_time_window || 'None'}
      Entities: ${context.active_entities?.join(', ') || 'None'}
      
      Possible Intents:
      - DIRECT_RETRIEVAL: Asking for specific records (e.g. "Show me FIRs in Mysuru", "Find cases of theft")
      - AGGREGATE_ANALYTICAL: Asking for trends or counts (e.g. "How many thefts last month?", "Compare hotspots")
      - RELATIONSHIP_QUERY: Asking about connections (e.g. "How is John linked to Smith?")
      - REASONING_QUERY: Asking for analysis or explanations (e.g. "Why is this area flagged?")
      - FOLLOW_UP: A query that relies on previous context (e.g. "What about last year?", "Who is he?")
      
      Return ONLY a JSON object with this exact structure:
      {
        "intent": "...",
        "entities": {
          "district": "...",
          "crime_types": ["..."],
          "time_window": "...",
          "person_names": ["..."],
          "fir_numbers": ["..."]
        },
        "resolvedQuery": "The standalone query rewritten if it was a follow-up."
      }
    `;

    try {
      const response = await CatalystQuickML.generateResponse(prompt);
      
      if (!response) {
        throw new Error("No response from QuickML");
      }

      // Try to parse the JSON response from QuickML
      // Strip markdown code block if present
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr) as ParsedQuery;
      
      // Ensure it has required fields
      if (!parsed.intent || !parsed.entities) {
        throw new Error("Invalid format returned by QuickML");
      }

      return parsed;
    } catch (error) {
      console.warn("Intent classification failed, falling back to basic matching:", error);
      
      // Fallback basic heuristic parsing
      return this.basicHeuristicClassification(query, context);
    }
  }

  private static basicHeuristicClassification(query: string, context: ChatContext): ParsedQuery {
    const lowerQuery = query.toLowerCase();
    
    let intent: QueryIntent = 'DIRECT_RETRIEVAL';
    if (lowerQuery.includes('how many') || lowerQuery.includes('trend') || lowerQuery.includes('compare')) {
      intent = 'AGGREGATE_ANALYTICAL';
    } else if (lowerQuery.includes('connect') || lowerQuery.includes('link') || lowerQuery.includes('relation')) {
      intent = 'RELATIONSHIP_QUERY';
    } else if (lowerQuery.includes('why') || lowerQuery.includes('explain')) {
      intent = 'REASONING_QUERY';
    } else if (lowerQuery.includes('what about') || lowerQuery.includes('he') || lowerQuery.includes('she') || lowerQuery.includes('they')) {
      intent = 'FOLLOW_UP';
    }

    // Basic entity extraction (very naive fallback)
    const entities: any = {};
    if (lowerQuery.includes('bengaluru')) entities.district = 'Bengaluru';
    if (lowerQuery.includes('mysuru')) entities.district = 'Mysuru';
    
    if (lowerQuery.includes('theft') || lowerQuery.includes('steal')) entities.crime_types = ['Theft'];
    if (lowerQuery.includes('murder')) entities.crime_types = ['Murder'];

    return {
      intent,
      entities,
      resolvedQuery: query
    };
  }
}
