import { NextRequest, NextResponse } from 'next/server';
import { SearchService, type SearchQuery } from '@/lib/services/searchService';

/**
 * Phase 1 Step 10: Search API
 * 
 * GET /api/search - Unified search across FIRs, entities, and relationships
 * POST /api/search - Advanced search with complex filters
 * 
 * Supports:
 * - Full-text search (descriptions, OCR text)
 * - Semantic search (vector embeddings)
 * - Entity search (persons, vehicles, phones)
 * - Metadata search (dates, crime types, locations)
 * - Similarity search (find similar FIRs)
 * - Faceted search (filters and counts)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query: SearchQuery = {
      text: searchParams.get('q') || searchParams.get('text') || undefined,
      firId: searchParams.get('firId') || undefined,
      crimeType: searchParams.get('crimeType') || undefined,
      policeStation: searchParams.get('policeStation') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      personName: searchParams.get('person') || searchParams.get('personName') || undefined,
      vehicleRegistration: searchParams.get('vehicle') || searchParams.get('vehicleRegistration') || undefined,
      phoneNumber: searchParams.get('phone') || searchParams.get('phoneNumber') || undefined,
      status: searchParams.get('status') || undefined,
    };

    // Parse options
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeSemanticSearch = searchParams.get('semantic') !== 'false';
    const includeEntitySearch = searchParams.get('entities') !== 'false';

    console.log('🔍 Search request:', { query, limit, offset });

    // Validate that at least one search parameter is provided
    const hasSearchParams = Object.values(query).some(value => value !== undefined && value !== '');
    
    if (!hasSearchParams) {
      return NextResponse.json({
        error: 'At least one search parameter required',
        usage: 'GET /api/search?q=text&crimeType=theft&dateFrom=2026-01-01',
        availableParams: [
          'q or text - search text',
          'firId - specific FIR ID',
          'crimeType - crime type filter',
          'policeStation - police station filter', 
          'dateFrom/dateTo - date range',
          'person or personName - person name',
          'vehicle or vehicleRegistration - vehicle registration',
          'phone or phoneNumber - phone number',
          'status - FIR status',
          'limit - results per page (default: 20)',
          'offset - pagination offset (default: 0)',
          'semantic - enable semantic search (default: true)',
          'entities - enable entity search (default: true)',
        ]
      }, { status: 400 });
    }

    // Execute search
    const searchResponse = await SearchService.search(query, {
      limit,
      offset,
      includeSemanticSearch,
      includeEntitySearch,
    });

    return NextResponse.json({
      success: true,
      ...searchResponse,
    });

  } catch (error) {
    console.error('❌ Search API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Search request failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...searchParams } = body;

    switch (action) {
      case 'advanced':
        return await handleAdvancedSearch(searchParams);
      case 'similar':
        return await handleSimilaritySearch(searchParams);
      case 'faceted':
        return await handleFacetedSearch(searchParams);
      default:
        // Regular search with POST body
        return await handleRegularSearch(searchParams);
    }

  } catch (error) {
    console.error('❌ Search POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Search request failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}

async function handleRegularSearch(params: any) {
  const query: SearchQuery = {
    text: params.text || params.q,
    firId: params.firId,
    crimeType: params.crimeType,
    policeStation: params.policeStation,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    personName: params.personName,
    vehicleRegistration: params.vehicleRegistration,
    phoneNumber: params.phoneNumber,
    status: params.status,
  };

  const options = {
    limit: params.limit || 20,
    offset: params.offset || 0,
    includeSemanticSearch: params.includeSemanticSearch !== false,
    includeEntitySearch: params.includeEntitySearch !== false,
  };

  const searchResponse = await SearchService.search(query, options);

  return NextResponse.json({
    success: true,
    ...searchResponse,
  });
}

async function handleAdvancedSearch(params: any) {
  console.log('🔍 Advanced search:', params);

  const filters = {
    textQuery: params.textQuery,
    crimeTypes: params.crimeTypes,
    policeStations: params.policeStations,
    dateRange: params.dateRange,
    entities: params.entities,
    similarTo: params.similarTo,
  };

  const searchResponse = await SearchService.advancedSearch(filters);

  return NextResponse.json({
    success: true,
    ...searchResponse,
  });
}

async function handleSimilaritySearch(params: any) {
  const { firId, limit = 10 } = params;

  if (!firId) {
    return NextResponse.json(
      { error: 'FIR ID required for similarity search' },
      { status: 400 }
    );
  }

  console.log('🔍 Similarity search for FIR:', firId);

  const searchResponse = await SearchService.advancedSearch({
    similarTo: firId,
  });

  return NextResponse.json({
    success: true,
    message: `Found ${searchResponse.results.length} similar FIRs`,
    firId: firId,
    ...searchResponse,
  });
}

async function handleFacetedSearch(params: any) {
  console.log('🔍 Faceted search:', params);

  const query: SearchQuery = {
    text: params.text,
    crimeType: params.crimeType,
    policeStation: params.policeStation,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };

  // Get search results with facets
  const searchResponse = await SearchService.search(query, {
    limit: params.limit || 50,
    offset: params.offset || 0,
  });

  return NextResponse.json({
    success: true,
    message: 'Faceted search completed',
    ...searchResponse,
    // Facets are already included in the response
  });
}

/**
 * Search suggestions/autocomplete
 */
export async function OPTIONS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({
        suggestions: [],
        message: 'Query too short'
      });
    }

    // Generate search suggestions based on existing data
    // This is a simple implementation - can be enhanced with proper autocomplete
    const suggestions = [
      `${query} theft`,
      `${query} robbery`,
      `${query} murder`,
      `${query} assault`,
      `${query} fraud`,
    ].filter(s => s.trim().length > 2);

    return NextResponse.json({
      query: query,
      suggestions: suggestions.slice(0, 5),
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}