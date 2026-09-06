/**
 * Hybrid Retrieval Architecture - Type Definitions
 * Phase 0.2
 */

export type RetrieverType = 'sql' | 'graph' | 'vector' | 'ocr' | 'analytics';

export interface QueryContext {
  query: string;
  intent?: string;
  entities?: ExtractedEntity[];
  filters?: QueryFilters;
  sessionId?: string;
  userId?: string;
  role?: string;
}

export interface ExtractedEntity {
  type: 'person' | 'district' | 'station' | 'crime_type' | 'date_range' | 'fir_number';
  value: string;
  normalized?: string;
  confidence?: number;
}

export interface QueryFilters {
  districts?: string[];
  stations?: string[];
  crimeTypes?: string[];
  dateRange?: { start: Date; end: Date };
  personIds?: string[];
  firIds?: string[];
  caseIds?: string[];
}

export interface EvidenceItem {
  id: string;
  type: 'fir' | 'person' | 'case' | 'document' | 'relationship' | 'aggregate';
  source: RetrieverType;
  data: any;
  relevanceScore?: number;
  metadata: {
    retrievedAt: Date;
    matchedOn?: string[];
    confidence?: number;
    [key: string]: any;
  };
}

export interface RetrieverResult {
  retriever: RetrieverType;
  success: boolean;
  items: EvidenceItem[];
  executionTimeMs: number;
  error?: string;
  metadata?: {
    totalMatches?: number;
    queryType?: string;
    cacheHit?: boolean;
    [key: string]: any;
  };
}

export interface MergedEvidence {
  items: EvidenceItem[];
  totalItems: number;
  deduplicated: number;
  sourceBreakdown: Record<RetrieverType, number>;
  executionTimeMs: number;
  retrieverResults: RetrieverResult[];
}

export interface RetrieverConfig {
  enabled: boolean;
  timeout: number; // milliseconds
  maxResults: number;
  fallbackOnError: boolean;
}

export interface HybridRetrievalConfig {
  retrievers: Record<RetrieverType, RetrieverConfig>;
  parallelExecution: boolean;
  deduplicationStrategy: 'strict' | 'fuzzy';
  mergeStrategy: 'union' | 'intersection' | 'weighted';
  timeout: number; // overall timeout
}
