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
      console.warn('Catalyst QuickML LLM call failed, falling back to local search:', (e as Error).message);
      return null;
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
      console.warn('Catalyst QuickML Embedding failed:', (e as Error).message);
      return null;
    }
    return null;
  }
};
