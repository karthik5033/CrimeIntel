import { NextResponse } from 'next/server';
import { getCatalystApp } from '@/lib/catalyst';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    // Require ADMIN_SEED_TOKEN authentication
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.ADMIN_SEED_TOKEN;
    
    if (!expectedToken) {
      return NextResponse.json({ 
        error: 'ADMIN_SEED_TOKEN not configured' 
      }, { status: 500 });
    }
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Catalyst is authenticated (not mock mode)
    if (process.env.USE_MOCK_CATALYST === 'true') {
      return NextResponse.json({ 
        error: 'Cannot seed data in mock mode. Set USE_MOCK_CATALYST=false and provide valid Catalyst credentials.' 
      }, { status: 400 });
    }

    const app = getCatalystApp();
    const datastore = app.datastore();

    const seedDir = path.join(process.cwd(), 'data/seed');
    
    if (!fs.existsSync(seedDir)) {
      return NextResponse.json({ 
        error: `Seed directory not found: ${seedDir}` 
      }, { status: 400 });
    }
    
    const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
      return NextResponse.json({ 
        error: 'No seed JSON files found in data/seed directory' 
      }, { status: 400 });
    }

    const results: Record<string, number> = {};
    const errors: Record<string, string> = {};

    for (const file of files) {
      const tableName = file.replace('.json', '');
      const filePath = path.join(seedDir, file);
      
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        if (!Array.isArray(data) || data.length === 0) {
          console.log(`[Seed] Skipping ${tableName}: empty or invalid data`);
          continue;
        }

        const table = datastore.table(tableName);
        let inserted = 0;
        const batchSize = 100; // Catalyst limit

        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          await table.insertRows(batch);
          inserted += batch.length;
          console.log(`[Seed] Inserted ${inserted}/${data.length} into ${tableName}`);
        }
        
        results[tableName] = inserted;
      } catch (error: any) {
        console.error(`[Seed] Error loading ${tableName}:`, error);
        errors[tableName] = error.message;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Seed data loaded into Catalyst Data Store successfully.',
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
