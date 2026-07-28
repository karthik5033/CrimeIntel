import { getCatalystApp } from '@/lib/catalyst';
import { ParsedQuery } from '../chat/intentClassifier';

export class SQLAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any[]> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    if (!zcql) {
      return [];
    }

    try {
      let query = `SELECT * FROM FIRs`;
      let conditions = [];

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
        const mappedDistrict = distMap[parsedQuery.entities.district] || parsedQuery.entities.district;
        conditions.push(`district_id = '${mappedDistrict}'`);
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
        return [];
      }

      query += ` WHERE ` + conditions.join(' AND ');

      // Limit results to top 5 to prevent context overflow
      query += ` LIMIT 5`;

      const results = await zcql.executeZCQLQuery(query);
      
      let finalResults = results.map((row: any) => row.FIRs || row);
      
      // Since mock ZCQL doesn't fully support WHERE/LIMIT, apply basic filtering locally for the mock
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
        const mappedDistrict = distMap[parsedQuery.entities.district] || parsedQuery.entities.district;
        finalResults = finalResults.filter((f: any) => f.district === mappedDistrict || f.district_id === mappedDistrict);
      }
      if (parsedQuery.entities.fir_numbers && parsedQuery.entities.fir_numbers.length > 0) {
        const targetFir = parsedQuery.entities.fir_numbers[0];
        finalResults = finalResults.filter((f: any) => String(f.fir_no).includes(targetFir) || String(f.id).includes(targetFir));
      }

      return finalResults.slice(0, 5);
    } catch (error) {
      return [];
    }
  }
}
