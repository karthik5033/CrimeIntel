import { GeminiService } from '@/lib/ai/gemini';
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
  confidence?: number;
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
        "confidence": 0.95,
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
      const schema = {
        type: 'OBJECT',
        properties: {
          intent: {
            type: 'STRING',
            enum: ['DIRECT_RETRIEVAL', 'AGGREGATE_ANALYTICAL', 'RELATIONSHIP_QUERY', 'REASONING_QUERY', 'FOLLOW_UP', 'CONVERSATIONAL']
          },
          confidence: { type: 'NUMBER' },
          entities: {
            type: 'OBJECT',
            properties: {
              district: { type: 'STRING' },
              crime_types: { type: 'ARRAY', items: { type: 'STRING' } },
              time_window: { type: 'STRING' },
              person_names: { type: 'ARRAY', items: { type: 'STRING' } },
              fir_numbers: { type: 'ARRAY', items: { type: 'STRING' } }
            }
          },
          resolvedQuery: { type: 'STRING' }
        },
        required: ['intent', 'confidence', 'entities', 'resolvedQuery']
      };

      const parsed = await GeminiService.generateJsonResponse<ParsedQuery>(prompt, schema, undefined, 'gemini-2.5-flash');
      
      // Ensure it has required fields
      if (!parsed.intent || !parsed.entities) {
        throw new Error("Invalid format returned by Gemini");
      }
      
      if (parsed.confidence === undefined) {
        parsed.confidence = 1.0;
      }

      return parsed;
    } catch (error) {
      console.error("IntentClassifier Gemini Error:", error);
      // Fallback basic heuristic parsing
      return this.basicHeuristicClassification(query, context);
    }
  }

  private static basicHeuristicClassification(query: string, context: ChatContext): ParsedQuery {
    const lowerQuery = query.toLowerCase();
    
    let intent: QueryIntent = 'CONVERSATIONAL'; // Default to conversational for unrecognized gibberish
    let confidence = 0.5; // Default low confidence for heuristics

    if (/\b(how many|trend|compare|hotspots?|most|highest|top|areas?|which areas?)\b/.test(lowerQuery)) {
      intent = 'AGGREGATE_ANALYTICAL';
      confidence = 0.8;
    } else if (/\b(connect|link|relation|network)\b/.test(lowerQuery)) {
      intent = 'RELATIONSHIP_QUERY';
      confidence = 0.8;
    } else if (/\b(why|explain|reason)\b/.test(lowerQuery)) {
      intent = 'REASONING_QUERY';
      confidence = 0.8;
    } else if (/\b(what about|he|she|they)\b/.test(lowerQuery)) {
      intent = 'FOLLOW_UP';
      confidence = 0.7;
    } else if (/\b(show|find|list|get|search|cases?|firs?|incidents?|records?|suspects?)\b/.test(lowerQuery)) {
      intent = 'DIRECT_RETRIEVAL';
      confidence = 0.8;
    }

    // Basic entity extraction (very naive fallback)
    const entities: any = {};
    if (lowerQuery.includes('bengaluru') || lowerQuery.includes('bangalore') || lowerQuery.includes('banglore')) entities.district = 'Bengaluru';
    if (lowerQuery.includes('mysuru') || lowerQuery.includes('mysore')) entities.district = 'Mysuru';
    
    const CRIME_TYPE_MAPPINGS: Record<string, string[]> = {
      'Theft': ['theft', 'steal', 'stolen', 'kalla', 'kallathana', 'thefit'],
      'Murder': ['murder', 'kill', 'homicide', 'kolle'],
      'Robbery': ['robbery', 'robery', 'robbed', 'dacoity'], 
      'Burglary': ['burglary', 'burglar', 'break in', 'broke in'],
      'Assault': ['assault', 'attack', 'beat', 'halli'],
      'Online Fraud': ['fraud', 'scam', 'cheat', 'fake', 'online', 'mosha'],
      'Sexual Harassment': ['harass', 'molest'],
      'Rape': ['rape', 'sexual'],
      'Hit and Run': ['hit and run', 'accident'],
      'Cheating': ['cheat', 'deceive', 'mosa'],
      'Cyber Stalking': ['cyber', 'stalk']
    };

    entities.crime_types = entities.crime_types || [];
    for (const [type, keywords] of Object.entries(CRIME_TYPE_MAPPINGS)) {
      if (keywords.some(k => lowerQuery.includes(k))) {
        if (!entities.crime_types.includes(type)) {
          entities.crime_types.push(type);
        }
        if (intent === 'CONVERSATIONAL') {
          intent = 'DIRECT_RETRIEVAL';
          confidence = 0.7;
        }
      }
    }
    
    if (entities.crime_types.length === 0) {
      delete entities.crime_types;
    }
    // Extract FIR numbers (e.g., "fir 13", "fir no 2001", "fir-13")
    const firMatch = lowerQuery.match(/fir\s*(?:no)?\s*[-#:]?\s*(\d+)/i);
    if (firMatch) {
      entities.fir_numbers = [firMatch[1]];
      intent = 'DIRECT_RETRIEVAL';
    }

    // Extract potential names (capitalized words not at start of string)
    const nameMatches = query.match(/(?<!^)\b[A-Z][a-z]+\b/g);
    if (nameMatches && nameMatches.length > 0) {
      entities.person_names = nameMatches;
      // If we found a name but intent is DIRECT_RETRIEVAL, it might be a reasoning/relationship query
      if (intent === 'DIRECT_RETRIEVAL' && /\b(who|suspect|victim|person)\b/.test(lowerQuery)) {
        intent = 'REASONING_QUERY';
      }
    }

    return {
      intent,
      confidence,
      entities,
      resolvedQuery: query
    };
  }
}
