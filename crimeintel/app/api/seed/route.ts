import { NextResponse } from 'next/server';
import { getCatalystApp } from '@/lib/catalyst';
import personsData from '@/data/seed/Persons.json';
import policeStationsData from '@/data/seed/PoliceStations.json';
import firsData from '@/data/seed/FIRs.json';
import casesData from '@/data/seed/Cases.json';
import vehiclesData from '@/data/seed/Vehicles.json';
import phoneRecordsData from '@/data/seed/PhoneRecords.json';
import bankAccountsData from '@/data/seed/BankAccounts.json';
import weaponsData from '@/data/seed/Weapons.json';
import entityRelationshipsData from '@/data/seed/EntityRelationships.json';
import transactionsData from '@/data/seed/Transactions.json';

// Chunk array into smaller batches
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Flatten an object so all values are primitives (Catalyst Data Store requirement)
function flattenRecord(record: any): Record<string, string | number | boolean> {
  const flat: Record<string, string | number | boolean> = {};
  for (const [key, val] of Object.entries(record)) {
    if (val === null || val === undefined) {
      flat[key] = '';
    } else if (typeof val === 'object') {
      flat[key] = JSON.stringify(val);
    } else {
      flat[key] = val as any;
    }
  }
  return flat;
}

async function seedTable(datastore: any, tableName: string, records: any[], batchSize = 1) {
  let successCount = 0;
  let failCount = 0;
  const batches = chunk(records, batchSize);
  for (const batch of batches) {
    for (const record of batch) {
      try {
        await datastore.table(tableName).insertRow(flattenRecord(record));
        successCount++;
      } catch (err: any) {
        // Ignore duplicate row errors, log others
        if (!err.message?.includes('duplicate') && !err.message?.includes('DUPLICATE')) {
          failCount++;
        }
      }
    }
  }
  return { successCount, failCount };
}

async function seedNoSQLCollection(app: any, collectionName: string, records: any[]) {
  let successCount = 0;
  let failCount = 0;
  try {
    const nosql = app.nosql();
    const batches = chunk(records, 1);
    for (const batch of batches) {
      for (const record of batch) {
        try {
          await nosql.table(collectionName).insertRow({
            document_id: record.id || record.CaseMasterID || String(Math.random()),
            data: JSON.stringify(record),
            created_at: new Date().toISOString()
          });
          successCount++;
        } catch {
          failCount++;
        }
      }
    }
  } catch (err: any) {
    console.error(`NoSQL ${collectionName} error:`, err.message);
  }
  return { successCount, failCount };
}

export async function POST(request: Request) {
  const results: Record<string, any> = {};

  try {
    const app = getCatalystApp();
    const datastore = app.datastore();

    // ─── Catalyst Data Store Tables ─────────────────────────────────────────
    console.log('📦 Seeding Catalyst Data Store...');

    const datastoreJobs = [
      { name: 'Persons', data: personsData as any[] },
      { name: 'PoliceStations', data: policeStationsData as any[] },
      { name: 'FIRs', data: firsData as any[] },
      { name: 'Cases', data: casesData as any[] },
      { name: 'Vehicles', data: vehiclesData as any[] },
      { name: 'PhoneRecords', data: phoneRecordsData as any[] },
      { name: 'BankAccounts', data: bankAccountsData as any[] },
      { name: 'Weapons', data: weaponsData as any[] },
      { name: 'Transactions', data: transactionsData as any[] },
    ];

    for (const job of datastoreJobs) {
      console.log(`  → Seeding DataStore/${job.name} (${job.data.length} records)...`);
      const result = await seedTable(datastore, job.name, job.data);
      results[`DataStore/${job.name}`] = result;
      console.log(`  ✅ ${job.name}: ${result.successCount} OK, ${result.failCount} failed`);
    }

    // ─── Catalyst NoSQL – Graph & Relationship Data ──────────────────────────
    console.log('📦 Seeding Catalyst NoSQL (EntityRelationships)...');
    const relResult = await seedNoSQLCollection(app, 'EntityRelationships', entityRelationshipsData as any[]);
    results['NoSQL/EntityRelationships'] = relResult;
    console.log(`  ✅ EntityRelationships: ${relResult.successCount} OK`);

    // ─── Catalyst Cache – Precompute Summary KPIs ────────────────────────────
    console.log('📦 Precomputing Cache KPIs...');
    try {
      const cache = app.cache();
      const segment = cache.segment('crimeintel');

      const totalFIRs = (firsData as any[]).length;
      const totalPersons = (personsData as any[]).length;
      const totalCases = (casesData as any[]).length;

      // District-level case count aggregation
      const districtCounts: Record<string, number> = {};
      for (const fir of (firsData as any[])) {
        const d = fir.district_name_en || 'Unknown';
        districtCounts[d] = (districtCounts[d] || 0) + 1;
      }

      const kpiSummary = {
        totalFIRs,
        totalPersons,
        totalCases,
        districtCounts,
        computedAt: new Date().toISOString()
      };

      await segment.put('kpi_summary', JSON.stringify(kpiSummary), 1440); // 24hr TTL
      results['Cache/kpi_summary'] = { success: true };
      console.log('  ✅ Cache KPI summary written');
    } catch (cacheErr: any) {
      results['Cache/kpi_summary'] = { error: cacheErr.message };
      console.warn('  ⚠️ Cache write failed:', cacheErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Seeding complete! All Catalyst services populated.',
      results
    });

  } catch (error: any) {
    console.error('❌ Seeder failed:', error.message);
    return NextResponse.json(
      { success: false, error: error.message, results },
      { status: 500 }
    );
  }
}
