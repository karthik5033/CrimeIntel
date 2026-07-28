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
      // In a real Catalyst ZCQL environment, we'd run aggregate queries here
      // For this mock, we fetch all FIRs and manually compute basic analytics
      const query = `SELECT * FROM FIRs`;
      const allFirs = await zcql.executeZCQLQuery(query);

      let filtered = allFirs.map((row: any) => row.FIRs || row);

      if (parsedQuery.entities.district) {
        const distMap: Record<string, string> = {
          'Bengaluru': 'DIST_1',
          'Bangalore': 'DIST_1',
          'Banglore': 'DIST_1',
          'Mysuru': 'DIST_2',
          'Mysore': 'DIST_2',
          'Mangaluru': 'DIST_3',
          'Hubballi': 'DIST_4',
          'Belagavi': 'DIST_5'
        };
        const districtId = distMap[parsedQuery.entities.district] || parsedQuery.entities.district;
        filtered = filtered.filter((f: any) => f.district_id === districtId);
      }
      if (parsedQuery.entities.crime_types && parsedQuery.entities.crime_types.length > 0) {
        filtered = filtered.filter((f: any) => parsedQuery.entities.crime_types?.includes(f.crime_type_en));
      }

      // Perform basic grouping if requested
      if (parsedQuery.resolvedQuery.toLowerCase().includes('hotspot') || parsedQuery.resolvedQuery.toLowerCase().includes('area')) {
        const countsByStation: Record<string, number> = {};
        filtered.forEach((f: any) => {
          const station = f.police_station_id || 'Unknown Station';
          countsByStation[station] = (countsByStation[station] || 0) + 1;
        });

        // Sort and take top 3
        const sortedStations = Object.entries(countsByStation)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        const results = sortedStations.map(([station, count]) => ({
          type: 'AnalyticsResult',
          metric: 'Hotspot',
          location: station,
          incident_count: count
        }));

        return results;
      }

      const count = filtered.length;
      return [{
        type: 'AnalyticsResult',
        metric: "Incident Count",
        value: count,
        context: parsedQuery.entities,
        analysis: `Found ${count} incidents matching the criteria.`
      }];

    } catch (error) {
      return { trend: "error" };
    }
  }
}
