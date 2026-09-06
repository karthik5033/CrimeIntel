/**
 * Phase 0.10: Evidence Ranking System - Exports
 */

export * from './types';
export * from './evidence-ranker';

// Convenience singleton
import { EvidenceRanker } from './evidence-ranker';
import { RankingConfig } from './types';

let rankerInstance: EvidenceRanker | null = null;

export function getEvidenceRanker(config?: Partial<RankingConfig>): EvidenceRanker {
  if (!rankerInstance) {
    rankerInstance = new EvidenceRanker(config);
  }
  return rankerInstance;
}

/**
 * Reset singleton (for testing)
 */
export function resetEvidenceRanker(): void {
  rankerInstance = null;
}
