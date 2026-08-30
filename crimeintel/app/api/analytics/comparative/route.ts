import { NextResponse } from 'next/server';
import { ServerDataLoader } from '@/lib/api/serverDataLoader';

async function fetchFromCatalyst(tableName: string) {
  if (tableName === 'FIRs') return ServerDataLoader.getFIRs();
  if (tableName === 'PoliceStations') return ServerDataLoader.getPoliceStations();
  return [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const districtA = searchParams.get('districtA') || 'DIST_1';
    const districtB = searchParams.get('districtB') || 'DIST_2';

    const [firs, policeStations] = await Promise.all([
      fetchFromCatalyst('FIRs'),
      fetchFromCatalyst('PoliceStations')
    ]);

    // Build lookup: police_station_id → district_id
    const psToDistrict: Record<string, string> = {};
    policeStations.forEach((ps: any) => {
      psToDistrict[ps.id] = ps.district_id;
    });

    // Build lookup: district_id → name
    const districtNames: Record<string, string> = {};
    policeStations.forEach((ps: any) => {
      if (ps.name_en && ps.name_en.includes('District Police Office') && !districtNames[ps.district_id]) {
        districtNames[ps.district_id] = ps.name_en.replace(' District Police Office', '');
      }
    });

    // Collect all unique crime types across both districts
    const crimeTypesA: Record<string, number> = {};
    const crimeTypesB: Record<string, number> = {};

    firs.forEach((fir: any) => {
      const distId = fir.district_id || psToDistrict[fir.police_station_id] || 'UNKNOWN';
      const crimeType = fir.crime_type_en || 'Other';

      if (distId === districtA) {
        crimeTypesA[crimeType] = (crimeTypesA[crimeType] || 0) + 1;
      } else if (distId === districtB) {
        crimeTypesB[crimeType] = (crimeTypesB[crimeType] || 0) + 1;
      }
    });

    // Merge all crime types from both districts
    const allCrimeTypes = new Set([...Object.keys(crimeTypesA), ...Object.keys(crimeTypesB)]);

    // Build radar data
    const radarData = Array.from(allCrimeTypes).map(crimeType => {
      const countA = crimeTypesA[crimeType] || 0;
      const countB = crimeTypesB[crimeType] || 0;
      return {
        subject: crimeType,
        districtA: countA,
        districtB: countB,
        fullMark: Math.max(countA, countB) + 10,
      };
    });

    // Sort by total count descending for better chart readability
    radarData.sort((a, b) => (b.districtA + b.districtB) - (a.districtA + a.districtB));

    // Return top 8 crime types for chart clarity (too many makes radar unreadable)
    const topRadar = radarData.slice(0, 8);

    return NextResponse.json({
      data: topRadar,
      districtAName: districtNames[districtA] || districtA,
      districtBName: districtNames[districtB] || districtB,
      meta: {
        totalCrimeTypesA: Object.values(crimeTypesA).reduce((a, b) => a + b, 0),
        totalCrimeTypesB: Object.values(crimeTypesB).reduce((a, b) => a + b, 0),
      }
    });
  } catch (error: any) {
    console.error('Error fetching analytics comparative:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
