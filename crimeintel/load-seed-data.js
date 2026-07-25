#!/usr/bin/env node

/**
 * Data Loader Script
 * Loads seed JSON data into Catalyst Data Store tables
 * 
 * Usage: node load-seed-data.js
 */

const fs = require('fs');
const path = require('path');

// Load seed data
const firsSeed = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/seed/FIRs.json'), 'utf8'));
const personsSeed = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/seed/Persons.json'), 'utf8'));
const vehiclesSeed = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/seed/Vehicles.json'), 'utf8'));
const relationshipsSeed = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/seed/EntityRelationships.json'), 'utf8'));

console.log('📊 Seed Data Summary:');
console.log(`   - FIRs: ${firsSeed.length}`);
console.log(`   - Persons: ${personsSeed.length}`);
console.log(`   - Vehicles: ${vehiclesSeed.length}`);
console.log(`   - Relationships: ${relationshipsSeed.length}`);
console.log('');

async function loadData() {
  try {
    // Initialize Catalyst SDK
    const catalyst = require('zcatalyst-sdk-node');
    console.log('🔧 Initializing Catalyst SDK...');
    const app = catalyst.initialize();
    console.log('✅ Catalyst SDK initialized');
    
    const datastore = app.datastore();
    
    // Load FIRs
    console.log('\n📝 Loading FIRs...');
    const firsTable = datastore.table('FIRs');
    const batchSize = 100;
    
    for (let i = 0; i < firsSeed.length; i += batchSize) {
      const batch = firsSeed.slice(i, i + batchSize);
      await firsTable.insertRows(batch);
      console.log(`   Loaded ${Math.min(i + batchSize, firsSeed.length)} / ${firsSeed.length} FIRs`);
    }
    console.log('✅ FIRs loaded successfully');
    
    // Load Persons
    console.log('\n👥 Loading Persons...');
    const personsTable = datastore.table('Persons');
    
    for (let i = 0; i < personsSeed.length; i += batchSize) {
      const batch = personsSeed.slice(i, i + batchSize);
      await personsTable.insertRows(batch);
      console.log(`   Loaded ${Math.min(i + batchSize, personsSeed.length)} / ${personsSeed.length} Persons`);
    }
    console.log('✅ Persons loaded successfully');
    
    // Load Vehicles
    console.log('\n🚗 Loading Vehicles...');
    const vehiclesTable = datastore.table('Vehicles');
    
    for (let i = 0; i < vehiclesSeed.length; i += batchSize) {
      const batch = vehiclesSeed.slice(i, i + batchSize);
      await vehiclesTable.insertRows(batch);
      console.log(`   Loaded ${Math.min(i + batchSize, vehiclesSeed.length)} / ${vehiclesSeed.length} Vehicles`);
    }
    console.log('✅ Vehicles loaded successfully');
    
    // Load Entity Relationships
    console.log('\n🔗 Loading Entity Relationships...');
    const relationshipsTable = datastore.table('EntityRelationships');
    
    for (let i = 0; i < relationshipsSeed.length; i += batchSize) {
      const batch = relationshipsSeed.slice(i, i + batchSize);
      await relationshipsTable.insertRows(batch);
      console.log(`   Loaded ${Math.min(i + batchSize, relationshipsSeed.length)} / ${relationshipsSeed.length} Relationships`);
    }
    console.log('✅ Relationships loaded successfully');
    
    console.log('\n🎉 All seed data loaded successfully into Catalyst Data Store!');
    console.log('\n📊 Final Summary:');
    console.log(`   ✓ ${firsSeed.length} FIRs`);
    console.log(`   ✓ ${personsSeed.length} Persons`);
    console.log(`   ✓ ${vehiclesSeed.length} Vehicles`);
    console.log(`   ✓ ${relationshipsSeed.length} Entity Relationships`);
    console.log('\n✅ You can now view the dashboard at http://localhost:3000/dashboard');
    
  } catch (error) {
    console.error('❌ Error loading data:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Make sure you are logged in: catalyst login');
    console.error('   2. Verify tables exist in Catalyst console');
    console.error('   3. Check your network connection');
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the loader
loadData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
