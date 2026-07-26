/**
 * Embedding Index Computer
 * Phase 0.1 - Generates and stores vector embeddings for semantic search
 */

import { EmbeddingIndex, IndexComputationResult } from './types';

export interface EntityForEmbedding {
  entity_id: string;
  entity_type: 'case' | 'person' | 'fir' | 'narrative';
  text_content: string;
  metadata: Record<string, any>;
}

export class EmbeddingComputer {
  private readonly EMBEDDING_DIM = 384; // Typical for sentence transformers

  /**
   * Compute embeddings for all entities
   * In production, use Catalyst QuickML or sentence-transformers
   */
  async compute(
    entities: EntityForEmbedding[]
  ): Promise<IndexComputationResult> {
    const startTime = Date.now();
    const snapshot_version = this.generateSnapshotVersion();

    try {
      const embeddings: EmbeddingIndex[] = [];

      for (const entity of entities) {
        // Generate embedding (mock for now - in production use real embedding model)
        const embedding = await this.generateEmbedding(entity.text_content);

        embeddings.push({
          entity_id: entity.entity_id,
          entity_type: entity.entity_type,
          embedding,
          text_content: entity.text_content,
          metadata: entity.metadata,
          computed_at: new Date(),
        });
      }

      return {
        success: true,
        index_type: 'embedding',
        records_computed: embeddings.length,
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
      };
    } catch (error) {
      return {
        success: false,
        index_type: 'embedding',
        records_computed: 0,
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate embedding vector for text
   * MOCK IMPLEMENTATION - In production:
   * - Use Catalyst QuickML Embedding API
   * - Or sentence-transformers (all-MiniLM-L6-v2, all-mpnet-base-v2)
   * - Or OpenAI text-embedding-ada-002
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Mock: Generate deterministic pseudo-embedding based on text
    // This is NOT a real semantic embedding - just for structure
    const embedding = new Array(this.EMBEDDING_DIM).fill(0);

    // Simple hash-based pseudo-embedding (deterministic)
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const hash = this.simpleHash(word);
      const idx = hash % this.EMBEDDING_DIM;
      embedding[idx] += 1 / Math.sqrt(words.length);
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => (magnitude > 0 ? val / magnitude : 0));
  }

  /**
   * Simple hash function for mock embedding
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Compute cosine similarity between two embeddings
   */
  static cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have same dimension');
    }

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Search for similar entities using vector similarity
   */
  static searchSimilar(
    queryEmbedding: number[],
    allEmbeddings: EmbeddingIndex[],
    topK: number = 10
  ): Array<{ entity: EmbeddingIndex; similarity: number }> {
    const similarities = allEmbeddings.map(entity => ({
      entity,
      similarity: this.cosineSimilarity(queryEmbedding, entity.embedding),
    }));

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK);
  }

  private generateSnapshotVersion(): string {
    return `v${Date.now()}`;
  }
}

/**
 * Integration notes for production:
 * 
 * 1. Catalyst QuickML Integration:
 *    ```typescript
 *    import catalyst from 'zcatalyst-sdk-node';
 *    const quickml = catalyst.quickml();
 *    const response = await quickml.embedding().generate({
 *      text: entity.text_content,
 *      model: 'text-embedding-ada-002'
 *    });
 *    const embedding = response.embedding;
 *    ```
 * 
 * 2. Sentence Transformers (Python):
 *    ```python
 *    from sentence_transformers import SentenceTransformer
 *    model = SentenceTransformer('all-MiniLM-L6-v2')
 *    embeddings = model.encode(texts)
 *    ```
 * 
 * 3. Storage:
 *    - Catalyst NoSQL with vector index
 *    - Or dedicated vector DB (Pinecone, Weaviate, Qdrant)
 * 
 * 4. Search:
 *    - Use approximate nearest neighbor (ANN) for scale
 *    - HNSW, IVF, or Product Quantization algorithms
 */
