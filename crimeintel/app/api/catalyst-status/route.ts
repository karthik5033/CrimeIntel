import { NextResponse } from 'next/server';
import { getCatalystAppAsync } from '@/lib/catalyst/index';

/**
 * Catalyst Status Check Endpoint
 * Tests if Catalyst SDK is initialized and working
 * 
 * GET /api/catalyst-status
 */

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    checks: {}
  };

  try {
    // Check 1: Environment Variables
    results.checks.envVars = {
      status: 'checking',
      projectId: process.env.CATALYST_PROJECT_ID || process.env.NEXT_PUBLIC_CATALYST_PROJECT_ID || 'MISSING',
      environment: process.env.CATALYST_ENV || process.env.NEXT_PUBLIC_CATALYST_ENV || 'MISSING',
      hasProjectId: !!(process.env.CATALYST_PROJECT_ID || process.env.NEXT_PUBLIC_CATALYST_PROJECT_ID),
      hasEnvironment: !!(process.env.CATALYST_ENV || process.env.NEXT_PUBLIC_CATALYST_ENV)
    };

    if (results.checks.envVars.hasProjectId && results.checks.envVars.hasEnvironment) {
      results.checks.envVars.status = 'ok';
    } else {
      results.checks.envVars.status = 'error';
      results.checks.envVars.message = 'Missing environment variables';
    }

    // Check 2: Catalyst SDK Initialization
    try {
      const app = await getCatalystAppAsync();
      results.checks.sdkInit = {
        status: 'ok',
        message: 'Catalyst SDK initialized successfully',
        hasApp: !!app
      };

      // Check 3: Filestore (Stratus) Availability
      try {
        const filestore = app.filestore();
        results.checks.filestore = {
          status: 'ok',
          message: 'Filestore available',
          hasFilestore: !!filestore
        };

        // Check 4: List Buckets
        try {
          const buckets = await filestore.getAllBuckets();
          const bucketNames = buckets.map((b: any) => b.bucket_name);
          
          results.checks.buckets = {
            status: 'ok',
            message: 'Buckets retrieved successfully',
            count: buckets.length,
            buckets: bucketNames,
            hasFirBucket: bucketNames.includes('fir_documents'),
            hasEvidenceBucket: bucketNames.includes('evidence_files')
          };

          if (!results.checks.buckets.hasFirBucket) {
            results.checks.buckets.status = 'warning';
            results.checks.buckets.warning = 'fir_documents bucket not found. Please create it in Catalyst Console.';
          }
        } catch (error) {
          results.checks.buckets = {
            status: 'error',
            message: 'Failed to list buckets',
            error: (error as Error).message
          };
        }

        // Check 5: Datastore Availability
        try {
          const datastore = app.datastore();
          results.checks.datastore = {
            status: 'ok',
            message: 'Datastore available',
            hasDatastore: !!datastore
          };

          // Try to get table list
          try {
            const tables = await datastore.getAllTables();
            results.checks.datastore.tableCount = tables.length;
            results.checks.datastore.tables = tables.map((t: any) => t.table_name).slice(0, 10);
          } catch (error) {
            results.checks.datastore.warning = 'Could not list tables: ' + (error as Error).message;
          }
        } catch (error) {
          results.checks.datastore = {
            status: 'error',
            message: 'Datastore not available',
            error: (error as Error).message
          };
        }

      } catch (error) {
        results.checks.filestore = {
          status: 'error',
          message: 'Filestore not available',
          error: (error as Error).message
        };
      }

    } catch (error) {
      results.checks.sdkInit = {
        status: 'error',
        message: 'Failed to initialize Catalyst SDK',
        error: (error as Error).message,
        stack: (error as Error).stack
      };
    }

    // Overall Status
    const hasErrors = Object.values(results.checks).some((check: any) => check.status === 'error');
    const hasWarnings = Object.values(results.checks).some((check: any) => check.status === 'warning');

    if (hasErrors) {
      results.status = 'error';
      results.message = 'Catalyst has configuration errors';
    } else if (hasWarnings) {
      results.status = 'warning';
      results.message = 'Catalyst is working but has warnings';
    } else {
      results.status = 'ok';
      results.message = 'All Catalyst services are working correctly';
    }

    // Recommendations
    results.recommendations = [];
    
    if (!results.checks.envVars?.hasProjectId) {
      results.recommendations.push('Set CATALYST_PROJECT_ID in .env.local');
    }
    
    if (results.checks.buckets && !results.checks.buckets.hasFirBucket) {
      results.recommendations.push('Create "fir_documents" bucket in Catalyst Console → File Store');
    }
    
    if (results.checks.buckets && !results.checks.buckets.hasEvidenceBucket) {
      results.recommendations.push('Create "evidence_files" bucket in Catalyst Console → File Store');
    }

    return NextResponse.json(results, { 
      status: hasErrors ? 500 : 200 
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check Catalyst status',
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
