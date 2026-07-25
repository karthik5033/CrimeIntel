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
        filtered = filtered.filter((f: any) => f.district === parsedQuery.entities.district);
      }
      if (parsedQuery.entities.crime_types && parsedQuery.entities.crime_types.length > 0) {
        filtered = filtered.filter((f: any) => parsedQuery.entities.crime_types?.includes(f.crime_type_en));
      }

      const count = filtered.length;
      return {
        metric: "Incident Count",
        value: count,
        context: parsedQuery.entities,
        analysis: `Found ${count} incidents matching the criteria.`
      };

    } catch (error) {
      console.error("AnalyticsAgent Error:", error);
      return { trend: "error" };
    }
  }
}
