/**
 * Phase 1 Step 9: Embeddings Service
 * 
 * Generates vector embeddings for:
 * - FIR narratives/descriptions
 * - OCR extracted text
 * - Witness statements
 * - Evidence descriptions
 * 
 * Enables:
 * - Semantic search (find similar cases)
 * - Contextual recommendations
 * - Anomaly detection
 * - Pattern matching
 * 
 * Uses either:
 * 1. Catalyst Zia Embeddings (if available)
 * 2. OpenAI Embeddings API (text-embedding-3-small)
 * 3. Local/Open Source models (sentence-transformers)
 */

import { getCatalystApp } from '@/lib/catalyst';

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  model: string;
  dimensions: number;
  generatedAt: string;
}

export interface EmbeddingStorageRecord {
  id: string;
  entityId: string;
  entityType: 'FIR' | 'Person' | 'Case' | 'Evidence';
  text: string;
  embedding: string; // JSON string of array
  model: string;
  dimensions: number;
  createdAt: string;
}

export class EmbeddingsService {
  private static readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private static readonly EMBEDDING_DIMENSIONS = 1536;

  /**
   * Generate embedding for text
   */
  static async generateEmbedding(text: string): Promise<EmbeddingResult> {
    // Try methods in order of preference
    try {
      return await this.generateWithZia(text);
    } catch (error) {
      console.warn('Zia embeddings failed, trying OpenAI:', error);
      
      try {
        return await this.generateWithOpenAI(text);
      } catch (error2) {
        console.warn('OpenAI embeddings failed, using fallback:', error2);
        
        // Fallback: simple hash-based embedding (for demo purposes)
        return this.generateFallbackEmbedding(text);
      }
    }
  }

  /**
   * Method 1: Generate embedding using Catalyst Zia
   */
  private static async generateWithZia(text: string): Promise<EmbeddingResult> {
    const app = getCatalystApp();
    const zia = app.zia?.();

    if (!zia) {
      throw new Error('Zia not available');
    }

    // Call Zia embeddings API
    const result = await zia.generateEmbeddings(text);

    if (!result || !result.embedding) {
      throw new Error('Zia returned no embedding');
    }

    return {
      text: text,
      embedding: result.embedding,
      model: 'catalyst-zia',
      dimensions: result.embedding.length,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Method 2: Generate embedding using OpenAI API
   */
  private static async generateWithOpenAI(text: string): Promise<EmbeddingResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Truncate text if too long (OpenAI limit: ~8191 tokens)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: truncatedText,
        model: this.EMBEDDING_MODEL,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API failed: ${error}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    return {
      text: truncatedText,
      embedding: embedding,
      model: this.EMBEDDING_MODEL,
      dimensions: embedding.length,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Method 3: Fallback - Simple hash-based embedding
   * (Not suitable for production, but allows testing without API keys)
   */
  private static generateFallbackEmbedding(text: string): EmbeddingResult {
    // Generate a simple deterministic embedding based on text
    // This is NOT a real embedding and won't work for semantic search
    const dimensions = 384; // Smaller dimension for fallback
    const embedding = new Array(dimensions).fill(0);

    // Hash text to generate pseudo-random but deterministic values
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = i % dimensions;
      embedding[index] = (embedding[index] + charCode) / 2;
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalized = embedding.map(val => val / magnitude);

    return {
      text: text,
      embedding: normalized,
      model: 'fallback-hash',
      dimensions: dimensions,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Store embedding in Catalyst Data Store
   * Note: Requires Embeddings table in Data Store
   */
  static async storeEmbedding(
    entityId: string,
    entityType: 'FIR' | 'Person' | 'Case' | 'Evidence',
    text: string,
    embedding: EmbeddingResult
  ): Promise<string> {
    const app = getCatalystApp();
    const table = app.datastore().table('Embeddings');

    const record: Partial<EmbeddingStorageRecord> = {
      id: `EMB_${entityType}_${entityId}_${Date.now()}`,
      entityId: entityId,
      entityType: entityType,
      text: text.substring(0, 1000), // Store truncated text for reference
      embedding: JSON.stringify(embedding.embedding), // Store as JSON string
      model: embedding.model,
      dimensions: embedding.dimensions,
      createdAt: embedding.generatedAt,
    };

    try {
      await table.insertRow(record);
      return record.id as string;
    } catch (error) {
      console.error('Failed to store embedding:', error);
      throw error;
    }
  }

  /**
   * Generate and store embeddings for a FIR
   */
  static async generateFIREmbeddings(firId: string): Promise<{
    descriptionEmbedding?: string;
    ocrEmbedding?: string;
    success: boolean;
    errors: string[];
  }> {
    const result = {
      descriptionEmbedding: undefined as string | undefined,
      ocrEmbedding: undefined as string | undefined,
      success: false,
      errors: [] as string[],
    };

    try {
      // Get FIR data
      const app = getCatalystApp();
      const zcql = app.zcql();
      
      const firQuery = await zcql.executeZCQLQuery(
        `SELECT description, ocr_text FROM FIRs WHERE fir_no = '${firId}' LIMIT 1`
      );

      if (!firQuery || firQuery.length === 0) {
        throw new Error('FIR not found');
      }

      const fir = firQuery[0].FIRs || firQuery[0];

      // Generate embedding for description
      if (fir.description && fir.description.length > 10) {
        try {
          const descEmbedding = await this.generateEmbedding(fir.description);
          const embId = await this.storeEmbedding(firId, 'FIR', fir.description, descEmbedding);
          result.descriptionEmbedding = embId;
          console.log(`✅ Generated description embedding for FIR ${firId}`);
        } catch (error) {
          result.errors.push(`Description embedding failed: ${(error as Error).message}`);
        }
      }

      // Generate embedding for OCR text
      if (fir.ocr_text && fir.ocr_text.length > 10) {
        try {
          // Use first 8000 characters of OCR text
          const ocrText = fir.ocr_text.substring(0, 8000);
          const ocrEmbedding = await this.generateEmbedding(ocrText);
          const embId = await this.storeEmbedding(firId, 'FIR', ocrText, ocrEmbedding);
          result.ocrEmbedding = embId;
          console.log(`✅ Generated OCR embedding for FIR ${firId}`);
        } catch (error) {
          result.errors.push(`OCR embedding failed: ${(error as Error).message}`);
        }
      }

      result.success = result.errors.length === 0;
      return result;

    } catch (error) {
      result.errors.push((error as Error).message);
      result.success = false;
      return result;
    }
  }

  /**
   * Find similar FIRs using cosine similarity
   */
  static async findSimilarFIRs(
    firId: string,
    limit: number = 10
  ): Promise<Array<{ firId: string; similarity: number }>> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    try {
      // Get embedding for the query FIR
      const queryEmbedding = await zcql.executeZCQLQuery(
        `SELECT embedding FROM Embeddings WHERE entityId = '${firId}' AND entityType = 'FIR' ORDER BY createdAt DESC LIMIT 1`
      );

      if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error('No embedding found for FIR');
      }

      const queryVector = JSON.parse(queryEmbedding[0].Embeddings?.embedding || queryEmbedding[0].embedding);

      // Get all other FIR embeddings
      const allEmbeddings = await zcql.executeZCQLQuery(
        `SELECT entityId, embedding FROM Embeddings WHERE entityType = 'FIR' AND entityId != '${firId}'`
      );

      // Calculate cosine similarity for each
      const similarities = allEmbeddings.map((row: any) => {
        const emb = row.Embeddings || row;
        const targetVector = JSON.parse(emb.embedding);
        const similarity = this.cosineSimilarity(queryVector, targetVector);

        return {
          firId: emb.entityId,
          similarity: similarity,
        };
      });

      // Sort by similarity and return top N
      return similarities
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to find similar FIRs:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Search FIRs by text query using semantic search
   */
  static async searchByText(
    query: string,
    limit: number = 10
  ): Promise<Array<{ firId: string; score: number; text: string }>> {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);

      // Get all FIR embeddings
      const app = getCatalystApp();
      const zcql = app.zcql();
      
      const allEmbeddings = await zcql.executeZCQLQuery(
        `SELECT entityId, text, embedding FROM Embeddings WHERE entityType = 'FIR'`
      );

      // Calculate similarity for each
      const results = allEmbeddings.map((row: any) => {
        const emb = row.Embeddings || row;
        const targetVector = JSON.parse(emb.embedding);
        const score = this.cosineSimilarity(queryEmbedding.embedding, targetVector);

        return {
          firId: emb.entityId,
          score: score,
          text: emb.text,
        };
      });

      // Sort by score and return top N
      return results
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to search by text:', error);
      throw error;
    }
  }

  /**
   * Batch generate embeddings for multiple FIRs
   */
  static async generateBatchEmbeddings(firIds: string[]): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ firId: string; error: string }>;
  }> {
    const result = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ firId: string; error: string }>,
    };

    for (const firId of firIds) {
      try {
        const embResult = await this.generateFIREmbeddings(firId);
        if (embResult.success) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push({
            firId: firId,
            error: embResult.errors.join(', '),
          });
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          firId: firId,
          error: (error as Error).message,
        });
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return result;
  }
}
