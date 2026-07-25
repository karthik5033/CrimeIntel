import { NextResponse } from 'next/server';
import { getCatalystApp } from '@/lib/catalyst';

/**
 * Analytics Correlations API
 * 
 * Reads from the REAL Catalyst database:
 *   FIRs       → each FIR has a `district_id`
 *   PoliceStations → maps police_station_id → district_id + name_en
 *   SocioEconomicData → maps district_id → unemployment_rate, literacy_rate, population_density
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
    const [firs, policeStations, socioData] = await Promise.all([
      fetchFromCatalyst('FIRs'),
      fetchFromCatalyst('PoliceStations'),
      fetchFromCatalyst('SocioEconomicData')
    ]);

    // Build lookup: police_station_id → district_id
    const psToDistrict: Record<string, string> = {};
    policeStations.forEach((ps: any) => {
      psToDistrict[ps.id] = ps.district_id;
    });

    // Build lookup: district_id → station name (use the district-level office name)
    const districtName: Record<string, string> = {};
    policeStations.forEach((ps: any) => {
      // Only use "District Police Office" entries for clean district names
      if (ps.name_en && ps.name_en.includes('District Police Office') && !districtName[ps.district_id]) {
        districtName[ps.district_id] = ps.name_en.replace(' District Police Office', '');
      }
    });

    // Build lookup: district_id → socio-economic metrics
    const socioByDistrict: Record<string, any> = {};
    socioData.forEach((s: any) => {
      socioByDistrict[s.district_id] = s;
    });

    // Count FIRs per district_id
    const firCountByDistrict: Record<string, number> = {};
    firs.forEach((fir: any) => {
      // FIR can have district_id directly, or we resolve it via police_station_id
      const distId = fir.district_id || psToDistrict[fir.police_station_id] || 'UNKNOWN';
      firCountByDistrict[distId] = (firCountByDistrict[distId] || 0) + 1;
    });

    // Build the correlation data — only for districts that have socio-economic data
    const unemploymentData: any[] = [];
    const literacyData: any[] = [];

    Object.entries(socioByDistrict).forEach(([distId, metrics]) => {
      const name = districtName[distId] || distId;
      const crimeCount = firCountByDistrict[distId] || 0;
      const popDensity = metrics.population_density || 1000;

      const crimeRate = crimeCount;

      unemploymentData.push({
        district: name,
        value: metrics.unemployment_rate,
        crimeRate,
        population: popDensity * 100, // rough proxy for bubble size
      });

      literacyData.push({
        district: name,
        value: metrics.literacy_rate,
        crimeRate,
        population: popDensity * 100,
      });
    });

    return NextResponse.json({
      unemployment: unemploymentData,
      literacy: literacyData,
      meta: {
        totalFIRs: firs.length,
        districtsWithSocioData: Object.keys(socioByDistrict).length,
        districtsWithFIRs: Object.keys(firCountByDistrict).length,
      }
    });
  } catch (error: any) {
    console.error('Error fetching analytics correlations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
