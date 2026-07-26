import { getCatalystApp } from '@/lib/catalyst';
import { ParsedQuery } from '../chat/intentClassifier';

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

      // In a real scenario, this would use graph traversal logic.
      // Here we simulate fetching 1-hop relationships for the requested entities.
      const query = `SELECT * FROM EntityRelationships`;
      const allRels = await zcql.executeZCQLQuery(query);
      
      const relevantRels = allRels.filter((row: any) => {
        const rel = row.EntityRelationships || row;
        return entities.some(e => 
          (rel.source_id && rel.source_id.toLowerCase().includes(e.toLowerCase())) ||
          (rel.target_id && rel.target_id.toLowerCase().includes(e.toLowerCase()))
        );
      });

      return relevantRels.slice(0, 10).map((row: any) => row.EntityRelationships || row);
    } catch (error) {
      console.error("GraphAgent Error:", error);
      return [];
    }
  }
}
