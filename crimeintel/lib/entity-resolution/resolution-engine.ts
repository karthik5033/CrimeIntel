/**
 * Entity Resolution Engine - Main Orchestrator
 * Phase 0.3
 * 
 * 4-layer matching pipeline: Deterministic → Fuzzy → Contextual → ML
 */

import {
  PersonRecord,
  MatchCandidate,
  CanonicalPerson,
  EntityResolutionConfig,
  ResolutionMetrics,
} from './types';

import { DeterministicMatcher } from './matchers/deterministic-matcher';
import { FuzzyMatcher } from './matchers/fuzzy-matcher';
import { ContextualMatcher } from './matchers/contextual-matcher';
import { MLMatcher } from './matchers/ml-matcher';

export class EntityResolutionEngine {
  private config: EntityResolutionConfig;
  private deterministicMatcher: DeterministicMatcher;
  private fuzzyMatcher: FuzzyMatcher;
  private contextualMatcher: ContextualMatcher;
  private mlMatcher: MLMatcher;

  constructor(config?: Partial<EntityResolutionConfig>) {
    this.config = {
      exactMatchThreshold: 1.0,
      fuzzyNameThreshold: 0.85,
      phoneticThreshold: 0.80,
      contextualThreshold: 0.75,
      mlThreshold: 0.80,
      autoMergeThreshold: 0.95,
      reviewThreshold: 0.75,
      enableKannadaMatching: true,
      enablePhoneticMatching: true,
      enableContextualMatching: true,
      enableMLMatching: true,
      ...config,
    };

    this.deterministicMatcher = new DeterministicMatcher();
    this.fuzzyMatcher = new FuzzyMatcher(
      this.config.fuzzyNameThreshold,
      this.config.phoneticThreshold
    );
    this.contextualMatcher = new ContextualMatcher(this.config.contextualThreshold);
    this.mlMatcher = new MLMatcher(this.config.mlThreshold);
  }

  /**
   * Main resolution method - runs 4-layer matching pipeline
   */
  async resolve(persons: PersonRecord[]): Promise<{
    candidates: MatchCandidate[];
    metrics: ResolutionMetrics;
  }> {
    const startTime = Date.now();

    console.log(`[Entity Resolution] Starting 4-layer matching for ${persons.length} persons...`);
    console.log('[Entity Resolution] ═══════════════════════════════════════════');

    const allCandidates: MatchCandidate[] = [];

    // Layer 1: Deterministic matching (exact phone/vehicle/ID matches)
    console.log('\n[Layer 1] Deterministic Matching...');
    const deterministicCandidates = this.deterministicMatcher.findMatches(persons);
    allCandidates.push(...deterministicCandidates);
    console.log(`  ✓ ${deterministicCandidates.length} deterministic candidates found`);

    // Layer 2: Fuzzy name matching
    if (this.config.enablePhoneticMatching) {
      console.log('\n[Layer 2] Fuzzy + Phonetic Name Matching...');
      const fuzzyCandidates = this.fuzzyMatcher.findMatches(persons);
      allCandidates.push(...fuzzyCandidates);
      console.log(`  ✓ ${fuzzyCandidates.length} fuzzy/phonetic candidates found`);
    }

    // Layer 3: Contextual matching
    if (this.config.enableContextualMatching) {
      console.log('\n[Layer 3] Contextual Matching...');
      const contextualCandidates = this.contextualMatcher.findMatches(persons);
      allCandidates.push(...contextualCandidates);
      console.log(`  ✓ ${contextualCandidates.length} contextual candidates found`);
    }

    // Layer 4: ML-assisted scoring
    if (this.config.enableMLMatching && allCandidates.length > 0) {
      console.log('\n[Layer 4] ML-Assisted Scoring...');
      const mlCandidates = this.mlMatcher.findMatches(persons, allCandidates);
      
      // Replace lower-confidence candidates with ML-scored versions
      const enhancedCandidates = this.enhanceCandidatesWithML(allCandidates, mlCandidates);
      allCandidates.length = 0;
      allCandidates.push(...enhancedCandidates);
      
      console.log(`  ✓ ${allCandidates.length} candidates after ML enhancement`);
    }

    // Deduplicate candidates
    const uniqueCandidates = this.deduplicateCandidates(allCandidates);

    // Calculate metrics
    const metrics = this.calculateMetrics(uniqueCandidates, persons.length, Date.now() - startTime);

    console.log('\n[Entity Resolution] ═══════════════════════════════════════════');
    console.log(`[Entity Resolution] Complete in ${metrics.processingTimeMs}ms`);
    console.log(`  Total candidates: ${metrics.candidatesGenerated}`);
    console.log(`  Auto-merge: ${metrics.autoMerged}`);
    console.log(`  Review required: ${metrics.reviewRequired}`);
    console.log(`  Rejected: ${metrics.rejected}`);

    return { candidates: uniqueCandidates, metrics };
  }

  /**
   * Merge person records into canonical entities
   */
  async createCanonicalEntities(
    persons: PersonRecord[],
    candidates: MatchCandidate[]
  ): Promise<CanonicalPerson[]> {
    console.log('[Entity Resolution] Creating canonical entities from match candidates...');

    // Build union-find structure for merging
    const clusters = this.buildClusters(candidates);

    const canonicalPersons: CanonicalPerson[] = [];

    for (const cluster of clusters) {
      const personRecords = cluster.map(id => persons.find(p => p.id === id)!).filter(Boolean);
      
      if (personRecords.length === 0) continue;

      const canonical = this.mergePersonRecords(personRecords);
      canonicalPersons.push(canonical);
    }

    console.log(`[Entity Resolution] Created ${canonicalPersons.length} canonical entities`);

    return canonicalPersons;
  }

  /**
   * Build clusters of person IDs that should be merged
   */
  private buildClusters(candidates: MatchCandidate[]): string[][] {
    const unionFind = new Map<string, string>();
    
    // Initialize: each person is its own parent
    const allPersonIds = new Set<string>();
    for (const candidate of candidates) {
      if (candidate.suggestedAction === 'auto_merge' || candidate.confidence >= this.config.autoMergeThreshold) {
        allPersonIds.add(candidate.person1Id);
        allPersonIds.add(candidate.person2Id);
      }
    }

    for (const id of allPersonIds) {
      unionFind.set(id, id);
    }

    // Union operation
    const find = (id: string): string => {
      if (unionFind.get(id) !== id) {
        unionFind.set(id, find(unionFind.get(id)!));
      }
      return unionFind.get(id)!;
    };

    const union = (id1: string, id2: string) => {
      const root1 = find(id1);
      const root2 = find(id2);
      if (root1 !== root2) {
        unionFind.set(root2, root1);
      }
    };

    // Merge based on candidates
    for (const candidate of candidates) {
      if (candidate.suggestedAction === 'auto_merge' || candidate.confidence >= this.config.autoMergeThreshold) {
        union(candidate.person1Id, candidate.person2Id);
      }
    }

    // Group by root
    const groups = new Map<string, string[]>();
    for (const id of allPersonIds) {
      const root = find(id);
      if (!groups.has(root)) {
        groups.set(root, []);
      }
      groups.get(root)!.push(id);
    }

    return Array.from(groups.values());
  }

  /**
   * Merge multiple person records into one canonical record
   */
  private mergePersonRecords(persons: PersonRecord[]): CanonicalPerson {
    // Choose primary name (most common or first)
    const nameCounts = new Map<string, number>();
    for (const person of persons) {
      nameCounts.set(person.name, (nameCounts.get(person.name) || 0) + 1);
    }
    const primaryName = Array.from(nameCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];

    // Collect all unique aliases
    const aliases = new Set<string>();
    for (const person of persons) {
      if (person.name !== primaryName) {
        aliases.add(person.name);
      }
      if (person.aliases) {
        person.aliases.forEach(alias => aliases.add(alias));
      }
    }

    // Collect all unique phones
    const phoneNumbers = new Set<string>();
    for (const person of persons) {
      if (person.phoneNumbers) {
        person.phoneNumbers.forEach(phone => phoneNumbers.add(phone));
      }
    }

    // Collect all unique vehicles
    const vehicleNumbers = new Set<string>();
    for (const person of persons) {
      if (person.vehicleNumbers) {
        person.vehicleNumbers.forEach(vehicle => vehicleNumbers.add(vehicle));
      }
    }

    // Collect all unique addresses
    const addresses = new Set<string>();
    for (const person of persons) {
      if (person.address) {
        addresses.add(person.address);
      }
    }

    return {
      canonicalId: `canonical-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mergedFrom: persons.map(p => p.id),
      name: primaryName,
      aliases: Array.from(aliases),
      phoneNumbers: Array.from(phoneNumbers),
      vehicleNumbers: Array.from(vehicleNumbers),
      addresses: Array.from(addresses),
      confidence: 0.9, // Could be calculated based on match scores
      resolutionMethod: ['exact_id', 'fuzzy_name'], // From candidates
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Enhance candidates with ML scores
   */
  private enhanceCandidatesWithML(
    originalCandidates: MatchCandidate[],
    mlCandidates: MatchCandidate[]
  ): MatchCandidate[] {
    const mlMap = new Map<string, MatchCandidate>();
    
    for (const mlCandidate of mlCandidates) {
      const key = `${mlCandidate.person1Id}-${mlCandidate.person2Id}`;
      mlMap.set(key, mlCandidate);
    }

    return originalCandidates.map(candidate => {
      const key = `${candidate.person1Id}-${candidate.person2Id}`;
      return mlMap.get(key) || candidate;
    });
  }

  /**
   * Remove duplicate candidates (same pair, different methods)
   */
  private deduplicateCandidates(candidates: MatchCandidate[]): MatchCandidate[] {
    const seen = new Map<string, MatchCandidate>();

    for (const candidate of candidates) {
      // Normalize key (person1 < person2 alphabetically)
      const [id1, id2] = [candidate.person1Id, candidate.person2Id].sort();
      const key = `${id1}-${id2}`;

      if (!seen.has(key)) {
        seen.set(key, candidate);
      } else {
        // Keep the one with higher confidence
        const existing = seen.get(key)!;
        if (candidate.confidence > existing.confidence) {
          seen.set(key, candidate);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Calculate resolution metrics
   */
  private calculateMetrics(
    candidates: MatchCandidate[],
    totalPersons: number,
    processingTimeMs: number
  ): ResolutionMetrics {
    let autoMerged = 0;
    let reviewRequired = 0;
    let rejected = 0;

    for (const candidate of candidates) {
      switch (candidate.suggestedAction) {
        case 'auto_merge':
          autoMerged++;
          break;
        case 'review_required':
          reviewRequired++;
          break;
        case 'reject':
          rejected++;
          break;
      }
    }

    return {
      totalPersons,
      candidatesGenerated: candidates.length,
      autoMerged,
      reviewRequired,
      rejected,
      processingTimeMs,
    };
  }
}
