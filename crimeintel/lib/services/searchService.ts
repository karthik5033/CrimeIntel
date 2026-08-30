/**
 * Phase 1 Step 10: Search Service
 * 
 * Combines multiple search strategies:
 * 1. Full-text search (in-memory)
 * 2. Semantic search (vector embeddings)
 * 3. Entity-based search (persons, vehicles, phones)
 * 4. Metadata search (dates, locations, crime types)
 * 
 * Provides unified search interface for officers to find relevant FIRs,
 * cases, and entities across the entire database.
 */

import { ServerDataLoader } from '@/lib/api/serverDataLoader';
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
    const allResults: SearchResult[] = [];

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
   * Full-text search using ServerDataLoader
   */
  static async fullTextSearch(
    query: SearchQuery,
    options: { limit?: number } = {}
  ): Promise<SearchResult[]> {
    const { limit = 20 } = options;
    const firRows = await ServerDataLoader.getFIRs();

    const results: SearchResult[] = [];

    try {
      const filteredFirs = firRows.filter((fir: any) => {
        if (query.text) {
          const searchText = query.text.toLowerCase();
          const descMatch = fir.description?.toLowerCase().includes(searchText);
          const ocrMatch = fir.ocr_text?.toLowerCase().includes(searchText);
          if (!descMatch && !ocrMatch) return false;
        }

        if (query.crimeType && !fir.crime_type_en?.toLowerCase().includes(query.crimeType.toLowerCase())) {
          return false;
        }

        if (query.policeStation && fir.police_station_id !== query.policeStation) {
          return false;
        }

        if (query.dateFrom && fir.date < query.dateFrom) return false;
        if (query.dateTo && fir.date > query.dateTo) return false;
        if (query.status && fir.status_en !== query.status) return false;
        if (query.firId && fir.fir_no !== query.firId) return false;

        return true;
      }).sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }).slice(0, limit);

      // Convert to SearchResult format
      filteredFirs.forEach((fir: any) => {
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
        const firs = await ServerDataLoader.getFIRs();
        const firQuery = firs.filter((f: any) => f.fir_no === result.firId).slice(0, 1);

        if (firQuery.length > 0) {
          const fir = firQuery[0];
          
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
    try {
      const allPersons = await ServerDataLoader.getPersons();
      const persons = allPersons.filter((p: any) => 
        p.name?.toLowerCase().includes(personName.toLowerCase())
      ).slice(0, limit);

      const results: SearchResult[] = [];

      for (const person of persons) {
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
    try {
      const allVehicles = await ServerDataLoader.getVehicles();
      const vehicles = allVehicles.filter((v: any) => 
        v.registration?.toLowerCase().includes(registration.toLowerCase())
      ).slice(0, limit);

      const results: SearchResult[] = [];

      for (const vehicle of vehicles) {
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
    try {
      const allPhones = await ServerDataLoader.getPhoneRecords();
      const phones = allPhones.filter((p: any) => 
        p.number?.toLowerCase().includes(phoneNumber.toLowerCase())
      ).slice(0, limit);

      const results: SearchResult[] = [];

      for (const phone of phones) {
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
    try {
      const allFirs = await ServerDataLoader.getFIRs();
      
      const crimeTypeMap = new Map<string, number>();
      const stationMap = new Map<string, number>();

      allFirs.forEach((fir: any) => {
        if (fir.crime_type_en) {
          crimeTypeMap.set(fir.crime_type_en, (crimeTypeMap.get(fir.crime_type_en) || 0) + 1);
        }
        if (fir.police_station_id) {
          stationMap.set(fir.police_station_id, (stationMap.get(fir.police_station_id) || 0) + 1);
        }
      });

      const crimeTypes = Array.from(crimeTypeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const policeStations = Array.from(stationMap.entries())
        .map(([station, count]) => ({ station, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        crimeTypes,
        policeStations,
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
        
        const firs = await ServerDataLoader.getFIRs();

        for (const sim of similar) {
          const firQuery = firs.filter((f: any) => f.fir_no === sim.firId).slice(0, 1);

          if (firQuery.length > 0) {
            const fir = firQuery[0];
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