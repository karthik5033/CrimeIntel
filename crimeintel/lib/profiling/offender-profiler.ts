/**
 * Phase 8: Offender Profiler
 * 
 * Generates comprehensive offender profiles with behavioral analysis
 * powered by Rational Choice Theory from Phase 6 Reasoning Engine.
 */

import type {
  OffenderProfile,
  CriminalHistoryEntry,
  BehavioralProfile,
  NetworkConnection,
  LinkedEntity,
  InvestigationLead,
  ProfileQuery,
  OffenderListItem,
  OffenderSearchFilters,
} from './types';

/**
 * Offender profiling engine
 */
export class OffenderProfiler {
  /**
   * Get comprehensive offender profile
   */
  async getProfile(query: ProfileQuery): Promise<{
    profile: OffenderProfile;
    history?: CriminalHistoryEntry[];
    behavioralProfile?: BehavioralProfile;
    network?: NetworkConnection[];
    linkedEntities?: LinkedEntity[];
    leads?: InvestigationLead[];
  }> {
    const { personId } = query;

    // Fetch base profile
    const profile = await this.fetchOffenderProfile(personId);

    const result: any = { profile };

    // Conditionally include requested data
    if (query.includeHistory) {
      result.history = await this.getCriminalHistory(personId);
    }

    if (query.includeBehavioralProfile) {
      result.behavioralProfile = await this.generateBehavioralProfile(personId);
    }

    if (query.includeNetwork) {
      result.network = await this.getNetworkConnections(personId);
    }

    if (query.includeLinkedEntities) {
      result.linkedEntities = await this.getLinkedEntities(personId);
    }

    if (query.includeLeads) {
      result.leads = await this.generateInvestigationLeads(personId);
    }

    return result;
  }

  /**
   * Search offenders with filters
   */
  async searchOffenders(filters: OffenderSearchFilters): Promise<OffenderListItem[]> {
    // Mock data - in production, query from Catalyst DataStore
    const mockOffenders: OffenderListItem[] = [
      {
        personId: 'PERSON-001',
        name: 'Rajesh Kumar',
        age: 32,
        gender: 'Male',
        riskScore: 78,
        firCount: 12,
        lastKnownStatus: 'Released',
        district: 'Bengaluru Urban',
        role: 'Accused',
      },
      {
        personId: 'PERSON-002',
        name: 'Prakash M',
        age: 28,
        gender: 'Male',
        riskScore: 65,
        firCount: 8,
        lastKnownStatus: 'In Custody',
        district: 'Mysuru',
        role: 'Accused',
      },
      {
        personId: 'PERSON-003',
        name: 'Suresh Rao',
        age: 45,
        gender: 'Male',
        riskScore: 82,
        firCount: 15,
        lastKnownStatus: 'Wanted',
        district: 'Bengaluru Urban',
        role: 'Accused',
      },
      {
        personId: 'PERSON-004',
        name: 'Ramesh K',
        age: 38,
        gender: 'Male',
        riskScore: 54,
        firCount: 5,
        lastKnownStatus: 'Released',
        district: 'Mangaluru',
        role: 'Accused',
      },
    ];

    // Apply filters
    let filtered = mockOffenders;

    if (filters.role) {
      filtered = filtered.filter((o) => filters.role!.includes(o.role as any));
    }

    if (filters.riskScoreRange) {
      filtered = filtered.filter(
        (o) =>
          o.riskScore >= filters.riskScoreRange!.min &&
          o.riskScore <= filters.riskScoreRange!.max
      );
    }

    if (filters.districts) {
      filtered = filtered.filter((o) => filters.districts!.includes(o.district));
    }

    if (filters.minFIRCount) {
      filtered = filtered.filter((o) => o.firCount >= filters.minFIRCount!);
    }

    // Sort by risk score descending
    return filtered.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Get top offenders by risk score
   */
  async getTopOffenders(limit: number = 10): Promise<OffenderListItem[]> {
    const all = await this.searchOffenders({ role: ['Accused'] });
    return all.slice(0, limit);
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Fetch base offender profile
   */
  private async fetchOffenderProfile(personId: string): Promise<OffenderProfile> {
    // Mock - in production, query from DataStore
    return {
      personId,
      name: 'Rajesh Kumar',
      age: 32,
      gender: 'Male',
      role: 'Accused',
      riskScore: 78,
      status: 'Released',
      quickStats: {
        totalFIRs: 12,
        firstOffenseDate: new Date('2020-03-15'),
        lastOffenseDate: new Date('2024-01-20'),
        activeCases: 2,
      },
    };
  }

  /**
   * Get criminal history timeline
   */
  private async getCriminalHistory(personId: string): Promise<CriminalHistoryEntry[]> {
    // Mock - in production, join person-FIR links with FIR table
    const history: CriminalHistoryEntry[] = [
      {
        firId: 'FIR-001',
        firNumber: '2024/001/0015',
        date: new Date('2024-01-20'),
        crimeType: 'Chain Snatching',
        status: 'Under Investigation',
        description: 'Gold chain snatched from elderly woman near bus stop',
        severity: 'Severe',
        location: 'Whitefield, Bengaluru',
        district: 'Bengaluru Urban',
      },
      {
        firId: 'FIR-002',
        firNumber: '2023/008/0142',
        date: new Date('2023-08-10'),
        crimeType: 'Vehicle Theft',
        status: 'Chargesheeted',
        description: 'Motorcycle stolen from parking lot',
        severity: 'Moderate',
        location: 'Koramangala, Bengaluru',
        district: 'Bengaluru Urban',
      },
      {
        firId: 'FIR-003',
        firNumber: '2022/12/0089',
        date: new Date('2022-12-05'),
        crimeType: 'Robbery',
        status: 'Convicted',
        description: 'Mobile phone snatched at knife-point',
        severity: 'Severe',
        location: 'MG Road, Bengaluru',
        district: 'Bengaluru Urban',
      },
      {
        firId: 'FIR-004',
        firNumber: '2021/05/0034',
        date: new Date('2021-05-18'),
        crimeType: 'Theft',
        status: 'Resolved',
        description: 'Shoplifting from electronics store',
        severity: 'Minor',
        location: 'Brigade Road, Bengaluru',
        district: 'Bengaluru Urban',
      },
      {
        firId: 'FIR-005',
        firNumber: '2020/03/0022',
        date: new Date('2020-03-15'),
        crimeType: 'Pickpocketing',
        status: 'Resolved',
        description: 'Wallet stolen in crowded market',
        severity: 'Minor',
        location: 'KR Market, Bengaluru',
        district: 'Bengaluru Urban',
      },
    ];

    return history.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Generate behavioral profile using RCT from Phase 6
   */
  private async generateBehavioralProfile(
    personId: string
  ): Promise<BehavioralProfile> {
    // Get criminal history for RCT analysis
    const history = await this.getCriminalHistory(personId);

    // Mock RCT analysis for now - in production, use Phase 6 Reasoning Engine
    // const reasoningEngine = new ReasoningEngine();
    // const rctAnalysis = await reasoningEngine.applyTheory('RCT', ...);

    // Extract behavioral patterns
    const moConsistency = this.calculateMOConsistency(history);
    const timePattern = this.extractTimePattern(history);
    const geoPattern = this.extractGeographicPattern(history);
    const escalation = this.analyzeEscalation(history);

    return {
      personId,
      preferredTime: timePattern,
      targetProfile: {
        description: 'Elderly victims in isolated locations',
        commonTraits: ['Elderly', 'Female', 'Isolated areas', 'Evening hours'],
        icon: 'user-target',
      },
      modusOperandi: {
        method: 'Chain snatching from behind using two-wheeler',
        consistencyScore: moConsistency,
        patterns: [
          'Approaches from behind',
          'Uses two-wheeler for quick escape',
          'Targets elderly women',
          'Prefers evening hours (6-9 PM)',
          'Operates in semi-crowded areas',
        ],
      },
      geographicRange: geoPattern,
      escalationTrend: escalation,
      moConsistency,
      confidence: Math.min(98, 40 + (history.length * 5) + (moConsistency > 70 ? 15 : 0) + (timePattern ? 10 : 0)), // Dynamic confidence based on data completeness
    };
  }

  /**
   * Get network connections
   */
  private async getNetworkConnections(personId: string): Promise<NetworkConnection[]> {
    // Mock - in production, query from Phase 0.1 graph-computer
    return [
      {
        personId: 'PERSON-010',
        name: 'Suresh Rao',
        relationshipType: 'Co-accused',
        strength: 85,
        sharedFIRs: 3,
        firstSeen: new Date('2022-06-10'),
        lastSeen: new Date('2024-01-20'),
      },
      {
        personId: 'PERSON-011',
        name: 'Mahesh K',
        relationshipType: 'Associate',
        strength: 62,
        sharedFIRs: 1,
        firstSeen: new Date('2023-03-15'),
        lastSeen: new Date('2023-08-10'),
      },
      {
        personId: 'PERSON-012',
        name: 'Prakash M',
        relationshipType: 'Contact',
        strength: 45,
        sharedFIRs: 0,
        firstSeen: new Date('2021-11-20'),
        lastSeen: new Date('2023-05-12'),
      },
    ];
  }

  /**
   * Get linked entities (vehicles, phones, accounts, addresses)
   */
  private async getLinkedEntities(personId: string): Promise<LinkedEntity[]> {
    // Mock - in production, join across entity tables
    return [
      {
        type: 'Vehicle',
        value: 'KA-01-AB-1234 (Honda Activa)',
        firCount: 5,
        firstSeen: new Date('2022-01-10'),
        lastSeen: new Date('2024-01-20'),
        status: 'Seized',
      },
      {
        type: 'Phone',
        value: '+91-98765-43210',
        firCount: 8,
        firstSeen: new Date('2021-05-15'),
        lastSeen: new Date('2023-12-10'),
        status: 'Active',
      },
      {
        type: 'BankAccount',
        value: 'HDFC Bank - XXXX4567',
        firCount: 2,
        firstSeen: new Date('2022-08-20'),
        lastSeen: new Date('2023-06-15'),
      },
      {
        type: 'Address',
        value: '#45, 3rd Cross, Whitefield, Bengaluru - 560066',
        firCount: 12,
        firstSeen: new Date('2020-03-15'),
        lastSeen: new Date('2024-01-20'),
        status: 'Last Known',
      },
    ];
  }

  /**
   * Generate investigation leads
   */
  private async generateInvestigationLeads(
    personId: string
  ): Promise<InvestigationLead[]> {
    // Combine insights from graph, patterns, RCT, and similarity
    return [
      {
        id: 'LEAD-001',
        description: 'Frequent activity near Whitefield between 6-9 PM (overlaps with 3 unsolved chain snatchings)',
        priority: 'High',
        source: 'Pattern',
        confidence: 82,
        actionable: true,
        details: 'Review CCTV footage from Whitefield area during evening hours',
      },
      {
        id: 'LEAD-002',
        description: 'Associate Suresh Rao was arrested last week (Case #4521), may provide information',
        priority: 'High',
        source: 'Graph',
        confidence: 90,
        actionable: true,
        details: 'Interview Suresh Rao about recent activities with Rajesh Kumar',
      },
      {
        id: 'LEAD-003',
        description: 'MO matches unsolved Case #3201 from 2023 (chain snatching, elderly target, two-wheeler)',
        priority: 'Medium',
        source: 'Similarity',
        confidence: 75,
        actionable: true,
        details: 'Compare evidence between current case and Case #3201',
      },
      {
        id: 'LEAD-004',
        description: 'Rational Choice analysis suggests escalation due to financial pressure (recent loan defaults)',
        priority: 'Medium',
        source: 'Theory',
        confidence: 68,
        actionable: false,
        details: 'Monitor for increased activity, consider preventive measures',
      },
    ];
  }

  /**
   * Calculate MO consistency score
   */
  private calculateMOConsistency(history: CriminalHistoryEntry[]): number {
    if (history.length < 2) return 0;

    // Simple heuristic: group by crime type and location patterns
    const crimeTypeCounts = history.reduce((acc, h) => {
      acc[h.crimeType] = (acc[h.crimeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxCount = Math.max(...Object.values(crimeTypeCounts));
    const consistency = (maxCount / history.length) * 100;

    return Math.round(consistency);
  }

  /**
   * Extract time pattern from history
   */
  private extractTimePattern(history: CriminalHistoryEntry[]): BehavioralProfile['preferredTime'] {
    // Mock analysis - in production, analyze timestamps
    return {
      hourRange: '18:00-21:00',
      dayOfWeek: 'Friday, Saturday',
      visualization: 'clock',
    };
  }

  /**
   * Extract geographic pattern
   */
  private extractGeographicPattern(
    history: CriminalHistoryEntry[]
  ): BehavioralProfile['geographicRange'] {
    // Mock - in production, calculate centroid from FIR locations
    return {
      centerLat: 12.9716,
      centerLng: 77.5946,
      radiusKm: 5.2,
      districts: ['Bengaluru Urban'],
    };
  }

  /**
   * Analyze escalation trend
   */
  private analyzeEscalation(
    history: CriminalHistoryEntry[]
  ): BehavioralProfile['escalationTrend'] {
    const severityMap = { Minor: 1, Moderate: 2, Severe: 3, Critical: 4 };
    const dataPoints = history.map((h) => ({
      date: h.date,
      severity: severityMap[h.severity],
    }));

    // Simple trend analysis
    const recentAvg =
      dataPoints
        .slice(0, 3)
        .reduce((sum, dp) => sum + dp.severity, 0) / Math.min(3, dataPoints.length);
    const oldAvg =
      dataPoints
        .slice(-3)
        .reduce((sum, dp) => sum + dp.severity, 0) / Math.min(3, dataPoints.length);

    let trend: 'escalating' | 'stable' | 'de-escalating' = 'stable';
    if (recentAvg > oldAvg + 0.5) trend = 'escalating';
    if (recentAvg < oldAvg - 0.5) trend = 'de-escalating';

    return {
      trend,
      description:
        trend === 'escalating'
          ? 'Crime severity increasing over time'
          : trend === 'de-escalating'
          ? 'Crime severity decreasing over time'
          : 'Crime severity remains consistent',
      dataPoints,
    };
  }
}

/**
 * Singleton instance
 */
export const offenderProfiler = new OffenderProfiler();
