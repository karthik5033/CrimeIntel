/**
 * Offender Score Index Computer
 * Phase 0.1 - Computes per-person risk/recidivism scores
 */

import { OffenderScoreIndex, IndexComputationResult } from './types';

export interface PersonRecord {
  person_id: string;
  person_name: string;
  fir_ids: string[];
  offense_dates: Date[];
  crime_types: string[];
  has_active_connections?: boolean;
}

export class OffenderScoreComputer {
  private readonly FREQUENCY_WEIGHT = 0.3;
  private readonly RECENCY_WEIGHT = 0.25;
  private readonly SEVERITY_WEIGHT = 0.25;
  private readonly ESCALATION_WEIGHT = 0.1;
  private readonly NETWORK_WEIGHT = 0.1;

  /**
   * Compute offender risk scores
   */
  async compute(persons: PersonRecord[]): Promise<IndexComputationResult> {
    const startTime = Date.now();
    const snapshot_version = this.generateSnapshotVersion();

    try {
      const scores: OffenderScoreIndex[] = [];

      for (const person of persons) {
        // Only score persons with offenses
        if (person.fir_ids.length === 0) continue;

        const score: OffenderScoreIndex = {
          person_id: person.person_id,
          person_name: person.person_name,
          risk_score: this.calculateRiskScore(person),
          recidivism_probability: this.calculateRecidivismProbability(person),
          offense_count: person.fir_ids.length,
          last_offense_date: this.getLastOffenseDate(person.offense_dates),
          escalation_trend: this.calculateEscalationTrend(person),
          behavioral_consistency: this.calculateBehavioralConsistency(person),
          network_activity_score: this.calculateNetworkActivityScore(person),
          computed_at: new Date(),
        };

        scores.push(score);
      }

      return {
        success: true,
        index_type: 'offender-score',
        records_computed: scores.length,
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
      };
    } catch (error) {
      return {
        success: false,
        index_type: 'offender-score',
        records_computed: 0,
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private calculateRiskScore(person: PersonRecord): number {
    // Composite risk score from multiple factors
    const frequencyScore = this.calculateFrequencyScore(person);
    const recencyScore = this.calculateRecencyScore(person);
    const severityScore = this.calculateSeverityScore(person);
    const escalationScore = this.calculateEscalationScore(person);
    const networkScore = person.has_active_connections ? 80 : 20;

    const compositeScore =
      frequencyScore * this.FREQUENCY_WEIGHT +
      recencyScore * this.RECENCY_WEIGHT +
      severityScore * this.SEVERITY_WEIGHT +
      escalationScore * this.ESCALATION_WEIGHT +
      networkScore * this.NETWORK_WEIGHT;

    return Math.min(Math.round(compositeScore), 100);
  }

  private calculateFrequencyScore(person: PersonRecord): number {
    // More offenses = higher risk
    const offenseCount = person.fir_ids.length;
    if (offenseCount >= 5) return 100;
    if (offenseCount >= 3) return 80;
    if (offenseCount >= 2) return 60;
    return 40;
  }

  private calculateRecencyScore(person: PersonRecord): number {
    // More recent offense = higher risk
    const lastOffense = this.getLastOffenseDate(person.offense_dates);
    if (!lastOffense) return 0;

    const daysSinceLastOffense = Math.floor(
      (Date.now() - lastOffense.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastOffense <= 30) return 100;
    if (daysSinceLastOffense <= 90) return 80;
    if (daysSinceLastOffense <= 180) return 60;
    if (daysSinceLastOffense <= 365) return 40;
    return 20;
  }

  private calculateSeverityScore(person: PersonRecord): number {
    const severityWeights: Record<string, number> = {
      murder: 100,
      kidnapping: 90,
      robbery: 70,
      'vehicle theft': 50,
      burglary: 60,
      assault: 65,
      'chain snatching': 55,
      cybercrime: 40,
    };

    const avgSeverity =
      person.crime_types.reduce((acc, type) => {
        const severity = severityWeights[type.toLowerCase()] || 50;
        return acc + severity;
      }, 0) / person.crime_types.length;

    return avgSeverity;
  }

  private calculateEscalationScore(person: PersonRecord): number {
    // Check if crime severity is increasing over time
    if (person.crime_types.length < 2) return 50;

    const severityWeights: Record<string, number> = {
      murder: 100,
      kidnapping: 90,
      robbery: 70,
      burglary: 60,
      assault: 65,
      'vehicle theft': 50,
      'chain snatching': 55,
      cybercrime: 40,
    };

    // Get severity over time
    const severities = person.crime_types.map(
      (type) => severityWeights[type.toLowerCase()] || 50
    );

    // Check if later crimes are more severe
    const midpoint = Math.floor(severities.length / 2);
    const firstHalfAvg =
      severities.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
    const secondHalfAvg =
      severities.slice(midpoint).reduce((a, b) => a + b, 0) /
      (severities.length - midpoint);

    if (secondHalfAvg > firstHalfAvg * 1.2) return 100; // Escalating
    if (secondHalfAvg < firstHalfAvg * 0.8) return 20; // De-escalating
    return 50; // Stable
  }

  private calculateRecidivismProbability(person: PersonRecord): number {
    // Simplified recidivism model
    // In production, use trained ML model
    const riskScore = this.calculateRiskScore(person);
    const offenseCount = person.fir_ids.length;

    let baseProbability = 0;
    if (offenseCount >= 5) baseProbability = 0.8;
    else if (offenseCount >= 3) baseProbability = 0.6;
    else if (offenseCount >= 2) baseProbability = 0.4;
    else baseProbability = 0.2;

    // Adjust by risk score
    const adjustedProbability = baseProbability * (riskScore / 100);

    return Math.min(adjustedProbability, 0.95);
  }

  private calculateEscalationTrend(
    person: PersonRecord
  ): 'escalating' | 'stable' | 'de-escalating' {
    const escalationScore = this.calculateEscalationScore(person);
    if (escalationScore >= 80) return 'escalating';
    if (escalationScore <= 30) return 'de-escalating';
    return 'stable';
  }

  private calculateBehavioralConsistency(person: PersonRecord): number {
    // How consistent is the MO (crime types)?
    if (person.crime_types.length < 2) return 1.0;

    const uniqueTypes = new Set(person.crime_types);
    const consistency = 1 - uniqueTypes.size / person.crime_types.length;

    return Math.max(consistency, 0.1);
  }

  private calculateNetworkActivityScore(person: PersonRecord): number {
    // Based on whether person has active network connections
    // In production, this would query the graph index
    return person.has_active_connections ? 75 : 25;
  }

  private getLastOffenseDate(dates: Date[]): Date | undefined {
    if (dates.length === 0) return undefined;
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }

  private generateSnapshotVersion(): string {
    return `v${Date.now()}`;
  }
}
