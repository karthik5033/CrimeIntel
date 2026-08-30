import { getCatalystAppAsync } from '@/lib/catalyst';
import { ParsedQuery } from '../chat/intentClassifier';

/**
 * Builds a parameterized ZCQL query with safe parameter substitution.
 * Escapes single quotes by doubling them (ZCQL standard) to prevent SQL injection.
 */
function buildParameterizedQuery(
  baseQuery: string,
  params: Record<string, string | number>
): string {
  let query = baseQuery;
  
  // Escape single quotes in string parameters
  const escaped: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      escaped[key] = value.replace(/'/g, "''");
    } else {
      escaped[key] = String(value);
    }
  }
  
  // Replace placeholders with escaped values
  for (const [key, value] of Object.entries(escaped)) {
    const placeholder = `{${key}}`;
    query = query.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }
  
  return query;
}

/**
 * Cached district mapping to avoid repeated database queries
 */
let districtMappingCache: Record<string, string> | null = null;
let districtCacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Gets dynamic district mapping from database.
 * Maps both English and Kannada district names to district IDs.
 * Results are cached for 5 minutes to improve performance.
 */
async function getDistrictMapping(): Promise<Record<string, string>> {
  // Return cached mapping if still valid
  if (districtMappingCache && Date.now() - districtCacheTimestamp < CACHE_TTL_MS) {
    return districtMappingCache;
  }
  
  const app = await getCatalystAppAsync();
  const zcql = app.zcql();
  
  if (!zcql) {
    return {};
  }
  
  try {
    const result = await zcql.executeZCQLQuery('SELECT * FROM Districts');
    const districts = result.map((row: any) => row.Districts || row);
    
    const mapping: Record<string, string> = {};
    for (const district of districts) {
      // Map English name to district_id
      if (district.name) {
        mapping[district.name.toLowerCase()] = district.id;
      }
      // Map Kannada name to district_id
      if (district.name_kn) {
        mapping[district.name_kn.toLowerCase()] = district.id;
      }
    }
    
    // Update cache
    districtMappingCache = mapping;
    districtCacheTimestamp = Date.now();
    
    return mapping;
  } catch (error) {
    console.error('Error loading district mapping:', error);
    return {};
  }
}

export class SQLAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any[]> {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();

    if (!zcql) {
      return [];
    }

    try {
      let query = `SELECT * FROM FIRs`;
      let conditions = [];

      if (parsedQuery.entities.district) {
        let d = parsedQuery.entities.district.toLowerCase();
        
        // City to District alias map for common Karnataka cities
        const cityToDistrictMap: Record<string, string> = {
          'mangalore': 'dakshina kannada',
          'mangaluru': 'dakshina kannada',
          'bangalore': 'bengaluru urban',
          'bengaluru': 'bengaluru urban',
          'mysore': 'mysuru',
          'hubli': 'dharwad',
          'dharwad': 'dharwad',
          'belgaum': 'belagavi'
        };

        if (cityToDistrictMap[d]) {
          d = cityToDistrictMap[d];
        }
        
        // Use dynamic district mapping
        const districtMapping = await getDistrictMapping();
        const mappedDistrict = districtMapping[d] || parsedQuery.entities.district;
        
        conditions.push(buildParameterizedQuery("district_id = '{district}'", { district: mappedDistrict }));
      }
      
      if (parsedQuery.entities.crime_types && parsedQuery.entities.crime_types.length > 0) {
        const ct = parsedQuery.entities.crime_types[0];
        conditions.push(buildParameterizedQuery("crime_type_en = '{crimeType}'", { crimeType: ct }));
      }

      if (parsedQuery.entities.fir_numbers && parsedQuery.entities.fir_numbers.length > 0) {
        const fir = parsedQuery.entities.fir_numbers[0];
        conditions.push(buildParameterizedQuery("fir_no LIKE '%{fir}%'", { fir }));
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
      
      return results.map((row: any) => row.FIRs || row);
    } catch (error) {
      console.error("SQLAgent execution error:", error);
      return [];
    }
  }
}
