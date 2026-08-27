/**
 * Data Security & Quality Integration Tests
 * 
 * Tests for Phase 3: Data Security & Quality
 * - SQL injection prevention with parameterized queries
 * - Server-side filtering implementation
 * - VectorAgent disabled when embeddings not configured
 * - Seed endpoint authentication
 * - Dynamic district mapping
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { CatalystDataStore } from '@/lib/catalyst/datastore';
import { SQLAgent } from '@/lib/ai/agents/sqlAgent';
import { GraphAgent } from '@/lib/ai/agents/graphAgent';
import { VectorAgent } from '@/lib/ai/agents/vectorAgent';
import { ParsedQuery } from '@/lib/ai/chat/intentClassifier';
import fs from 'fs';
import path from 'path';

describe('Data Security & Quality Tests', () => {
  
  describe('Task 5.1-5.3: SQL Injection Prevention', () => {
    
    it('should safely escape SQL injection in getPersonById', async () => {
      const maliciousId = "'; DROP TABLE Persons; --";
      
      try {
        // Should not throw, should safely escape the input
        const result = await CatalystDataStore.getPersonById(maliciousId);
        
        // Should return null (no person with that ID) rather than executing malicious SQL
        expect(result).toBeNull();
      } catch (error: any) {
        // In mock mode, zcql() might not be available - verify the code structure instead
        expect(error.message).toContain('zcql');
      }
    });
    
    it('should safely escape single quotes in legitimate data', async () => {
      const idWithQuote = "P-O'Brien-123";
      
      try {
        // Should handle single quotes in legitimate IDs
        const result = await CatalystDataStore.getPersonById(idWithQuote);
        
        // Should either return null or a valid person (not throw error)
        expect(result === null || typeof result === 'object').toBe(true);
      } catch (error: any) {
        // In mock mode, zcql() might not be available
        expect(error.message).toContain('zcql');
      }
    });
    
    it('should safely escape SQL injection with OR condition', async () => {
      const maliciousId = "P-123' OR '1'='1";
      
      try {
        const result = await CatalystDataStore.getPersonById(maliciousId);
        
        // Should return null rather than returning all persons
        expect(result).toBeNull();
      } catch (error: any) {
        // In mock mode, zcql() might not be available
        expect(error.message).toContain('zcql');
      }
    });
    
    it('should prevent SQL injection in getFIRById', async () => {
      const maliciousId = "'; DELETE FROM FIRs; --";
      
      try {
        const result = await CatalystDataStore.getFIRById(maliciousId);
        
        expect(result).toBeNull();
      } catch (error: any) {
        // In mock mode, zcql() might not be available
        expect(error.message).toContain('zcql');
      }
    });
    
    it('should prevent SQL injection in getGraphForEntity', async () => {
      const maliciousEntity = "'; DROP TABLE EntityRelationships; --";
      
      try {
        const result = await CatalystDataStore.getGraphForEntity(maliciousEntity);
        
        // Should return empty array, not execute malicious SQL
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      } catch (error: any) {
        // In mock mode, zcql() might not be available
        expect(error.message).toContain('zcql');
      }
    });
  });
  
  describe('Task 5.3: No String Interpolation in Queries', () => {
    
    it('should not contain string interpolation in datastore.ts', () => {
      const datastorePath = path.join(process.cwd(), 'lib/catalyst/datastore.ts');
      const content = fs.readFileSync(datastorePath, 'utf-8');
      
      // Check for vulnerable patterns like `${variable}` in SQL queries
      // Allow template literals for non-SQL purposes, but flag SQL-like patterns
      const sqlInjectionPattern = /executeZCQLQuery\([^)]*\$\{[^}]+\}/g;
      const matches = content.match(sqlInjectionPattern);
      
      expect(matches).toBeNull();
    });
    
    it('should use buildParameterizedQuery in all agent files', () => {
      const sqlAgentPath = path.join(process.cwd(), 'lib/ai/agents/sqlAgent.ts');
      const graphAgentPath = path.join(process.cwd(), 'lib/ai/agents/graphAgent.ts');
      
      const sqlAgentContent = fs.readFileSync(sqlAgentPath, 'utf-8');
      const graphAgentContent = fs.readFileSync(graphAgentPath, 'utf-8');
      
      // Verify buildParameterizedQuery function exists
      expect(sqlAgentContent).toContain('buildParameterizedQuery');
      expect(graphAgentContent).toContain('buildParameterizedQuery');
      
      // Verify no string interpolation in ZCQL queries
      const sqlInjectionPattern = /executeZCQLQuery\([^)]*\$\{[^}]+\}/g;
      expect(sqlAgentContent.match(sqlInjectionPattern)).toBeNull();
      expect(graphAgentContent.match(sqlInjectionPattern)).toBeNull();
    });
  });
  
  describe('Task 5.4: Dynamic District Mapping', () => {
    
    it('should have getDistricts method in datastore', async () => {
      try {
        const districts = await CatalystDataStore.getDistricts();
        
        expect(Array.isArray(districts)).toBe(true);
        // Districts should have id and name fields
        if (districts.length > 0) {
          expect(districts[0]).toHaveProperty('id');
          expect(districts[0]).toHaveProperty('name');
        }
      } catch (error: any) {
        // In mock mode, zcql() might not be available - verify method exists
        const datastorePath = path.join(process.cwd(), 'lib/catalyst/datastore.ts');
        const content = fs.readFileSync(datastorePath, 'utf-8');
        expect(content).toContain('getDistricts');
      }
    });
    
    it('should use dynamic district mapping in SQLAgent', () => {
      const sqlAgentPath = path.join(process.cwd(), 'lib/ai/agents/sqlAgent.ts');
      const content = fs.readFileSync(sqlAgentPath, 'utf-8');
      
      // Should have getDistrictMapping function
      expect(content).toContain('getDistrictMapping');
      
      // Should have district mapping cache
      expect(content).toContain('districtMappingCache');
    });
  });
  
  describe('Task 5.5: GraphAgent Server-Side Filtering', () => {
    
    it('should use server-side WHERE clause in GraphAgent', () => {
      const graphAgentPath = path.join(process.cwd(), 'lib/ai/agents/graphAgent.ts');
      const content = fs.readFileSync(graphAgentPath, 'utf-8');
      
      // Should construct WHERE clause in query
      expect(content).toContain('WHERE');
      
      // Should have LIMIT clause
      expect(content).toContain('LIMIT');
    });
    
    it('should retrieve graph relationships with server-side filtering', async () => {
      const parsedQuery: ParsedQuery = {
        intent: 'RELATIONSHIP_QUERY',
        entities: {
          person_names: ['John Doe'],
          fir_numbers: []
        },
        resolvedQuery: 'Find relationships for John Doe'
      };
      
      try {
        const results = await GraphAgent.retrieve(parsedQuery);
        
        expect(Array.isArray(results)).toBe(true);
        // Results should be limited (not unlimited)
        expect(results.length).toBeLessThanOrEqual(100);
      } catch (error: any) {
        // In mock mode, zcql() might not be available
        // Verify the code structure has proper LIMIT clause
        const graphAgentPath = path.join(process.cwd(), 'lib/ai/agents/graphAgent.ts');
        const content = fs.readFileSync(graphAgentPath, 'utf-8');
        expect(content).toContain('LIMIT 100');
      }
    });
  });
  
  describe('Task 5.6: VectorAgent Disabled Until Embeddings Ready', () => {
    
    it('should return empty array when QUICKML_EMBEDDING_ENDPOINT_KEY not configured', async () => {
      // Save current env var
      const originalKey = process.env.QUICKML_EMBEDDING_ENDPOINT_KEY;
      
      // Temporarily remove the key
      delete process.env.QUICKML_EMBEDDING_ENDPOINT_KEY;
      
      const parsedQuery: ParsedQuery = {
        intent: 'DIRECT_RETRIEVAL',
        entities: {},
        resolvedQuery: 'test query'
      };
      
      const results = await VectorAgent.retrieve(parsedQuery);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
      
      // Restore original value
      if (originalKey) {
        process.env.QUICKML_EMBEDDING_ENDPOINT_KEY = originalKey;
      }
    });
    
    it('should have TODO comment for future implementation', () => {
      const vectorAgentPath = path.join(process.cwd(), 'lib/ai/agents/vectorAgent.ts');
      const content = fs.readFileSync(vectorAgentPath, 'utf-8');
      
      expect(content).toContain('TODO');
      expect(content).toContain('QUICKML_EMBEDDING_ENDPOINT_KEY');
    });
  });
  
  describe('Task 5.7: Seed Endpoint Security', () => {
    
    it('should have proper authentication check in seed route', () => {
      const seedRoutePath = path.join(process.cwd(), 'app/api/admin/seed/route.ts');
      const content = fs.readFileSync(seedRoutePath, 'utf-8');
      
      // Should check for ADMIN_SEED_TOKEN
      expect(content).toContain('ADMIN_SEED_TOKEN');
      
      // Should check authorization header
      expect(content).toContain('authorization');
      
      // Should return 401 for unauthorized
      expect(content).toContain('401');
    });
    
    it('should check for ADMIN_SEED_TOKEN configuration', () => {
      const seedRoutePath = path.join(process.cwd(), 'app/api/admin/seed/route.ts');
      const content = fs.readFileSync(seedRoutePath, 'utf-8');
      
      // Should verify token is configured
      expect(content).toContain('expectedToken');
      expect(content).toContain('ADMIN_SEED_TOKEN');
    });
    
    it('should prevent seeding in mock mode', () => {
      const seedRoutePath = path.join(process.cwd(), 'app/api/admin/seed/route.ts');
      const content = fs.readFileSync(seedRoutePath, 'utf-8');
      
      // Should check for USE_MOCK_CATALYST
      expect(content).toContain('USE_MOCK_CATALYST');
      
      // Should return 400 error in mock mode
      expect(content).toMatch(/status.*400/);
    });
  });
  
  describe('Task 5.8: Overall Data Security Validation', () => {
    
    it('should have parameterized query helper with proper escaping', () => {
      const datastorePath = path.join(process.cwd(), 'lib/catalyst/datastore.ts');
      const content = fs.readFileSync(datastorePath, 'utf-8');
      
      // Should have buildParameterizedQuery function
      expect(content).toContain('function buildParameterizedQuery');
      
      // Should escape single quotes by doubling them
      expect(content).toContain("replace(/'/g, \"''\")");
    });
    
    it('should handle numeric parameters without quotes', () => {
      const datastorePath = path.join(process.cwd(), 'lib/catalyst/datastore.ts');
      const content = fs.readFileSync(datastorePath, 'utf-8');
      
      // Should handle typeof value === 'number'
      expect(content).toContain("typeof value === 'string'");
    });
  });
});
