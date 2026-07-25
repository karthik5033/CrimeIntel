import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingsService } from '@/lib/services/embeddingsService';

/**
 * Phase 1 Step 9: Embeddings API
 * 
 * POST /api/embeddings - Generate embeddings for a FIR
 * GET /api/embeddings/similar?firId=... - Find similar FIRs
 * POST /api/embeddings/search - Semantic search by text query
 * POST /api/embeddings/batch - Generate embeddings for multiple FIRs
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, firId, firIds, query } = body;

    switch (action) {
      case 'generate':
        return await handleGenerate(firId);
      case 'batch':
        return await handleBatch(firIds);
      case 'search':
        return await handleSearch(query);
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: generate, batch, or search' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Embeddings API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Embeddings operation failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}

async function handleGenerate(firId: string) {
  if (!firId) {
    return NextResponse.json(
      { error: 'FIR ID required' },
      { status: 400 }
    );
  }

  console.log('🔮 Generating embeddings for FIR:', firId);

  const result = await EmbeddingsService.generateFIREmbeddings(firId);

  return NextResponse.json({
    success: result.success,
    message: result.success 
      ? 'Embeddings generated successfully'
      : 'Embeddings generation completed with errors',
    firId: firId,
    embeddings: {
      description: result.descriptionEmbedding,
      ocr: result.ocrEmbedding,
    },
    errors: result.errors,
  });
}

async function handleBatch(firIds: string[]) {
  if (!firIds || !Array.isArray(firIds) || firIds.length === 0) {
    return NextResponse.json(
      { error: 'Array of FIR IDs required' },
      { status: 400 }
    );
  }

  console.log(`🔮 Generating embeddings for ${firIds.length} FIRs...`);

  const result = await EmbeddingsService.generateBatchEmbeddings(firIds);

  return NextResponse.json({
    success: result.failed === 0,
    message: `Processed ${firIds.length} FIRs: ${result.successful} successful, ${result.failed} failed`,
    stats: {
      total: firIds.length,
      successful: result.successful,
      failed: result.failed,
    },
    errors: result.errors,
  });
}

async function handleSearch(query: string) {
  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Search query required' },
      { status: 400 }
    );
  }

  console.log('🔍 Semantic search for:', query);

  const results = await EmbeddingsService.searchByText(query, 10);

  return NextResponse.json({
    success: true,
    message: `Found ${results.length} similar FIRs`,
    query: query,
    results: results,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firId = searchParams.get('firId');
    const action = searchParams.get('action') || 'similar';

    if (!firId) {
      return NextResponse.json(
        { error: 'FIR ID required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'similar':
        const similar = await EmbeddingsService.findSimilarFIRs(firId, 10);
        return NextResponse.json({
          success: true,
          firId: firId,
          similarFIRs: similar,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: similar' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Embeddings GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve embeddings data',
      details: (error as Error).message
    }, { status: 500 });
  }
}