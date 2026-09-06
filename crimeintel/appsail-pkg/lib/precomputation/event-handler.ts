/**
 * Phase 0.9: Event Handler
 * 
 * Handles event-driven triggers for incremental precomputation updates
 */

import { EventTrigger, JobType } from './types';
import { JobScheduler } from './job-scheduler';

export class PrecomputationEventHandler {
  private scheduler: JobScheduler;

  constructor(scheduler: JobScheduler) {
    this.scheduler = scheduler;
    console.log('[Event Handler] Initialized');
  }

  /**
   * Handle FIR_CREATED event
   */
  async handleFIRCreated(firId: string, metadata: any): Promise<void> {
    console.log(`\n[Event Handler] FIR_CREATED event received: ${firId}`);

    const event: EventTrigger = {
      eventType: 'FIR_CREATED',
      payload: { firId, ...metadata },
      affectedJobs: this.determineAffectedJobs('FIR_CREATED', metadata),
      issuedAt: new Date(),
    };

    // Trigger incremental updates
    await this.scheduler.executeEventTriggered(event);

    console.log(`[Event Handler] FIR_CREATED processing complete\n`);
  }

  /**
   * Handle PERSON_UPDATED event
   */
  async handlePersonUpdated(personId: string, metadata: any): Promise<void> {
    console.log(`\n[Event Handler] PERSON_UPDATED event received: ${personId}`);

    const event: EventTrigger = {
      eventType: 'PERSON_UPDATED',
      payload: { personId, ...metadata },
      affectedJobs: this.determineAffectedJobs('PERSON_UPDATED', metadata),
      issuedAt: new Date(),
    };

    await this.scheduler.executeEventTriggered(event);

    console.log(`[Event Handler] PERSON_UPDATED processing complete\n`);
  }

  /**
   * Handle CASE_STATUS_CHANGED event
   */
  async handleCaseStatusChanged(caseId: string, metadata: any): Promise<void> {
    console.log(`\n[Event Handler] CASE_STATUS_CHANGED event received: ${caseId}`);

    const event: EventTrigger = {
      eventType: 'CASE_STATUS_CHANGED',
      payload: { caseId, ...metadata },
      affectedJobs: this.determineAffectedJobs('CASE_STATUS_CHANGED', metadata),
      issuedAt: new Date(),
    };

    await this.scheduler.executeEventTriggered(event);

    console.log(`[Event Handler] CASE_STATUS_CHANGED processing complete\n`);
  }

  /**
   * Determine which jobs should be triggered by this event
   */
  private determineAffectedJobs(
    eventType: 'FIR_CREATED' | 'PERSON_UPDATED' | 'CASE_STATUS_CHANGED',
    metadata: any
  ): JobType[] {
    const jobMap: Record<string, JobType[]> = {
      FIR_CREATED: [
        'hotspot_index', // New FIR changes hotspot calculations
        'graph_snapshot', // New relationships need graph update
        'embeddings', // New narrative needs embedding
        'anomaly_flags', // Check if this is anomalous
      ],
      PERSON_UPDATED: [
        'offender_scores', // Person data changed -> recalc risk score
        'graph_snapshot', // If relationships changed
      ],
      CASE_STATUS_CHANGED: [
        'case_summaries', // Status change affects summary
        'offender_scores', // Conviction/acquittal affects offender score
      ],
    };

    return jobMap[eventType] || [];
  }

  /**
   * Batch event processing (multiple events at once)
   */
  async handleEventBatch(events: Array<{
    type: 'FIR_CREATED' | 'PERSON_UPDATED' | 'CASE_STATUS_CHANGED';
    id: string;
    metadata: any;
  }>): Promise<void> {
    console.log(`\n[Event Handler] Processing batch of ${events.length} events`);

    // Group events by type
    const grouped = new Map<string, any[]>();
    for (const event of events) {
      if (!grouped.has(event.type)) {
        grouped.set(event.type, []);
      }
      grouped.get(event.type)!.push(event);
    }

    // Process each type
    for (const [type, typeEvents] of grouped.entries()) {
      console.log(`[Event Handler] Processing ${typeEvents.length} ${type} events`);
      
      // Determine all affected jobs
      const allAffectedJobs = new Set<JobType>();
      for (const event of typeEvents) {
        const affected = this.determineAffectedJobs(
          type as any,
          event.metadata
        );
        affected.forEach(job => allAffectedJobs.add(job));
      }

      // Trigger update for all affected jobs once (batch optimization)
      const batchEvent: EventTrigger = {
        eventType: type as any,
        payload: { batch: true, events: typeEvents },
        affectedJobs: Array.from(allAffectedJobs),
        issuedAt: new Date(),
      };

      await this.scheduler.executeEventTriggered(batchEvent);
    }

    console.log(`[Event Handler] Batch processing complete\n`);
  }
}
