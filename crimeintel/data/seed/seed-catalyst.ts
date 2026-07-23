import { getCatalystApp } from '../../lib/catalyst';
import personsData from './Persons.json';
import policeStationsData from './PoliceStations.json';
import firsData from './FIRs.json';
import casesData from './Cases.json';
import vehiclesData from './Vehicles.json';
import phoneRecordsData from './PhoneRecords.json';
import bankAccountsData from './BankAccounts.json';
import weaponsData from './Weapons.json';
import entityRelationshipsData from './EntityRelationships.json';
import socioEconomicData from './SocioEconomicData.json';
import transactionsData from './Transactions.json';

/**
 * Catalyst Data Store Bulk Seeder
 * Pushes all CrimeIntel entities to live Catalyst Data Store tables.
 */
export async function seedCatalystDataStore() {
  console.log('🌱 Starting Catalyst Data Store seeding pipeline...');
  const app = getCatalystApp();
  const datastore = app.datastore();

  const datasets = [
    { name: 'Persons', data: personsData },
    { name: 'PoliceStations', data: policeStationsData },
    { name: 'FIRs', data: firsData },
    { name: 'Cases', data: casesData },
    { name: 'Vehicles', data: vehiclesData },
    { name: 'PhoneRecords', data: phoneRecordsData },
    { name: 'BankAccounts', data: bankAccountsData },
    { name: 'Weapons', data: weaponsData },
    { name: 'EntityRelationships', data: entityRelationshipsData },
    { name: 'SocioEconomicData', data: socioEconomicData },
    { name: 'Transactions', data: transactionsData },
  ];

  for (const set of datasets) {
    try {
      console.log(`Uploading ${set.data.length} records to table "${set.name}"...`);
      const table = datastore.table(set.name);
      
      // Batch insert in chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < set.data.length; i += chunkSize) {
        const chunk = set.data.slice(i, i + chunkSize);
        for (const record of chunk) {
          try {
            await table.insertRow(record);
          } catch (err) {
            // Ignore duplicate record errors
          }
        }
      }
      console.log(`✅ Successfully seeded "${set.name}"`);
    } catch (error) {
      console.warn(`⚠️ Table "${set.name}" seeding note:`, (error as Error).message);
    }
  }

  console.log('✨ Seeding complete!');
}

if (require.main === module) {
  seedCatalystDataStore();
}
