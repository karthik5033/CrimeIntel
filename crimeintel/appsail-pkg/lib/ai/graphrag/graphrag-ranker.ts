/**
 * GraphRAG Ranker - Re-rank candidates by multiple signals
 * Phase 0.4
 * 
 * Combines: semantic similarity + graph proximity + recency + confidence
 * Will integrate with Phase 0.10 (Evidence Ranking) when available
 */

import { SeedNode, ExpandedNode, GraphRAGCandidate, GraphRAGConfig } from './types';

export class GraphRAGRanker {
  private weights: GraphRAGConfig['weights'];

  constructor(weights: GraphRAGConfig['weights']) {
    this.weights = weights;
  }

  /**
   * Rank all candidates (seed + expanded) with multi-signal scoring
   */
  rank(
    seedNodes: SeedNode[],
    expandedNodes: ExpandedNode[]
  ): GraphRAGCandidate[] {
    console.log(`[GraphRAG Ranker] Ranking ${seedNodes.length + expandedNodes.length} candidates...`);

    const candidates: GraphRAGCandidate[] = [];

    // Rank seed nodes
    for (const seed of seedNodes) {
      candidates.push(this.scoreSeedNode(seed));
    }

    // Rank expanded nodes
    for (const expanded of expandedNodes) {
      candidates.push(this.scoreExpandedNode(expanded));
    }

    // Sort by final score descending
    candidates.sort((a, b) => b.finalScore - a.finalScore);

    console.log(`[GraphRAG Ranker] Top 5 scores: ${candidates.slice(0, 5).map(c => c.finalScore.toFixed(3)).join(', ')}`);

    return candidates;
  }

  /**
   * Score a seed node (has semantic score, no graph proximity)
   */
  private scoreSeedNode(seed: SeedNode): GraphRAGCandidate {
    const semanticScore = seed.semanticScore;
    const graphProximityScore = 1.0; // Seed nodes are at distance 0
    const recencyScore = this.calculateRecencyScore(seed.data);
    const confidenceScore = this.calculateConfidenceScore(seed.data);

    const finalScore = this.computeWeightedScore({
      semanticScore,
      graphProximityScore,
      recencyScore,
      confidenceScore,
    });

    return {
      node: seed,
      isSeedNode: true,
      semanticScore,
      graphProximityScore,
      recencyScore,
      confidenceScore,
      finalScore,
      evidence: {
        vectorMatch: `Direct semantic match (${(semanticScore * 100).toFixed(1)}% similarity)`,
        graphPath: 'Seed node (0 hops)',
        temporalContext: this.describeRecency(seed.data),
        dataQuality: `Confidence: ${(confidenceScore * 100).toFixed(0)}%`,
      },
    };
  }

  /**
   * Score an expanded node (has graph proximity, inherited semantic score)
   */
  private scoreExpandedNode(expanded: ExpandedNode): GraphRAGCandidate {
    // Semantic score decays with graph distance
    const semanticScore = 0.5 / expanded.hopDistance;
    
    const graphProximityScore = expanded.graphProximityScore;
    const recencyScore = this.calculateRecencyScore(expanded.data);
    const confidenceScore = this.calculateConfidenceScore(expanded.data);

    const finalScore = this.computeWeightedScore({
      semanticScore,
      graphProximityScore,
      recencyScore,
      confidenceScore,
    });

    return {
      node: expanded,
      isSeedNode: false,
      semanticScore,
      graphProximityScore,
      recencyScore,
      confidenceScore,
      finalScore,
      evidence: {
        vectorMatch: `Graph-connected entity (${expanded.hopDistance} hop${expanded.hopDistance > 1 ? 's' : ''})`,
        graphPath: `Path: ${expanded.relationshipPath.slice(0, 3).join(' → ')}${expanded.relationshipPath.length > 3 ? ' ...' : ''}`,
        temporalContext: this.describeRecency(expanded.data),
        dataQuality: `Confidence: ${(confidenceScore * 100).toFixed(0)}%`,
      },
    };
  }

  /**
   * Compute final weighted score
   */
  private computeWeightedScore(scores: {
    semanticScore: number;
    graphProximityScore: number;
    recencyScore: number;
    confidenceScore: number;
  }): number {
    const { semantic, graphProximity, recency, confidence } = this.weights;

    const weightedSum =
      scores.semanticScore * semantic +
      scores.graphProximityScore * graphProximity +
      scores.recencyScore * recency +
      scores.confidenceScore * confidence;

    // Normalize by total weight
    const totalWeight = semantic + graphProximity + recency + confidence;

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate recency score (more recent = higher score)
   */
  private calculateRecencyScore(data: any): number {
    // Try to extract date from data
    const dateField = data.date || data.date_registered || data.created_at || data.updated_at;
    
    if (!dateField) return 0.5; // Neutral if no date available

    const date = dateField instanceof Date ? dateField : new Date(dateField);
    const now = new Date();
    const ageInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    // Score decays exponentially with age
    // Recent (0-30 days): 0.9-1.0
    // Medium (30-180 days): 0.6-0.9
    // Old (180+ days): 0.3-0.6
    if (ageInDays < 30) {
      return 1.0 - (ageInDays / 30) * 0.1;
    } else if (ageInDays < 180) {
      return 0.9 - ((ageInDays - 30) / 150) * 0.3;
    } else {
      return Math.max(0.3, 0.6 - ((ageInDays - 180) / 365) * 0.3);
    }
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidenceScore(data: any): number {
    if (!data || typeof data !== 'object') return 0.5;

    let totalFields = 0;
    let filledFields = 0;

    for (const [key, value] of Object.entries(data)) {
      // Skip internal fields
      if (key.startsWith('_') || key === 'id') continue;

      totalFields++;
      
      if (value !== null && value !== undefined && value !== '') {
        filledFields++;
      }
    }

    if (totalFields === 0) return 0.5;

    return filledFields / totalFields;
  }

  /**
   * Describe recency in human-readable terms
   */
  private describeRecency(data: any): string {
    const dateField = data.date || data.date_registered || data.created_at || data.updated_at;
    
    if (!dateField) return 'No date information';

    const date = dateField instanceof Date ? dateField : new Date(dateField);
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (ageInDays === 0) return 'Today';
    if (ageInDays === 1) return 'Yesterday';
    if (ageInDays < 7) return `${ageInDays} days ago`;
    if (ageInDays < 30) return `${Math.floor(ageInDays / 7)} weeks ago`;
    if (ageInDays < 365) return `${Math.floor(ageInDays / 30)} months ago`;
    return `${Math.floor(ageInDays / 365)} years ago`;
  }
}
