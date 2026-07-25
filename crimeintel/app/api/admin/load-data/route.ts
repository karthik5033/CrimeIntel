import { NextResponse } from 'next/server';
import { CatalystDataStore } from '@/lib/catalyst/datastore';
import firsSeed from '@/data/seed/FIRs.json';
import personsSeed from '@/data/seed/Persons.json';
import vehiclesSeed from '@/data/seed/Vehicles.json';
import entityRelationshipsSeed from '@/data/seed/EntityRelationships.json';

/**
 * Admin API endpoint to load seed data into Catalyst Data Store
 * 
 * POST /api/admin/load-data
 * 
 * This is a one-time data migration endpoint.
 * Should be protected in production with authentication.
 */
export async function POST(request: Request) {
  try {
    const { tables } = await request.json();
    const results: Record<string, any> = {};
    
    // Load FIRs
    if (!tables || tables.includes('firs')) {
      console.log('Loading FIRs...');
      await CatalystDataStore.insertFIRs(firsSeed);
      results.firs = { loaded: firsSeed.length, status: 'success' };
    }
    
    // Load Persons
    if (!tables || tables.includes('persons')) {
      console.log('Loading Persons...');
      await CatalystDataStore.insertPersons(personsSeed);
      results.persons = { loaded: personsSeed.length, status: 'success' };
    }
    
    // Load Vehicles
    if (!tables || tables.includes('vehicles')) {
      console.log('Loading Vehicles...');
      await CatalystDataStore.insertVehicles(vehiclesSeed);
      results.vehicles = { loaded: vehiclesSeed.length, status: 'success' };
    }
    
    // Load Entity Relationships
    if (!tables || tables.includes('relationships')) {
      console.log('Loading Entity Relationships...');
      await CatalystDataStore.insertRelationships(entityRelationshipsSeed);
      results.relationships = { loaded: entityRelationshipsSeed.length, status: 'success' };
    }
    
    return NextResponse.json({
      success: true,
      message: 'Seed data loaded successfully into Catalyst Data Store',
      results
    });
    
  } catch (error) {
    console.error('Failed to load seed data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        'Verify tables exist in Catalyst console',
        'Check Catalyst SDK configuration',
        'Ensure network connectivity to Catalyst'
      ]
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check data load status
 */
export async function GET() {
  try {
    const firs = await CatalystDataStore.getFIRs();
    const persons = await CatalystDataStore.getPersons();
    const vehicles = await CatalystDataStore.getVehicles();
    const relationships = await CatalystDataStore.getEntityRelationships();
    
    return NextResponse.json({
      success: true,
      counts: {
        firs: firs.length,
        persons: persons.length,
        vehicles: vehicles.length,
        relationships: relationships.length
      },
      status: firs.length > 0 ? 'Data loaded' : 'Tables empty - need to load data'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'Unable to query Catalyst Data Store'
    }, { status: 500 });
  }
}
