import { getCatalystApp } from './index';
import { getSharedAccessToken } from './auth';

/**
 * Catalyst QuickML Client
 * Executes ML pipelines for inference and embedding tasks using the published endpoint key.
 */

/**
 * Summarize RAG context to prevent token overflow
 * Caps records at 15 and extracts only key fields
 */
function summarizeRagContext(contextData: any, maxRecords: number = 15): string {
  const ragContext = contextData?.ragContext || [];
  let summary = '';
  let recordCount = 0;
  
  for (const source of ragContext) {
    if (!source.data || !Array.isArray(source.data)) continue;
    
    for (const item of source.data) {
      if (recordCount >= maxRecords) break;
      
      // Extract only key fields
      const essentials: any = {};
      const keyFields = ['fir_no', 'crime_type_en', 'district_id', 'date', 'status_en', 'description'];
      keyFields.forEach(field => {
        if (item[field]) essentials[field] = item[field];
      });
      
      summary += JSON.stringify(essentials) + '\n';
      recordCount++;
    }
    if (recordCount >= maxRecords) break;
  }
  
  return summary || 'No context data available';
}

export const CatalystQuickML = {
  // LLM Generation via Pipeline Endpoint
  generateResponse: async (prompt: string, contextData: any = {}) => {
    const endpointKey = process.env.QUICKML_ENDPOINT_KEY;

    // ── Direct HTTP LLM Serving path (independent of SDK) ──────────────
    if (endpointKey && endpointKey.startsWith('http')) {
      try {
        console.log(`🤖 Sending request to Catalyst LLM Serving API: ${endpointKey}`);

        // Use shared OAuth token
        const token = await getSharedAccessToken();
        const orgId = process.env.CATALYST_ORG_ID || '60078981781';

        // Domain-specific system prompt for Karnataka State Police
        const systemPrompt = `You are an AI intelligence assistant for Karnataka State Police CrimeIntel system.

Your role:
- Analyze FIR (First Information Report) data from Karnataka State Police databases
- Identify crime patterns, suspect connections, and investigative leads
- Summarize complex intelligence data in clear, actionable insights
- Apply criminological frameworks (Routine Activity Theory, Crime Pattern Theory) when relevant

Guidelines:
- Be concise but thorough - officers need quick actionable intelligence
- Highlight key FIR numbers, suspect names, and location patterns
- When data is incomplete, state confidence level and what's missing
- Use professional law enforcement terminology
- For Kannada queries, ensure cultural and linguistic accuracy

Current query context: ${contextData?.intent || 'general inquiry'}`;

        // Optimize context size to prevent token overflow
        const contextSummary = summarizeRagContext(contextData, 15);
        const userMessage = `Query: ${prompt}\n\nContext: ${contextSummary}`;

        const fetchResponse = await fetch(endpointKey, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'CATALYST-ORG': orgId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ]
          })
        });

        if (fetchResponse.ok) {
          const json = await fetchResponse.json();
          return json.choices?.[0]?.message?.content || json.response || json.text || JSON.stringify(json);
        } else {
          const errorText = await fetchResponse.text();
          console.error(`Catalyst LLM Serving returned ${fetchResponse.status}:`, errorText);

          // Check for Groq fallback
          if (process.env.GROQ_API_KEY) {
            console.log('🔄 Falling back to Groq API...');
            return await callGroqFallback(prompt, contextData);
          }

          throw new Error(`LLM Serving API Error: ${fetchResponse.status}`);
        }
      } catch (e) {
        console.warn('Catalyst LLM Serving HTTP call failed:', (e as Error).message);
        // Fall through to SDK pipeline or heuristic fallback below
      }
    }

    // ── SDK QuickML Pipeline path ──────────────────────────────────────
    try {
      const app = await getCatalystApp();
      const quickml = typeof app.quickML === 'function' ? app.quickML() : (app as any).quickml?.();

      if (!endpointKey && process.env.NODE_ENV !== 'development') {
        console.warn('⚠️ QUICKML_ENDPOINT_KEY is not configured.');
        return null;
      }

      // Traditional QuickML Pipeline approach
      if (quickml && typeof quickml.predict === 'function') {
        const input_data = {
          prompt,
          context: JSON.stringify(contextData)
        };

        const response = await quickml.predict(endpointKey || 'mock_endpoint_key', input_data);

        if (response && response.text) {
          return response.text;
        } else if (response && response.prediction) {
          return response.prediction;
        } else if (response) {
          return typeof response === 'string' ? response : JSON.stringify(response);
        }
      }
    } catch (e) {
      console.warn('Catalyst QuickML SDK pipeline call failed, falling back to heuristic search:', (e as Error).message);
    }

    // Ultimate Fallback: Local Heuristic Summarization
    console.log('🤖 QuickML: Falling back to local heuristic generation');
    try {
      if (contextData && contextData.ragContext && Array.isArray(contextData.ragContext) && contextData.ragContext.length > 0) {
        // We have data, let's summarize it deterministically
        let response = `Based on my analysis, I found ${contextData.ragContext.length} relevant data sources.\n\n`;
        
        let firs = 0, persons = 0, vehicles = 0;
        
        contextData.ragContext.forEach((source: any) => {
          if (source.source === 'FIRs') firs += Array.isArray(source.data) ? source.data.length : 1;
          if (source.source === 'Persons') persons += Array.isArray(source.data) ? source.data.length : 1;
          if (source.source === 'Vehicles') vehicles += Array.isArray(source.data) ? source.data.length : 1;
        });
        
        if (firs > 0) response += `- **FIRs**: ${firs} related cases identified.\n`;
        if (persons > 0) response += `- **Suspects/Persons**: ${persons} individuals linked.\n`;
        if (vehicles > 0) response += `- **Vehicles**: ${vehicles} vehicles found in records.\n`;
        
        response += `\n*Note: Catalyst QuickML is currently unconfigured or unavailable. This is a heuristic summary of the retrieved intelligence. To enable natural language summarization, configure a valid Catalyst QuickML Pipeline Endpoint Key.*`;
        
        return response;
      } else {
        // Conversational response without data
        const queryLower = prompt.toLowerCase();
        if (queryLower.match(/hello|hi|hey/)) {
          return "Hello Officer. I am ready to assist with your investigation. What would you like to search for?";
        }
        
        return "I'm sorry, I couldn't find any specific intelligence matching your query. Please provide more details or try searching for a specific FIR, suspect, or district.\n\n*(Note: Catalyst QuickML services are currently unavailable. Ensure QUICKML_ENDPOINT_KEY is correctly configured.)*";
      }
    } catch (e) {
      console.warn("Heuristic fallback failed:", e);
    }

    return null;
  },

  // Embedding Generation via Pipeline Endpoint
  generateEmbedding: async (text: string): Promise<number[] | null> => {
    try {
      const app = getCatalystApp();
      const quickml = typeof app.quickML === 'function' ? app.quickML() : (app as any).quickml?.();
      
      const endpointKey = process.env.QUICKML_EMBEDDING_ENDPOINT_KEY || process.env.QUICKML_ENDPOINT_KEY;
      
      if (quickml && typeof quickml.predict === 'function') {
        // Assume embedding pipeline takes "text" as input and returns an embedding array
        const response = await quickml.predict(endpointKey || 'mock_endpoint_key', { text });
        
        if (response && response.embedding) {
          return response.embedding;
        } else if (Array.isArray(response)) {
          return response;
        }
      }
    } catch (e) {
      console.warn('Catalyst QuickML Embedding failed:', (e as Error).message);
      return null;
    }
    return null;
  }
};

/**
 * Groq API fallback when Catalyst GLM is unavailable
 */
async function callGroqFallback(prompt: string, contextData: any): Promise<string> {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const systemPrompt = `You are an AI intelligence assistant for Karnataka State Police CrimeIntel system.

Your role:
- Analyze FIR (First Information Report) data from Karnataka State Police databases
- Identify crime patterns, suspect connections, and investigative leads
- Summarize complex intelligence data in clear, actionable insights
- Apply criminological frameworks (Routine Activity Theory, Crime Pattern Theory) when relevant

Guidelines:
- Be concise but thorough - officers need quick actionable intelligence
- Highlight key FIR numbers, suspect names, and location patterns
- When data is incomplete, state confidence level and what's missing
- Use professional law enforcement terminology
- For Kannada queries, ensure cultural and linguistic accuracy

Current query context: ${contextData?.intent || 'general inquiry'}`;

    const contextSummary = summarizeRagContext(contextData, 15);
    const userMessage = `Query: ${prompt}\n\nContext: ${contextSummary}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || 'Unable to generate response';
  } catch (error) {
    console.error('Groq fallback failed:', error);
    throw error;
  }
}
