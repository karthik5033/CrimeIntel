/**
 * GraphRAG Pipeline - Main Orchestrator
 * Phase 0.4
 * 
 * Query → Vector Search → Graph Expansion → Re-ranking → LLM Context
 */

import {
  GraphRAGQuery,
  GraphRAGResult,
  GraphRAGConfig,
  SeedNode,
  ExpandedNode,
  GraphRAGCandidate,
} from './types';

import { GraphExpander } from './graph-expander';
import { GraphRAGRanker } from './graphrag-ranker';

// Will integrate with Phase 0.2's VectorRetriever when wired
import { VectorRetriever } from '../hybrid-retrieval/retrievers/vector-retriever';

export class GraphRAGPipeline {
  private config: GraphRAGConfig;
  private vectorRetriever: VectorRetriever;
  private graphExpander: GraphExpander;
  private ranker: GraphRAGRanker;

  constructor(config?: Partial<GraphRAGConfig>) {
    this.config = {
      vectorTopK: 10,
      vectorThreshold: 0.7,
      maxHops: 2,
      maxNodesPerHop: 50,
      weights: {
        semantic: 0.35,
        graphProximity: 0.30,
        recency: 0.20,
        confidence: 0.15,
      },
      maxFinalResults: 20,
      includeGraphContext: true,
      ...config,
    };

    // Initialize components
    this.vectorRetriever = new VectorRetriever({
      enabled: true,
      timeout: 2000,
      maxResults: this.config.vectorTopK,
      fallbackOnError: true,
    });

    this.graphExpander = new GraphExpander(
      this.config.maxHops,
      this.config.maxNodesPerHop,
      this.config.relationshipTypeFilter
    );

    this.ranker = new GraphRAGRanker(this.config.weights);
  }

  /**
   * Main GraphRAG retrieval method
   */
  async retrieve(query: GraphRAGQuery): Promise<GraphRAGResult> {
    console.log('[GraphRAG Pipeline] ═════════════════════════════════════════');
    console.log(`[GraphRAG Pipeline] Query: "${query.query}"`);
    console.log('[GraphRAG Pipeline] ═════════════════════════════════════════\n');

    const startTime = Date.now();
    let vectorSearchTime = 0;
    let graphExpansionTime = 0;
    let rankingTime = 0;

    // Step 1: Vector Search (get seed nodes)
    console.log('[Step 1] Vector Search for seed nodes...');
    const vectorStartTime = Date.now();
    
    const seedNodes = await this.vectorSearch(query);
    
    vectorSearchTime = Date.now() - vectorStartTime;
    console.log(`  ✓ Found ${seedNodes.length} seed nodes in ${vectorSearchTime}ms\n`);

    if (seedNodes.length === 0) {
      console.log('[GraphRAG Pipeline] No seed nodes found, returning empty result\n');
      return this.emptyResult(startTime);
    }

    // Step 2: Graph Expansion (explore neighborhoods)
    console.log('[Step 2] Graph Expansion (traversing relationships)...');
    const graphStartTime = Date.now();
    
    const expandedNodes = await this.graphExpander.expand(seedNodes);
    
    graphExpansionTime = Date.now() - graphStartTime;
    console.log(`  ✓ Expanded to ${expandedNodes.length} connected nodes in ${graphExpansionTime}ms\n`);

    // Step 3: Re-ranking (multi-signal scoring)
    console.log('[Step 3] Re-ranking with multi-signal scoring...');
    const rankingStartTime = Date.now();
    
    const rankedCandidates = this.ranker.rank(seedNodes, expandedNodes);
    const finalCandidates = rankedCandidates.slice(0, this.config.maxFinalResults);
    
    rankingTime = Date.now() - rankingStartTime;
    console.log(`  ✓ Ranked ${rankedCandidates.length} candidates, selected top ${finalCandidates.length} in ${rankingTime}ms\n`);

    // Build graph context summary
    const graphContext = this.config.includeGraphContext
      ? this.graphExpander.buildSubgraphSummary(seedNodes, expandedNodes)
      : undefined;

    const totalTime = Date.now() - startTime;

    console.log('[GraphRAG Pipeline] ═════════════════════════════════════════');
    console.log(`[GraphRAG Pipeline] Complete in ${totalTime}ms`);
    console.log(`  Seed nodes: ${seedNodes.length}`);
    console.log(`  Expanded nodes: ${expandedNodes.length}`);
    console.log(`  Final candidates: ${finalCandidates.length}`);
    console.log(`  Top score: ${finalCandidates[0]?.finalScore.toFixed(3) || 'N/A'}`);
    console.log('[GraphRAG Pipeline] ═════════════════════════════════════════\n');

    return {
      candidates: finalCandidates,
      seedNodes,
      expandedNodes,
      metrics: {
        vectorSearchTimeMs: vectorSearchTime,
        graphExpansionTimeMs: graphExpansionTime,
        rankingTimeMs: rankingTime,
        totalTimeMs: totalTime,
        seedNodesCount: seedNodes.length,
        expandedNodesCount: expandedNodes.length,
        finalCandidatesCount: finalCandidates.length,
      },
      graphContext,
    };
  }

  /**
   * Step 1: Vector search to get seed nodes
   * Uses Phase 0.2's VectorRetriever
   */
  private async vectorSearch(query: GraphRAGQuery): Promise<SeedNode[]> {
    const context = {
      query: query.query,
      intent: query.intent,
      filters: query.filters,
    };

    const retrieverResult = await this.vectorRetriever.retrieve(context);

    if (!retrieverResult.success || retrieverResult.items.length === 0) {
      return [];
    }

    // Convert retriever items to seed nodes
    const seedNodes: SeedNode[] = retrieverResult.items
      .filter(item => (item.relevanceScore || 0) >= this.config.vectorThreshold)
      .slice(0, this.config.vectorTopK)
      .map(item => ({
        id: item.id,
        type: item.type as any, // 'fir' | 'person' | 'case' | 'document'
        semanticScore: item.relevanceScore || 0,
        data: item.data,
        source: 'vector_search' as const,
      }));

    return seedNodes;
  }

  /**
   * Build empty result for when no seeds found
   */
  private emptyResult(startTime: number): GraphRAGResult {
    return {
      candidates: [],
      seedNodes: [],
      expandedNodes: [],
      metrics: {
        vectorSearchTimeMs: 0,
        graphExpansionTimeMs: 0,
        rankingTimeMs: 0,
        totalTimeMs: Date.now() - startTime,
        seedNodesCount: 0,
        expandedNodesCount: 0,
        finalCandidatesCount: 0,
      },
    };
  }

  /**
   * Helper: Extract graph-aware context for LLM
   */
  buildLLMContext(result: GraphRAGResult): {
    primaryEvidence: any[];
    graphContext: string;
    relationshipSummary: string;
  } {
    // Primary evidence: top-ranked candidates
    const primaryEvidence = result.candidates.slice(0, 5).map(candidate => ({
      ...candidate.node.data,
      _evidence_score: candidate.finalScore,
      _evidence_type: candidate.isSeedNode ? 'direct_match' : 'graph_connected',
      _graph_path: candidate.evidence.graphPath,
    }));

    // Graph context summary
    const graphContext = result.graphContext?.subgraphSummary || 'No graph context available';

    // Relationship summary
    const relationshipCounts = new Map<string, number>();
    for (const expanded of result.expandedNodes) {
      for (const relType of expanded.relationshipTypes) {
        relationshipCounts.set(relType, (relationshipCounts.get(relType) || 0) + 1);
      }
    }

    const relationshipSummary = Array.from(relationshipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    return {
      primaryEvidence,
      graphContext,
      relationshipSummary,
    };
  }
}
