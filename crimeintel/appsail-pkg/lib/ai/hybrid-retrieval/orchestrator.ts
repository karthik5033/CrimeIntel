/**
 * Hybrid Retrieval Orchestrator
 * Phase 0.2
 * 
 * Fans out to 5 retrievers in parallel, merges and deduplicates results
 */

import {
  QueryContext,
  RetrieverType,
  EvidenceItem,
  RetrieverResult,
  MergedEvidence,
  HybridRetrievalConfig,
} from './types';

import { SQLRetriever } from './retrievers/sql-retriever';
import { GraphRetriever } from './retrievers/graph-retriever';
import { VectorRetriever } from './retrievers/vector-retriever';
import { OCRRetriever } from './retrievers/ocr-retriever';
import { AnalyticsRetriever } from './retrievers/analytics-retriever';

// Phase 0.4 GraphRAG Integration
import { GraphRAGPipeline } from '../graphrag/graphrag-pipeline';
import { GraphRAGQuery } from '../graphrag/types';

export class HybridRetrievalOrchestrator {
  private config: HybridRetrievalConfig;
  private sqlRetriever: SQLRetriever;
  private graphRetriever: GraphRetriever;
  private vectorRetriever: VectorRetriever;
  private ocrRetriever: OCRRetriever;
  private analyticsRetriever: AnalyticsRetriever;
  
  // Phase 0.4: GraphRAG Pipeline for relationship-heavy queries
  private graphRAGPipeline?: GraphRAGPipeline;
  private useGraphRAG: boolean;

  constructor(config?: Partial<HybridRetrievalConfig>) {
    this.config = {
      retrievers: {
        sql: { enabled: true, timeout: 2000, maxResults: 20, fallbackOnError: true },
        graph: { enabled: true, timeout: 2000, maxResults: 15, fallbackOnError: true },
        vector: { enabled: true, timeout: 2000, maxResults: 10, fallbackOnError: true },
        ocr: { enabled: true, timeout: 3000, maxResults: 10, fallbackOnError: true },
        analytics: { enabled: true, timeout: 1000, maxResults: 10, fallbackOnError: true },
      },
      parallelExecution: true,
      deduplicationStrategy: 'fuzzy',
      mergeStrategy: 'union',
      timeout: 5000,
      ...config,
    };

    // Initialize retrievers
    this.sqlRetriever = new SQLRetriever(this.config.retrievers.sql);
    this.graphRetriever = new GraphRetriever(this.config.retrievers.graph);
    this.vectorRetriever = new VectorRetriever(this.config.retrievers.vector);
    this.ocrRetriever = new OCRRetriever(this.config.retrievers.ocr);
    this.analyticsRetriever = new AnalyticsRetriever(this.config.retrievers.analytics);
    
    // Phase 0.4: Initialize GraphRAG for relationship-heavy queries
    // Disabled by default, enabled via config or intent detection
    this.useGraphRAG = (config as any)?.useGraphRAG || false;
    if (this.useGraphRAG) {
      this.graphRAGPipeline = new GraphRAGPipeline({
        vectorTopK: 10,
        maxHops: 2,
        maxNodesPerHop: 50,
        maxFinalResults: 20,
      });
      console.log('[Hybrid Retrieval] GraphRAG mode ENABLED');
    }
  }

  /**
   * Main retrieval method - orchestrates all retrievers
   * Phase 0.4 Integration: Detects relationship queries and uses GraphRAG
   */
  async retrieve(context: QueryContext): Promise<MergedEvidence> {
    const startTime = Date.now();

    console.log('[Hybrid Retrieval] Starting retrieval for query:', context.query);
    console.log('[Hybrid Retrieval] Parallel execution:', this.config.parallelExecution);
    console.log('[Hybrid Retrieval] Intent:', context.intent);

    // Phase 0.4: Use GraphRAG for relationship-heavy queries
    const isRelationshipQuery = this.isRelationshipQuery(context);
    
    if (isRelationshipQuery && this.graphRAGPipeline) {
      console.log('[Hybrid Retrieval] 🕸️  Detected RELATIONSHIP query → using GraphRAG pipeline');
      return await this.retrieveViaGraphRAG(context, startTime);
    }

    try {
      // Standard hybrid retrieval (no GraphRAG)
      // Fan out to all enabled retrievers
      const retrieverResults = this.config.parallelExecution
        ? await this.retrieveParallel(context)
        : await this.retrieveSequential(context);

      // Log retriever performance
      this.logRetrieverPerformance(retrieverResults);

      // Merge and deduplicate results
      const mergedItems = this.mergeResults(retrieverResults);
      const deduplicatedItems = this.deduplicateResults(mergedItems);

      // Calculate source breakdown
      const sourceBreakdown = this.calculateSourceBreakdown(deduplicatedItems);

      const totalTime = Date.now() - startTime;

      console.log('[Hybrid Retrieval] Complete:', {
        totalItems: deduplicatedItems.length,
        deduplicated: mergedItems.length - deduplicatedItems.length,
        executionTimeMs: totalTime,
        sourceBreakdown,
      });

      return {
        items: deduplicatedItems,
        totalItems: deduplicatedItems.length,
        deduplicated: mergedItems.length - deduplicatedItems.length,
        sourceBreakdown,
        executionTimeMs: totalTime,
        retrieverResults,
      };
    } catch (error: any) {
      console.error('[Hybrid Retrieval] Error:', error.message);
      throw error;
    }
  }

  /**
   * Phase 0.4: Detect if query is relationship-heavy
   */
  private isRelationshipQuery(context: QueryContext): boolean {
    if (!this.useGraphRAG) return false;
    
    // Check intent
    if (context.intent === 'RELATIONSHIP_QUERY') return true;
    
    // Check for relationship keywords in query
    const relationshipKeywords = [
      'connect', 'connection', 'link', 'relationship', 'associate',
      'gang', 'network', 'group', 'related to',
      'who knows', 'who introduced', 'co-accused', 'accomplice',
      'path between', 'how are', 'linked',
    ];
    
    const queryLower = context.query.toLowerCase();
    return relationshipKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Phase 0.4: GraphRAG retrieval pipeline
   * Vector search → Graph expansion → Multi-signal re-ranking
   */
  private async retrieveViaGraphRAG(context: QueryContext, startTime: number): Promise<MergedEvidence> {
    if (!this.graphRAGPipeline) {
      throw new Error('GraphRAG pipeline not initialized');
    }

    // Build GraphRAG query
    const graphRAGQuery: GraphRAGQuery = {
      query: context.query,
      intent: context.intent,
      filters: context.filters,
      entityContext: context.entityContext,
    };

    // Execute GraphRAG pipeline
    const graphRAGResult = await this.graphRAGPipeline.retrieve(graphRAGQuery);

    // Convert GraphRAG candidates to EvidenceItems
    const items: EvidenceItem[] = graphRAGResult.candidates.map(candidate => ({
      id: candidate.node.id,
      type: candidate.node.type as any,
      source: 'graph' as RetrieverType, // Mark as coming from graph
      relevanceScore: candidate.finalScore,
      data: candidate.node.data,
      metadata: {
        graphRAG: true,
        isSeedNode: candidate.isSeedNode,
        hopDistance: candidate.hopDistance,
        graphPath: candidate.evidence.graphPath,
        scoringDetails: candidate.scoringDetails,
      },
      confidence: candidate.evidence.confidence,
      timestamp: new Date(),
    }));

    const totalTime = Date.now() - startTime;

    // Build source breakdown (all from graph in GraphRAG mode)
    const sourceBreakdown: Record<RetrieverType, number> = {
      sql: 0,
      graph: items.length, // All items attributed to graph
      vector: 0,
      ocr: 0,
      analytics: 0,
    };

    console.log('[Hybrid Retrieval] GraphRAG Complete:', {
      totalItems: items.length,
      seedNodes: graphRAGResult.seedNodes.length,
      expandedNodes: graphRAGResult.expandedNodes.length,
      executionTimeMs: totalTime,
      metrics: graphRAGResult.metrics,
    });

    return {
      items,
      totalItems: items.length,
      deduplicated: 0, // GraphRAG handles dedup internally
      sourceBreakdown,
      executionTimeMs: totalTime,
      retrieverResults: [{
        retriever: 'graph',
        success: true,
        items,
        executionTimeMs: totalTime,
        metadata: {
          graphRAG: true,
          metrics: graphRAGResult.metrics,
          graphContext: graphRAGResult.graphContext,
        },
      }],
    };
  }

  /**
   * Execute all retrievers in parallel (faster, default)
   */
  private async retrieveParallel(context: QueryContext): Promise<RetrieverResult[]> {
    const retrievalPromises: Promise<RetrieverResult>[] = [];

    if (this.config.retrievers.sql.enabled) {
      retrievalPromises.push(
        this.withTimeout(this.sqlRetriever.retrieve(context), this.config.retrievers.sql.timeout, 'sql')
      );
    }

    if (this.config.retrievers.graph.enabled) {
      retrievalPromises.push(
        this.withTimeout(this.graphRetriever.retrieve(context), this.config.retrievers.graph.timeout, 'graph')
      );
    }

    if (this.config.retrievers.vector.enabled) {
      retrievalPromises.push(
        this.withTimeout(this.vectorRetriever.retrieve(context), this.config.retrievers.vector.timeout, 'vector')
      );
    }

    if (this.config.retrievers.ocr.enabled) {
      retrievalPromises.push(
        this.withTimeout(this.ocrRetriever.retrieve(context), this.config.retrievers.ocr.timeout, 'ocr')
      );
    }

    if (this.config.retrievers.analytics.enabled) {
      retrievalPromises.push(
        this.withTimeout(this.analyticsRetriever.retrieve(context), this.config.retrievers.analytics.timeout, 'analytics')
      );
    }

    // Wait for all retrievers (with timeout handling)
    const results = await Promise.allSettled(retrievalPromises);

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Timeout or error - return empty result
        const retrieverType = ['sql', 'graph', 'vector', 'ocr', 'analytics'][index] as RetrieverType;
        console.warn(`[Hybrid Retrieval] ${retrieverType} retriever failed:`, result.reason);
        return {
          retriever: retrieverType,
          success: false,
          items: [],
          executionTimeMs: 0,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Execute retrievers sequentially (slower, for debugging)
   */
  private async retrieveSequential(context: QueryContext): Promise<RetrieverResult[]> {
    const results: RetrieverResult[] = [];

    if (this.config.retrievers.sql.enabled) {
      results.push(await this.sqlRetriever.retrieve(context));
    }

    if (this.config.retrievers.graph.enabled) {
      results.push(await this.graphRetriever.retrieve(context));
    }

    if (this.config.retrievers.vector.enabled) {
      results.push(await this.vectorRetriever.retrieve(context));
    }

    if (this.config.retrievers.ocr.enabled) {
      results.push(await this.ocrRetriever.retrieve(context));
    }

    if (this.config.retrievers.analytics.enabled) {
      results.push(await this.analyticsRetriever.retrieve(context));
    }

    return results;
  }

  /**
   * Merge results from all retrievers
   */
  private mergeResults(retrieverResults: RetrieverResult[]): EvidenceItem[] {
    const allItems: EvidenceItem[] = [];

    for (const result of retrieverResults) {
      if (result.success && result.items.length > 0) {
        allItems.push(...result.items);
      }
    }

    return allItems;
  }

  /**
   * Deduplicate results by entity ID
   */
  private deduplicateResults(items: EvidenceItem[]): EvidenceItem[] {
    const seen = new Map<string, EvidenceItem>();

    for (const item of items) {
      // Create deduplication key based on type and id
      const key = `${item.type}-${item.id}`;

      if (!seen.has(key)) {
        seen.set(key, item);
      } else {
        // Keep the one with higher relevance score
        const existing = seen.get(key)!;
        if ((item.relevanceScore || 0) > (existing.relevanceScore || 0)) {
          seen.set(key, item);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Calculate how many items came from each source
   */
  private calculateSourceBreakdown(items: EvidenceItem[]): Record<RetrieverType, number> {
    const breakdown: Record<RetrieverType, number> = {
      sql: 0,
      graph: 0,
      vector: 0,
      ocr: 0,
      analytics: 0,
    };

    for (const item of items) {
      breakdown[item.source]++;
    }

    return breakdown;
  }

  /**
   * Log retriever performance metrics
   */
  private logRetrieverPerformance(results: RetrieverResult[]): void {
    console.log('[Hybrid Retrieval] Retriever Performance:');
    
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      console.log(
        `  ${status} ${result.retriever.padEnd(10)}: ${result.executionTimeMs}ms, ` +
        `${result.items.length} items` +
        (result.metadata?.cacheHit ? ' (cached)' : '')
      );
    }
  }

  /**
   * Wrap promise with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    retrieverName: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${retrieverName} retriever timeout`)), timeoutMs)
      ),
    ]);
  }
}
