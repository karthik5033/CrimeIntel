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
        console.log("SQLAgent: No search entities found in parsed query. Falling back to general retrieval.");
        query += ` LIMIT 20`;
      } else {
        query += ` WHERE ` + conditions.join(' AND ');
        query += ` LIMIT 20`;
      }

      console.log("SQLAgent Executing ZCQL:", query);
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
        const d = parsedQuery.entities.district.toLowerCase();
        let filtered = finalResults.filter((f: any) => 
          f.district === mappedDistrict || 
          f.district_id === mappedDistrict ||
          String(f.district_id).toLowerCase().includes(d) || 
          (f.district && String(f.district).toLowerCase().includes(d)) ||
          (f.description && String(f.description).toLowerCase().includes(d))
        );
        
        // Fallback for mock demo: if no matching district, return original array so demo doesn't fail empty
        if (filtered.length > 0) {
          finalResults = filtered;
        } else {
          console.log(`SQLAgent: Mock fallback - No cases found for district ${d}, returning generic cases instead.`);
        }
      }
      
      if (parsedQuery.entities.fir_numbers && parsedQuery.entities.fir_numbers.length > 0) {
        const targetFir = parsedQuery.entities.fir_numbers[0].toLowerCase();
        let filtered = finalResults.filter((f: any) => String(f.fir_no).toLowerCase().includes(targetFir) || String(f.id).toLowerCase().includes(targetFir));
        
        // Fallback for mock demo
        if (filtered.length > 0) {
          finalResults = filtered;
        }
      }

      return finalResults.slice(0, 20);
    } catch (error) {
      return [];
    }
  }
}
