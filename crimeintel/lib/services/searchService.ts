/**
 * Phase 1 Step 10: Search Service
 * 
 * Combines multiple search strategies:
 * 1. Full-text search (ZCQL LIKE queries)
 * 2. Semantic search (vector embeddings)
 * 3. Entity-based search (persons, vehicles, phones)
 * 4. Metadata search (dates, locations, crime types)
 * 
 * Provides unified search interface for officers to find relevant FIRs,
 * cases, and entities across the entire database.
 */

import { getCatalystApp } from '@/lib/catalyst';
import { EmbeddingsService } from './embeddingsService';

export interface SearchQuery {
  text?: string;
  firId?: string;
  crimeType?: string;
  policeStation?: string;
  dateFrom?: string;
  dateTo?: string;
  personName?: string;
  vehicleRegistration?: string;
  phoneNumber?: string;
  status?: string;
}

export interface SearchResult {
  id: string;
  type: 'FIR' | 'Person' | 'Vehicle' | 'Phone' | 'Case';
  title: string;
  description: string;
  score: number;
  metadata: Record<string, any>;
  highlights?: string[];
}

export interface SearchResponse {
  query: SearchQuery;
  results: SearchResult[];
  totalFound: number;
  searchTime: number;
  searchMethods: string[];
  facets?: {
    crimeTypes: Array<{ type: string; count: number }>;
    policeStations: Array<{ station: string; count: number }>;
    dateRanges: Array<{ range: string; count: number }>;
  };
}

export class SearchService {
  /**
   * Unified search interface
   */
  static async search(
    query: SearchQuery,
    options: {
      limit?: number;
      offset?: number;
      includeSemanticSearch?: boolean;
      includeEntitySearch?: boolean;
    } = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const { limit = 20, offset = 0, includeSemanticSearch = true, includeEntitySearch = true } = options;
    
    console.log('🔍 Starting unified search:', query);

    const searchMethods: string[] = [];
    let allResults: SearchResult[] = [];

    try {
      // 1. Full-text search (always included)
      const textResults = await this.fullTextSearch(query, { limit: limit * 2 });
      allResults.push(...textResults);
      searchMethods.push('full-text');

      // 2. Semantic search (if text query provided and enabled)
      if (query.text && includeSemanticSearch) {
        try {
          const semanticResults = await this.semanticSearch(query.text, { limit: limit });
          allResults.push(...semanticResults);
          searchMethods.push('semantic');
        } catch (error) {
          console.warn('Semantic search failed:', error);
        }
      }

      // 3. Entity-based search (if specific entity queries and enabled)
      if (includeEntitySearch) {
        if (query.personName) {
          const personResults = await this.searchPersons(query.personName, { limit: limit });
          allResults.push(...personResults);
          searchMethods.push('persons');
        }

        if (query.vehicleRegistration) {
          const vehicleResults = await this.searchVehicles(query.vehicleRegistration, { limit: limit });
          allResults.push(...vehicleResults);
          searchMethods.push('vehicles');
        }

        if (query.phoneNumber) {
          const phoneResults = await this.searchPhones(query.phoneNumber, { limit: limit });
          allResults.push(...phoneResults);
          searchMethods.push('phones');
        }
      }

      // 4. Combine and rank results
      const combinedResults = this.combineResults(allResults);

      // 5. Apply pagination
      const paginatedResults = combinedResults.slice(offset, offset + limit);

      // 6. Generate facets for filtering
      const facets = await this.generateFacets(query);

      const searchTime = Date.now() - startTime;

      console.log(`✅ Search completed in ${searchTime}ms: ${paginatedResults.length} results`);

      return {
        query: query,
        results: paginatedResults,
        totalFound: combinedResults.length,
        searchTime: searchTime,
        searchMethods: searchMethods,
        facets: facets,
      };

    } catch (error) {
      console.error('❌ Search error:', error);
      throw error;
    }
  }

  /**
   * Full-text search using ZCQL
   */
  static async fullTextSearch(
    query: SearchQuery,
    options: { limit?: number } = {}
  ): Promise<SearchResult[]> {
    const { limit = 20 } = options;
    const app = getCatalystApp();
    const zcql = app.zcql();

    const results: SearchResult[] = [];

    try {
      // Build WHERE conditions
      const conditions: string[] = [];

      if (query.text) {
        // Search in description and OCR text
        const searchText = query.text.replace(/'/g, "''"); // Escape quotes
        conditions.push(`(description LIKE '%${searchText}%' OR ocr_text LIKE '%${searchText}%')`);
      }

      if (query.crimeType) {
        conditions.push(`crime_type_en LIKE '%${query.crimeType}%'`);
      }

      if (query.policeStation) {
        conditions.push(`police_station_id = '${query.policeStation}'`);
      }

      if (query.dateFrom) {
        conditions.push(`date >= '${query.dateFrom}'`);
      }

      if (query.dateTo) {
        conditions.push(`date <= '${query.dateTo}'`);
      }

      if (query.status) {
        conditions.push(`status_en = '${query.status}'`);
      }

      if (query.firId) {
        conditions.push(`fir_no = '${query.firId}'`);
      }

      // Execute search
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const firQuery = `
        SELECT fir_no, crime_type_en, description, police_station_id, date, status_en, ocr_text 
        FROM FIRs 
        ${whereClause} 
        ORDER BY date DESC 
        LIMIT ${limit}
      `;

      const firRows = await zcql.executeZCQLQuery(firQuery);

      // Convert to SearchResult format
      firRows.forEach((row: any) => {
        const fir = row.FIRs || row;
        
        // Calculate relevance score based on matches
        let score = 0.5; // Base score
        
        if (query.text && fir.description) {
          const textMatches = (fir.description.toLowerCase().match(new RegExp(query.text.toLowerCase(), 'g')) || []).length;
          score += textMatches * 0.1;
        }

        if (query.text && fir.ocr_text) {
          const ocrMatches = (fir.ocr_text.toLowerCase().match(new RegExp(query.text.toLowerCase(), 'g')) || []).length;
          score += ocrMatches * 0.05;
        }

        // Generate highlights
        const highlights: string[] = [];
        if (query.text && fir.description) {
          const highlighted = this.generateHighlight(fir.description, query.text);
          if (highlighted) highlights.push(highlighted);
        }

        results.push({
          id: fir.fir_no,
          type: 'FIR',
          title: `FIR ${fir.fir_no} - ${fir.crime_type_en}`,
          description: fir.description || 'No description available',
          score: score,
          metadata: {
            crimeType: fir.crime_type_en,
            policeStation: fir.police_station_id,
            date: fir.date,
            status: fir.status_en,
          },
          highlights: highlights,
        });
      });

      return results;

    } catch (error) {
      console.error('Full-text search error:', error);
      throw error;
    }
  }

  /**
   * Semantic search using embeddings
   */
  static async semanticSearch(
    queryText: string,
    options: { limit?: number } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10 } = options;

    try {
      const semanticResults = await EmbeddingsService.searchByText(queryText, limit);

      // Convert to SearchResult format
      const results: SearchResult[] = [];

      for (const result of semanticResults) {
        // Get FIR details
        const app = getCatalystApp();
        const zcql = app.zcql();
        
        const firQuery = await zcql.executeZCQLQuery(
          `SELECT fir_no, crime_type_en, description, police_station_id, date, status_en 
           FROM FIRs WHERE fir_no = '${result.firId}' LIMIT 1`
        );

        if (firQuery.length > 0) {
          const fir = firQuery[0].FIRs || firQuery[0];
          
          results.push({
            id: fir.fir_no,
            type: 'FIR',
            title: `FIR ${fir.fir_no} - ${fir.crime_type_en}`,
            description: fir.description || result.text,
            score: result.score * 0.8, // Semantic scores are typically higher, so we scale them down
            metadata: {
              crimeType: fir.crime_type_en,
              policeStation: fir.police_station_id,
              date: fir.date,
              status: fir.status_en,
              semanticSimilarity: result.score,
            },
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Semantic search error:', error);
      return []; // Return empty array instead of throwing to allow other search methods
    }
  }

  /**
   * Search persons and related FIRs
   */
  static async searchPersons(
    personName: string,
    options: { limit?: number } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10 } = options;
    const app = getCatalystApp();
    const zcql = app.zcql();

    try {
      const escapedName = personName.replace(/'/g, "''");
      const personsQuery = `
        SELECT name, role, fir_id, phone, address 
        FROM Persons 
        WHERE name LIKE '%${escapedName}%' 
        LIMIT ${limit}
      `;

      const persons = await zcql.executeZCQLQuery(personsQuery);
      const results: SearchResult[] = [];

      for (const row of persons) {
        const person = row.Persons || row;
        
        results.push({
          id: `person_${person.name}_${person.fir_id}`,
          type: 'Person',
          title: `${person.name} (${person.role})`,
          description: `Role: ${person.role} | FIR: ${person.fir_id} | Phone: ${person.phone || 'N/A'}`,
          score: 0.9, // High score for exact entity matches
          metadata: {
            personName: person.name,
            role: person.role,
            firId: person.fir_id,
            phone: person.phone,
            address: person.address,
          },
        });
      }

      return results;

    } catch (error) {
      console.error('Person search error:', error);
      return [];
    }
  }

  /**
   * Search vehicles and related FIRs
   */
  static async searchVehicles(
    registration: string,
    options: { limit?: number } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10 } = options;
    const app = getCatalystApp();
    const zcql = app.zcql();

    try {
      const escapedReg = registration.replace(/'/g, "''");
      const vehiclesQuery = `
        SELECT registration, type, color, make, model, fir_id, owner 
        FROM Vehicles 
        WHERE registration LIKE '%${escapedReg}%' 
        LIMIT ${limit}
      `;

      const vehicles = await zcql.executeZCQLQuery(vehiclesQuery);
      const results: SearchResult[] = [];

      for (const row of vehicles) {
        const vehicle = row.Vehicles || row;
        
        results.push({
          id: `vehicle_${vehicle.registration}`,
          type: 'Vehicle',
          title: `Vehicle ${vehicle.registration}`,
          description: `${vehicle.type || 'Unknown'} | ${vehicle.color || ''} ${vehicle.make || ''} ${vehicle.model || ''} | Owner: ${vehicle.owner || 'Unknown'}`,
          score: 0.95, // Very high score for exact registration matches
          metadata: {
            registration: vehicle.registration,
            type: vehicle.type,
            color: vehicle.color,
            make: vehicle.make,
            model: vehicle.model,
            firId: vehicle.fir_id,
            owner: vehicle.owner,
          },
        });
      }

      return results;

    } catch (error) {
      console.error('Vehicle search error:', error);
      return [];
    }
  }

  /**
   * Search phone numbers and related FIRs
   */
  static async searchPhones(
    phoneNumber: string,
    options: { limit?: number } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10 } = options;
    const app = getCatalystApp();
    const zcql = app.zcql();

    try {
      const escapedPhone = phoneNumber.replace(/'/g, "''");
      const phonesQuery = `
        SELECT number, owner, type, fir_id, imei 
        FROM PhoneRecords 
        WHERE number LIKE '%${escapedPhone}%' 
        LIMIT ${limit}
      `;

      const phones = await zcql.executeZCQLQuery(phonesQuery);
      const results: SearchResult[] = [];

      for (const row of phones) {
        const phone = row.PhoneRecords || row;
        
        results.push({
          id: `phone_${phone.number}`,
          type: 'Phone',
          title: `Phone ${phone.number}`,
          description: `Owner: ${phone.owner || 'Unknown'} | Type: ${phone.type || 'Mobile'} | IMEI: ${phone.imei || 'N/A'}`,
          score: 0.9,
          metadata: {
            number: phone.number,
            owner: phone.owner,
            type: phone.type,
            firId: phone.fir_id,
            imei: phone.imei,
          },
        });
      }

      return results;

    } catch (error) {
      console.error('Phone search error:', error);
      return [];
    }
  }

  /**
   * Combine and deduplicate results from multiple search methods
   */
  static combineResults(results: SearchResult[]): SearchResult[] {
    // Group by ID and take highest scoring result
    const resultMap = new Map<string, SearchResult>();

    for (const result of results) {
      const existing = resultMap.get(result.id);
      if (!existing || result.score > existing.score) {
        resultMap.set(result.id, result);
      }
    }

    // Convert back to array and sort by score
    return Array.from(resultMap.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Generate search result highlights
   */
  static generateHighlight(text: string, query: string, maxLength: number = 200): string | null {
    if (!text || !query) return null;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return null;

    // Extract context around the match
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    let excerpt = text.substring(start, end);

    // Add ellipsis if truncated
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';

    // Highlight the query term
    const highlightedExcerpt = excerpt.replace(
      new RegExp(query, 'gi'),
      `<mark>$&</mark>`
    );

    return highlightedExcerpt;
  }

  /**
   * Generate facets for filtering
   */
  static async generateFacets(query: SearchQuery): Promise<{
    crimeTypes: Array<{ type: string; count: number }>;
    policeStations: Array<{ station: string; count: number }>;
    dateRanges: Array<{ range: string; count: number }>;
  }> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    try {
      // Get crime type facets
      const crimeTypesQuery = `
        SELECT crime_type_en, COUNT(*) as count 
        FROM FIRs 
        GROUP BY crime_type_en 
        ORDER BY count DESC 
        LIMIT 10
      `;
      const crimeTypesResult = await zcql.executeZCQLQuery(crimeTypesQuery);

      // Get police station facets
      const stationsQuery = `
        SELECT police_station_id, COUNT(*) as count 
        FROM FIRs 
        GROUP BY police_station_id 
        ORDER BY count DESC 
        LIMIT 10
      `;
      const stationsResult = await zcql.executeZCQLQuery(stationsQuery);

      return {
        crimeTypes: crimeTypesResult.map((row: any) => ({
          type: (row.FIRs || row).crime_type_en,
          count: (row.FIRs || row).count,
        })),
        policeStations: stationsResult.map((row: any) => ({
          station: (row.FIRs || row).police_station_id,
          count: (row.FIRs || row).count,
        })),
        dateRanges: [
          { range: 'Last 7 days', count: 0 },
          { range: 'Last 30 days', count: 0 },
          { range: 'Last 6 months', count: 0 },
          { range: 'Last year', count: 0 },
        ],
      };

    } catch (error) {
      console.error('Facet generation error:', error);
      return {
        crimeTypes: [],
        policeStations: [],
        dateRanges: [],
      };
    }
  }

  /**
   * Advanced search with complex filters
   */
  static async advancedSearch(filters: {
    textQuery?: string;
    crimeTypes?: string[];
    policeStations?: string[];
    dateRange?: { from: string; to: string };
    entities?: {
      persons?: string[];
      vehicles?: string[];
      phones?: string[];
    };
    similarTo?: string; // FIR ID for similarity search
  }): Promise<SearchResponse> {
    const query: SearchQuery = {
      text: filters.textQuery,
      dateFrom: filters.dateRange?.from,
      dateTo: filters.dateRange?.to,
    };

    // If similarity search is requested
    if (filters.similarTo) {
      try {
        const similar = await EmbeddingsService.findSimilarFIRs(filters.similarTo, 20);
        const results: SearchResult[] = [];

        for (const sim of similar) {
          const app = getCatalystApp();
          const zcql = app.zcql();
          
          const firQuery = await zcql.executeZCQLQuery(
            `SELECT * FROM FIRs WHERE fir_no = '${sim.firId}' LIMIT 1`
          );

          if (firQuery.length > 0) {
            const fir = firQuery[0].FIRs || firQuery[0];
            results.push({
              id: fir.fir_no,
              type: 'FIR',
              title: `FIR ${fir.fir_no} - ${fir.crime_type_en}`,
              description: fir.description,
              score: sim.similarity,
              metadata: {
                crimeType: fir.crime_type_en,
                similarity: sim.similarity,
              },
            });
          }
        }

        return {
          query: query,
          results: results,
          totalFound: results.length,
          searchTime: 0,
          searchMethods: ['similarity'],
        };
      } catch (error) {
        console.error('Similarity search error:', error);
      }
    }

    // Otherwise use regular unified search
    return this.search(query, { limit: 50 });
  }
}