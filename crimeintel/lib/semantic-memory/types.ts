/**
 * Phase 0.11: Semantic Memory - Type Definitions
 * 
 * Structured conversation context (slot-based frames) that replaces raw message replay
 */

/**
 * Conversation frame - structured state of what the investigator is working on
 */
export interface ConversationFrame {
  sessionId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Core context slots
  activeDistrict: string | null; // "Bengaluru", "Mysuru", null = all
  activeCrimeTypes: string[]; // ["Vehicle Theft", "Burglary"]
  activeTimeWindow: TimeWindow | null;
  activeEntities: EntityReference[]; // Persons, FIRs, Cases being discussed
  activeFocus: InvestigationFocus | null; // "repeat offenders", "money trail", etc.
  
  // Metadata
  queryCount: number; // Number of queries in this session
  lastActivity: Date;
  confidence: number; // How confident we are about the frame (0-1)
}

/**
 * Time window with natural language representation
 */
export interface TimeWindow {
  startDate: Date;
  endDate: Date;
  label: string; // "last 3 months", "this year", "2024-2025"
  isRelative: boolean; // true for "last X", false for absolute dates
}

/**
 * Reference to an entity mentioned in conversation
 */
export interface EntityReference {
  type: 'person' | 'fir' | 'case' | 'location' | 'vehicle' | 'station';
  id: string;
  name: string; // Human-readable name
  mentionedAt: Date;
  relevance: number; // 0-1, decays over time
}

/**
 * Investigation focus - what aspect is the investigator working on
 */
export type InvestigationFocus =
  | 'repeat_offenders'
  | 'money_trail'
  | 'network_connections'
  | 'crime_patterns'
  | 'hotspot_analysis'
  | 'case_resolution'
  | 'evidence_gathering'
  | 'suspect_profiling'
  | 'temporal_trends'
  | 'geographic_analysis'
  | null;

/**
 * Slot update - incremental change to the frame
 */
export interface SlotUpdate {
  slot: keyof ConversationFrame;
  value: any;
  confidence: number; // How confident we are about this update
  source: 'explicit' | 'inferred' | 'fallback'; // How we determined this
}

/**
 * Frame update result
 */
export interface FrameUpdateResult {
  frame: ConversationFrame;
  updates: SlotUpdate[];
  changed: boolean;
  explanation: string; // Human-readable explanation of what changed
}

/**
 * Query enrichment - original query + frame context
 */
export interface EnrichedQuery {
  originalQuery: string;
  enrichedQuery: string; // Query with frame context added
  frame: ConversationFrame;
  contextAdded: string[]; // Which context elements were added
  confidence: number;
}

/**
 * Frame persistence options
 */
export interface FramePersistenceOptions {
  ttl: number; // Time-to-live in seconds (default: 30 minutes)
  decayRate: number; // How fast entity relevance decays (0-1)
  maxEntities: number; // Maximum entities to track (default: 20)
  autoCleanup: boolean; // Remove irrelevant entities automatically
}

/**
 * Frame query - retrieve frame by various criteria
 */
export interface FrameQuery {
  sessionId?: string;
  userId?: string;
  activeDistrict?: string;
  activeCrimeTypes?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Frame analytics - insights about conversation patterns
 */
export interface FrameAnalytics {
  sessionId: string;
  totalQueries: number;
  dominantDistrict: string | null;
  dominantCrimeTypes: string[];
  averageTimeWindow: number; // Average window size in days
  mostMentionedEntities: EntityReference[];
  investigationFocusHistory: InvestigationFocus[];
  sessionDuration: number; // milliseconds
}

/**
 * Context extraction result - extracted context from a query
 */
export interface ContextExtraction {
  district: string | null;
  crimeTypes: string[];
  timeWindow: TimeWindow | null;
  entities: EntityReference[];
  focus: InvestigationFocus | null;
  confidence: number;
  ambiguities: string[]; // Things that couldn't be confidently determined
}

/**
 * Frame diff - changes between two frames
 */
export interface FrameDiff {
  sessionId: string;
  before: ConversationFrame;
  after: ConversationFrame;
  changes: Array<{
    slot: keyof ConversationFrame;
    oldValue: any;
    newValue: any;
    reason: string;
  }>;
  timestamp: Date;
}

/**
 * Configuration for semantic memory system
 */
export interface SemanticMemoryConfig {
  persistence: FramePersistenceOptions;
  extraction: {
    minConfidenceThreshold: number; // Minimum confidence to update frame (0-1)
    enableInference: boolean; // Allow inferring context from conversation
    enableCorrection: boolean; // Allow user to correct frame
  };
  decay: {
    entityRelevanceHalfLife: number; // Half-life for entity relevance (seconds)
    timeWindowExpansion: number; // How much to expand time windows (days)
  };
}

export const DEFAULT_SEMANTIC_MEMORY_CONFIG: SemanticMemoryConfig = {
  persistence: {
    ttl: 1800, // 30 minutes
    decayRate: 0.1, // 10% decay per update
    maxEntities: 20,
    autoCleanup: true,
  },
  extraction: {
    minConfidenceThreshold: 0.6,
    enableInference: true,
    enableCorrection: true,
  },
  decay: {
    entityRelevanceHalfLife: 600, // 10 minutes
    timeWindowExpansion: 7, // Expand by 1 week if ambiguous
  },
};
