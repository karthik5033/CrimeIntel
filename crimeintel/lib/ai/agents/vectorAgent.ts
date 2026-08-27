import { ParsedQuery } from '../chat/intentClassifier';
import { performSemanticSearchVector } from '@/lib/nlp/semantic-search';

export class VectorAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any[]> {
    try {
      // Check if embeddings are configured
      if (!process.env.QUICKML_EMBEDDING_ENDPOINT_KEY) {
        console.log('VectorAgent: Embeddings not configured (QUICKML_EMBEDDING_ENDPOINT_KEY missing). Skipping vector search.');
        // TODO: Implement real Catalyst QuickML embeddings when endpoint is configured
        return [];
      }
      
      // Use the resolved query to perform semantic RAG search
      const results = await performSemanticSearchVector(parsedQuery.resolvedQuery, 4);
      return results;
    } catch (error) {
      console.error("VectorAgent Error:", error);
      return [];
    }
  }
}
