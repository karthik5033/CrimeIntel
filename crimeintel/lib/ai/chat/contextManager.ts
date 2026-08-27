import { CatalystNoSQL, ChatSession as CatalystChatSession, createEmptySession } from '@/lib/catalyst/nosql';

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
    try {
      const nosqlSession = await CatalystNoSQL.getChatSession(sessionId);
      
      // If we get null (error), return empty session
      if (nosqlSession === null) {
        console.warn(`⚠️ Error retrieving session ${sessionId}, using empty session`);
        return {
          session_id: sessionId,
          context: {},
          messages: []
        };
      }
      
      // If we got a session (either existing or empty template)
      // Convert from NoSQL format to ContextManager format
      return {
        session_id: nosqlSession.session_id,
        user_id: nosqlSession.user_id,
        context: {
          active_district: nosqlSession.data.active_context.accumulated_filters?.district,
          active_crime_types: nosqlSession.data.entities.crime_types,
          active_time_window: nosqlSession.data.active_context.accumulated_filters?.time_window,
          active_entities: [
            ...nosqlSession.data.entities.person_names,
            ...nosqlSession.data.entities.vehicle_numbers
          ],
          last_query: nosqlSession.data.active_context.last_query
        },
        messages: nosqlSession.data.conversation_history
      };
    } catch (error) {
      console.error('❌ Error in getSession:', error);
      // Return empty session on error
      return {
        session_id: sessionId,
        context: {},
        messages: []
      };
    }
  }

  static async saveSession(session: ChatSession): Promise<boolean> {
    try {
      // Convert from ContextManager format to NoSQL format
      const nosqlSessionData = {
        entities: {
          crime_types: session.context.active_crime_types || [],
          districts: session.context.active_district ? [session.context.active_district] : [],
          person_names: (session.context.active_entities || []).filter((e: string) => !e.match(/^[A-Z]{2}\d{2}/)), // Not vehicle numbers
          vehicle_numbers: (session.context.active_entities || []).filter((e: string) => e.match(/^[A-Z]{2}\d{2}/)), // Vehicle numbers
          date_ranges: session.context.active_time_window ? [session.context.active_time_window] : []
        },
        conversation_history: session.messages || [],
        active_context: {
          last_intent: '',
          last_query: session.context.last_query || '',
          accumulated_filters: {
            district: session.context.active_district,
            time_window: session.context.active_time_window
          }
        }
      };
      
      const success = await CatalystNoSQL.saveChatSession(session.session_id, nosqlSessionData);
      
      if (!success) {
        console.warn(`⚠️ Failed to persist session ${session.session_id}`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error in saveSession:', error);
      return false;
    }
  }

  static updateContext(currentContext: ChatContext, updates: Partial<ChatContext>): ChatContext {
    return {
      ...currentContext,
      ...updates
    };
  }
}
