import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

/**
 * GET /api/data?table=FIRs
 * 
 * Returns data from seed JSON files for local development.
 * In production (deployed on Catalyst), this would query the Catalyst Data Store.
 * 
 * Supported tables: Persons, FIRs, Cases, PoliceStations, Vehicles,
 *   PhoneRecords, BankAccounts, Weapons, EntityRelationships, Transactions, SocioEconomicData
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

    // Try Catalyst SDK first (works when deployed or running via `catalyst serve`)
    try {
      const { getCatalystApp } = await import('@/lib/catalyst');
      const app = getCatalystApp();
      const zcql = app.zcql();
      
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery(`SELECT * FROM ${table}`);
        const rows = queryResult.map((row: any) => row[table] || row);
        return NextResponse.json({ success: true, source: 'catalyst', table, count: rows.length, data: rows });
      }
    } catch {
      // Catalyst SDK not available — fall through to local seed data
    }

    // Fallback: Load from local seed JSON files
    const seedPath = path.join(process.cwd(), 'data', 'seed', `${table}.json`);
    
    if (!fs.existsSync(seedPath)) {
      return NextResponse.json(
        { error: `Seed file not found for table: ${table}` },
        { status: 404 }
      );
    }

    const rawData = fs.readFileSync(seedPath, 'utf-8');
    const data = JSON.parse(rawData);

    return NextResponse.json({
      success: true,
      source: 'local-seed',
      table,
      count: Array.isArray(data) ? data.length : 0,
      data
    });

  } catch (error: any) {
    console.error('Data API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
