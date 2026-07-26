/**
 * Phase 0.11: Semantic Memory Manager
 * 
 * Manages conversation frames - extracts, updates, enriches queries with context
 */

import {
  ConversationFrame,
  SlotUpdate,
  FrameUpdateResult,
  EnrichedQuery,
  ContextExtraction,
  FrameQuery,
  FrameAnalytics,
  FrameDiff,
  SemanticMemoryConfig,
  DEFAULT_SEMANTIC_MEMORY_CONFIG,
  EntityReference,
  InvestigationFocus,
  TimeWindow,
} from './types';
import { ContextExtractor } from './context-extractor';

/**
 * Main manager for semantic memory / conversation frames
 */
export class SemanticMemoryManager {
  private frames: Map<string, ConversationFrame> = new Map();
  private contextExtractor: ContextExtractor;
  private config: SemanticMemoryConfig;

  constructor(config: Partial<SemanticMemoryConfig> = {}) {
    this.config = { ...DEFAULT_SEMANTIC_MEMORY_CONFIG, ...config };
    this.contextExtractor = new ContextExtractor();
  }

  /**
   * Get or create frame for a session
   */
  async getFrame(sessionId: string, userId: string): Promise<ConversationFrame> {
    let frame = this.frames.get(sessionId);
    
    if (!frame) {
      frame = this.createEmptyFrame(sessionId, userId);
      this.frames.set(sessionId, frame);
    } else {
      // Check TTL
      const age = Date.now() - frame.lastActivity.getTime();
      if (age > this.config.persistence.ttl * 1000) {
        // Frame expired, create new one
        frame = this.createEmptyFrame(sessionId, userId);
        this.frames.set(sessionId, frame);
      }
    }
    
    return frame;
  }

  /**
   * Update frame based on a new query
   */
  async updateFrame(
    sessionId: string,
    userId: string,
    query: string
  ): Promise<FrameUpdateResult> {
    const frame = await this.getFrame(sessionId, userId);
    
    // Extract context from query
    const extraction = await this.contextExtractor.extractContext(query, frame);
    
    // Determine updates
    const updates = this.determineUpdates(frame, extraction);
    
    // Apply updates if confidence is high enough
    const changed = updates.length > 0 && 
      extraction.confidence >= this.config.extraction.minConfidenceThreshold;
    
    if (changed) {
      this.applyUpdates(frame, updates);
      frame.queryCount++;
      frame.lastActivity = new Date();
      frame.updatedAt = new Date();
    }
    
    // Update frame confidence based on extraction confidence
    frame.confidence = this.calculateFrameConfidence(frame, extraction);
    
    const explanation = this.generateExplanation(updates, extraction);
    
    return {
      frame,
      updates,
      changed,
      explanation,
    };
  }

  /**
   * Enrich query with frame context
   */
  async enrichQuery(sessionId: string, userId: string, query: string): Promise<EnrichedQuery> {
    const updateResult = await this.updateFrame(sessionId, userId, query);
    const frame = updateResult.frame;
    
    const contextParts: string[] = [];
    const contextAdded: string[] = [];
    
    // Add district context
    if (frame.activeDistrict) {
      contextParts.push(`District: ${frame.activeDistrict}`);
      contextAdded.push('district');
    }
    
    // Add crime type context
    if (frame.activeCrimeTypes.length > 0) {
      contextParts.push(`Crime Types: ${frame.activeCrimeTypes.join(', ')}`);
      contextAdded.push('crimeTypes');
    }
    
    // Add time window context
    if (frame.activeTimeWindow) {
      contextParts.push(`Time Period: ${frame.activeTimeWindow.label}`);
      contextAdded.push('timeWindow');
    }
    
    // Add entity context (top 5 most relevant)
    const topEntities = frame.activeEntities
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);
    
    if (topEntities.length > 0) {
      const entityStr = topEntities.map(e => `${e.name} (${e.type})`).join(', ');
      contextParts.push(`Related Entities: ${entityStr}`);
      contextAdded.push('entities');
    }
    
    // Add focus context
    if (frame.activeFocus) {
      contextParts.push(`Investigation Focus: ${frame.activeFocus.replace('_', ' ')}`);
      contextAdded.push('focus');
    }
    
    // Build enriched query
    let enrichedQuery = query;
    if (contextParts.length > 0) {
      enrichedQuery = `${query}\n\nContext:\n${contextParts.join('\n')}`;
    }
    
    return {
      originalQuery: query,
      enrichedQuery,
      frame,
      contextAdded,
      confidence: frame.confidence,
    };
  }

  /**
   * Get analytics for a session
   */
  async getAnalytics(sessionId: string): Promise<FrameAnalytics | null> {
    const frame = this.frames.get(sessionId);
    if (!frame) return null;
    
    const sessionDuration = frame.updatedAt.getTime() - frame.createdAt.getTime();
    
    // Calculate dominant crime types (most frequently mentioned)
    const crimeTypeCounts = new Map<string, number>();
    frame.activeCrimeTypes.forEach(type => {
      crimeTypeCounts.set(type, (crimeTypeCounts.get(type) || 0) + 1);
    });
    
    const dominantCrimeTypes = Array.from(crimeTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
    
    // Calculate average time window
    let averageTimeWindow = 0;
    if (frame.activeTimeWindow) {
      averageTimeWindow = 
        (frame.activeTimeWindow.endDate.getTime() - frame.activeTimeWindow.startDate.getTime()) / 
        (1000 * 60 * 60 * 24); // Convert to days
    }
    
    return {
      sessionId,
      totalQueries: frame.queryCount,
      dominantDistrict: frame.activeDistrict,
      dominantCrimeTypes,
      averageTimeWindow,
      mostMentionedEntities: frame.activeEntities
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 10),
      investigationFocusHistory: [frame.activeFocus], // Could track history over time
      sessionDuration,
    };
  }

  /**
   * Compare two frames
   */
  diffFrames(sessionId: string, beforeTime: Date, afterTime: Date): FrameDiff | null {
    // In a real implementation, we'd store frame history
    // For now, just return current frame as "after"
    const currentFrame = this.frames.get(sessionId);
    if (!currentFrame) return null;
    
    // Mock "before" frame (in production, retrieve from history)
    const beforeFrame = this.createEmptyFrame(sessionId, currentFrame.userId);
    
    const changes: FrameDiff['changes'] = [];
    
    // Compare slots
    if (beforeFrame.activeDistrict !== currentFrame.activeDistrict) {
      changes.push({
        slot: 'activeDistrict',
        oldValue: beforeFrame.activeDistrict,
        newValue: currentFrame.activeDistrict,
        reason: 'District context changed',
      });
    }
    
    if (JSON.stringify(beforeFrame.activeCrimeTypes) !== JSON.stringify(currentFrame.activeCrimeTypes)) {
      changes.push({
        slot: 'activeCrimeTypes',
        oldValue: beforeFrame.activeCrimeTypes,
        newValue: currentFrame.activeCrimeTypes,
        reason: 'Crime types changed',
      });
    }
    
    return {
      sessionId,
      before: beforeFrame,
      after: currentFrame,
      changes,
      timestamp: new Date(),
    };
  }

  /**
   * Clear expired frames (called periodically)
   */
  cleanupExpiredFrames(): number {
    let removed = 0;
    const now = Date.now();
    
    for (const [sessionId, frame] of this.frames.entries()) {
      const age = now - frame.lastActivity.getTime();
      if (age > this.config.persistence.ttl * 1000) {
        this.frames.delete(sessionId);
        removed++;
      }
    }
    
    return removed;
  }

  /**
   * Decay entity relevance (called periodically or on each update)
   */
  private decayEntityRelevance(frame: ConversationFrame): void {
    const now = Date.now();
    const halfLife = this.config.decay.entityRelevanceHalfLife * 1000;
    
    frame.activeEntities = frame.activeEntities
      .map(entity => {
        const age = now - entity.mentionedAt.getTime();
        const decayFactor = Math.pow(0.5, age / halfLife);
        return {
          ...entity,
          relevance: entity.relevance * decayFactor,
        };
      })
      .filter(entity => entity.relevance > 0.05); // Remove very low relevance entities
    
    // Enforce max entities limit
    if (frame.activeEntities.length > this.config.persistence.maxEntities) {
      frame.activeEntities = frame.activeEntities
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, this.config.persistence.maxEntities);
    }
  }

  /**
   * Create empty frame
   */
  private createEmptyFrame(sessionId: string, userId: string): ConversationFrame {
    return {
      sessionId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      activeDistrict: null,
      activeCrimeTypes: [],
      activeTimeWindow: null,
      activeEntities: [],
      activeFocus: null,
      queryCount: 0,
      lastActivity: new Date(),
      confidence: 0.5, // Neutral starting confidence
    };
  }

  /**
   * Determine what updates to make based on extraction
   */
  private determineUpdates(
    frame: ConversationFrame,
    extraction: ContextExtraction
  ): SlotUpdate[] {
    const updates: SlotUpdate[] = [];
    
    // District update
    if (extraction.district && extraction.district !== frame.activeDistrict) {
      updates.push({
        slot: 'activeDistrict',
        value: extraction.district,
        confidence: extraction.confidence,
        source: 'explicit',
      });
    }
    
    // Crime types update (merge with existing, don't replace)
    if (extraction.crimeTypes.length > 0) {
      const mergedTypes = Array.from(new Set([...frame.activeCrimeTypes, ...extraction.crimeTypes]));
      if (JSON.stringify(mergedTypes.sort()) !== JSON.stringify(frame.activeCrimeTypes.sort())) {
        updates.push({
          slot: 'activeCrimeTypes',
          value: mergedTypes,
          confidence: extraction.confidence,
          source: 'explicit',
        });
      }
    }
    
    // Time window update
    if (extraction.timeWindow) {
      updates.push({
        slot: 'activeTimeWindow',
        value: extraction.timeWindow,
        confidence: extraction.confidence,
        source: 'explicit',
      });
    }
    
    // Entities update (merge with existing)
    if (extraction.entities.length > 0) {
      const mergedEntities = this.mergeEntities(frame.activeEntities, extraction.entities);
      updates.push({
        slot: 'activeEntities',
        value: mergedEntities,
        confidence: extraction.confidence,
        source: 'explicit',
      });
    }
    
    // Focus update
    if (extraction.focus && extraction.focus !== frame.activeFocus) {
      updates.push({
        slot: 'activeFocus',
        value: extraction.focus,
        confidence: extraction.confidence,
        source: 'inferred',
      });
    }
    
    return updates;
  }

  /**
   * Apply updates to frame
   */
  private applyUpdates(frame: ConversationFrame, updates: SlotUpdate[]): void {
    for (const update of updates) {
      (frame as any)[update.slot] = update.value;
    }
    
    // Decay entity relevance after applying updates
    this.decayEntityRelevance(frame);
  }

  /**
   * Merge new entities with existing ones
   */
  private mergeEntities(
    existing: EntityReference[],
    newEntities: EntityReference[]
  ): EntityReference[] {
    const merged = new Map<string, EntityReference>();
    
    // Add existing entities
    existing.forEach(entity => {
      merged.set(`${entity.type}:${entity.id}`, entity);
    });
    
    // Add/update with new entities
    newEntities.forEach(entity => {
      const key = `${entity.type}:${entity.id}`;
      const existingEntity = merged.get(key);
      
      if (existingEntity) {
        // Boost relevance if mentioned again
        existingEntity.relevance = Math.min(1.0, existingEntity.relevance + 0.2);
        existingEntity.mentionedAt = entity.mentionedAt;
      } else {
        merged.set(key, entity);
      }
    });
    
    return Array.from(merged.values());
  }

  /**
   * Calculate overall frame confidence
   */
  private calculateFrameConfidence(
    frame: ConversationFrame,
    extraction: ContextExtraction
  ): number {
    // Confidence increases with:
    // 1. Number of filled slots
    // 2. Quality of extraction
    // 3. Number of queries (more context = more confidence)
    
    let filledSlots = 0;
    if (frame.activeDistrict) filledSlots++;
    if (frame.activeCrimeTypes.length > 0) filledSlots++;
    if (frame.activeTimeWindow) filledSlots++;
    if (frame.activeEntities.length > 0) filledSlots++;
    if (frame.activeFocus) filledSlots++;
    
    const slotConfidence = filledSlots / 5; // 5 total slots
    const extractionConfidence = extraction.confidence;
    const queryConfidence = Math.min(1.0, frame.queryCount / 10); // Max confidence at 10 queries
    
    return (slotConfidence * 0.4 + extractionConfidence * 0.4 + queryConfidence * 0.2);
  }

  /**
   * Generate human-readable explanation of updates
   */
  private generateExplanation(updates: SlotUpdate[], extraction: ContextExtraction): string {
    if (updates.length === 0) {
      return 'No context changes detected';
    }
    
    const explanations: string[] = [];
    
    for (const update of updates) {
      switch (update.slot) {
        case 'activeDistrict':
          explanations.push(`District set to ${update.value}`);
          break;
        case 'activeCrimeTypes':
          explanations.push(`Crime types updated to: ${update.value.join(', ')}`);
          break;
        case 'activeTimeWindow':
          explanations.push(`Time period set to ${update.value.label}`);
          break;
        case 'activeEntities':
          explanations.push(`Tracking ${update.value.length} entities`);
          break;
        case 'activeFocus':
          explanations.push(`Focus changed to ${update.value.replace('_', ' ')}`);
          break;
      }
    }
    
    if (extraction.ambiguities.length > 0) {
      explanations.push(`Ambiguities: ${extraction.ambiguities.join(', ')}`);
    }
    
    return explanations.join('; ');
  }

  /**
   * Query frames by various criteria
   */
  async queryFrames(query: FrameQuery): Promise<ConversationFrame[]> {
    const results: ConversationFrame[] = [];
    
    for (const [_, frame] of this.frames) {
      let matches = true;
      
      if (query.sessionId && frame.sessionId !== query.sessionId) {
        matches = false;
      }
      
      if (query.userId && frame.userId !== query.userId) {
        matches = false;
      }
      
      if (query.activeDistrict && frame.activeDistrict !== query.activeDistrict) {
        matches = false;
      }
      
      if (query.activeCrimeTypes) {
        const hasAllTypes = query.activeCrimeTypes.every(type =>
          frame.activeCrimeTypes.includes(type)
        );
        if (!hasAllTypes) {
          matches = false;
        }
      }
      
      if (query.createdAfter && frame.createdAt < query.createdAfter) {
        matches = false;
      }
      
      if (query.createdBefore && frame.createdAt > query.createdBefore) {
        matches = false;
      }
      
      if (matches) {
        results.push(frame);
      }
    }
    
    return results;
  }

  /**
   * Reset frame for a session (useful for testing or user-initiated reset)
   */
  async resetFrame(sessionId: string, userId: string): Promise<ConversationFrame> {
    const newFrame = this.createEmptyFrame(sessionId, userId);
    this.frames.set(sessionId, newFrame);
    return newFrame;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.frames.keys());
  }

  /**
   * Get statistics about memory usage
   */
  getStats(): {
    totalFrames: number;
    totalEntities: number;
    averageConfidence: number;
    oldestFrame: Date | null;
  } {
    const frames = Array.from(this.frames.values());
    
    const totalEntities = frames.reduce((sum, f) => sum + f.activeEntities.length, 0);
    const averageConfidence = frames.length > 0
      ? frames.reduce((sum, f) => sum + f.confidence, 0) / frames.length
      : 0;
    
    const oldestFrame = frames.length > 0
      ? frames.reduce((oldest, f) => f.createdAt < oldest ? f.createdAt : oldest, new Date())
      : null;
    
    return {
      totalFrames: frames.length,
      totalEntities,
      averageConfidence,
      oldestFrame,
    };
  }
}
