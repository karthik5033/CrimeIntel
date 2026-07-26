import { CatalystNoSQL } from '@/lib/catalyst/nosql';

export interface ChatContext {
  active_district?: string;
  active_crime_types?: string[];
  active_time_window?: string;
  active_entities?: string[];
  last_query?: string;
}

export interface ChatSession {
  session_id: string;
  user_id?: string;
  context: ChatContext;
  messages: any[];
}

export class ContextManager {
  static async getSession(sessionId: string): Promise<ChatSession> {
    const data = await CatalystNoSQL.getChatSession(sessionId);
    if (data) {
      // Ensure context object exists
      if (!data.context) {
        data.context = {};
      }
      return data as ChatSession;
    }

    // Return a new session if none found
    return {
      session_id: sessionId,
      context: {},
      messages: []
    };
  }

  static async saveSession(session: ChatSession): Promise<boolean> {
    return await CatalystNoSQL.saveChatSession(session.session_id, session);
  }

  static updateContext(currentContext: ChatContext, updates: Partial<ChatContext>): ChatContext {
    return {
      ...currentContext,
      ...updates
    };
  }
}
