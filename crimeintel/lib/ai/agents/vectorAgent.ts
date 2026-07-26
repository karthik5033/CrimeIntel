import { ParsedQuery } from '../chat/intentClassifier';
import { performSemanticSearch } from '@/lib/nlp/semantic-search';

export class VectorAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any[]> {
    try {
      // Use the resolved query to perform semantic RAG search
      const results = await performSemanticSearch(parsedQuery.resolvedQuery, 4);
      return results;
    } catch (error) {
      console.error("VectorAgent Error:", error);
      return [];
    }
  }
}
