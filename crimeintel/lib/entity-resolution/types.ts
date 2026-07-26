/**
 * Entity Resolution Engine - Type Definitions
 * Phase 0.3
 * 
 * Merges fragmented identities across the database
 */

export interface PersonRecord {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  address?: string;
  phoneNumbers?: string[];
  vehicleNumbers?: string[];
  aliases?: string[];
  idNumbers?: string[]; // Aadhaar, PAN, etc.
  stationId?: string;
  district?: string;
}

export type MatchingMethod = 
  | 'exact_id' 
  | 'exact_phone' 
  | 'exact_vehicle' 
  | 'fuzzy_name' 
  | 'phonetic_name' 
  | 'contextual_address' 
  | 'ml_similarity';

export interface MatchCandidate {
  person1Id: string;
  person2Id: string;
  confidence: number; // 0-1
  method: MatchingMethod;
  evidence: string[];
  suggestedAction: 'auto_merge' | 'review_required' | 'reject';
}

export interface CanonicalPerson {
  canonicalId: string;
  mergedFrom: string[]; // Original person IDs
  name: string; // Primary/most common name
  aliases: string[]; // All name variations
  phoneNumbers: string[];
  vehicleNumbers: string[];
  addresses: string[];
  confidence: number;
  resolutionMethod: MatchingMethod[];
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityAlias {
  id: string;
  personId: string; // Links to CanonicalPerson
  aliasType: 'name' | 'vehicle' | 'phone' | 'nickname' | 'id_number';
  aliasValue: string;
  confidence: number;
  source: string; // Where this alias was discovered
  createdAt: Date;
}

export interface ResolutionMetrics {
  totalPersons: number;
  candidatesGenerated: number;
  autoMerged: number;
  reviewRequired: number;
  rejected: number;
  precision?: number;
  recall?: number;
  processingTimeMs: number;
}

export interface MergeDecision {
  candidateId: string;
  decision: 'merge' | 'reject' | 'needs_review';
  decidedBy: 'auto' | 'human';
  decisionReason: string;
  decidedAt: Date;
}

export interface EntityResolutionConfig {
  exactMatchThreshold: number; // 1.0 for exact
  fuzzyNameThreshold: number; // 0-1, e.g. 0.85
  phoneticThreshold: number; // 0-1
  contextualThreshold: number; // 0-1
  mlThreshold: number; // 0-1
  autoMergeThreshold: number; // 0-1, above this = auto merge
  reviewThreshold: number; // 0-1, below auto but above reject
  enableKannadaMatching: boolean;
  enablePhoneticMatching: boolean;
  enableContextualMatching: boolean;
  enableMLMatching: boolean;
}
