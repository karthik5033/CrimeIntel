/**
 * Phase 0.9: Precomputation Engine - Type Definitions
 * 
 * Scheduling system for refreshing Phase 0.1 Intelligence Layer indices
 */

export type JobType =
  | 'offender_scores'
  | 'graph_snapshot'
  | 'embeddings'
  | 'hotspot_index'
  | 'anomaly_flags'
  | 'similarity_index'
  | 'case_summaries';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type JobTrigger = 'nightly' | 'event_driven' | 'manual';

export interface JobDefinition {
  id: string;
  type: JobType;
  name: string;
  description: string;
  trigger: JobTrigger;
  schedule?: string; // Cron expression for nightly jobs
  dependencies: JobType[]; // Jobs that must complete before this job
  estimatedDuration: number; // milliseconds
  enabled: boolean;
}

export interface JobExecution {
  id: string;
  jobType: JobType;
  status: JobStatus;
  trigger: JobTrigger;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  error?: string;
  result?: any;
  metadata: {
    rowsProcessed?: number;
    itemsCreated?: number;
    itemsUpdated?: number;
    cacheHits?: number;
    cacheMisses?: number;
  };
}

export interface JobManifest {
  version: string;
  createdAt: Date;
  jobs: JobDefinition[];
  dependencyGraph: Map<JobType, JobType[]>; // job -> dependencies
  executionOrder: JobType[]; // Topologically sorted execution order
}

export interface PrecomputationResult {
  executionId: string;
  trigger: JobTrigger;
  startedAt: Date;
  completedAt: Date;
  totalDuration: number;
  jobExecutions: JobExecution[];
  summary: {
    totalJobs: number;
    completed: number;
    failed: number;
    skipped: number;
  };
  errors: string[];
}

export interface EventTrigger {
  eventType: 'FIR_CREATED' | 'PERSON_UPDATED' | 'CASE_STATUS_CHANGED';
  payload: any;
  affectedJobs: JobType[];
  issuedAt: Date;
}

export interface JobSchedule {
  jobType: JobType;
  cronExpression: string; // e.g., "0 3 * * *" for 3 AM daily
  timezone: string;
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
}

export interface CacheInvalidation {
  jobType: JobType;
  cacheKeys: string[];
  invalidatedAt: Date;
  reason: string;
}

export interface JobDependencyNode {
  jobType: JobType;
  dependsOn: JobType[];
  dependedBy: JobType[];
}

export interface IncrementalUpdate {
  jobType: JobType;
  updateType: 'insert' | 'update' | 'delete';
  entityIds: string[];
  trigger: EventTrigger;
  executedAt: Date;
  duration: number;
}

/**
 * Job configuration for dependency management
 */
export const JOB_DEFINITIONS: JobDefinition[] = [
  {
    id: 'job-embeddings',
    type: 'embeddings',
    name: 'Embedding Generation',
    description: 'Generate vector embeddings for all case narratives and profiles',
    trigger: 'nightly',
    schedule: '0 1 * * *', // 1 AM daily
    dependencies: [], // No dependencies - runs first
    estimatedDuration: 600000, // 10 minutes
    enabled: true,
  },
  {
    id: 'job-similarity',
    type: 'similarity_index',
    name: 'Similarity Index',
    description: 'Compute case-to-case and person-to-person similarity scores',
    trigger: 'nightly',
    schedule: '0 2 * * *', // 2 AM daily
    dependencies: ['embeddings'], // Needs embeddings first
    estimatedDuration: 300000, // 5 minutes
    enabled: true,
  },
  {
    id: 'job-graph',
    type: 'graph_snapshot',
    name: 'Graph Snapshot',
    description: 'Rebuild graph adjacency, centrality, and community detection',
    trigger: 'nightly',
    schedule: '0 2:30 * * *', // 2:30 AM daily
    dependencies: ['embeddings'], // Can run in parallel with similarity
    estimatedDuration: 900000, // 15 minutes
    enabled: true,
  },
  {
    id: 'job-hotspot',
    type: 'hotspot_index',
    name: 'Hotspot Index',
    description: 'Recompute spatiotemporal crime hotspots',
    trigger: 'nightly',
    schedule: '0 3 * * *', // 3 AM daily
    dependencies: [], // Independent
    estimatedDuration: 180000, // 3 minutes
    enabled: true,
  },
  {
    id: 'job-offender',
    type: 'offender_scores',
    name: 'Offender Risk Scores',
    description: 'Recalculate risk/recidivism scores for all persons',
    trigger: 'nightly',
    schedule: '0 3:15 * * *', // 3:15 AM daily
    dependencies: ['graph_snapshot'], // Needs graph for network features
    estimatedDuration: 240000, // 4 minutes
    enabled: true,
  },
  {
    id: 'job-anomaly',
    type: 'anomaly_flags',
    name: 'Anomaly Detection',
    description: 'Detect statistical anomalies and trend changes',
    trigger: 'nightly',
    schedule: '0 3:30 * * *', // 3:30 AM daily
    dependencies: [], // Independent
    estimatedDuration: 120000, // 2 minutes
    enabled: true,
  },
  {
    id: 'job-summaries',
    type: 'case_summaries',
    name: 'Case Summaries',
    description: 'Generate AI summaries for all cases',
    trigger: 'nightly',
    schedule: '0 4 * * *', // 4 AM daily
    dependencies: ['embeddings', 'graph_snapshot'], // Needs context
    estimatedDuration: 360000, // 6 minutes
    enabled: true,
  },
];
