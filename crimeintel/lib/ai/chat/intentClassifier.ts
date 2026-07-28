import { CatalystQuickML } from '@/lib/catalyst/quickml';
import { ChatContext } from './contextManager';

export type QueryIntent = 
  | 'DIRECT_RETRIEVAL'
  | 'AGGREGATE_ANALYTICAL'
  | 'RELATIONSHIP_QUERY'
  | 'REASONING_QUERY'
  | 'FOLLOW_UP'
  | 'CONVERSATIONAL';

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
      - CONVERSATIONAL: General chat, greetings, or non-investigative queries (e.g. "hello", "testing", "who are you?")
      
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
      
      // Fallback basic heuristic parsing
      return this.basicHeuristicClassification(query, context);
    }
  }

  private static basicHeuristicClassification(query: string, context: ChatContext): ParsedQuery {
    const lowerQuery = query.toLowerCase();
    
    let intent: QueryIntent = 'DIRECT_RETRIEVAL';
    if (/\b(how many|trend|compare|hotspots?|most|highest|top|areas?|which areas?)\b/.test(lowerQuery)) {
      intent = 'AGGREGATE_ANALYTICAL';
    } else if (/\b(connect|link|relation)\b/.test(lowerQuery)) {
      intent = 'RELATIONSHIP_QUERY';
    } else if (/\b(why|explain)\b/.test(lowerQuery)) {
      intent = 'REASONING_QUERY';
    } else if (/\b(what about|he|she|they)\b/.test(lowerQuery)) {
      intent = 'FOLLOW_UP';
    } else if (/\b(hello|hi|hey|test|mike|who are you)\b/.test(lowerQuery)) {
      intent = 'CONVERSATIONAL';
    }

    // Basic entity extraction (very naive fallback)
    const entities: any = {};
    if (lowerQuery.includes('bengaluru') || lowerQuery.includes('bangalore') || lowerQuery.includes('banglore')) entities.district = 'Bengaluru';
    if (lowerQuery.includes('mysuru') || lowerQuery.includes('mysore')) entities.district = 'Mysuru';
    
    const CRIME_TYPE_MAPPINGS: Record<string, string[]> = {
      'Theft': ['theft', 'steal', 'stolen'],
      'Murder': ['murder', 'kill', 'homicide'],
      'Robbery': ['robbery', 'robery', 'robbed'], // Covers the 'robery' typo
      'Burglary': ['burglary', 'burglar', 'break in', 'broke in'],
      'Assault': ['assault', 'attack', 'beat'],
      'Online Fraud': ['fraud', 'scam', 'cheat', 'fake', 'online'],
      'Sexual Harassment': ['harass', 'molest'],
      'Rape': ['rape', 'sexual'],
      'Hit and Run': ['hit and run', 'accident'],
      'Cheating': ['cheat', 'deceive'],
      'Cyber Stalking': ['cyber', 'stalk']
    };

    for (const [type, keywords] of Object.entries(CRIME_TYPE_MAPPINGS)) {
      if (keywords.some(k => lowerQuery.includes(k))) {
        entities.crime_types = [type];
        break;
      }
    }
    // Extract FIR numbers (e.g., "fir 13", "fir no 2001", "fir-13")
    const firMatch = lowerQuery.match(/fir\s*(?:no)?\s*[-#:]?\s*(\d+)/i);
    if (firMatch) {
      entities.fir_numbers = [firMatch[1]];
    }

    return {
      intent,
      entities,
      resolvedQuery: query
    };
  }
}
