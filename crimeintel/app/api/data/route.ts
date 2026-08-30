import { NextRequest, NextResponse } from 'next/server';
import { ServerDataLoader } from '@/lib/api/serverDataLoader';

/**
 * GET /api/data?table=FIRs
 * 
 * Strictly connects to ServerDataLoader.
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

    // Strictly enforce ServerDataLoader Connection
    let rows: any[] = [];
    
    switch (table) {
      case 'Persons': rows = await ServerDataLoader.getPersons(); break;
      case 'FIRs': rows = await ServerDataLoader.getFIRs(); break;
      case 'Cases': rows = await ServerDataLoader.getCases(); break;
      case 'PoliceStations': rows = await ServerDataLoader.getPoliceStations(); break;
      case 'Vehicles': rows = await ServerDataLoader.getVehicles(); break;
      case 'PhoneRecords': rows = await ServerDataLoader.getPhoneRecords(); break;
      case 'BankAccounts': rows = await ServerDataLoader.getBankAccounts(); break;
      case 'Weapons': rows = await ServerDataLoader.getWeapons(); break;
      case 'EntityRelationships': rows = await ServerDataLoader.getEntityRelationships(); break;
      case 'Transactions': rows = await ServerDataLoader.getTransactions(); break;
      case 'SocioEconomicData': rows = await ServerDataLoader.getSocioEconomicData(); break;
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
