/**
 * SQL Retriever - Structured Data from Catalyst Data Store
 * Phase 0.2
 */

import {
  QueryContext,
  EvidenceItem,
  RetrieverResult,
  RetrieverConfig,
} from '../types';

export class SQLRetriever {
  private config: RetrieverConfig;

  constructor(config: RetrieverConfig) {
    this.config = config;
  }

  async retrieve(context: QueryContext): Promise<RetrieverResult> {
    const startTime = Date.now();

    try {
      console.log('[SQL Retriever] Executing structured query...');

      // Build parameterized SQL query based on context
      const query = this.buildQuery(context);
      const results = await this.executeQuery(query, context);

      const items = this.formatResults(results);

      return {
        retriever: 'sql',
        success: true,
        items,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          totalMatches: items.length,
          queryType: this.getQueryType(context),
          cacheHit: false,
        },
      };
    } catch (error: any) {
      console.error('[SQL Retriever] Error:', error.message);

      if (this.config.fallbackOnError) {
        return {
          retriever: 'sql',
          success: false,
          items: [],
          executionTimeMs: Date.now() - startTime,
          error: error.message,
        };
      }

      throw error;
    }
  }

  private buildQuery(context: QueryContext): string {
    const { filters } = context;
    
    // Base query
    let query = `
      SELECT 
        fir.id as fir_id,
        fir.crime_no,
        fir.crime_type,
        fir.date_registered,
        fir.location,
        fir.description,
        fir.status,
        station.name as station_name,
        district.name as district_name
      FROM fir
      LEFT JOIN station ON fir.station_id = station.id
      LEFT JOIN district ON station.district_id = district.id
      WHERE 1=1
    `;

    // Apply filters (parameterized to prevent injection)
    const conditions: string[] = [];

    if (filters?.districts?.length) {
      conditions.push(`district.name IN (${filters.districts.map(() => '?').join(',')})`);
    }

    if (filters?.stations?.length) {
      conditions.push(`station.name IN (${filters.stations.map(() => '?').join(',')})`);
    }

    if (filters?.crimeTypes?.length) {
      conditions.push(`fir.crime_type IN (${filters.crimeTypes.map(() => '?').join(',')})`);
    }

    if (filters?.dateRange) {
      conditions.push(`fir.date_registered BETWEEN ? AND ?`);
    }

    if (filters?.firIds?.length) {
      conditions.push(`fir.id IN (${filters.firIds.map(() => '?').join(',')})`);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ` ORDER BY fir.date_registered DESC LIMIT ${this.config.maxResults}`;

    return query;
  }

  private async executeQuery(query: string, context: QueryContext): Promise<any[]> {
    // In production, this would call Catalyst Data Store
    // For now, return mock data that respects the query structure

    console.log('[SQL Retriever] Mock query execution');
    
    // Simulate query execution delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    // Return mock FIR records
    return [
      {
        fir_id: 'fir-001',
        crime_no: 'FIR/2024/001',
        crime_type: 'Vehicle Theft',
        date_registered: new Date('2024-01-15'),
        location: 'Whitefield, Bengaluru',
        description: 'Two-wheeler theft from parking lot',
        status: 'Under Investigation',
        station_name: 'Whitefield Police Station',
        district_name: 'Bengaluru Urban',
      },
      {
        fir_id: 'fir-002',
        crime_no: 'FIR/2024/002',
        crime_type: 'Burglary',
        date_registered: new Date('2024-01-20'),
        location: 'Koramangala, Bengaluru',
        description: 'Residential burglary during night hours',
        status: 'Under Investigation',
        station_name: 'Koramangala Police Station',
        district_name: 'Bengaluru Urban',
      },
    ];
  }

  private formatResults(results: any[]): EvidenceItem[] {
    return results.map(row => ({
      id: row.fir_id,
      type: 'fir' as const,
      source: 'sql' as const,
      data: row,
      relevanceScore: 1.0,
      metadata: {
        retrievedAt: new Date(),
        matchedOn: ['structured_query'],
        confidence: 1.0,
      },
    }));
  }

  private getQueryType(context: QueryContext): string {
    if (context.filters?.firIds?.length) return 'direct_lookup';
    if (context.filters?.dateRange) return 'temporal_filter';
    if (context.filters?.districts?.length) return 'geographic_filter';
    return 'general_search';
  }
}
