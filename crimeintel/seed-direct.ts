import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import path from 'path';
import { insertToDataStore } from './lib/catalyst/direct-api';

async function seed() {
  try {
    const seedDir = path.join(process.cwd(), 'data/seed');
    const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const tableName = file.replace('.json', '');
      const filePath = path.join(seedDir, file);
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (!Array.isArray(data) || data.length === 0) continue;
      
      let inserted = 0;
      const batchSize = 100;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await insertToDataStore(tableName, batch);
        inserted += batch.length;
        console.log(`[Seed] Inserted ${inserted}/${data.length} into ${tableName}`);
      }
    }
    console.log('All seed data loaded successfully!');
  } catch(e) {
    console.error('Error:', e);
  }
}

seed();
