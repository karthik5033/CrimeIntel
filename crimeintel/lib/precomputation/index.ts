/**
 * Phase 0.9: Precomputation Engine - Exports
 */

export * from './types';
export * from './job-scheduler';
export * from './event-handler';
export * from './precomputation-engine';

// Convenience singleton
import { PrecomputationEngine } from './precomputation-engine';

let engineInstance: PrecomputationEngine | null = null;

export function getPrecomputationEngine(): PrecomputationEngine {
  if (!engineInstance) {
    engineInstance = new PrecomputationEngine();
  }
  return engineInstance;
}
