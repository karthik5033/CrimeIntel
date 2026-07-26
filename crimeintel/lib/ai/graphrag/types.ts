/**
 * GraphRAG Pipeline - Type Definitions
 * Phase 0.4
 * 
 * Graph-aware Retrieval Augmented Generation
 */

export interface GraphRAGQuery {
  query: string;
  intent?: string;
  maxHops?: number; // 1 or 2 for graph expansion
  maxResults?: number;
  includeGraphContext?: boolean;
  filters?: {
    entityTypes?: string[];
    relationshipTypes?: string[];
    dateRange?: { start: Date; end: Date };
  };
}

export interface SeedNode {
  id: string;
  type: 'person' | 'fir' | 'case' | 'document';
  semanticScore: number; // From vector similarity
  data: any;
  source: 'vector_search' | 'sql_query';
}

export interface ExpandedNode {
  id: string;
  type: string;
  data: any;
  hopDistance: number; // 1 or 2 from seed
  relationshipPath: string[]; // Path from seed to this node
  relationshipTypes: string[]; // Types of relationships traversed
  graphProximityScore: number; // Relevance based on graph position
}

export interface GraphRAGCandidate {
  node: ExpandedNode | SeedNode;
  isSeedNode: boolean;
  
  // Scoring components
  semanticScore: number; // From vector similarity
  graphProximityScore: number; // How close to seed in graph
  recencyScore: number; // Temporal relevance
  confidenceScore: number; // Data quality/completeness
  
  // Final score
  finalScore: number;
  
  // Evidence for explainability
  evidence: {
    vectorMatch?: string;
    graphPath?: string;
    temporalContext?: string;
    dataQuality?: string;
  };
}

export interface GraphRAGResult {
  candidates: GraphRAGCandidate[];
  seedNodes: SeedNode[];
  expandedNodes: ExpandedNode[];
  
  metrics: {
    vectorSearchTimeMs: number;
    graphExpansionTimeMs: number;
    rankingTimeMs: number;
    totalTimeMs: number;
    seedNodesCount: number;
    expandedNodesCount: number;
    finalCandidatesCount: number;
  };
  
  graphContext?: {
    subgraphSummary: string;
    keyRelationships: string[];
    clusterInfo?: string;
  };
}

export interface GraphRAGConfig {
  // Vector search params
  vectorTopK: number;
  vectorThreshold: number; // Minimum similarity score
  
  // Graph expansion params
  maxHops: number; // 1 or 2
  maxNodesPerHop: number; // Limit expansion size
  relationshipTypeFilter?: string[]; // Only follow certain edge types
  
  // Re-ranking weights
  weights: {
    semantic: number; // 0-1
    graphProximity: number; // 0-1
    recency: number; // 0-1
    confidence: number; // 0-1
  };
  
  // Output control
  maxFinalResults: number;
  includeGraphContext: boolean;
}
