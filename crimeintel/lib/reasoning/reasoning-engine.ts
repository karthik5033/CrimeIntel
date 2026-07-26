/**
 * Phase 6: Reasoning Engine Core
 * 
 * Transforms data into investigative reasoning with theory-backed explanations
 */

import {
  ReasoningQuery,
  ReasoningOutput,
  TheoryEvaluation,
  RATEvaluation,
  CPTEvaluation,
  RCTEvaluation,
  SDTEvaluation,
  AlternativeHypothesis,
  ConfidenceBreakdown,
  EvidenceCitation,
  ReasoningConfig,
  DEFAULT_REASONING_CONFIG,
  CrimeTheory,
  ConfidenceLevel,
} from './types';
import { FinancialEvidenceMapper } from './financial-evidence';

/**
 * Main reasoning engine class
 */
export class ReasoningEngine {
  private config: ReasoningConfig;

  constructor(config: Partial<ReasoningConfig> = {}) {
    this.config = { ...DEFAULT_REASONING_CONFIG, ...config };
  }

  /**
   * Main reasoning pipeline
   */
  async reason(query: ReasoningQuery): Promise<ReasoningOutput> {
    const startTime = Date.now();

    // Stage 1: Context Assembly
    const context = await this.assembleContext(query);

    // Stage 2: Theory Selection
    const theories = this.selectTheories(query, context);

    // Stage 3: Evidence Gathering
    const evidence = await this.gatherEvidence(query, context);

    // Stage 4: Mechanism Matching (apply theories)
    const mechanisms = await this.matchMechanisms(theories, evidence, context);

    // Stage 5: Alternative Generation
    const alternatives = this.config.alternativeGeneration.enabled
      ? await this.generateAlternatives(query, evidence, mechanisms)
      : [];

    // Stage 6: Confidence Scoring
    const confidence = this.calculateConfidence(mechanisms, evidence, alternatives);

    // Stage 7: Compose output
    const claim = this.composeClaim(query, mechanisms, confidence);

    const processingTime = Date.now() - startTime;

    return {
      id: `reasoning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query: query.query,
      claim,
      mechanisms,
      evidence,
      alternatives,
      confidence,
      timestamp: new Date(),
      userId: 'system', // Will be overridden by caller
      processingTime,
    };
  }

  /**
   * Stage 1: Assemble context from query
   */
  private async assembleContext(query: ReasoningQuery): Promise<any> {
    // In production, this would:
    // - Parse query for entities, locations, time periods
    // - Fetch relevant data from Catalyst Data Store
    // - Load user context from Semantic Memory (Phase 0.11)
    
    // Mock implementation
    return {
      district: query.context?.district || 'Bengaluru',
      crimeTypes: query.context?.crimeTypes || ['Vehicle Theft'],
      timeWindow: query.context?.timeWindow || {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        end: new Date(),
      },
    };
  }

  /**
   * Stage 2: Select appropriate theories based on query type
   */
  private selectTheories(query: ReasoningQuery, context: any): CrimeTheory[] {
    // If theories explicitly specified
    if (query.theories && query.theories.length > 0) {
      return query.theories.filter(t => this.config.enabledTheories.includes(t));
    }

    // Auto-select based on query content
    const queryLower = query.query.toLowerCase();
    const selectedTheories: CrimeTheory[] = [];

    // Routine Activity Theory: Good for "why here, why now" questions
    if (queryLower.includes('why') || queryLower.includes('risk') || queryLower.includes('predict')) {
      selectedTheories.push('routine_activity_theory');
    }

    // Crime Pattern Theory: Good for location-based questions
    if (queryLower.includes('where') || queryLower.includes('location') || queryLower.includes('area')) {
      selectedTheories.push('crime_pattern_theory');
    }

    // Rational Choice Theory: Good for offender behavior questions
    if (queryLower.includes('offender') || queryLower.includes('pattern') || queryLower.includes('behavio')) {
      selectedTheories.push('rational_choice_theory');
    }

    // Social Disorganization: Good for district-level trends
    if (queryLower.includes('district') || queryLower.includes('trend') || queryLower.includes('why')) {
      selectedTheories.push('social_disorganization');
    }

    // Default: Use RAT if no theories selected
    if (selectedTheories.length === 0) {
      selectedTheories.push('routine_activity_theory');
    }

    return selectedTheories;
  }

  /**
   * Stage 3: Gather evidence from multiple sources
   */
  private async gatherEvidence(query: ReasoningQuery, context: any): Promise<EvidenceCitation[]> {
    // In production, this would call:
    // - Phase 0.2 Hybrid Retrieval
    // - Phase 0.4 GraphRAG
    // - Phase 0.1 Intelligence Indices

    // Mock evidence
    const evidence: EvidenceCitation[] = [
      {
        type: 'fir',
        id: 'FIR-045-2025',
        title: 'Vehicle Theft near MG Road',
        summary: 'Two-wheeler theft reported near festival grounds, lock-picking method used',
        relevance: 0.95,
        url: '/firs/FIR-045-2025',
      },
      {
        type: 'person',
        id: 'P-123',
        title: 'Repeat Offender: Ravi Kumar',
        summary: 'Released 14 days ago, prior history of vehicle theft with similar MO',
        relevance: 0.88,
        url: '/profiles/P-123',
      },
      {
        type: 'statistic',
        id: 'STAT-001',
        title: 'Patrol Coverage Analysis',
        summary: 'Night patrol coverage down 22% in District X compared to last month',
        relevance: 0.75,
      },
      {
        type: 'pattern',
        id: 'PAT-001',
        title: 'Festival Season Pattern',
        summary: 'Vehicle theft incidents increase 3x during festival season (historical data)',
        relevance: 0.82,
      },
    ];

    // Integrate financial evidence if query is financial-related
    try {
      const financialEvidence = await FinancialEvidenceMapper.gatherFinancialEvidence(query.query);
      if (financialEvidence.length > 0) {
        evidence.push(...financialEvidence as any);
        console.log(`[ReasoningEngine] Added ${financialEvidence.length} financial evidence citations`);
      }
    } catch (error) {
      console.error('[ReasoningEngine] Error gathering financial evidence:', error);
    }

    return evidence.slice(0, this.config.evidenceLimits.maxTotal);
  }

  /**
   * Stage 4: Match mechanisms (apply theories to evidence)
   */
  private async matchMechanisms(
    theories: CrimeTheory[],
    evidence: EvidenceCitation[],
    context: any
  ): Promise<TheoryEvaluation[]> {
    const evaluations: TheoryEvaluation[] = [];

    for (const theory of theories) {
      let evaluation: TheoryEvaluation | null = null;

      switch (theory) {
        case 'routine_activity_theory':
          evaluation = this.evaluateRAT(evidence, context);
          break;
        case 'crime_pattern_theory':
          evaluation = this.evaluateCPT(evidence, context);
          break;
        case 'rational_choice_theory':
          evaluation = this.evaluateRCT(evidence, context);
          break;
        case 'social_disorganization':
          evaluation = this.evaluateSDT(evidence, context);
          break;
      }

      if (evaluation) {
        evaluations.push(evaluation);
      }
    }

    return evaluations;
  }

  /**
   * Evaluate Routine Activity Theory
   */
  private evaluateRAT(evidence: EvidenceCitation[], context: any): RATEvaluation {
    // Mock evaluation - in production, analyze actual data
    return {
      theory: 'routine_activity_theory',
      factors: {
        motivatedOffender: {
          present: true,
          count: 2,
          evidence: evidence.filter(e => e.type === 'person'),
          explanation: '2 repeat offenders released in last 30 days with matching MO (vehicle theft)',
        },
        suitableTarget: {
          density: 'high',
          description: 'Festival season with 3x normal foot traffic',
          evidence: evidence.filter(e => e.type === 'pattern'),
          explanation: 'Festival season creates concentration of unattended vehicles near crowded areas',
        },
        absentGuardian: {
          level: 'high', // High absence = low guardianship
          metrics: {
            patrolCoverage: 78, // 78% coverage (down from 100%)
            cctvDensity: 2.5,   // 2.5 cameras per sq km
          },
          evidence: evidence.filter(e => e.type === 'statistic'),
          explanation: 'Night patrol coverage reduced by 22% compared to previous month',
        },
      },
      riskScore: 78, // High risk
      overallExplanation: 
        'High risk scenario: Motivated offenders present (2 repeat offenders recently released) + ' +
        'Suitable targets concentrated (festival season, 3x foot traffic) + ' +
        'Guardian deficit (patrol coverage down 22%). All three RAT factors converge.',
    };
  }

  /**
   * Evaluate Crime Pattern Theory
   */
  private evaluateCPT(evidence: EvidenceCitation[], context: any): CPTEvaluation {
    // Check for financial evidence
    const financialEvidence = evidence.filter(e => (e as any).type === 'financial');
    let financialInsights = '';
    
    if (financialEvidence.length > 0) {
      const analysis = FinancialEvidenceMapper.analyzeCPT(financialEvidence as any);
      if (analysis.confidence > 0.5) {
        financialInsights = ` Financial pattern analysis: ${analysis.mechanism}. ` +
          `${analysis.supporting.join('; ')}.`;
      }
    }

    // Mock evaluation
    return {
      theory: 'crime_pattern_theory',
      crimeLocation: {
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'MG Road, Bengaluru',
      },
      overlappingOffenders: [
        {
          personId: 'P-123',
          name: 'Ravi Kumar',
          activityNodes: [
            {
              type: 'home',
              latitude: 12.9800,
              longitude: 77.6000,
              distance: 800, // 800 meters
            },
            {
              type: 'prior_crime',
              latitude: 12.9750,
              longitude: 77.5950,
              distance: 500,
            },
          ],
          closestNodeDistance: 500,
          moMatch: true,
          explanation: 'Lives 800m from crime scene, prior crime 500m away, MO matches (lock-picking, evening hours)',
        },
      ],
      geoRadius: 2000, // 2km
      overallExplanation: 
        '1 offender with activity node overlap within 2km radius. Closest node is 500m away (prior crime location). ' +
        'MO matches historical pattern. Suggests offender operates within familiar geographic area.' +
        financialInsights,
    };
  }

  /**
   * Evaluate Rational Choice Theory
   */
  private evaluateRCT(evidence: EvidenceCitation[], context: any): RCTEvaluation {
    // Check for financial evidence
    const financialEvidence = evidence.filter(e => (e as any).type === 'financial');
    let financialInsights = '';
    
    if (financialEvidence.length > 0) {
      const analysis = FinancialEvidenceMapper.analyzeRCT(financialEvidence as any);
      if (analysis.confidence > 0.5) {
        financialInsights = `\n\nFinancial Crime Analysis: ${analysis.mechanism}. ` +
          `Supporting evidence: ${analysis.supporting.join('; ')}.`;
      }
    }

    // Mock evaluation
    return {
      theory: 'rational_choice_theory',
      offenderId: 'P-123',
      behavioralProfile: {
        preferredTime: {
          timeRange: '10 PM - 2 AM',
          percentage: 78,
        },
        targetProfile: {
          type: 'Two-wheelers, unattended, dimly lit areas',
          consistency: 0.85,
        },
        method: {
          description: 'Lock-picking, no violence, quick operation',
          escalationTrend: 'stable',
        },
        geographicRange: {
          radiusKm: 5,
          centerPoint: { latitude: 12.9716, longitude: 77.5946 },
        },
        toolWeapon: {
          description: 'Lock-pick tools (same type in 4/6 cases)',
          consistency: 0.82,
        },
      },
      moConsistencyScore: 0.82,
      recidivismRisk: 'high',
      violenceEscalationRisk: 'low',
      overallExplanation: 
        'Highly consistent behavioral pattern: operates 10 PM-2 AM (78% of incidents), targets unattended two-wheelers, ' +
        'uses lock-picking (no violence), operates within 5km radius of home. High recidivism risk due to pattern ' +
        'consistency and recent release. Low violence escalation risk (no violence in 6 prior incidents).' +
        financialInsights,
    };
  }

  /**
   * Evaluate Social Disorganization Theory
   */
  private evaluateSDT(evidence: EvidenceCitation[], context: any): SDTEvaluation {
    // Check for financial evidence
    const financialEvidence = evidence.filter(e => (e as any).type === 'financial');
    let financialInsights = '';
    
    if (financialEvidence.length > 0) {
      const analysis = FinancialEvidenceMapper.analyzeSDT(financialEvidence as any);
      if (analysis.confidence > 0.5) {
        financialInsights = ` Financial vulnerability analysis: ${analysis.mechanism}. ` +
          `${analysis.supporting.join('; ')}.`;
      }
    }

    // Mock evaluation
    return {
      theory: 'social_disorganization',
      district: context.district,
      socioEconomicFactors: {
        unemploymentRate: 18, // 18%
        migrationRate: 12,    // +12% recent influx
        populationDensity: 2500, // per sq km
        literacyRate: 82,     // 82%
      },
      crimeMetrics: {
        crimeRate: 450, // Per 100k
        comparisonToStateAvg: 3.2, // 3.2x higher
      },
      correlationAnalysis: [
        {
          factor: 'Unemployment',
          correlation: 0.72,
          mechanism: 'High unemployment (18% vs state avg 8%) may reduce informal social controls and increase economic desperation',
        },
        {
          factor: 'Migration',
          correlation: 0.65,
          mechanism: 'Recent migration influx (+12%) weakens community cohesion and informal surveillance',
        },
      ],
      caveats: [
        'Correlation does not imply causation',
        'Multiple confounding factors may be present',
        'Reporting bias: Some districts may have higher FIR filing rates',
      ],
      alternatives: [
        'Seasonal agricultural labor patterns may confound migration data',
        'Improved reporting infrastructure may inflate crime statistics',
      ],
      overallExplanation: 
        `District X shows 3.2x higher property crime rate. Correlated factors: unemployment (18% vs state avg 8%), ` +
        `recent migration (+12%). Mechanism: High population turnover weakens informal social controls. ` +
        `CAVEAT: Correlation not causation. Alternative explanations possible.` +
        financialInsights,
    };
  }

  /**
   * Stage 5: Generate alternative hypotheses
   */
  private async generateAlternatives(
    query: ReasoningQuery,
    evidence: EvidenceCitation[],
    mechanisms: TheoryEvaluation[]
  ): Promise<AlternativeHypothesis[]> {
    // Mock alternatives - in production, use statistical tests and graph analysis
    const alternatives: AlternativeHypothesis[] = [
      {
        id: 'alt-1',
        hypothesis: 'Could this be random noise or natural variation?',
        status: 'Rejected',
        evidence: evidence.filter(e => e.type === 'statistic'),
        explanation: 'Chi-square test shows statistically significant pattern (p < 0.01). Not random noise.',
        confidence: 0.85,
      },
      {
        id: 'alt-2',
        hypothesis: 'Could this be organized gang activity rather than individual offenders?',
        status: 'Rejected',
        evidence: evidence.filter(e => e.type === 'graph'),
        explanation: 'No shared network connections found between suspects. Incidents appear independent.',
        confidence: 0.75,
      },
      {
        id: 'alt-3',
        hypothesis: 'Could this be a seasonal pattern unrelated to current factors?',
        status: 'Partially Supported',
        evidence: evidence.filter(e => e.type === 'pattern'),
        explanation: 'Festival season pattern confirmed historically, but current year shows 40% higher rate than typical seasonal increase.',
        confidence: 0.55,
      },
    ];

    return alternatives.filter(
      alt => alt.confidence >= this.config.alternativeGeneration.minConfidenceToInclude
    ).slice(0, this.config.alternativeGeneration.maxAlternatives);
  }

  /**
   * Stage 6: Calculate confidence scores
   */
  private calculateConfidence(
    mechanisms: TheoryEvaluation[],
    evidence: EvidenceCitation[],
    alternatives: AlternativeHypothesis[]
  ): ConfidenceBreakdown {
    // Calculate individual factors
    const mechanismSupport = Math.min(1.0, mechanisms.length / 3); // More theories = higher confidence
    const historicalPrecedent = 0.75; // Mock: 75% similar cases found
    const networkEvidence = evidence.filter(e => e.type === 'graph').length > 0 ? 0.8 : 0.5;
    const statisticalSignificance = 0.85; // Mock: p < 0.01
    const dataCompleteness = evidence.length / this.config.evidenceLimits.maxTotal;

    // Weighted average
    const score = (
      mechanismSupport * 0.3 +
      historicalPrecedent * 0.2 +
      networkEvidence * 0.2 +
      statisticalSignificance * 0.2 +
      dataCompleteness * 0.1
    );

    // Determine confidence level
    let overall: ConfidenceLevel;
    if (score >= this.config.confidenceThresholds.high) {
      overall = 'High';
    } else if (score >= this.config.confidenceThresholds.moderateHigh) {
      overall = 'Moderate-High';
    } else if (score >= this.config.confidenceThresholds.moderate) {
      overall = 'Moderate';
    } else {
      overall = 'Low';
    }

    return {
      overall,
      score,
      factors: {
        mechanismSupport,
        historicalPrecedent,
        networkEvidence,
        statisticalSignificance,
        dataCompleteness,
      },
      explanation: `Confidence: ${overall} (${(score * 100).toFixed(0)}%). Based on ${mechanisms.length} supporting theories, ` +
                   `${evidence.length} evidence items, and statistical significance testing.`,
    };
  }

  /**
   * Compose final claim based on mechanisms and confidence
   */
  private composeClaim(
    query: ReasoningQuery,
    mechanisms: TheoryEvaluation[],
    confidence: ConfidenceBreakdown
  ): string {
    // Extract key insight from mechanisms
    if (mechanisms.length === 0) {
      return 'Insufficient data to generate reasoning-based claim.';
    }

    // Use first mechanism as primary claim
    const primaryMechanism = mechanisms[0];

    if (primaryMechanism.theory === 'routine_activity_theory') {
      const rat = primaryMechanism as RATEvaluation;
      return `District shows elevated risk for vehicle theft. Risk score: ${rat.riskScore}/100. ` +
             `All three Routine Activity Theory factors converge: motivated offenders present, ` +
             `target concentration high, guardian coverage reduced.`;
    } else if (primaryMechanism.theory === 'crime_pattern_theory') {
      const cpt = primaryMechanism as CPTEvaluation;
      return `${cpt.overlappingOffenders.length} suspect(s) with activity node overlap near crime location. ` +
             `Closest suspect operates within ${cpt.overlappingOffenders[0].closestNodeDistance}m of crime scene.`;
    } else if (primaryMechanism.theory === 'rational_choice_theory') {
      const rct = primaryMechanism as RCTEvaluation;
      return `Suspect shows highly consistent behavioral pattern (MO consistency: ${(rct.moConsistencyScore * 100).toFixed(0)}%). ` +
             `${rct.recidivismRisk.charAt(0).toUpperCase() + rct.recidivismRisk.slice(1)} recidivism risk.`;
    } else if (primaryMechanism.theory === 'social_disorganization') {
      const sdt = primaryMechanism as SDTEvaluation;
      return `District ${sdt.district} shows ${sdt.crimeMetrics.comparisonToStateAvg}x higher crime rate than state average. ` +
             `Correlated with elevated unemployment (${sdt.socioEconomicFactors.unemploymentRate}%) and migration (+${sdt.socioEconomicFactors.migrationRate}%).`;
    }

    return 'Analysis complete. See mechanisms for details.';
  }
}

/**
 * Singleton instance
 */
export const reasoningEngine = new ReasoningEngine();
