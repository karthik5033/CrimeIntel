/**
 * Phase 0.9: Precomputation Engine
 * 
 * Main orchestrator for nightly + event-driven precomputation
 */

import { JobScheduler } from './job-scheduler';
import { PrecomputationEventHandler } from './event-handler';
import {
  JobType,
  JobManifest,
  JobExecution,
  PrecomputationResult,
} from './types';

export class PrecomputationEngine {
  private scheduler: JobScheduler;
  private eventHandler: PrecomputationEventHandler;
  private isRunning: boolean = false;
  private lastNightlyRun?: Date;
  private nextScheduledRun?: Date;

  constructor() {
    this.scheduler = new JobScheduler();
    this.eventHandler = new PrecomputationEventHandler(this.scheduler);
    
    console.log('[Precomputation Engine] Initialized');
    console.log('[Precomputation Engine] Ready for nightly + event-driven execution\n');
  }

  /**
   * Execute nightly batch (called by Catalyst Cron)
   */
  async runNightlyBatch(): Promise<PrecomputationResult> {
    if (this.isRunning) {
      throw new Error('Precomputation already running');
    }

    this.isRunning = true;
    this.lastNightlyRun = new Date();

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           NIGHTLY PRECOMPUTATION BATCH STARTED               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    try {
      const result = await this.scheduler.executeNightlyBatch();

      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║           NIGHTLY PRECOMPUTATION BATCH COMPLETE              ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
      console.log(`✓ ${result.summary.completed}/${result.summary.totalJobs} jobs succeeded`);
      console.log(`  Total duration: ${(result.totalDuration / 1000 / 60).toFixed(2)} minutes`);
      
      if (result.summary.failed > 0) {
        console.log(`⚠ ${result.summary.failed} jobs failed:`);
        result.errors.forEach(err => console.log(`  - ${err}`));
      }
      
      console.log('');

      return result;
    } finally {
      this.isRunning = false;
      
      // Schedule next run (24 hours from now)
      this.nextScheduledRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Handle event-driven trigger (called by app when data changes)
   */
  async handleFIRCreated(firId: string, metadata: any = {}): Promise<void> {
    await this.eventHandler.handleFIRCreated(firId, metadata);
  }

  async handlePersonUpdated(personId: string, metadata: any = {}): Promise<void> {
    await this.eventHandler.handlePersonUpdated(personId, metadata);
  }

  async handleCaseStatusChanged(caseId: string, metadata: any = {}): Promise<void> {
    await this.eventHandler.handleCaseStatusChanged(caseId, metadata);
  }

  /**
   * Get current status (for admin panel)
   */
  getStatus(): {
    isRunning: boolean;
    lastNightlyRun?: Date;
    nextScheduledRun?: Date;
    activeJobs: JobExecution[];
    recentExecutions: JobExecution[];
  } {
    return {
      isRunning: this.isRunning,
      lastNightlyRun: this.lastNightlyRun,
      nextScheduledRun: this.nextScheduledRun,
      activeJobs: this.scheduler.getActiveExecutions(),
      recentExecutions: this.scheduler.getExecutionHistory(20),
    };
  }

  /**
   * Get job manifest (for admin panel configuration)
   */
  getJobManifest(): JobManifest {
    return this.scheduler.getJobManifest();
  }

  /**
   * Enable/disable specific jobs
   */
  setJobEnabled(jobType: JobType, enabled: boolean): void {
    this.scheduler.setJobEnabled(jobType, enabled);
  }

  /**
   * Manual trigger of specific job (admin only)
   */
  async triggerJobManually(jobType: JobType): Promise<JobExecution> {
    const job = this.scheduler.getJobManifest().jobs.find(j => j.type === jobType);
    
    if (!job) {
      throw new Error(`Job ${jobType} not found`);
    }

    console.log(`\n[Precomputation Engine] Manual trigger: ${jobType}\n`);

    const executionId = `manual-${Date.now()}`;
    const result = await (this.scheduler as any).executeJob(job, 'manual', executionId);

    console.log(`\n[Precomputation Engine] Manual trigger complete\n`);

    return result;
  }

  /**
   * Get execution history for a specific job
   */
  getJobHistory(jobType: JobType, limit: number = 10): JobExecution[] {
    return this.scheduler
      .getExecutionHistory(100)
      .filter(e => e.jobType === jobType)
      .slice(-limit);
  }

  /**
   * Estimate time until next nightly run
   */
  getTimeUntilNextRun(): number | null {
    if (!this.nextScheduledRun) return null;
    
    return Math.max(0, this.nextScheduledRun.getTime() - Date.now());
  }

  /**
   * Check if indices are stale (haven't been updated recently)
   */
  isStale(): boolean {
    if (!this.lastNightlyRun) return true;
    
    const hoursSinceLastRun = (Date.now() - this.lastNightlyRun.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastRun > 36; // Stale if >36 hours since last run
  }

  /**
   * Get health status
   */
  getHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    isStale: boolean;
    lastRun?: Date;
    nextRun?: Date;
    issues: string[];
  } {
    const issues: string[] = [];
    const isStale = this.isStale();

    if (isStale) {
      issues.push('Indices are stale (>36 hours since last run)');
    }

    if (this.isRunning) {
      // Check if running for too long
      const activeJobs = this.scheduler.getActiveExecutions();
      if (activeJobs.length > 0) {
        const longestRunning = Math.max(...activeJobs.map(j => Date.now() - j.startedAt.getTime()));
        if (longestRunning > 30 * 60 * 1000) { // 30 minutes
          issues.push('Job running for >30 minutes (may be stuck)');
        }
      }
    }

    const recentFailures = this.scheduler
      .getExecutionHistory(50)
      .filter(e => e.status === 'failed');

    if (recentFailures.length > 5) {
      issues.push(`${recentFailures.length} recent job failures`);
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0) {
      status = isStale ? 'critical' : 'warning';
    }

    return {
      status,
      isStale,
      lastRun: this.lastNightlyRun,
      nextRun: this.nextScheduledRun,
      issues,
    };
  }
}
