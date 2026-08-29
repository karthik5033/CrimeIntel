import { GeminiService } from '@/lib/ai/gemini';
import { ChatContext } from './contextManager';

export type QueryIntent = 
  | 'DIRECT_RETRIEVAL'
  | 'AGGREGATE_ANALYTICAL'
  | 'RELATIONSHIP_QUERY'
  | 'REASONING_QUERY'
  | 'STATISTICAL_ANALYSIS'
  | 'PREDICTIVE_ANALYSIS'
  | 'GENERATE_REPORT'
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

function normalizeDistrict(rawDistrict: string): string {
  if (!rawDistrict) return rawDistrict;
  const lower = rawDistrict.toLowerCase().trim();
  
  if (lower.includes('bangalore') || lower.includes('banglore') || lower.includes('bengaluru')) return 'Bengaluru Urban';
  if (lower.includes('mysore') || lower.includes('mysuru')) return 'Mysuru';
  if (lower.includes('mangalore') || lower.includes('mangaluru') || lower.includes('dakshina')) return 'Dakshina Kannada';
  if (lower.includes('hubli') || lower.includes('dharwad') || lower.includes('hubballi')) return 'Dharwad';
  if (lower.includes('belgaum') || lower.includes('belagavi') || lower.includes('belgavi')) return 'Belagavi';
  if (lower.includes('gulbarga') || lower.includes('kalaburagi')) return 'Kalaburagi';
  if (lower.includes('bellary') || lower.includes('ballari')) return 'Ballari';
  if (lower.includes('mandya')) return 'Mandya';
  
  return rawDistrict.charAt(0).toUpperCase() + rawDistrict.slice(1);
}

function normalizeCrimeType(rawType: string): string {
  if (!rawType) return rawType;
  const lower = rawType.toLowerCase().trim();
  
  if (lower.includes('attempt to murder') || lower.includes('attempted murder')) return 'Attempt to Murder';
  if (lower.includes('murder') || lower.includes('homicide') || lower.includes('kill')) return 'Murder';
  if (lower.includes('theft') || lower.includes('steal') || lower.includes('stolen')) return 'Theft';
  if (lower.includes('robbery') || lower.includes('robbed') || lower.includes('dacoity')) return 'Robbery';
  if (lower.includes('burglary') || lower.includes('break in')) return 'Burglary';
  if (lower.includes('assault') || lower.includes('attack') || lower.includes('beat')) return 'Assault';
  if (lower.includes('fraud') || lower.includes('scam') || lower.includes('cheat')) return 'Online Fraud';
  if (lower.includes('harass') || lower.includes('molest')) return 'Sexual Harassment';
  if (lower.includes('rape') || lower.includes('sexual')) return 'Rape';
  if (lower.includes('hit and run') || lower.includes('accident')) return 'Hit and Run';
  if (lower.includes('cheat') || lower.includes('deceive')) return 'Cheating';
  if (lower.includes('cyber') || lower.includes('stalk')) return 'Cyber Stalking';
  
  // Title case fallback
  return rawType.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Levenshtein distance for fuzzy string matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1) // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const KNOWN_SUSPECTS = ['Manoj', 'Kavya', 'Anitha', 'Ravi', 'Raju', 'Ganesh', 'Kumar', 'Suresh', 'Manju'];

function resolveAlias(rawName: string): string {
  let bestMatch = rawName;
  let minDistance = 3; // Max threshold for typo correction
  
  for (const known of KNOWN_SUSPECTS) {
    const dist = levenshteinDistance(rawName.toLowerCase(), known.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = known;
    }
  }
  return bestMatch;
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
      - AGGREGATE_ANALYTICAL: Asking for basic trends or counts (e.g. "How many thefts last month?", "Compare hotspots")
      - STATISTICAL_ANALYSIS: Asking for detailed statistical data, distributions, or metrics (e.g. "give me statistical data", "distribution of crimes")
      - PREDICTIVE_ANALYSIS: Asking for forecasts, predictions, or future projections (e.g. "predict future crimes", "what will happen next year?")
      - GENERATE_REPORT: Asking for a full, comprehensive dossier, report, or briefing on all data (e.g. "generate a report on thefts", "brief me on murders in mysuru")
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
            enum: ['DIRECT_RETRIEVAL', 'AGGREGATE_ANALYTICAL', 'STATISTICAL_ANALYSIS', 'PREDICTIVE_ANALYSIS', 'GENERATE_REPORT', 'RELATIONSHIP_QUERY', 'REASONING_QUERY', 'FOLLOW_UP', 'CONVERSATIONAL']
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
      
      if (!parsed.resolvedQuery || parsed.resolvedQuery.toLowerCase() === 'none') {
        parsed.resolvedQuery = query;
      }
      
      const lowerQuery = query.toLowerCase();
      
      // Heuristic fallback for missing district
      if (!parsed.entities.district) {
        if (lowerQuery.includes('bengaluru') || lowerQuery.includes('bangalore') || lowerQuery.includes('banglore')) parsed.entities.district = 'Bengaluru Urban';
        else if (lowerQuery.includes('mysuru') || lowerQuery.includes('mysore')) parsed.entities.district = 'Mysuru';
        else if (lowerQuery.includes('belgavi') || lowerQuery.includes('belagavi') || lowerQuery.includes('belgaum')) parsed.entities.district = 'Belagavi';
        else if (lowerQuery.includes('mangaluru') || lowerQuery.includes('mangalore')) parsed.entities.district = 'Dakshina Kannada';
        else if (lowerQuery.includes('hubballi') || lowerQuery.includes('hubli') || lowerQuery.includes('dharwad')) parsed.entities.district = 'Dharwad';
      }
      
      if (parsed.entities && parsed.entities.district) {
        parsed.entities.district = normalizeDistrict(parsed.entities.district);
      }
      
      if (parsed.entities && parsed.entities.crime_types && parsed.entities.crime_types.length > 0) {
        parsed.entities.crime_types = parsed.entities.crime_types.map(normalizeCrimeType);
      }
      
      if (parsed.entities && parsed.entities.person_names && parsed.entities.person_names.length > 0) {
        parsed.entities.person_names = parsed.entities.person_names.map(resolveAlias);
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

    if (/\b(how many|compare|hotspots?|most|highest|top|areas?|which areas?)\b/.test(lowerQuery)) {
      intent = 'AGGREGATE_ANALYTICAL';
      confidence = 0.8;
    } else if (/\b(predict|forecast|future|prediction|expect|next)\b/.test(lowerQuery)) {
      intent = 'PREDICTIVE_ANALYSIS';
      confidence = 0.9;
    } else if (/\b(report|dossier|briefing|generate report|full report)\b/.test(lowerQuery)) {
      intent = 'GENERATE_REPORT';
      confidence = 0.95;
    } else if (/\b(statistics|stats|distribution|analyze data|statistical|metrics|variance)\b/.test(lowerQuery)) {
      intent = 'STATISTICAL_ANALYSIS';
      confidence = 0.9;
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
    if (lowerQuery.includes('bengaluru') || lowerQuery.includes('bangalore') || lowerQuery.includes('banglore')) entities.district = 'Bengaluru Urban';
    if (lowerQuery.includes('mysuru') || lowerQuery.includes('mysore')) entities.district = 'Mysuru';
    if (lowerQuery.includes('belgavi') || lowerQuery.includes('belagavi') || lowerQuery.includes('belgaum')) entities.district = 'Belagavi';
    if (lowerQuery.includes('mangaluru') || lowerQuery.includes('mangalore')) entities.district = 'Dakshina Kannada';
    if (lowerQuery.includes('hubballi') || lowerQuery.includes('hubli') || lowerQuery.includes('dharwad')) entities.district = 'Dharwad';
    
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
      entities.person_names = nameMatches.map(resolveAlias);
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
