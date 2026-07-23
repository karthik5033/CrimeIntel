import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReasoningOutput } from '@/lib/reasoning/types';
import { CatalystNoSQL } from '@/lib/catalyst/nosql';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isThinking?: boolean;
  tableData?: any[];
  reasoningBlock?: ReasoningOutput | any;
  ragContext?: any[];
  citations?: { id: string; label: string; type: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  contextEntities: { id: string; label: string; type: string }[];
  
  // Actions
  createNewSession: () => void;
  setActiveSession: (id: string) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  deleteSession: (id: string) => void;
  addContextEntity: (entity: { id: string; label: string; type: string }) => void;
  clearContext: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      contextEntities: [],

      createNewSession: () => {
        const newSession: ChatSession = {
          id: crypto.randomUUID(),
          title: 'New Investigation',
          messages: [],
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newSession.id,
          contextEntities: [],
        }));
        // Sync to Catalyst NoSQL
        CatalystNoSQL.saveChatSession(newSession.id, newSession);
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      addMessage: (message) => {
        set((state) => {
          if (!state.activeSessionId) return state;
          
          const newMessage: ChatMessage = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          };

          const updatedSessions = state.sessions.map((session) => {
            if (session.id === state.activeSessionId) {
              const isFirstUserMessage = session.messages.length === 0 && message.role === 'user';
              const updated = {
                ...session,
                title: isFirstUserMessage ? message.content.slice(0, 30) + '...' : session.title,
                messages: [...session.messages, newMessage],
                updatedAt: new Date().toISOString(),
              };
              // Async sync to Catalyst NoSQL
              CatalystNoSQL.saveChatSession(updated.id, updated);
              return updated;
            }
            return session;
          });

          return { sessions: updatedSessions };
        });
      },

      updateLastMessage: (updates) => {
        set((state) => {
          if (!state.activeSessionId) return state;
          
          const updatedSessions = state.sessions.map((session) => {
            if (session.id === state.activeSessionId) {
              const messages = [...session.messages];
              if (messages.length > 0) {
                const lastIndex = messages.length - 1;
                messages[lastIndex] = { ...messages[lastIndex], ...updates };
              }
              const updated = { ...session, messages, updatedAt: new Date().toISOString() };
              // Async sync to Catalyst NoSQL
              CatalystNoSQL.saveChatSession(updated.id, updated);
              return updated;
            }
            return session;
          });

          return { sessions: updatedSessions };
        });
      },

      deleteSession: (id) => {
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== id);
          return {
            sessions: newSessions,
            activeSessionId: state.activeSessionId === id 
              ? (newSessions[0]?.id || null) 
              : state.activeSessionId
          };
        });
      },

      addContextEntity: (entity) => {
        set((state) => {
          if (state.contextEntities.some(e => e.id === entity.id)) return state;
          return { contextEntities: [...state.contextEntities, entity] };
        });
      },

      clearContext: () => set({ contextEntities: [] }),
    }),
    {
      name: 'crimeintel-chat-storage',
    }
  )
);
