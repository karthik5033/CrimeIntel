/**
 * Crime Intelligence Layer - Main Coordinator
 * Phase 0.1 - Standing Computation System
 * 
 * This layer sits between the Data Store and all other systems,
 * providing precomputed indices that eliminate on-demand computation.
 */

import { HotspotComputer, CrimeRecord } from './hotspot-computer';
import { OffenderScoreComputer, PersonRecord } from './offender-score-computer';
import { GangScoreComputer, PersonConnection, CommunityDetector } from './gang-score-computer';
import { SimilarityComputer, EntityForSimilarity } from './similarity-computer';
import { EmbeddingComputer, EntityForEmbedding } from './embedding-computer';
import { GraphComputer, RawGraphData } from './graph-computer';
import {
  IndexType,
  IndexComputationResult,
  HotspotIndex,
  OffenderScoreIndex,
  GangScoreIndex,
} from './types';

export interface IntelligenceLayerConfig {
  enableCache: boolean;
  cacheExpiryMinutes: number;
  enableAutoRefresh: boolean;
  autoRefreshIntervalMinutes: number;
}

export class IntelligenceLayer {
  private hotspotComputer: HotspotComputer;
  private offenderScoreComputer: OffenderScoreComputer;
  private gangScoreComputer: GangScoreComputer;
  private communityDetector: CommunityDetector;
  private similarityComputer: SimilarityComputer;
  private embeddingComputer: EmbeddingComputer;
  private graphComputer: GraphComputer;
  
  private config: IntelligenceLayerConfig;
  
  // In-memory cache (in production, use Catalyst Cache)
  private cache = new Map<string, { data: any; computed_at: Date }>();

  constructor(config?: Partial<IntelligenceLayerConfig>) {
    this.config = {
      enableCache: true,
      cacheExpiryMinutes: 60,
      enableAutoRefresh: false,
      autoRefreshIntervalMinutes: 1440, // 24 hours
      ...config,
    };

    this.hotspotComputer = new HotspotComputer();
    this.offenderScoreComputer = new OffenderScoreComputer();
    this.gangScoreComputer = new GangScoreComputer();
    this.communityDetector = new CommunityDetector();
    this.similarityComputer = new SimilarityComputer();
    this.embeddingComputer = new EmbeddingComputer();
    this.graphComputer = new GraphComputer();
  }

  /**
   * Compute all indices from raw data
   */
  async computeAll(data: {
    crimes: CrimeRecord[];
    persons: PersonRecord[];
    connections: PersonConnection[];
    entitiesForSimilarity: EntityForSimilarity[];
    entitiesForEmbedding: EntityForEmbedding[];
    graphData: RawGraphData;
  }): Promise<{
    hotspots: IndexComputationResult;
    offenderScores: IndexComputationResult;
    gangScores: IndexComputationResult;
    similarity: IndexComputationResult;
    embeddings: IndexComputationResult;
    graph: IndexComputationResult;
  }> {
    console.log('[Intelligence Layer] Computing all 6 indices...');

    // Compute in parallel for efficiency
    const [hotspots, offenderScores, gangScores, similarity, embeddings, graph] =
      await Promise.all([
        this.computeHotspots(data.crimes),
        this.computeOffenderScores(data.persons),
        this.computeGangScores(data.connections),
        this.computeSimilarity(data.entitiesForSimilarity),
        this.computeEmbeddings(data.entitiesForEmbedding),
        this.computeGraph(data.graphData),
      ]);

    return { hotspots, offenderScores, gangScores, similarity, embeddings, graph };
  }

  /**
   * Compute hotspot index
   */
  async computeHotspots(crimes: CrimeRecord[]): Promise<IndexComputationResult> {
    console.log(`[Intelligence Layer] Computing hotspot index from ${crimes.length} crimes...`);
    
    const result = await this.hotspotComputer.compute(crimes);
    
    if (result.success && this.config.enableCache) {
      this.cache.set('hotspot-index', {
        data: result,
        computed_at: new Date(),
      });
    }
    
    return result;
  }

  /**
   * Compute offender score index
   */
  async computeOffenderScores(persons: PersonRecord[]): Promise<IndexComputationResult> {
    console.log(`[Intelligence Layer] Computing offender scores for ${persons.length} persons...`);
    
    const result = await this.offenderScoreComputer.compute(persons);
    
    if (result.success && this.config.enableCache) {
      this.cache.set('offender-score-index', {
        data: result,
        computed_at: new Date(),
      });
    }
    
    return result;
  }

  /**
   * Compute gang score index
   */
  async computeGangScores(connections: PersonConnection[]): Promise<IndexComputationResult> {
    console.log(`[Intelligence Layer] Computing gang scores from ${connections.length} connections...`);
    
    // First detect communities
    const communities = this.communityDetector.detect(connections);
    console.log(`[Intelligence Layer] Detected ${communities.length} communities`);
    
    const result = await this.gangScoreComputer.compute(connections, communities);
    
    if (result.success && this.config.enableCache) {
      this.cache.set('gang-score-index', {
        data: result,
        computed_at: new Date(),
      });
    }
    
    return result;
  }

  /**
   * Get cached index or recompute if expired
   */
  async getIndex(indexType: IndexType): Promise<any> {
    if (!this.config.enableCache) {
      throw new Error('Cache disabled - cannot retrieve index');
    }

    const cached = this.cache.get(`${indexType}-index`);
    
    if (!cached) {
      throw new Error(`Index ${indexType} not computed yet`);
    }

    // Check if expired
    const ageMinutes = (Date.now() - cached.computed_at.getTime()) / 1000 / 60;
    if (ageMinutes > this.config.cacheExpiryMinutes) {
      console.log(`[Intelligence Layer] Index ${indexType} expired (${ageMinutes.toFixed(1)} minutes old)`);
      throw new Error(`Index ${indexType} expired - recomputation needed`);
    }

    return cached.data;
  }

  /**
   * Get freshness status of all indices
   */
  getFreshnessStatus(): Record<IndexType, { computed_at?: Date; age_minutes?: number; is_fresh: boolean }> {
    const status: any = {
      hotspot: { is_fresh: false },
      'gang-score': { is_fresh: false },
      'offender-score': { is_fresh: false },
      similarity: { is_fresh: false },
      embedding: { is_fresh: false },
      graph: { is_fresh: false },
    };

    for (const [key, value] of this.cache.entries()) {
      const indexType = key.replace('-index', '') as IndexType;
      const ageMinutes = (Date.now() - value.computed_at.getTime()) / 1000 / 60;
      
      status[indexType] = {
        computed_at: value.computed_at,
        age_minutes: ageMinutes,
        is_fresh: ageMinutes < this.config.cacheExpiryMinutes,
      };
    }

    return status;
  }

  /**
   * Clear all cached indices
   */
  clearCache(): void {
    console.log('[Intelligence Layer] Clearing all cached indices');
    this.cache.clear();
  }
}

// Export all types and computers
export * from './types';
export * from './hotspot-computer';
export * from './offender-score-computer';
export * from './gang-score-computer';
export * from './similarity-computer';
export * from './embedding-computer';
export * from './graph-computer';

  /**
   * Compute similarity index
   */
  async computeSimilarity(entities: EntityForSimilarity[]): Promise<IndexComputationResult> {
    console.log(`[Intelligence Layer] Computing similarity index for ${entities.length} entities...`);
    
    const result = await this.similarityComputer.compute(entities);
    
    if (result.success && this.config.enableCache) {
      this.cache.set('similarity-index', {
        data: result,
        computed_at: new Date(),
      });
    }
    
    return result;
  }

  /**
   * Compute embedding index
   */
  async computeEmbeddings(entities: EntityForEmbedding[]): Promise<IndexComputationResult> {
    console.log(`[Intelligence Layer] Computing embeddings for ${entities.length} entities...`);
    
    const result = await this.embeddingComputer.compute(entities);
    
    if (result.success && this.config.enableCache) {
      this.cache.set('embedding-index', {
        data: result,
        computed_at: new Date(),
      });
    }
    
    return result;
  }

  /**
   * Compute graph index
   */
  async computeGraph(graphData: RawGraphData): Promise<IndexComputationResult> {
    console.log(`[Intelligence Layer] Computing graph index (${graphData.nodes.length} nodes, ${graphData.edges.length} edges)...`);
    
    const result = await this.graphComputer.compute(graphData);
    
    if (result.success && this.config.enableCache) {
      this.cache.set('graph-index', {
        data: result,
        computed_at: new Date(),
      });
    }
    
    return result;
  }
