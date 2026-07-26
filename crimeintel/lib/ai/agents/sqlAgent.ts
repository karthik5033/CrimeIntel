import { getCatalystApp } from '@/lib/catalyst';
import { ParsedQuery } from '../chat/intentClassifier';

export class SQLAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any[]> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    if (!zcql) {
      console.warn("SQLAgent: ZCQL is unavailable.");
      return [];
    }

    try {
      let query = `SELECT * FROM FIRs`;
      let conditions = [];

      if (parsedQuery.entities.district) {
        conditions.push(`district = '${parsedQuery.entities.district}'`);
      }
      
      if (parsedQuery.entities.crime_types && parsedQuery.entities.crime_types.length > 0) {
        // For simplicity, we just use the first crime type
        conditions.push(`crime_type_en = '${parsedQuery.entities.crime_types[0]}'`);
      }

      if (parsedQuery.entities.fir_numbers && parsedQuery.entities.fir_numbers.length > 0) {
        // If FIR numbers are provided, query for them (mock handles this loosely)
        const firs = parsedQuery.entities.fir_numbers.map(f => `'${f}'`).join(',');
        // In Catalyst ZCQL we would use IN, but let's stick to simple equal or LIKE for mock support
        conditions.push(`fir_no LIKE '%${parsedQuery.entities.fir_numbers[0]}%'`);
      }

      if (conditions.length === 0) {
        console.log("SQLAgent: No search entities found in parsed query. Returning empty to prevent indiscriminate data dump.");
        return [];
      }

      query += ` WHERE ` + conditions.join(' AND ');

      // Limit results to top 5 to prevent context overflow
      query += ` LIMIT 5`;

      console.log("SQLAgent Executing ZCQL:", query);
      const results = await zcql.executeZCQLQuery(query);
      
      let finalResults = results.map((row: any) => row.FIRs || row);
      
      // Since mock ZCQL doesn't fully support WHERE/LIMIT, apply basic filtering locally for the mock
      if (parsedQuery.entities.district) {
        finalResults = finalResults.filter((f: any) => f.district === parsedQuery.entities.district || f.district_id === parsedQuery.entities.district);
      }
      if (parsedQuery.entities.fir_numbers && parsedQuery.entities.fir_numbers.length > 0) {
        const targetFir = parsedQuery.entities.fir_numbers[0];
        finalResults = finalResults.filter((f: any) => String(f.fir_no).includes(targetFir) || String(f.id).includes(targetFir));
      }

      return finalResults.slice(0, 5);
    } catch (error) {
      console.error("SQLAgent Error:", error);
      return [];
    }
  }
}
