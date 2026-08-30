import { NextResponse } from 'next/server';
import { getCatalystAppAsync } from '@/lib/catalyst/index';

/**
 * Test endpoint to verify Catalyst bucket exists and is accessible
 * GET /api/test-bucket
 */

export async function GET() {
  try {
    console.log('🧪 Testing Catalyst bucket...');
    
    const app = await getCatalystAppAsync();
    const filestore = app.filestore();
    
    if (!filestore) {
      return NextResponse.json({
        success: false,
        error: 'Filestore not initialized'
      }, { status: 500 });
    }

    // List all buckets
    const buckets = await filestore.getAllBuckets();
    console.log('📦 Available buckets:', buckets.map((b: any) => b.bucket_name));
    
    const bucketNames = buckets.map((b: any) => b.bucket_name);
    const hasFirBucket = bucketNames.includes('fir_documents');
    
    if (!hasFirBucket) {
      return NextResponse.json({
        success: false,
        error: 'fir_documents bucket not found',
        availableBuckets: bucketNames,
        recommendation: 'Create "fir_documents" bucket in Catalyst Console → File Store'
      }, { status: 404 });
    }

    // Try to access the bucket
    const bucket = filestore.bucket('fir_documents');
    console.log('✅ fir_documents bucket accessible');

    return NextResponse.json({
      success: true,
      message: 'fir_documents bucket is ready',
      availableBuckets: bucketNames,
      bucketName: 'fir_documents'
    });

  } catch (error) {
    console.error('❌ Bucket test failed:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      details: (error as Error).stack
    }, { status: 500 });
  }
}
