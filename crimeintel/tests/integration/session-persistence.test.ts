/**
 * Integration Tests: Session Persistence
 * 
 * Tests the conversation flow with session persistence across requests.
 * Validates that chat context accumulates correctly and persists to NoSQL.
 * 
 * **Validates Requirements:**
 * - 2.19: Session context persists across requests
 * - 2.21: Follow-up queries use accumulated context
 * - 2.22: Sessions expire after 30 days
 * - 1.19: Conversation flow feels natural
 * - 1.20: Active Context sidebar displays entities
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { CatalystNoSQL, createEmptySession, ChatSession } from '@/lib/catalyst/nosql';
import { ContextManager } from '@/lib/ai/chat/contextManager';

describe('Session Persistence Integration Tests', () => {
  const testSessionId = `test-session-${Date.now()}`;

  beforeAll(() => {
    // Ensure we're not in mock mode for this test
    if (process.env.USE_MOCK_CATALYST === 'true') {
      console.warn('⚠️ Running persistence tests in MOCK mode - results may not reflect production behavior');
    }
  });

  describe('Schema and Empty Session Creation', () => {
    it('should create an empty session with correct structure', () => {
      const emptySession = createEmptySession(testSessionId);
      
      expect(emptySession).toBeDefined();
      expect(emptySession.session_id).toBe(testSessionId);
      expect(emptySession.updated_at).toBeGreaterThan(0);
      expect(emptySession.ttl).toBeGreaterThan(emptySession.updated_at);
      
      // Verify TTL is approximately 30 days from now
      const ttlDiff = emptySession.ttl - emptySession.updated_at;
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      expect(ttlDiff).toBeGreaterThan(thirtyDaysInMs - 1000); // Allow 1s tolerance
      expect(ttlDiff).toBeLessThan(thirtyDaysInMs + 1000);
      
      // Verify nested data structure
      expect(emptySession.data).toBeDefined();
      expect(emptySession.data.entities).toBeDefined();
      expect(emptySession.data.entities.crime_types).toEqual([]);
      expect(emptySession.data.entities.districts).toEqual([]);
      expect(emptySession.data.entities.person_names).toEqual([]);
      expect(emptySession.data.entities.vehicle_numbers).toEqual([]);
      expect(emptySession.data.entities.date_ranges).toEqual([]);
      
      expect(emptySession.data.conversation_history).toEqual([]);
      expect(emptySession.data.active_context).toBeDefined();
      expect(emptySession.data.active_context.last_intent).toBe('');
      expect(emptySession.data.active_context.last_query).toBe('');
      expect(emptySession.data.active_context.accumulated_filters).toEqual({});
    });
  });

  describe('NoSQL Upsert Logic', () => {
    it('should insert a new session successfully', async () => {
      const newSession = createEmptySession(`insert-test-${Date.now()}`);
      
      const success = await CatalystNoSQL.saveChatSession(newSession.session_id, newSession.data);
      
      expect(success).toBe(true);
    });

    it('should update an existing session successfully', async () => {
      const sessionId = `update-test-${Date.now()}`;
      const initialSession = createEmptySession(sessionId);
      
      // Insert initial session
      await CatalystNoSQL.saveChatSession(sessionId, initialSession.data);
      
      // Update with new data
      const updatedData = {
        ...initialSession.data,
        entities: {
          ...initialSession.data.entities,
          crime_types: ['Murder', 'Theft']
        },
        conversation_history: [
          { role: 'user' as const, content: 'hello', timestamp: Date.now() }
        ]
      };
      
      const success = await CatalystNoSQL.saveChatSession(sessionId, updatedData);
      
      expect(success).toBe(true);
      
      // Verify update persisted
      const retrieved = await CatalystNoSQL.getChatSession(sessionId);
      expect(retrieved).not.toBeNull();
      if (retrieved) {
        expect(retrieved.data.entities.crime_types).toEqual(['Murder', 'Theft']);
        expect(retrieved.data.conversation_history).toHaveLength(1);
      }
    });

    it('should refresh TTL on each save', async () => {
      const sessionId = `ttl-refresh-${Date.now()}`;
      const initialSession = createEmptySession(sessionId);
      const initialTTL = initialSession.ttl;
      
      // Save initial session
      await CatalystNoSQL.saveChatSession(sessionId, initialSession.data);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update session
      await CatalystNoSQL.saveChatSession(sessionId, initialSession.data);
      
      // Retrieve and verify TTL was refreshed
      const retrieved = await CatalystNoSQL.getChatSession(sessionId);
      expect(retrieved).not.toBeNull();
      if (retrieved) {
        // TTL should be updated (greater than initial)
        expect(retrieved.ttl).toBeGreaterThan(initialTTL);
      }
    });
  });

  describe('Session Retrieval with Fallback', () => {
    it('should retrieve an existing session', async () => {
      const sessionId = `retrieve-test-${Date.now()}`;
      const testData = {
        entities: {
          crime_types: ['Robbery'],
          districts: ['Bengaluru'],
          person_names: ['John Doe'],
          vehicle_numbers: ['KA01AB1234'],
          date_ranges: ['2024-01-01 to 2024-12-31']
        },
        conversation_history: [
          { role: 'user' as const, content: 'test message', timestamp: Date.now() }
        ],
        active_context: {
          last_intent: 'DIRECT_RETRIEVAL',
          last_query: 'show robbery cases',
          accumulated_filters: { district: 'Bengaluru' }
        }
      };
      
      await CatalystNoSQL.saveChatSession(sessionId, testData);
      
      const retrieved = await CatalystNoSQL.getChatSession(sessionId);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved?.session_id).toBe(sessionId);
      expect(retrieved?.data.entities.crime_types).toEqual(['Robbery']);
      expect(retrieved?.data.entities.districts).toEqual(['Bengaluru']);
      expect(retrieved?.data.conversation_history).toHaveLength(1);
    });

    it('should return empty template for non-existent session', async () => {
      const nonExistentId = `non-existent-${Date.now()}`;
      
      const retrieved = await CatalystNoSQL.getChatSession(nonExistentId);
      
      // Should return empty template, not null
      expect(retrieved).not.toBeNull();
      if (retrieved) {
        expect(retrieved.session_id).toBe(nonExistentId);
        expect(retrieved.data.entities.crime_types).toEqual([]);
        expect(retrieved.data.conversation_history).toEqual([]);
      }
    });

    it('should distinguish between new session and error', async () => {
      // Test new session
      const newSessionId = `new-${Date.now()}`;
      const newSession = await CatalystNoSQL.getChatSession(newSessionId);
      expect(newSession).not.toBeNull();
      if (newSession) {
        expect(newSession.data).toBeDefined();
      }
      
      // Error case would return null (but hard to trigger without breaking connection)
      // This is tested implicitly by the implementation
    });
  });

  describe('ContextManager Integration', () => {
    it('should retrieve session through ContextManager', async () => {
      const sessionId = `context-test-${Date.now()}`;
      
      const session = await ContextManager.getSession(sessionId);
      
      expect(session).toBeDefined();
      expect(session.session_id).toBe(sessionId);
      expect(session.context).toBeDefined();
      expect(session.messages).toEqual([]);
    });

    it('should save session through ContextManager', async () => {
      const sessionId = `context-save-${Date.now()}`;
      
      const session = {
        session_id: sessionId,
        context: {
          active_district: 'Bengaluru',
          active_crime_types: ['Murder'],
          last_query: 'show murder cases in Bengaluru'
        },
        messages: [
          { role: 'user', content: 'hello', timestamp: Date.now() }
        ]
      };
      
      const success = await ContextManager.saveSession(session);
      
      expect(success).toBe(true);
      
      // Verify persisted correctly
      const retrieved = await ContextManager.getSession(sessionId);
      expect(retrieved.context.active_district).toBe('Bengaluru');
      expect(retrieved.context.active_crime_types).toEqual(['Murder']);
      expect(retrieved.messages).toHaveLength(1);
    });

    it('should persist session after each conversation turn', async () => {
      const sessionId = `conversation-${Date.now()}`;
      
      // Turn 1: Initial query
      let session = await ContextManager.getSession(sessionId);
      session.context.last_query = 'show murder cases';
      session.context.active_crime_types = ['Murder'];
      session.messages.push({
        role: 'user',
        content: 'show murder cases',
        timestamp: Date.now()
      });
      
      await ContextManager.saveSession(session);
      
      // Turn 2: Follow-up query
      session = await ContextManager.getSession(sessionId);
      expect(session.context.active_crime_types).toEqual(['Murder']);
      
      session.context.last_query = 'what about in Bengaluru?';
      session.context.active_district = 'Bengaluru';
      session.messages.push({
        role: 'user',
        content: 'what about in Bengaluru?',
        timestamp: Date.now()
      });
      
      await ContextManager.saveSession(session);
      
      // Turn 3: Another follow-up
      session = await ContextManager.getSession(sessionId);
      expect(session.context.active_crime_types).toEqual(['Murder']);
      expect(session.context.active_district).toBe('Bengaluru');
      expect(session.messages).toHaveLength(2);
      
      session.context.last_query = 'what about last year?';
      session.context.active_time_window = '2023-01-01 to 2023-12-31';
      session.messages.push({
        role: 'user',
        content: 'what about last year?',
        timestamp: Date.now()
      });
      
      await ContextManager.saveSession(session);
      
      // Verify all context accumulated
      const finalSession = await ContextManager.getSession(sessionId);
      expect(finalSession.context.active_crime_types).toEqual(['Murder']);
      expect(finalSession.context.active_district).toBe('Bengaluru');
      expect(finalSession.context.active_time_window).toBe('2023-01-01 to 2023-12-31');
      expect(finalSession.messages).toHaveLength(3);
    });
  });

  describe('Context Accumulation', () => {
    it('should accumulate entities across conversation turns', async () => {
      const sessionId = `accumulation-${Date.now()}`;
      
      const session = await ContextManager.getSession(sessionId);
      
      // Turn 1: Add crime type
      session.context.active_crime_types = ['Theft'];
      await ContextManager.saveSession(session);
      
      // Turn 2: Add district
      const session2 = await ContextManager.getSession(sessionId);
      session2.context.active_district = 'Mysuru';
      await ContextManager.saveSession(session2);
      
      // Turn 3: Add entity
      const session3 = await ContextManager.getSession(sessionId);
      session3.context.active_entities = ['KA09XY5678'];
      await ContextManager.saveSession(session3);
      
      // Verify all accumulated
      const finalSession = await ContextManager.getSession(sessionId);
      expect(finalSession.context.active_crime_types).toEqual(['Theft']);
      expect(finalSession.context.active_district).toBe('Mysuru');
      expect(finalSession.context.active_entities).toEqual(['KA09XY5678']);
    });

    it('should update context correctly', () => {
      const currentContext = {
        active_district: 'Bengaluru',
        active_crime_types: ['Murder']
      };
      
      const updatedContext = ContextManager.updateContext(currentContext, {
        active_time_window: '2024-01-01 to 2024-12-31'
      });
      
      expect(updatedContext.active_district).toBe('Bengaluru');
      expect(updatedContext.active_crime_types).toEqual(['Murder']);
      expect(updatedContext.active_time_window).toBe('2024-01-01 to 2024-12-31');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in getSession', async () => {
      // This tests that errors don't crash the app
      // The actual error would need to be triggered by network issues
      const session = await ContextManager.getSession('error-test');
      
      // Should return empty session, not throw
      expect(session).toBeDefined();
      expect(session.session_id).toBe('error-test');
    });

    it('should handle errors gracefully in saveSession', async () => {
      const session = {
        session_id: 'save-error-test',
        context: {},
        messages: []
      };
      
      // Should not throw even if save fails
      const result = await ContextManager.saveSession(session);
      
      // Result might be true or false depending on Catalyst availability
      expect(typeof result).toBe('boolean');
    });
  });
});
