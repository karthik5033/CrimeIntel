/**
 * Phase 0.10: Evidence Ranking - Type Definitions
 * 
 * Multi-signal scoring system for ranking evidence before LLM context
 */

export interface EvidenceItem {
  id: string;
  type: 'fir' | 'person' | 'case' | 'vehicle' | 'phone' | 'location' | 'document' | 'transaction';
  source: 'sql' | 'graph' | 'vector' | 'ocr' | 'analytics';
  content: any; // The actual data (FIR object, Person object, etc.)
  metadata: {
    retrievedAt: Date;
    confidence?: number; // From entity resolution, OCR, etc.
    dataQuality?: number; // From Phase 0.7 data quality pipeline
  };
}

export interface RankingScores {
  recency: number; // 0-1, how recent is this evidence
  relevance: number; // 0-1, semantic similarity to query
  confidence: number; // 0-1, data quality and resolution confidence
  graphProximity: number; // 0-1, closeness to query entities in graph
  investigationStatus: number; // 0-1, active investigations weighted higher
  composite: number; // 0-1, weighted composite score
}

export interface RankedEvidence extends EvidenceItem {
  scores: RankingScores;
  rank: number; // 1-indexed rank (1 = highest)
  explanation: string; // Human-readable explanation of ranking
}

export interface RankingWeights {
  recency: number; // Weight for recency score (0-1)
  relevance: number; // Weight for relevance score (0-1)
  confidence: number; // Weight for confidence score (0-1)
  graphProximity: number; // Weight for graph proximity score (0-1)
  investigationStatus: number; // Weight for investigation status score (0-1)
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  recency: 0.25,
  relevance: 0.35,
  confidence: 0.15,
  graphProximity: 0.15,
  investigationStatus: 0.10,
};

export interface RankingConfig {
  weights: RankingWeights;
  topK: number; // Number of top items to return
  recencyDecayDays: number; // Days for recency to decay to 0
  minConfidenceThreshold: number; // Filter out items below this confidence (0-1)
  activeInvestigationBoost: number; // Boost multiplier for active investigations (1.0 = no boost)
}

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  weights: DEFAULT_RANKING_WEIGHTS,
  topK: 20, // Default: top 20 items
  recencyDecayDays: 365, // 1 year decay
  minConfidenceThreshold: 0.3, // Filter out low-confidence items
  activeInvestigationBoost: 1.3, // 30% boost for active investigations
};

export interface RankingContext {
  queryText: string;
  queryEmbedding?: number[]; // Vector embedding of the query
  seedEntityIds?: string[]; // Entity IDs mentioned in query (for graph proximity)
  temporalFocus?: Date; // Date the query is focused on (for recency)
  config?: Partial<RankingConfig>;
}

export interface RankingResult {
  rankedEvidence: RankedEvidence[];
  totalItems: number;
  filteredItems: number; // Items filtered out due to confidence threshold
  topKItems: number; // Number of items returned (may be less than config.topK)
  executionTime: number; // milliseconds
  weights: RankingWeights; // Weights used for this ranking
}

export interface ScoreBreakdown {
  evidenceId: string;
  recency: {
    score: number;
    age: number; // days old
    explanation: string;
  };
  relevance: {
    score: number;
    similarityMetric: number;
    explanation: string;
  };
  confidence: {
    score: number;
    dataQualityScore: number;
    resolutionConfidence?: number;
    explanation: string;
  };
  graphProximity: {
    score: number;
    hops?: number;
    pathLength?: number;
    explanation: string;
  };
  investigationStatus: {
    score: number;
    status: string;
    explanation: string;
  };
  composite: {
    score: number;
    weightedContributions: Record<string, number>;
    explanation: string;
  };
}

/**
 * Recency decay curves
 */
export type RecencyDecayMode = 'linear' | 'exponential' | 'logarithmic';

export interface RecencyConfig {
  mode: RecencyDecayMode;
  halfLifeDays?: number; // For exponential decay
}

/**
 * Graph proximity calculation modes
 */
export type GraphProximityMode = 'shortest_path' | 'random_walk' | 'embedding_similarity';

export interface GraphProximityConfig {
  mode: GraphProximityMode;
  maxHops: number; // Maximum graph distance to consider
  decayPerHop: number; // Score decay per hop (0-1)
}
