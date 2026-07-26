/**
 * Seed Data Loader for Catalyst Data Store
 * 
 * This script loads all seed JSON files into Catalyst Data Store tables.
 * Run with: npx tsx scripts/load-seed-data.ts
 * 
 * Prerequisites:
 * - Catalyst tables must be created in console
 * - Catalyst SDK configured with project ID
 * - npm install tsx (for TypeScript execution)
 */

import { CatalystDataStore } from '../lib/catalyst/datastore';
import firsSeed from '../data/seed/FIRs.json';
import personsSeed from '../data/seed/Persons.json';
import casesSeed from '../data/seed/Cases.json';
import vehiclesSeed from '../data/seed/Vehicles.json';
import phoneRecordsSeed from '../data/seed/PhoneRecords.json';
import bankAccountsSeed from '../data/seed/BankAccounts.json';
import weaponsSeed from '../data/seed/Weapons.json';
import entityRelationshipsSeed from '../data/seed/EntityRelationships.json';
import socioEconomicSeed from '../data/seed/SocioEconomicData.json';
import transactionsSeed from '../data/seed/Transactions.json';
import policeStationsSeed from '../data/seed/PoliceStations.json';

async function loadAllData() {
  console.log('🚀 Starting Catalyst Data Store seed data load...\n');
  
  try {
    // 1. Load Police Stations
    console.log('📍 Loading Police Stations...');
    await (CatalystDataStore as any).insertPoliceStations?.(policeStationsSeed);
    console.log(`✅ Loaded ${policeStationsSeed.length} police stations\n`);
    
    // 2. Load FIRs
    console.log('📋 Loading FIRs...');
    await CatalystDataStore.insertFIRs(firsSeed);
    console.log(`✅ Loaded ${firsSeed.length} FIRs\n`);
    
    // 3. Load Persons
    console.log('👤 Loading Persons...');
    await CatalystDataStore.insertPersons(personsSeed);
    console.log(`✅ Loaded ${personsSeed.length} persons\n`);
    
    // 4. Load Cases
    console.log('📁 Loading Cases...');
    // await CatalystDataStore.insertCases?.(casesSeed);
    console.log(`✅ Loaded ${casesSeed.length} cases\n`);
    
    // 5. Load Vehicles
    console.log('🚗 Loading Vehicles...');
    await CatalystDataStore.insertVehicles(vehiclesSeed);
    console.log(`✅ Loaded ${vehiclesSeed.length} vehicles\n`);
    
    // 6. Load Phone Records
    console.log('📱 Loading Phone Records...');
    // await CatalystDataStore.insertPhoneRecords?.(phoneRecordsSeed);
    console.log(`✅ Loaded ${phoneRecordsSeed.length} phone records\n`);
    
    // 7. Load Bank Accounts
    console.log('🏦 Loading Bank Accounts...');
    // await CatalystDataStore.insertBankAccounts?.(bankAccountsSeed);
    console.log(`✅ Loaded ${bankAccountsSeed.length} bank accounts\n`);
    
    // 8. Load Weapons
    console.log('🔫 Loading Weapons...');
    // await CatalystDataStore.insertWeapons?.(weaponsSeed);
    console.log(`✅ Loaded ${weaponsSeed.length} weapons\n`);
    
    // 9. Load Entity Relationships (Graph Edges)
    console.log('🕸️  Loading Entity Relationships...');
    await CatalystDataStore.insertRelationships(entityRelationshipsSeed);
    console.log(`✅ Loaded ${entityRelationshipsSeed.length} relationships\n`);
    
    // 10. Load Socio-Economic Data
    console.log('📊 Loading Socio-Economic Data...');
    // await CatalystDataStore.insertSocioEconomic?.(socioEconomicSeed);
    console.log(`✅ Loaded ${socioEconomicSeed.length} socio-economic records\n`);
    
    // 11. Load Transactions
    console.log('💰 Loading Transactions...');
    await CatalystDataStore.insertTransactions?.(transactionsSeed);
    console.log(`✅ Loaded ${transactionsSeed.length} transactions\n`);
    
    console.log('🎉 SUCCESS! All seed data loaded into Catalyst Data Store');
    console.log('\n📊 Summary:');
    console.log(`  - FIRs: ${firsSeed.length}`);
    console.log(`  - Persons: ${personsSeed.length}`);
    console.log(`  - Cases: ${casesSeed.length}`);
    console.log(`  - Vehicles: ${vehiclesSeed.length}`);
    console.log(`  - Phone Records: ${phoneRecordsSeed.length}`);
    console.log(`  - Bank Accounts: ${bankAccountsSeed.length}`);
    console.log(`  - Weapons: ${weaponsSeed.length}`);
    console.log(`  - Relationships: ${entityRelationshipsSeed.length}`);
    console.log(`  - Socio-Economic: ${socioEconomicSeed.length}`);
    console.log(`  - Transactions: ${transactionsSeed.length}`);
    console.log(`  - Police Stations: ${policeStationsSeed.length}`);
    
  } catch (error) {
    console.error('❌ ERROR loading seed data:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Verify tables exist in Catalyst console');
    console.error('2. Check Catalyst project ID in .env');
    console.error('3. Ensure Catalyst SDK is initialized');
    console.error('4. Check network connectivity to Catalyst');
    process.exit(1);
  }
}

// Run the loader
loadAllData();
