/**
 * Contextual Matcher - Layer 3
 * Phase 0.3
 * 
 * Same address + same station + overlapping timeline → candidate merge
 */

import { PersonRecord, MatchCandidate } from '../types';

export class ContextualMatcher {
  private contextualThreshold: number;

  constructor(contextualThreshold: number = 0.75) {
    this.contextualThreshold = contextualThreshold;
  }

  /**
   * Find matches based on contextual signals
   */
  findMatches(persons: PersonRecord[]): MatchCandidate[] {
    const candidates: MatchCandidate[] = [];

    console.log(`[Contextual Matcher] Analyzing contextual signals...`);

    // Group by station for efficiency
    const stationGroups = this.groupByStation(persons);

    for (const [stationId, stationPersons] of stationGroups.entries()) {
      if (stationPersons.length < 2) continue;

      // Compare within station (higher likelihood of same person)
      for (let i = 0; i < stationPersons.length; i++) {
        for (let j = i + 1; j < stationPersons.length; j++) {
          const person1 = stationPersons[i];
          const person2 = stationPersons[j];

          const contextScore = this.calculateContextualScore(person1, person2);

          if (contextScore >= this.contextualThreshold) {
            candidates.push({
              person1Id: person1.id,
              person2Id: person2.id,
              confidence: contextScore,
              method: 'contextual_address',
              evidence: this.buildContextualEvidence(person1, person2),
              suggestedAction: contextScore > 0.85 ? 'review_required' : 'reject',
            });
          }
        }
      }
    }

    console.log(`[Contextual Matcher] Found ${candidates.length} contextual match candidates`);
    return candidates;
  }

  private groupByStation(persons: PersonRecord[]): Map<string, PersonRecord[]> {
    const groups = new Map<string, PersonRecord[]>();

    for (const person of persons) {
      if (person.stationId) {
        if (!groups.has(person.stationId)) {
          groups.set(person.stationId, []);
        }
        groups.get(person.stationId)!.push(person);
      }
    }

    return groups;
  }

  /**
   * Calculate contextual similarity score
   */
  private calculateContextualScore(person1: PersonRecord, person2: PersonRecord): number {
    let totalWeight = 0;
    let matchedWeight = 0;

    // Address similarity (highest weight)
    if (person1.address && person2.address) {
      totalWeight += 0.5;
      const addressSimilarity = this.addressSimilarity(person1.address, person2.address);
      matchedWeight += addressSimilarity * 0.5;
    }

    // Same station (medium weight)
    if (person1.stationId && person2.stationId) {
      totalWeight += 0.3;
      if (person1.stationId === person2.stationId) {
        matchedWeight += 0.3;
      }
    }

    // Age proximity (low weight, but helps)
    if (person1.age && person2.age) {
      totalWeight += 0.2;
      const ageDiff = Math.abs(person1.age - person2.age);
      if (ageDiff <= 2) {
        matchedWeight += 0.2 * (1 - ageDiff / 10);
      }
    }

    if (totalWeight === 0) return 0;

    return matchedWeight / totalWeight;
  }

  /**
   * Simple address similarity (token overlap)
   */
  private addressSimilarity(addr1: string, addr2: string): number {
    const tokens1 = this.tokenizeAddress(addr1);
    const tokens2 = this.tokenizeAddress(addr2);

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    let overlap = 0;
    for (const token of set1) {
      if (set2.has(token)) overlap++;
    }

    const union = set1.size + set2.size - overlap;
    return union > 0 ? overlap / union : 0;
  }

  private tokenizeAddress(address: string): string[] {
    return address
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 2); // Remove short words
  }

  private buildContextualEvidence(person1: PersonRecord, person2: PersonRecord): string[] {
    const evidence: string[] = [];

    if (person1.address && person2.address) {
      const similarity = this.addressSimilarity(person1.address, person2.address);
      if (similarity > 0.5) {
        evidence.push(`Similar addresses (${(similarity * 100).toFixed(0)}% overlap)`);
      }
    }

    if (person1.stationId === person2.stationId) {
      evidence.push(`Same station: ${person1.stationId}`);
    }

    if (person1.age && person2.age) {
      const ageDiff = Math.abs(person1.age - person2.age);
      if (ageDiff <= 2) {
        evidence.push(`Similar age: ${person1.age} ≈ ${person2.age}`);
      }
    }

    return evidence;
  }
}
