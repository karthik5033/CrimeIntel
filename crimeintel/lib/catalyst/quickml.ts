import { getCatalystApp } from './index';

/**
 * Catalyst QuickML Client
 * Executes ML pipelines for inference and embedding tasks using the published endpoint key.
 */
export const CatalystQuickML = {
  // LLM Generation via Pipeline Endpoint
  generateResponse: async (prompt: string, contextData: any = {}) => {
    try {
      const app = getCatalystApp();
      const quickml = typeof app.quickML === 'function' ? app.quickML() : (app as any).quickml?.();
      
      const endpointKey = process.env.QUICKML_ENDPOINT_KEY;
      if (!endpointKey && process.env.NODE_ENV !== 'development') {
        console.warn('⚠️ QUICKML_ENDPOINT_KEY is not configured.');
        return null;
      }

      // If the user provided a direct LLM Serving REST API URL instead of a pipeline endpoint key
      if (endpointKey && endpointKey.startsWith('http')) {
        console.log(`🤖 Sending request to Catalyst LLM Serving API: ${endpointKey}`);
        
        let token = "";
        try {
          if (app.credential && typeof app.credential.getToken === 'function') {
            const tokenResponse = await app.credential.getToken();
            token = tokenResponse.access_token || tokenResponse.accessToken;
          }
        } catch (e) {
          console.warn('Could not extract Catalyst token, proceeding without auth header', e);
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'CATALYST-ORG': process.env.CATALYST_ORG_ID || '60078981781'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const fetchResponse = await fetch(endpointKey, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are an AI intelligence assistant.' },
              { role: 'user', content: prompt + '\n\nContext: ' + JSON.stringify(contextData) }
            ]
          })
        });

        if (fetchResponse.ok) {
          const json = await fetchResponse.json();
          return json.choices?.[0]?.message?.content || json.response || json.text || JSON.stringify(json);
        } else {
          const errorText = await fetchResponse.text();
          console.error(`Catalyst LLM Serving returned ${fetchResponse.status}:`, errorText);
          throw new Error(`LLM Serving API Error: ${fetchResponse.status}`);
        }
      }

      // Traditional QuickML Pipeline approach
      if (quickml && typeof quickml.predict === 'function') {
        // QuickML pipeline predict requires the endpoint_key and the input data structured as expected by the pipeline.
        const input_data = {
          prompt,
          context: JSON.stringify(contextData)
        };
        
        const response = await quickml.predict(endpointKey || 'mock_endpoint_key', input_data);
        
        // Return based on typical QuickML pipeline response structure
        if (response && response.text) {
          return response.text;
        } else if (response && response.prediction) {
          return response.prediction;
        } else if (response) {
          // If structure is arbitrary, stringify the output
          return typeof response === 'string' ? response : JSON.stringify(response);
        }
      }
    } catch (e) {
      console.warn('Catalyst QuickML LLM call failed, falling back to heuristic search:', (e as Error).message);
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
