/**
 * ML-Assisted Matcher - Layer 4
 * Phase 0.3
 * 
 * Combines all signals into a single learned similarity score
 */

import { PersonRecord, MatchCandidate } from '../types';

export class MLMatcher {
  private mlThreshold: number;

  constructor(mlThreshold: number = 0.75) {
    this.mlThreshold = mlThreshold;
  }

  /**
   * ML-based similarity scoring (combines all signals)
   */
  findMatches(persons: PersonRecord[], existingCandidates: MatchCandidate[]): MatchCandidate[] {
    const candidates: MatchCandidate[] = [];

    console.log(`[ML Matcher] Scoring ${existingCandidates.length} candidate pairs with ML model...`);

    // In production: use a trained model (XGBoost, Random Forest, or neural network)
    // For now: weighted feature combination

    for (const candidate of existingCandidates) {
      const person1 = persons.find(p => p.id === candidate.person1Id);
      const person2 = persons.find(p => p.id === candidate.person2Id);

      if (!person1 || !person2) continue;

      // Extract features
      const features = this.extractFeatures(person1, person2, candidate);

      // Compute ML score (mock model - weighted sum of features)
      const mlScore = this.computeMLScore(features);

      if (mlScore >= this.mlThreshold) {
        candidates.push({
          person1Id: candidate.person1Id,
          person2Id: candidate.person2Id,
          confidence: mlScore,
          method: 'ml_similarity',
          evidence: [
            `ML model confidence: ${(mlScore * 100).toFixed(1)}%`,
            ...candidate.evidence,
          ],
          suggestedAction: mlScore > 0.90 ? 'auto_merge' : 'review_required',
        });
      }
    }

    console.log(`[ML Matcher] Generated ${candidates.length} ML-scored candidates`);
    return candidates;
  }

  /**
   * Extract features for ML model
   */
  private extractFeatures(person1: PersonRecord, person2: PersonRecord, candidate: MatchCandidate): Record<string, number> {
    return {
      // Base matching method confidence
      base_confidence: candidate.confidence,

      // Name features
      name_length_diff: Math.abs(person1.name.length - person2.name.length) / 50,
      name_token_count_1: person1.name.split(' ').length,
      name_token_count_2: person2.name.split(' ').length,

      // Contact overlap
      phone_overlap: this.calculatePhoneOverlap(person1, person2),
      vehicle_overlap: this.calculateVehicleOverlap(person1, person2),

      // Demographics
      age_difference: person1.age && person2.age ? Math.abs(person1.age - person2.age) : 99,
      same_gender: person1.gender === person2.gender ? 1 : 0,

      // Geographic
      same_district: person1.district === person2.district ? 1 : 0,
      same_station: person1.stationId === person2.stationId ? 1 : 0,

      // Data quality
      person1_completeness: this.calculateCompleteness(person1),
      person2_completeness: this.calculateCompleteness(person2),
    };
  }

  /**
   * Compute ML score (mock model - weighted feature combination)
   */
  private computeMLScore(features: Record<string, number>): number {
    // Mock weights (in production: learned from training data)
    const weights = {
      base_confidence: 0.35,
      phone_overlap: 0.25,
      vehicle_overlap: 0.15,
      same_station: 0.10,
      age_difference: -0.05, // Penalty for large age diff
      same_gender: 0.05,
      same_district: 0.05,
    };

    let score = 0;

    // Base confidence
    score += features.base_confidence * weights.base_confidence;

    // Phone overlap
    score += features.phone_overlap * weights.phone_overlap;

    // Vehicle overlap
    score += features.vehicle_overlap * weights.vehicle_overlap;

    // Same station
    score += features.same_station * weights.same_station;

    // Age penalty
    if (features.age_difference < 99) {
      const agePenalty = Math.max(0, 1 - features.age_difference / 10);
      score += agePenalty * Math.abs(weights.age_difference);
    }

    // Same gender
    score += features.same_gender * weights.same_gender;

    // Same district
    score += features.same_district * weights.same_district;

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, score));
  }

  private calculatePhoneOverlap(person1: PersonRecord, person2: PersonRecord): number {
    if (!person1.phoneNumbers || !person2.phoneNumbers) return 0;

    const phones1 = new Set(person1.phoneNumbers.map(p => p.replace(/\D/g, '')));
    const phones2 = new Set(person2.phoneNumbers.map(p => p.replace(/\D/g, '')));

    let overlap = 0;
    for (const phone of phones1) {
      if (phones2.has(phone)) overlap++;
    }

    return overlap > 0 ? 1.0 : 0.0;
  }

  private calculateVehicleOverlap(person1: PersonRecord, person2: PersonRecord): number {
    if (!person1.vehicleNumbers || !person2.vehicleNumbers) return 0;

    const vehicles1 = new Set(person1.vehicleNumbers);
    const vehicles2 = new Set(person2.vehicleNumbers);

    let overlap = 0;
    for (const vehicle of vehicles1) {
      if (vehicles2.has(vehicle)) overlap++;
    }

    return overlap > 0 ? 1.0 : 0.0;
  }

  private calculateCompleteness(person: PersonRecord): number {
    let fields = 0;
    let filled = 0;

    const checkField = (value: any) => {
      fields++;
      if (value && (typeof value !== 'object' || (Array.isArray(value) && value.length > 0))) {
        filled++;
      }
    };

    checkField(person.name);
    checkField(person.age);
    checkField(person.gender);
    checkField(person.address);
    checkField(person.phoneNumbers);
    checkField(person.vehicleNumbers);
    checkField(person.stationId);
    checkField(person.district);

    return fields > 0 ? filled / fields : 0;
  }
}
