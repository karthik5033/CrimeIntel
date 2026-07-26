/**
 * Type definitions for Crime Intelligence Layer
 * Phase 0.1 - Standing Computation Indices
 */

export interface ComputedIndex {
  id: string;
  type: IndexType;
  computed_at: Date;
  snapshot_version: string;
  data: any;
  freshness_minutes?: number;
}

export type IndexType =
  | 'hotspot'
  | 'gang-score'
  | 'offender-score'
  | 'similarity'
  | 'embedding'
  | 'graph';

export interface HotspotIndex {
  district_id: string;
  district_name: string;
  station_id?: string;
  station_name?: string;
  lat: number;
  lng: number;
  risk_score: number; // 0-100
  crime_density: number;
  recent_crimes: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  primary_crime_types: string[];
  computed_at: Date;
}

export interface GangScoreIndex {
  cluster_id: string;
  cluster_name?: string;
  member_ids: string[]; // person IDs
  organized_crime_score: number; // 0-100
  cohesion_score: number; // 0-100
  activity_level: 'high' | 'medium' | 'low';
  primary_districts: string[];
  recent_activity_count: number;
  computed_at: Date;
}

export interface OffenderScoreIndex {
  person_id: string;
  person_name: string;
  risk_score: number; // 0-100
  recidivism_probability: number; // 0-1
  offense_count: number;
  last_offense_date?: Date;
  escalation_trend: 'escalating' | 'stable' | 'de-escalating';
  behavioral_consistency: number; // 0-1
  network_activity_score: number; // 0-100
  computed_at: Date;
}

export interface SimilarityIndex {
  source_id: string;
  source_type: 'case' | 'person' | 'fir';
  similar_items: SimilarItem[];
  computed_at: Date;
}

export interface SimilarItem {
  id: string;
  type: 'case' | 'person' | 'fir';
  similarity_score: number; // 0-1
  similarity_reasons: string[];
}

export interface EmbeddingIndex {
  entity_id: string;
  entity_type: 'case' | 'person' | 'fir' | 'narrative';
  embedding: number[];
  text_content: string;
  metadata: Record<string, any>;
  computed_at: Date;
}

export interface GraphIndex {
  snapshot_id: string;
  node_count: number;
  edge_count: number;
  adjacency_data: AdjacencyData;
  centrality_scores: Record<string, number>;
  communities: Community[];
  computed_at: Date;
  metadata?: {
    entity_resolution?: {
      total_raw_persons: number;
      canonical_entities: number;
      merge_ratio: number;
    };
  };
}

export interface AdjacencyData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: 'person' | 'fir' | 'case' | 'vehicle' | 'phone' | 'location';
  label: string;
  metadata: Record<string, any>;
  centrality?: number;
  community_id?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
  metadata?: Record<string, any>;
}

export interface Community {
  id: string;
  member_ids: string[];
  cohesion_score: number;
  primary_crime_type?: string;
  geographic_center?: { lat: number; lng: number };
}

export interface IndexComputationResult {
  success: boolean;
  index_type: IndexType;
  records_computed: number;
  computation_time_ms: number;
  snapshot_version: string;
  error?: string;
}
