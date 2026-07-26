/**
 * Analytics Retriever - Precomputed Aggregates & Trends
 * Phase 0.2
 * 
 * Reads from Phase 0.1's hotspot/gang/offender score indices
 */

import {
  QueryContext,
  EvidenceItem,
  RetrieverResult,
  RetrieverConfig,
} from '../types';

export class AnalyticsRetriever {
  private config: RetrieverConfig;

  constructor(config: RetrieverConfig) {
    this.config = config;
  }

  async retrieve(context: QueryContext): Promise<RetrieverResult> {
    const startTime = Date.now();

    try {
      console.log('[Analytics Retriever] Fetching precomputed aggregates...');

      // Determine what analytics to fetch based on query
      const analyticsType = this.determineAnalyticsType(context);
      const results = await this.fetchAnalytics(analyticsType, context);

      const items = this.formatResults(results);

      return {
        retriever: 'analytics',
        success: true,
        items,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          totalMatches: items.length,
          queryType: analyticsType,
          cacheHit: true, // Reading from Phase 0.1 indices
        },
      };
    } catch (error: any) {
      console.error('[Analytics Retriever] Error:', error.message);

      if (this.config.fallbackOnError) {
        return {
          retriever: 'analytics',
          success: false,
          items: [],
          executionTimeMs: Date.now() - startTime,
          error: error.message,
        };
      }

      throw error;
    }
  }

  private determineAnalyticsType(context: QueryContext): string {
    const { query } = context;
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('hotspot') || lowerQuery.includes('high-risk') || lowerQuery.includes('flagged')) {
      return 'hotspot';
    }

    if (lowerQuery.includes('gang') || lowerQuery.includes('organized') || lowerQuery.includes('network')) {
      return 'gang_score';
    }

    if (lowerQuery.includes('offender') || lowerQuery.includes('repeat') || lowerQuery.includes('risk')) {
      return 'offender_score';
    }

    if (lowerQuery.includes('trend') || lowerQuery.includes('increase') || lowerQuery.includes('decrease')) {
      return 'trend';
    }

    if (lowerQuery.includes('count') || lowerQuery.includes('total') || lowerQuery.includes('number')) {
      return 'aggregate';
    }

    return 'general_analytics';
  }

  private async fetchAnalytics(analyticsType: string, context: QueryContext): Promise<any[]> {
    // In production: reads from Phase 0.1 intelligence indices in Catalyst Cache
    console.log(`[Analytics Retriever] Fetching ${analyticsType} from precomputed indices`);

    // Simulate fast cache read (<50ms)
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 30));

    // Mock analytics data based on type
    switch (analyticsType) {
      case 'hotspot':
        return [
          {
            type: 'hotspot',
            district: 'Bengaluru Urban',
            area: 'Whitefield',
            risk_score: 87,
            crime_density: 45,
            recent_incidents: 12,
            computed_at: new Date(),
          },
          {
            type: 'hotspot',
            district: 'Bengaluru Urban',
            area: 'Koramangala',
            risk_score: 73,
            crime_density: 38,
            recent_incidents: 9,
            computed_at: new Date(),
          },
        ];

      case 'gang_score':
        return [
          {
            type: 'gang_score',
            community_id: 'community-001',
            size: 5,
            organized_crime_score: 0.82,
            activity_level: 'high',
            primary_crime_type: 'Vehicle Theft',
            computed_at: new Date(),
          },
        ];

      case 'offender_score':
        return [
          {
            type: 'offender_score',
            person_id: 'person-001',
            name: 'Rajesh Kumar',
            risk_score: 0.78,
            recidivism_probability: 0.65,
            offense_count: 4,
            last_offense_date: new Date('2024-01-10'),
            computed_at: new Date(),
          },
          {
            type: 'offender_score',
            person_id: 'person-002',
            name: 'Suresh Babu',
            risk_score: 0.71,
            recidivism_probability: 0.58,
            offense_count: 3,
            last_offense_date: new Date('2024-01-15'),
            computed_at: new Date(),
          },
        ];

      case 'trend':
        return [
          {
            type: 'trend',
            metric: 'crime_count',
            period: 'last_30_days',
            current: 145,
            previous: 120,
            change_percent: 20.8,
            direction: 'increasing',
            computed_at: new Date(),
          },
        ];

      case 'aggregate':
        return [
          {
            type: 'aggregate',
            total_firs: 1247,
            active_cases: 342,
            resolved_cases: 905,
            persons_of_interest: 528,
            computed_at: new Date(),
          },
        ];

      default:
        return [];
    }
  }

  private formatResults(results: any[]): EvidenceItem[] {
    return results.map(result => ({
      id: `analytics-${result.type}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'aggregate' as const,
      source: 'analytics' as const,
      data: result,
      relevanceScore: 0.95, // Precomputed data is highly reliable
      metadata: {
        retrievedAt: new Date(),
        matchedOn: ['precomputed_index'],
        confidence: 0.95,
        computed_at: result.computed_at,
        analyticsType: result.type,
      },
    }));
  }
}
