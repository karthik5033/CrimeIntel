import { NextResponse } from 'next/server';
import { getCatalystApp } from '@/lib/catalyst';

/**
 * Returns the list of real districts from PoliceStations table in Catalyst
 * Used by the analytics UI to populate dropdowns.
 */

async function fetchFromCatalyst(tableName: string) {
  const app = getCatalystApp();
  const zcql = app.zcql();
  if (!zcql) {
    throw new Error('Catalyst ZCQL is not initialized');
  }
  const result = await zcql.executeZCQLQuery(`SELECT * FROM ${tableName}`);
  return result.map((row: any) => row[tableName] || row);
}

export async function GET() {
  try {
    const policeStations = await fetchFromCatalyst('PoliceStations');

    const districtMap: Record<string, string> = {};
    policeStations.forEach((ps: any) => {
      if (ps.name_en && ps.name_en.includes('District Police Office') && !districtMap[ps.district_id]) {
        districtMap[ps.district_id] = ps.name_en.replace(' District Police Office', '');
      }
    });

    const districts = Object.entries(districtMap).map(([id, name]) => ({ id, name }));
    districts.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(districts);
  } catch (error: any) {
    console.error('Error fetching districts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
