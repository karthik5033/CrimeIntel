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
      console.warn('Catalyst QuickML LLM call failed, falling back to local search:', (e as Error).message);
      return null;
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
