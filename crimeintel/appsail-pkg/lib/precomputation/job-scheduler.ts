/**
 * Phase 0.9: Job Scheduler
 * 
 * Orchestrates nightly + event-driven execution of precomputation jobs
 */

import {
  JobType,
  JobStatus,
  JobTrigger,
  JobDefinition,
  JobExecution,
  JobManifest,
  PrecomputationResult,
  EventTrigger,
  JOB_DEFINITIONS,
} from './types';

export class JobScheduler {
  private jobManifest: JobManifest;
  private executionHistory: JobExecution[] = [];
  private activeExecutions: Map<string, JobExecution> = new Map();

  constructor() {
    this.jobManifest = this.buildJobManifest();
    console.log(`[Job Scheduler] Initialized with ${this.jobManifest.jobs.length} jobs`);
  }

  /**
   * Build job manifest with dependency resolution
   */
  private buildJobManifest(): JobManifest {
    const dependencyGraph = new Map<JobType, JobType[]>();
    
    // Build dependency graph
    for (const job of JOB_DEFINITIONS) {
      dependencyGraph.set(job.type, job.dependencies);
    }

    // Topological sort to get execution order
    const executionOrder = this.topologicalSort(JOB_DEFINITIONS);

    return {
      version: '1.0.0',
      createdAt: new Date(),
      jobs: JOB_DEFINITIONS,
      dependencyGraph,
      executionOrder,
    };
  }

  /**
   * Topological sort for dependency-ordered execution
   */
  private topologicalSort(jobs: JobDefinition[]): JobType[] {
    const sorted: JobType[] = [];
    const visited = new Set<JobType>();
    const visiting = new Set<JobType>();

    const visit = (jobType: JobType): void => {
      if (visited.has(jobType)) return;
      if (visiting.has(jobType)) {
        throw new Error(`Circular dependency detected for job: ${jobType}`);
      }

      visiting.add(jobType);

      const job = jobs.find(j => j.type === jobType);
      if (job) {
        for (const dep of job.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(jobType);
      visited.add(jobType);
      sorted.push(jobType);
    };

    for (const job of jobs) {
      if (job.enabled) {
        visit(job.type);
      }
    }

    return sorted;
  }

  /**
   * Execute all jobs in nightly batch mode
   */
  async executeNightlyBatch(): Promise<PrecomputationResult> {
    const executionId = `nightly-${Date.now()}`;
    const startedAt = new Date();

    console.log(`\n[Job Scheduler] Starting nightly batch execution: ${executionId}`);
    console.log(`[Job Scheduler] Execution order: ${this.jobManifest.executionOrder.join(' → ')}\n`);

    const jobExecutions: JobExecution[] = [];
    const errors: string[] = [];

    // Execute jobs in dependency order
    for (const jobType of this.jobManifest.executionOrder) {
      const job = this.jobManifest.jobs.find(j => j.type === jobType);
      
      if (!job || !job.enabled) {
        console.log(`[Job Scheduler] Skipping disabled job: ${jobType}`);
        continue;
      }

      // Check if dependencies succeeded
      const canExecute = this.checkDependencies(job, jobExecutions);
      
      if (!canExecute) {
        console.log(`[Job Scheduler] Skipping ${jobType} due to failed dependencies`);
        jobExecutions.push({
          id: `${executionId}-${jobType}`,
          jobType,
          status: 'skipped',
          trigger: 'nightly',
          startedAt: new Date(),
          metadata: {},
        });
        continue;
      }

      // Execute job
      const execution = await this.executeJob(job, 'nightly', executionId);
      jobExecutions.push(execution);

      if (execution.status === 'failed') {
        errors.push(`${jobType}: ${execution.error}`);
      }
    }

    const completedAt = new Date();
    const totalDuration = completedAt.getTime() - startedAt.getTime();

    const result: PrecomputationResult = {
      executionId,
      trigger: 'nightly',
      startedAt,
      completedAt,
      totalDuration,
      jobExecutions,
      summary: {
        totalJobs: jobExecutions.length,
        completed: jobExecutions.filter(j => j.status === 'completed').length,
        failed: jobExecutions.filter(j => j.status === 'failed').length,
        skipped: jobExecutions.filter(j => j.status === 'skipped').length,
      },
      errors,
    };

    this.executionHistory.push(...jobExecutions);

    console.log(`\n[Job Scheduler] Nightly batch complete: ${result.summary.completed}/${result.summary.totalJobs} succeeded`);
    console.log(`[Job Scheduler] Total duration: ${(totalDuration / 1000).toFixed(1)}s\n`);

    return result;
  }

  /**
   * Check if job dependencies are satisfied
   */
  private checkDependencies(job: JobDefinition, executions: JobExecution[]): boolean {
    for (const depType of job.dependencies) {
      const depExecution = executions.find(e => e.jobType === depType);
      
      if (!depExecution) {
        console.log(`[Job Scheduler] Dependency ${depType} not executed yet`);
        return false;
      }

      if (depExecution.status !== 'completed') {
        console.log(`[Job Scheduler] Dependency ${depType} failed or skipped`);
        return false;
      }
    }

    return true;
  }

  /**
   * Execute a single job
   */
  private async executeJob(
    job: JobDefinition,
    trigger: JobTrigger,
    executionId: string
  ): Promise<JobExecution> {
    const execution: JobExecution = {
      id: `${executionId}-${job.type}`,
      jobType: job.type,
      status: 'running',
      trigger,
      startedAt: new Date(),
      metadata: {},
    };

    this.activeExecutions.set(execution.id, execution);

    console.log(`[${job.type}] Starting...`);

    try {
      // Execute the job (mock for now - will integrate with Phase 0.1)
      const result = await this.runJobLogic(job);

      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.status = 'completed';
      execution.result = result;
      execution.metadata = result.metadata || {};

      console.log(`[${job.type}] ✓ Completed in ${(execution.duration / 1000).toFixed(1)}s`);
    } catch (error: any) {
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.status = 'failed';
      execution.error = error.message;

      console.log(`[${job.type}] ✗ Failed: ${error.message}`);
    }

    this.activeExecutions.delete(execution.id);

    return execution;
  }

  /**
   * Run job-specific logic (integrates with Phase 0.1)
   */
  private async runJobLogic(job: JobDefinition): Promise<any> {
    // Simulate work with timeout
    const duration = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, duration));

    // Mock result based on job type
    const results: Record<JobType, any> = {
      embeddings: {
        embeddingsGenerated: 524,
        avgDimension: 768,
        metadata: { rowsProcessed: 524, itemsCreated: 524 },
      },
      similarity_index: {
        similarityPairsComputed: 15000,
        avgSimilarity: 0.42,
        metadata: { rowsProcessed: 524, itemsCreated: 15000 },
      },
      graph_snapshot: {
        nodesProcessed: 650,
        edgesProcessed: 2100,
        communitiesDetected: 12,
        metadata: { rowsProcessed: 650, itemsCreated: 2100 },
      },
      hotspot_index: {
        hotspotsDetected: 28,
        districtsProcessed: 10,
        metadata: { rowsProcessed: 200, itemsCreated: 28 },
      },
      offender_scores: {
        scoresComputed: 382,
        highRiskCount: 45,
        metadata: { rowsProcessed: 382, itemsUpdated: 382 },
      },
      anomaly_flags: {
        anomaliesDetected: 7,
        flagsRaised: 3,
        metadata: { rowsProcessed: 200, itemsCreated: 7 },
      },
      case_summaries: {
        summariesGenerated: 85,
        avgLength: 250,
        metadata: { rowsProcessed: 85, itemsCreated: 85 },
      },
    };

    return results[job.type] || {};
  }

  /**
   * Execute specific jobs triggered by events
   */
  async executeEventTriggered(event: EventTrigger): Promise<PrecomputationResult> {
    const executionId = `event-${event.eventType}-${Date.now()}`;
    const startedAt = new Date();

    console.log(`\n[Job Scheduler] Event triggered execution: ${event.eventType}`);
    console.log(`[Job Scheduler] Affected jobs: ${event.affectedJobs.join(', ')}\n`);

    const jobExecutions: JobExecution[] = [];
    const errors: string[] = [];

    for (const jobType of event.affectedJobs) {
      const job = this.jobManifest.jobs.find(j => j.type === jobType);
      
      if (!job || !job.enabled) {
        continue;
      }

      // For event-driven, use incremental update if possible
      const execution = await this.executeIncrementalUpdate(job, event, executionId);
      jobExecutions.push(execution);

      if (execution.status === 'failed') {
        errors.push(`${jobType}: ${execution.error}`);
      }
    }

    const completedAt = new Date();
    const totalDuration = completedAt.getTime() - startedAt.getTime();

    return {
      executionId,
      trigger: 'event_driven',
      startedAt,
      completedAt,
      totalDuration,
      jobExecutions,
      summary: {
        totalJobs: jobExecutions.length,
        completed: jobExecutions.filter(j => j.status === 'completed').length,
        failed: jobExecutions.filter(j => j.status === 'failed').length,
        skipped: jobExecutions.filter(j => j.status === 'skipped').length,
      },
      errors,
    };
  }

  /**
   * Execute incremental update (event-driven optimization)
   */
  private async executeIncrementalUpdate(
    job: JobDefinition,
    event: EventTrigger,
    executionId: string
  ): Promise<JobExecution> {
    const execution: JobExecution = {
      id: `${executionId}-${job.type}`,
      jobType: job.type,
      status: 'running',
      trigger: 'event_driven',
      startedAt: new Date(),
      metadata: {},
    };

    console.log(`[${job.type}] Incremental update for ${event.eventType}...`);

    try {
      // Incremental update logic (much faster than full recompute)
      const duration = Math.random() * 200 + 100; // 100-300ms (much faster)
      await new Promise(resolve => setTimeout(resolve, duration));

      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.status = 'completed';
      execution.result = { incremental: true, eventType: event.eventType };
      execution.metadata = { itemsUpdated: 1 };

      console.log(`[${job.type}] ✓ Incremental update in ${execution.duration}ms`);
    } catch (error: any) {
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.status = 'failed';
      execution.error = error.message;

      console.log(`[${job.type}] ✗ Failed: ${error.message}`);
    }

    return execution;
  }

  /**
   * Get job manifest (for admin panel)
   */
  getJobManifest(): JobManifest {
    return this.jobManifest;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit: number = 50): JobExecution[] {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Get currently running jobs
   */
  getActiveExecutions(): JobExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Enable/disable a job
   */
  setJobEnabled(jobType: JobType, enabled: boolean): void {
    const job = this.jobManifest.jobs.find(j => j.type === jobType);
    if (job) {
      job.enabled = enabled;
      console.log(`[Job Scheduler] Job ${jobType} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
}
