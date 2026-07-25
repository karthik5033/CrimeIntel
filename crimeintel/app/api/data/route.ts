import { NextRequest, NextResponse } from 'next/server';
import { CatalystDataStore } from '@/lib/catalyst/datastore';

/**
 * GET /api/data?table=FIRs
 * 
 * Strictly connects to Catalyst Database.
 * No local seed file fallbacks are permitted.
 */

const VALID_TABLES = [
  'Persons', 'FIRs', 'Cases', 'PoliceStations', 'Vehicles',
  'PhoneRecords', 'BankAccounts', 'Weapons', 'EntityRelationships',
  'Transactions', 'SocioEconomicData'
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');

    if (!table) {
      return NextResponse.json(
        { error: 'Missing required query parameter: table', validTables: VALID_TABLES },
        { status: 400 }
      );
    }

    if (!VALID_TABLES.includes(table)) {
      return NextResponse.json(
        { error: `Invalid table name: ${table}`, validTables: VALID_TABLES },
        { status: 400 }
      );
    }

    // Strictly enforce Catalyst Database Connection
    let rows: any[] = [];
    
    switch (table) {
      case 'Persons': rows = await CatalystDataStore.getPersons(); break;
      case 'FIRs': rows = await CatalystDataStore.getFIRs(); break;
      case 'Cases': rows = await CatalystDataStore.getCases(); break;
      case 'PoliceStations': rows = await CatalystDataStore.getPoliceStations(); break;
      case 'Vehicles': rows = await CatalystDataStore.getVehicles(); break;
      case 'PhoneRecords': rows = await CatalystDataStore.getPhoneRecords(); break;
      case 'BankAccounts': rows = await CatalystDataStore.getBankAccounts(); break;
      case 'Weapons': rows = await CatalystDataStore.getWeapons(); break;
      case 'EntityRelationships': rows = await CatalystDataStore.getEntityRelationships(); break;
      case 'Transactions': rows = await CatalystDataStore.getTransactions(); break;
      case 'SocioEconomicData': rows = await CatalystDataStore.getSocioEconomicData(); break;
    }

    return NextResponse.json({ 
      success: true, 
      source: 'catalyst', 
      table, 
      count: rows.length, 
      data: rows 
    });

  } catch (error: any) {
    console.error('Data API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
