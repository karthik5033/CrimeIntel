import { ParsedQuery } from '../chat/intentClassifier';
import { getCatalystAppAsync } from '@/lib/catalyst';

export class AnalyticsAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any> {
    const app = await getCatalystAppAsync();
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
        
        let mappedCounts = [];
        const isHotspotMockFallback = allFirsAgg.length > 0 && !('COUNT(ROWID)' in (allFirsAgg[0].FIRs || allFirsAgg[0])) && !('COUNT' in (allFirsAgg[0].FIRs || allFirsAgg[0]));

        if (isHotspotMockFallback) {
          const counts: any = {};
          for (const r of allFirsAgg) {
            const row = r.FIRs || r;
            const st = row.police_station_id;
            counts[st] = (counts[st] || 0) + 1;
          }
          mappedCounts = Object.keys(counts).map(k => ({ station: k, count: counts[k] }));
        } else {
          mappedCounts = allFirsAgg.map((row: any) => {
            const r = row.FIRs || row;
            const countVal = r['COUNT(ROWID)'] || r.COUNT || r.ROWID || 0;
            return { station: r.police_station_id, count: parseInt(countVal, 10) || 0 };
          });
        }
        
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
         if ('COUNT(ROWID)' in row) {
           count = parseInt(row['COUNT(ROWID)'], 10) || 0;
         } else if ('COUNT' in row) {
           count = parseInt(row['COUNT'], 10) || 0;
         } else {
           count = countRes.length;
         }
      }

      if (parsedQuery.intent === 'STATISTICAL_ANALYSIS') {
        const typeQuery = `SELECT crime_type_en, COUNT(ROWID) FROM FIRs${whereClause} GROUP BY crime_type_en`;
        const stationQuery = `SELECT police_station_id, COUNT(ROWID) FROM FIRs${whereClause} GROUP BY police_station_id`;
        
        const [typeRes, stationRes] = await Promise.all([
          zcql.executeZCQLQuery(typeQuery).catch(() => []),
          zcql.executeZCQLQuery(stationQuery).catch(() => [])
        ]);

        const isTypeMockFallback = typeRes.length > 0 && !('COUNT(ROWID)' in (typeRes[0].FIRs || typeRes[0])) && !('COUNT' in (typeRes[0].FIRs || typeRes[0]));
        let crimeDistribution = [];
        
        if (isTypeMockFallback) {
          const counts: any = {};
          for (const r of typeRes) {
            const row = r.FIRs || r;
            const type = row.crime_type_en;
            if (type) counts[type] = (counts[type] || 0) + 1;
          }
          crimeDistribution = Object.keys(counts).map(k => ({ type: k, count: counts[k] })).sort((a: any, b: any) => b.count - a.count);
        } else {
          crimeDistribution = typeRes.map((r: any) => {
            const row = r.FIRs || r;
            const c = row['COUNT(ROWID)'] || row.COUNT || row.ROWID;
            return { type: row.crime_type_en, count: parseInt(c, 10) || 0 };
          }).sort((a: any, b: any) => b.count - a.count);
        }

        const isStationMockFallback = stationRes.length > 0 && !('COUNT(ROWID)' in (stationRes[0].FIRs || stationRes[0])) && !('COUNT' in (stationRes[0].FIRs || stationRes[0]));
        let stationDistribution = [];
        
        if (isStationMockFallback) {
          const counts: any = {};
          for (const r of stationRes) {
            const row = r.FIRs || r;
            const st = row.police_station_id;
            if (st) counts[st] = (counts[st] || 0) + 1;
          }
          stationDistribution = Object.keys(counts).map(k => ({ station: k, count: counts[k] })).sort((a: any, b: any) => b.count - a.count).slice(0, 5);
        } else {
          stationDistribution = stationRes.map((r: any) => {
            const row = r.FIRs || r;
            const c = row['COUNT(ROWID)'] || row.COUNT || row.ROWID;
            return { station: row.police_station_id, count: parseInt(c, 10) || 0 };
          }).sort((a: any, b: any) => b.count - a.count).slice(0, 5); // top 5
        }

        return [{
          type: 'StatisticalResult',
          metric: "Detailed Statistical Distribution",
          total_incidents: count,
          distributions: {
            by_crime_type: crimeDistribution,
            by_police_station: stationDistribution
          },
          context: parsedQuery.entities
        }];
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
