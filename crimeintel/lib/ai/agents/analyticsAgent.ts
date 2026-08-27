import { ParsedQuery } from '../chat/intentClassifier';
import { getCatalystApp } from '@/lib/catalyst';

export class AnalyticsAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    if (!zcql) {
      return { trend: "unavailable" };
    }

    try {
      let conditions = [];
      if (parsedQuery.entities.district) {
        const d = parsedQuery.entities.district.replace(/'/g, "''");
        const districtQuery = `SELECT * FROM Districts WHERE name LIKE '%${d}%' OR name_kn LIKE '%${d}%'`;
        const distResults = await zcql.executeZCQLQuery(districtQuery);
        let mappedDistrict = d;
        if (distResults.length > 0) {
          const row = distResults[0].Districts || distResults[0];
          mappedDistrict = row.id;
        }
        conditions.push(`district_id = '${mappedDistrict}'`);
      }
      
      if (parsedQuery.entities.crime_types && parsedQuery.entities.crime_types.length > 0) {
        const ct = parsedQuery.entities.crime_types[0].replace(/'/g, "''");
        conditions.push(`crime_type_en = '${ct}'`);
      }

      const whereClause = conditions.length > 0 ? ` WHERE ` + conditions.join(' AND ') : '';

      if (parsedQuery.resolvedQuery.toLowerCase().includes('hotspot') || parsedQuery.resolvedQuery.toLowerCase().includes('area')) {
        const aggQuery = `SELECT police_station_id, COUNT(ROWID) FROM FIRs${whereClause} GROUP BY police_station_id`;
        const allFirsAgg = await zcql.executeZCQLQuery(aggQuery);
        
        const mappedCounts = allFirsAgg.map((row: any) => {
          const r = row.FIRs || row;
          // ZCQL COUNT is often returned in the format we can extract safely
          const countVal = r.ROWID || r['COUNT(ROWID)'] || 0;
          return { station: r.police_station_id, count: parseInt(countVal, 10) || 0 };
        });
        
        const sortedStations = mappedCounts.sort((a: any, b: any) => b.count - a.count).slice(0, 3);
        
        return sortedStations.map((s: any) => ({
          type: 'AnalyticsResult',
          metric: 'Hotspot',
          location: s.station,
          incident_count: s.count
        }));
      }

      const countQuery = `SELECT COUNT(ROWID) FROM FIRs${whereClause}`;
      const countRes = await zcql.executeZCQLQuery(countQuery);
      
      let count = 0;
      if (countRes.length > 0) {
         const row = countRes[0].FIRs || countRes[0];
         count = parseInt(row.ROWID || row['COUNT(ROWID)'], 10) || 0;
      }

      return [{
        type: 'AnalyticsResult',
        metric: "Incident Count",
        value: count,
        context: parsedQuery.entities,
        analysis: `Found ${count} incidents matching the criteria.`
      }];

    } catch (error) {
      console.error("AnalyticsAgent Error:", error);
      return { trend: "error" };
    }
  }
}
