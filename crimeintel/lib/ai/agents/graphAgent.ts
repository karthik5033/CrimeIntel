import { getCatalystApp } from '@/lib/catalyst';
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

export class GraphAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any[]> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    if (!zcql) {
      return [];
    }

    try {
      const entities = [
        ...(parsedQuery.entities.person_names || []),
        ...(parsedQuery.entities.fir_numbers || [])
      ];

      if (entities.length === 0) {
        return [];
      }

      // Build server-side WHERE clause with parameterized queries
      const conditions = entities.map((e, index) => {
        // Create unique parameter names for each entity
        return buildParameterizedQuery(
          `source_id LIKE '%{entity${index}}%' OR target_id LIKE '%{entity${index}}%'`,
          { [`entity${index}`]: e }
        );
      });
      
      let query = `SELECT * FROM EntityRelationships`;
      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' OR ');
      }
      // Add LIMIT clause to prevent unbounded result sets
      query += ` LIMIT 100`;

      console.log("GraphAgent Executing ZCQL:", query);
      const allRels = await zcql.executeZCQLQuery(query);
      return allRels.map((row: any) => row.EntityRelationships || row);
    } catch (error) {
      console.error("GraphAgent Error:", error);
      return [];
    }
  }
}
