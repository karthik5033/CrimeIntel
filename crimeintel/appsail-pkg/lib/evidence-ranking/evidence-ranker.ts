/**
 * Phase 0.10: Evidence Ranker
 * 
 * Multi-signal ranking system for evidence items
 */

import {
  EvidenceItem,
  RankingScores,
  RankedEvidence,
  RankingContext,
  RankingConfig,
  RankingResult,
  ScoreBreakdown,
  DEFAULT_RANKING_CONFIG,
  RecencyDecayMode,
  GraphProximityMode,
} from './types';

export class EvidenceRanker {
  private config: RankingConfig;

  constructor(config?: Partial<RankingConfig>) {
    this.config = {
      ...DEFAULT_RANKING_CONFIG,
      ...config,
      weights: {
        ...DEFAULT_RANKING_CONFIG.weights,
        ...(config?.weights || {}),
      },
    };

    // Normalize weights to sum to 1
    this.normalizeWeights();
  }

  /**
   * Rank evidence items
   */
  async rankEvidence(
    evidence: EvidenceItem[],
    context: RankingContext
  ): Promise<RankingResult> {
    const startTime = Date.now();

    // Merge context config with instance config
    const effectiveConfig: RankingConfig = {
      ...this.config,
      ...(context.config || {}),
      weights: {
        ...this.config.weights,
        ...(context.config?.weights || {}),
      },
    };

    console.log(`\n[Evidence Ranker] Ranking ${evidence.length} items...`);

    // Filter by confidence threshold
    const filteredEvidence = evidence.filter(item => {
      const confidence = item.metadata.confidence || 1.0;
      return confidence >= effectiveConfig.minConfidenceThreshold;
    });

    console.log(`[Evidence Ranker] ${filteredEvidence.length} items passed confidence threshold (${effectiveConfig.minConfidenceThreshold})`);

    // Score each item
    const scoredEvidence = await Promise.all(
      filteredEvidence.map(item => this.scoreEvidence(item, context, effectiveConfig))
    );

    // Sort by composite score (descending)
    scoredEvidence.sort((a, b) => b.scores.composite - a.scores.composite);

    // Assign ranks and trim to topK
    const topK = Math.min(effectiveConfig.topK, scoredEvidence.length);
    const rankedEvidence: RankedEvidence[] = scoredEvidence
      .slice(0, topK)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        explanation: this.generateExplanation(item, context),
      }));

    const executionTime = Date.now() - startTime;

    console.log(`[Evidence Ranker] Top ${topK} items selected in ${executionTime}ms\n`);

    return {
      rankedEvidence,
      totalItems: evidence.length,
      filteredItems: evidence.length - filteredEvidence.length,
      topKItems: rankedEvidence.length,
      executionTime,
      weights: effectiveConfig.weights,
    };
  }

  /**
   * Score a single evidence item
   */
  private async scoreEvidence(
    item: EvidenceItem,
    context: RankingContext,
    config: RankingConfig
  ): Promise<EvidenceItem & { scores: RankingScores }> {
    const scores: RankingScores = {
      recency: this.calculateRecencyScore(item, context, config),
      relevance: this.calculateRelevanceScore(item, context),
      confidence: this.calculateConfidenceScore(item),
      graphProximity: this.calculateGraphProximityScore(item, context),
      investigationStatus: this.calculateInvestigationStatusScore(item, config),
      composite: 0, // Will be calculated below
    };

    // Calculate weighted composite score
    scores.composite = this.calculateCompositeScore(scores, config.weights);

    return {
      ...item,
      scores,
    };
  }

  /**
   * Calculate recency score (how recent is this evidence)
   */
  private calculateRecencyScore(
    item: EvidenceItem,
    context: RankingContext,
    config: RankingConfig
  ): number {
    // Get timestamp from content (FIR date, case date, etc.)
    const timestamp = this.extractTimestamp(item);
    if (!timestamp) return 0.5; // Default if no timestamp

    const now = context.temporalFocus || new Date();
    const ageMs = now.getTime() - timestamp.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // Linear decay: score = 1 - (age / decayDays)
    const score = Math.max(0, 1 - ageDays / config.recencyDecayDays);

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calculate relevance score (semantic similarity to query)
   */
  private calculateRelevanceScore(
    item: EvidenceItem,
    context: RankingContext
  ): number {
    // If we have query embedding, calculate cosine similarity
    if (context.queryEmbedding && item.metadata) {
      // Mock: would calculate actual cosine similarity with item embedding
      // For now, use a heuristic based on source
      const sourceRelevance: Record<string, number> = {
        vector: 0.9, // Vector search returns most semantically relevant
        sql: 0.7, // SQL returns structurally matching items
        graph: 0.8, // Graph returns relationally relevant
        ocr: 0.6, // OCR may have extraction noise
        analytics: 0.75, // Analytics returns aggregated insights
      };

      return sourceRelevance[item.source] || 0.5;
    }

    // Default: text overlap heuristic
    const queryTokens = context.queryText.toLowerCase().split(/\s+/);
    const itemText = JSON.stringify(item.content).toLowerCase();
    
    const matches = queryTokens.filter(token => itemText.includes(token)).length;
    const score = matches / queryTokens.length;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calculate confidence score (data quality + resolution confidence)
   */
  private calculateConfidenceScore(item: EvidenceItem): number {
    const baseConfidence = item.metadata.confidence || 1.0;
    const dataQuality = item.metadata.dataQuality || 1.0;

    // Average of confidence scores
    return (baseConfidence + dataQuality) / 2;
  }

  /**
   * Calculate graph proximity score (closeness to query entities)
   */
  private calculateGraphProximityScore(
    item: EvidenceItem,
    context: RankingContext
  ): number {
    if (!context.seedEntityIds || context.seedEntityIds.length === 0) {
      return 0.5; // Neutral if no seed entities
    }

    // Extract entity ID from item
    const itemEntityId = this.extractEntityId(item);
    if (!itemEntityId) return 0.3; // Low score if no entity ID

    // Check if item entity is in seed entities (direct match = max score)
    if (context.seedEntityIds.includes(itemEntityId)) {
      return 1.0;
    }

    // Mock graph distance calculation
    // In production, would query Phase 0.1 graph-index for shortest path
    // For now, give higher score to items from graph retriever
    if (item.source === 'graph') {
      return 0.8; // Assume 1-2 hops away
    }

    // Items from other sources get lower graph proximity
    return 0.4;
  }

  /**
   * Calculate investigation status score
   */
  private calculateInvestigationStatusScore(
    item: EvidenceItem,
    config: RankingConfig
  ): number {
    // Extract status from content
    const status = this.extractStatus(item);

    const statusScores: Record<string, number> = {
      'under investigation': 1.0,
      'active': 1.0,
      'pending': 0.9,
      'charge-sheeted': 0.7,
      'trial': 0.6,
      'resolved': 0.4,
      'convicted': 0.3,
      'acquitted': 0.3,
      'closed': 0.2,
      'archived': 0.1,
    };

    const baseScore = statusScores[status] || 0.5;

    // Apply boost for active investigations
    if (status === 'under investigation' || status === 'active') {
      return Math.min(1, baseScore * config.activeInvestigationBoost);
    }

    return baseScore;
  }

  /**
   * Calculate weighted composite score
   */
  private calculateCompositeScore(
    scores: RankingScores,
    weights: RankingConfig['weights']
  ): number {
    return (
      scores.recency * weights.recency +
      scores.relevance * weights.relevance +
      scores.confidence * weights.confidence +
      scores.graphProximity * weights.graphProximity +
      scores.investigationStatus * weights.investigationStatus
    );
  }

  /**
   * Generate human-readable explanation of ranking
   */
  private generateExplanation(
    item: EvidenceItem & { scores: RankingScores },
    context: RankingContext
  ): string {
    const topFactors: string[] = [];

    // Find top 2 contributing factors
    const scoreContributions = [
      { name: 'recency', score: item.scores.recency * this.config.weights.recency },
      { name: 'relevance', score: item.scores.relevance * this.config.weights.relevance },
      { name: 'confidence', score: item.scores.confidence * this.config.weights.confidence },
      { name: 'graph proximity', score: item.scores.graphProximity * this.config.weights.graphProximity },
      { name: 'investigation status', score: item.scores.investigationStatus * this.config.weights.investigationStatus },
    ];

    scoreContributions.sort((a, b) => b.score - a.score);

    const top1 = scoreContributions[0];
    const top2 = scoreContributions[1];

    topFactors.push(`${top1.name} (${(top1.score * 100).toFixed(0)}%)`);
    if (top2.score > 0.1) {
      topFactors.push(`${top2.name} (${(top2.score * 100).toFixed(0)}%)`);
    }

    return `Ranked highly due to ${topFactors.join(' and ')}`;
  }

  /**
   * Get detailed score breakdown for analysis
   */
  getScoreBreakdown(
    rankedItem: RankedEvidence,
    context: RankingContext
  ): ScoreBreakdown {
    const timestamp = this.extractTimestamp(rankedItem);
    const age = timestamp 
      ? (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    return {
      evidenceId: rankedItem.id,
      recency: {
        score: rankedItem.scores.recency,
        age: Math.round(age),
        explanation: `${Math.round(age)} days old`,
      },
      relevance: {
        score: rankedItem.scores.relevance,
        similarityMetric: rankedItem.scores.relevance,
        explanation: `${(rankedItem.scores.relevance * 100).toFixed(0)}% semantic match`,
      },
      confidence: {
        score: rankedItem.scores.confidence,
        dataQualityScore: rankedItem.metadata.dataQuality || 1.0,
        resolutionConfidence: rankedItem.metadata.confidence,
        explanation: `${(rankedItem.scores.confidence * 100).toFixed(0)}% confidence`,
      },
      graphProximity: {
        score: rankedItem.scores.graphProximity,
        explanation: rankedItem.source === 'graph' 
          ? '1-2 hops from query entities'
          : 'Not directly connected',
      },
      investigationStatus: {
        score: rankedItem.scores.investigationStatus,
        status: this.extractStatus(rankedItem),
        explanation: `Status: ${this.extractStatus(rankedItem)}`,
      },
      composite: {
        score: rankedItem.scores.composite,
        weightedContributions: {
          recency: rankedItem.scores.recency * this.config.weights.recency,
          relevance: rankedItem.scores.relevance * this.config.weights.relevance,
          confidence: rankedItem.scores.confidence * this.config.weights.confidence,
          graphProximity: rankedItem.scores.graphProximity * this.config.weights.graphProximity,
          investigationStatus: rankedItem.scores.investigationStatus * this.config.weights.investigationStatus,
        },
        explanation: `Composite score: ${(rankedItem.scores.composite * 100).toFixed(0)}%`,
      },
    };
  }

  /**
   * Update ranking weights (for admin configuration)
   */
  updateWeights(weights: Partial<RankingConfig['weights']>): void {
    this.config.weights = {
      ...this.config.weights,
      ...weights,
    };
    this.normalizeWeights();
  }

  /**
   * Normalize weights to sum to 1
   */
  private normalizeWeights(): void {
    const sum = Object.values(this.config.weights).reduce((a, b) => a + b, 0);
    if (sum === 0) return;

    const normalized = Object.keys(this.config.weights).reduce((acc, key) => {
      acc[key as keyof typeof acc] = this.config.weights[key as keyof typeof this.config.weights] / sum;
      return acc;
    }, {} as typeof this.config.weights);

    this.config.weights = normalized;
  }

  /**
   * Extract timestamp from evidence item
   */
  private extractTimestamp(item: EvidenceItem): Date | null {
    const content = item.content;

    // Try different timestamp fields
    const dateFields = ['date', 'created_at', 'timestamp', 'incident_date', 'registered_date'];
    
    for (const field of dateFields) {
      if (content[field]) {
        const date = new Date(content[field]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  }

  /**
   * Extract entity ID from evidence item
   */
  private extractEntityId(item: EvidenceItem): string | null {
    const content = item.content;
    return content.id || content.person_id || content.fir_id || content.case_id || null;
  }

  /**
   * Extract status from evidence item
   */
  private extractStatus(item: EvidenceItem): string {
    const content = item.content;
    const status = (content.status || content.investigation_status || 'unknown').toLowerCase();
    return status;
  }

  /**
   * Get current configuration
   */
  getConfig(): RankingConfig {
    return { ...this.config };
  }
}
