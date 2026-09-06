/**
 * Phase 0.11: Semantic Memory - Main Export
 */

export * from './types';
import { SemanticMemoryManager } from './semantic-memory-manager';
export { SemanticMemoryManager };
export { ContextExtractor } from './context-extractor';

// Singleton instance for convenience
let _semanticMemoryInstance: SemanticMemoryManager | null = null;

export function getSemanticMemoryInstance(): SemanticMemoryManager {
  if (!_semanticMemoryInstance) {
    _semanticMemoryInstance = new SemanticMemoryManager();
  }
  return _semanticMemoryInstance;
}

export function resetSemanticMemoryInstance(): void {
  _semanticMemoryInstance = null;
}
