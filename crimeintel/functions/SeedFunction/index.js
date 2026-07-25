const catalyst = require('zcatalyst-sdk-node');
const fs = require('fs');
const path = require('path');

// Read JSON data
function readData(filename) {
  // We go up two levels from functions/SeedFunction to reach the project root
  const filePath = path.join(__dirname, '..', '..', 'data', 'seed', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Chunk array into smaller batches
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Flatten an object so all values are primitives
function flattenRecord(record) {
  const flat = {};
  for (const [key, val] of Object.entries(record)) {
    if (val === null || val === undefined) {
      flat[key] = '';
    } else if (typeof val === 'object') {
      flat[key] = JSON.stringify(val);
    } else {
      flat[key] = val;
    }
  }
  return flat;
}

async function seedTable(datastore, tableName, records, batchSize = 1) {
  let successCount = 0;
  let failCount = 0;
  const batches = chunk(records, batchSize);
  for (const batch of batches) {
    for (const record of batch) {
      try {
        await datastore.table(tableName).insertRow(flattenRecord(record));
        successCount++;
      } catch (err) {
        if (!err.message?.includes('duplicate') && !err.message?.includes('DUPLICATE')) {
          failCount++;
          console.error(`Failed to insert into ${tableName}:`, err.message);
        }
      }
    }
  }
  return { successCount, failCount };
}

async function seedNoSQLCollection(app, collectionName, records) {
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
        } catch (err) {
          failCount++;
        }
      }
    }
  } catch (err) {
    console.error(`NoSQL ${collectionName} error:`, err.message);
  }
  return { successCount, failCount };
}

module.exports = async (req, res) => {
  try {
    const app = catalyst.initialize(req);
    const datastore = app.datastore();

    console.log('Loading JSON data...');
    const personsData = readData('Persons.json');
    const policeStationsData = readData('PoliceStations.json');
    const firsData = readData('FIRs.json');
    const casesData = readData('Cases.json');
    const vehiclesData = readData('Vehicles.json');
    const phoneRecordsData = readData('PhoneRecords.json');
    const bankAccountsData = readData('BankAccounts.json');
    const weaponsData = readData('Weapons.json');
    const entityRelationshipsData = readData('EntityRelationships.json');
    const transactionsData = readData('Transactions.json');

    console.log('📦 Seeding Catalyst Data Store...');
    const datastoreJobs = [
      { name: 'Persons', data: personsData },
      { name: 'PoliceStations', data: policeStationsData },
      { name: 'FIRs', data: firsData },
      { name: 'Cases', data: casesData },
      { name: 'Vehicles', data: vehiclesData },
      { name: 'PhoneRecords', data: phoneRecordsData },
      { name: 'BankAccounts', data: bankAccountsData },
      { name: 'Weapons', data: weaponsData },
      { name: 'Transactions', data: transactionsData },
    ];

    const results = {};

    for (const job of datastoreJobs) {
      console.log(`  → Seeding DataStore/${job.name} (${job.data.length} records)...`);
      const result = await seedTable(datastore, job.name, job.data);
      results[job.name] = result;
      console.log(`  ✅ ${job.name}: ${result.successCount} OK, ${result.failCount} failed`);
    }

    console.log('📦 Seeding Catalyst NoSQL (EntityRelationships)...');
    const relResult = await seedNoSQLCollection(app, 'EntityRelationships', entityRelationshipsData);
    results['EntityRelationships'] = relResult;
    console.log(`  ✅ EntityRelationships: ${relResult.successCount} OK, ${relResult.failCount} failed`);

    res.status(200).send(results);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    res.status(500).send(err.message);
  }
};
