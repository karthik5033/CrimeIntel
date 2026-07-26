/**
 * Similarity Index Computer
 * Phase 0.1 - Computes case-to-case and person-to-person similarity
 */

import { SimilarityIndex, SimilarItem, IndexComputationResult } from './types';

export interface EntityForSimilarity {
  id: string;
  type: 'case' | 'person' | 'fir';
  text_content: string; // Narrative, description, or profile text
  attributes: {
    crime_types?: string[];
    locations?: { lat: number; lng: number }[];
    dates?: Date[];
    mo_patterns?: string[];
    age?: number;
    gender?: string;
  };
}

export class SimilarityComputer {
  private readonly TOP_K = 10; // Top K similar items per entity

  /**
   * Compute similarity index for all entities
   */
  async compute(
    entities: EntityForSimilarity[]
  ): Promise<IndexComputationResult> {
    const startTime = Date.now();
    const snapshot_version = this.generateSnapshotVersion();

    try {
      const indices: SimilarityIndex[] = [];

      for (const entity of entities) {
        const similarItems = this.findSimilarEntities(entity, entities);

        if (similarItems.length > 0) {
          indices.push({
            source_id: entity.id,
            source_type: entity.type,
            similar_items: similarItems,
            computed_at: new Date(),
          });
        }
      }

      return {
        success: true,
        index_type: 'similarity',
        records_computed: indices.length,
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
      };
    } catch (error) {
      return {
        success: false,
        index_type: 'similarity',
        records_computed: 0,
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private findSimilarEntities(
    source: EntityForSimilarity,
    allEntities: EntityForSimilarity[]
  ): SimilarItem[] {
    const similarities: Array<{ entity: EntityForSimilarity; score: number; reasons: string[] }> = [];

    for (const target of allEntities) {
      // Skip self
      if (target.id === source.id) continue;

      // Only compare same types
      if (target.type !== source.type) continue;

      const { score, reasons } = this.calculateSimilarity(source, target);

      if (score > 0.3) { // Threshold for "similar"
        similarities.push({ entity: target, score, reasons });
      }
    }

    // Sort by score descending, take top K
    similarities.sort((a, b) => b.score - a.score);
    const topK = similarities.slice(0, this.TOP_K);

    return topK.map(({ entity, score, reasons }) => ({
      id: entity.id,
      type: entity.type,
      similarity_score: score,
      similarity_reasons: reasons,
    }));
  }

  private calculateSimilarity(
    source: EntityForSimilarity,
    target: EntityForSimilarity
  ): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let totalScore = 0;
    let weights = 0;

    // Text similarity (TF-IDF style - simplified)
    const textSim = this.textSimilarity(source.text_content, target.text_content);
    if (textSim > 0.3) {
      totalScore += textSim * 0.4;
      weights += 0.4;
      reasons.push(`Narrative similarity: ${(textSim * 100).toFixed(0)}%`);
    }

    // Crime type overlap (for cases/FIRs)
    if (source.attributes.crime_types && target.attributes.crime_types) {
      const crimeOverlap = this.setOverlap(
        source.attributes.crime_types,
        target.attributes.crime_types
      );
      if (crimeOverlap > 0) {
        totalScore += crimeOverlap * 0.3;
        weights += 0.3;
        reasons.push(`Similar crime types: ${(crimeOverlap * 100).toFixed(0)}% overlap`);
      }
    }

    // Geographic proximity (for cases/FIRs)
    if (source.attributes.locations && target.attributes.locations) {
      const geoSim = this.geographicSimilarity(
        source.attributes.locations,
        target.attributes.locations
      );
      if (geoSim > 0.5) {
        totalScore += geoSim * 0.2;
        weights += 0.2;
        reasons.push(`Geographic proximity: ${(geoSim * 100).toFixed(0)}%`);
      }
    }

    // Temporal proximity (for cases/FIRs)
    if (source.attributes.dates && target.attributes.dates) {
      const timeSim = this.temporalSimilarity(
        source.attributes.dates,
        target.attributes.dates
      );
      if (timeSim > 0.5) {
        totalScore += timeSim * 0.1;
        weights += 0.1;
        reasons.push(`Similar timeframe`);
      }
    }

    // MO pattern overlap (for persons/cases)
    if (source.attributes.mo_patterns && target.attributes.mo_patterns) {
      const moOverlap = this.setOverlap(
        source.attributes.mo_patterns,
        target.attributes.mo_patterns
      );
      if (moOverlap > 0) {
        totalScore += moOverlap * 0.3;
        weights += 0.3;
        reasons.push(`Similar MO: ${(moOverlap * 100).toFixed(0)}% match`);
      }
    }

    // Demographic similarity (for persons)
    if (source.attributes.age !== undefined && target.attributes.age !== undefined) {
      const ageSim = this.ageSimilarity(source.attributes.age, target.attributes.age);
      if (ageSim > 0.7) {
        totalScore += ageSim * 0.1;
        weights += 0.1;
        reasons.push(`Similar age group`);
      }
    }

    // Normalize by total weights
    const finalScore = weights > 0 ? totalScore / weights : 0;

    return { score: Math.min(finalScore, 1), reasons };
  }

  private textSimilarity(text1: string, text2: string): number {
    // Simplified Jaccard similarity on words
    const words1 = new Set(this.tokenize(text1));
    const words2 = new Set(this.tokenize(text2));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2); // Remove short words
  }

  private setOverlap<T>(set1: T[], set2: T[]): number {
    const s1 = new Set(set1);
    const s2 = new Set(set2);
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private geographicSimilarity(
    locs1: { lat: number; lng: number }[],
    locs2: { lat: number; lng: number }[]
  ): number {
    // Find minimum distance between any pair of locations
    let minDistance = Infinity;

    for (const loc1 of locs1) {
      for (const loc2 of locs2) {
        const dist = this.haversineDistance(loc1, loc2);
        minDistance = Math.min(minDistance, dist);
      }
    }

    // Convert distance to similarity (closer = more similar)
    // Within 5km = very similar, >20km = not similar
    if (minDistance < 5) return 1.0;
    if (minDistance > 20) return 0.0;
    return 1 - (minDistance - 5) / 15;
  }

  private haversineDistance(
    loc1: { lat: number; lng: number },
    loc2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLng = this.toRad(loc2.lng - loc1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.lat)) *
        Math.cos(this.toRad(loc2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private temporalSimilarity(dates1: Date[], dates2: Date[]): number {
    // Find minimum time difference between any pair of dates
    let minDiff = Infinity;

    for (const date1 of dates1) {
      for (const date2 of dates2) {
        const diff = Math.abs(date1.getTime() - date2.getTime());
        minDiff = Math.min(minDiff, diff);
      }
    }

    // Convert to days
    const daysDiff = minDiff / (1000 * 60 * 60 * 24);

    // Within 7 days = very similar, >90 days = not similar
    if (daysDiff < 7) return 1.0;
    if (daysDiff > 90) return 0.0;
    return 1 - (daysDiff - 7) / 83;
  }

  private ageSimilarity(age1: number, age2: number): number {
    const diff = Math.abs(age1 - age2);
    // Within 5 years = very similar, >20 years = not similar
    if (diff <= 5) return 1.0;
    if (diff >= 20) return 0.0;
    return 1 - (diff - 5) / 15;
  }

  private generateSnapshotVersion(): string {
    return `v${Date.now()}`;
  }
}
