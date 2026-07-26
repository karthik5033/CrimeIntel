/**
 * OCR Retriever - Full-Text Search over Scanned Documents
 * Phase 0.2
 */

import {
  QueryContext,
  EvidenceItem,
  RetrieverResult,
  RetrieverConfig,
} from '../types';

export class OCRRetriever {
  private config: RetrieverConfig;

  constructor(config: RetrieverConfig) {
    this.config = config;
  }

  async retrieve(context: QueryContext): Promise<RetrieverResult> {
    const startTime = Date.now();

    try {
      console.log('[OCR Retriever] Searching scanned document text...');

      // Extract search terms from query
      const searchTerms = this.extractSearchTerms(context.query);

      // Full-text search over OCR'd documents
      const results = await this.searchOCRIndex(searchTerms);

      const items = this.formatResults(results);

      return {
        retriever: 'ocr',
        success: true,
        items,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          totalMatches: items.length,
          queryType: 'fulltext_search',
          searchTerms,
        },
      };
    } catch (error: any) {
      console.error('[OCR Retriever] Error:', error.message);

      if (this.config.fallbackOnError) {
        return {
          retriever: 'ocr',
          success: false,
          items: [],
          executionTimeMs: Date.now() - startTime,
          error: error.message,
        };
      }

      throw error;
    }
  }

  private extractSearchTerms(query: string): string[] {
    // Remove stop words, extract key terms
    const stopWords = ['the', 'is', 'in', 'at', 'on', 'show', 'find', 'search', 'for'];
    
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.includes(term));
  }

  private async searchOCRIndex(searchTerms: string[]): Promise<any[]> {
    // In production: full-text search in Catalyst NoSQL where OCR text is stored
    console.log('[OCR Retriever] Searching OCR index for:', searchTerms.join(', '));

    // Simulate search
    await new Promise(resolve => setTimeout(resolve, 60 + Math.random() * 80));

    // Mock OCR document matches
    return [
      {
        document_id: 'doc-001',
        fir_id: 'fir-005',
        extracted_text: 'Vehicle theft reported at Whitefield area, two-wheeler Honda Activa...',
        matched_terms: searchTerms.filter(term => ['vehicle', 'theft', 'whitefield'].includes(term)),
        confidence: 0.88,
        page_number: 1,
        ocr_timestamp: new Date('2024-01-15'),
      },
      {
        document_id: 'doc-002',
        fir_id: 'fir-006',
        extracted_text: 'Complainant reported missing motorcycle from parking area...',
        matched_terms: searchTerms.filter(term => ['vehicle', 'theft'].includes(term)),
        confidence: 0.75,
        page_number: 1,
        ocr_timestamp: new Date('2024-01-18'),
      },
    ];
  }

  private formatResults(results: any[]): EvidenceItem[] {
    return results.map(result => ({
      id: result.document_id,
      type: 'document' as const,
      source: 'ocr' as const,
      data: {
        fir_id: result.fir_id,
        extracted_text: result.extracted_text,
        page_number: result.page_number,
        ocr_timestamp: result.ocr_timestamp,
      },
      relevanceScore: result.confidence * (result.matched_terms.length / 10),
      metadata: {
        retrievedAt: new Date(),
        matchedOn: result.matched_terms,
        confidence: result.confidence,
        ocrQuality: result.confidence,
      },
    }));
  }
}
