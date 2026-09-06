/**
 * Graph Retriever - Relationship and Network Queries
 * Phase 0.2
 * 
 * Reads from Phase 0.1's graph-index, not live traversal
 */

import {
  QueryContext,
  EvidenceItem,
  RetrieverResult,
  RetrieverConfig,
} from '../types';

export class GraphRetriever {
  private config: RetrieverConfig;

  constructor(config: RetrieverConfig) {
    this.config = config;
  }

  async retrieve(context: QueryContext): Promise<RetrieverResult> {
    const startTime = Date.now();

    try {
      console.log('[Graph Retriever] Querying relationship graph...');

      // Determine graph query type from context
      const queryType = this.determineGraphQueryType(context);
      const results = await this.executeGraphQuery(queryType, context);

      const items = this.formatResults(results);

      return {
        retriever: 'graph',
        success: true,
        items,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          totalMatches: items.length,
          queryType,
          cacheHit: true, // Reading from precomputed index
        },
      };
    } catch (error: any) {
      console.error('[Graph Retriever] Error:', error.message);

      if (this.config.fallbackOnError) {
        return {
          retriever: 'graph',
          success: false,
          items: [],
          executionTimeMs: Date.now() - startTime,
          error: error.message,
        };
      }

      throw error;
    }
  }

  private determineGraphQueryType(context: QueryContext): string {
    const { query, entities } = context;

    if (query.toLowerCase().includes('connect') || query.toLowerCase().includes('relationship')) {
      return 'path_finding';
    }

    if (query.toLowerCase().includes('network') || query.toLowerCase().includes('gang')) {
      return 'community_detection';
    }

    if (entities?.some(e => e.type === 'person')) {
      return 'person_subgraph';
    }

    return 'general_graph';
  }

  private async executeGraphQuery(queryType: string, context: QueryContext): Promise<any[]> {
    // In production, this reads from Phase 0.1's graph-index in Catalyst Cache
    console.log(`[Graph Retriever] Executing ${queryType} query`);

    // Simulate reading from precomputed graph index
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50));

    // Mock graph query results
    switch (queryType) {
      case 'path_finding':
        return [
          {
            type: 'path',
            source: 'person-001',
            target: 'person-002',
            path: ['person-001', 'phone-123', 'person-002'],
            distance: 2,
            relationships: [
              { from: 'person-001', to: 'phone-123', type: 'owns' },
              { from: 'phone-123', to: 'person-002', type: 'called' },
            ],
          },
        ];

      case 'community_detection':
        return [
          {
            type: 'community',
            id: 'community-001',
            members: ['person-001', 'person-002', 'person-003'],
            size: 3,
            density: 0.85,
            crimeTypes: ['Vehicle Theft', 'Burglary'],
          },
        ];

      case 'person_subgraph':
        return [
          {
            type: 'subgraph',
            center: 'person-001',
            nodes: ['person-001', 'person-002', 'fir-001', 'vehicle-001'],
            edges: [
              { from: 'person-001', to: 'person-002', type: 'knows' },
              { from: 'person-001', to: 'fir-001', type: 'accused_in' },
              { from: 'person-001', to: 'vehicle-001', type: 'owns' },
            ],
            centrality: 0.75,
          },
        ];

      default:
        return [];
    }
  }

  private formatResults(results: any[]): EvidenceItem[] {
    return results.map(result => ({
      id: `graph-${result.type}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'relationship' as const,
      source: 'graph' as const,
      data: result,
      relevanceScore: result.density || result.centrality || 0.8,
      metadata: {
        retrievedAt: new Date(),
        matchedOn: ['graph_topology'],
        confidence: 0.85,
        graphQueryType: result.type,
      },
    }));
  }
}
