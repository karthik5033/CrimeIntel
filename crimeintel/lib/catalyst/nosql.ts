import { getCatalystApp } from './index';

/**
 * Catalyst NoSQL Client
 * Handles storing chat sessions, reasoning outputs, and unstructured search embeddings.
 */
export const CatalystNoSQL = {
  // Save Chat Session
  saveChatSession: async (sessionId: string, sessionData: any) => {
    try {
      const app = getCatalystApp();
      const nosql = app.nosql();
      if (nosql) {
        await nosql.table('chat_sessions').insertRow({
          session_id: sessionId,
          data: JSON.stringify(sessionData),
          updated_at: new Date().toISOString()
        });
        return true;
      }
    } catch (e) {
      console.warn('Catalyst NoSQL saveChatSession fallback:', (e as Error).message);
    }
    return false;
  },

  // Get Chat Session
  getChatSession: async (sessionId: string) => {
    try {
      const app = getCatalystApp();
      const nosql = app.nosql();
      if (nosql) {
        const row = await nosql.table('chat_sessions').getRow(sessionId);
        if (row && row.data) {
          return JSON.parse(row.data);
        }
      }
    } catch (e) {
      // Fallback
    }
    return null;
  },

  // Save Reasoning Output
  saveReasoningOutput: async (queryId: string, reasoning: any) => {
    try {
      const app = getCatalystApp();
      const nosql = app.nosql();
      if (nosql) {
        await nosql.table('reasoning_outputs').insertRow({
          query_id: queryId,
          claim: reasoning.claim,
          data: JSON.stringify(reasoning),
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Catalyst NoSQL saveReasoningOutput fallback');
    }
  }
};
