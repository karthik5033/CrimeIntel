import { getCatalystApp } from './index';

/**
 * Catalyst QuickML Client
 * Manages LLM inference, embedding generation, and prompt pipeline execution.
 */
export const CatalystQuickML = {
  // LLM Generation
  generateResponse: async (prompt: string, contextData: any = {}) => {
    try {
      const app = getCatalystApp();
      const quickml = app.quickml ? app.quickml() : null;

      if (quickml && typeof quickml.predict === 'function') {
        const response = await quickml.predict({
          prompt,
          context: contextData,
          temperature: 0.2,
        });
        if (response && response.text) {
          return response.text;
        }
      }
    } catch (e) {
      console.warn('Catalyst QuickML LLM call note:', (e as Error).message);
    }

    // Local Simulated LLM Fallback (Since QuickML is empty in console)
    if (contextData && contextData.ragContext && contextData.ragContext.length > 0) {
      const records = contextData.ragContext.map((r: any) => `- ${r.title}: ${r.snippet}`).join("\n");
      return `Based on the intelligence records, here is what I found:\n\n${records}\n\n(Note: This is an AI-generated summary running locally because QuickML is not yet configured in your Catalyst console.)`;
    }

    return null;
  },

  // Embedding Generation
  generateEmbedding: async (text: string): Promise<number[] | null> => {
    try {
      const app = getCatalystApp();
      if (app.quickml) {
        const response = await app.quickml().embeddings({ text });
        if (response && response.embedding) {
          return response.embedding;
        }
      }
    } catch (e) {
      console.warn('Catalyst QuickML Embedding note:', (e as Error).message);
    }
    return null;
  }
};
