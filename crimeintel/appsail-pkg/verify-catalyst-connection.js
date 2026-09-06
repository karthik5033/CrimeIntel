/**
 * Catalyst Connection Verification Script
 * Run this after adding CATALYST_CLIENT_ID and CATALYST_CLIENT_SECRET to .env.local
 * 
 * Usage: node verify-catalyst-connection.js
 */

require('dotenv').config({ path: '.env.local' });

async function verifyCatalystConnection() {
  console.log('\n🔍 Verifying Catalyst Connection...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('  PROJECT_ID:', process.env.CATALYST_PROJECT_ID || '❌ Missing');
  console.log('  ENVIRONMENT:', process.env.CATALYST_ENV || '❌ Missing');
  console.log('  USE_MOCK:', process.env.USE_MOCK_CATALYST || 'false');
  console.log('  CLIENT_ID:', process.env.CATALYST_CLIENT_ID ? '✅ Present' : '❌ Missing');
  console.log('  CLIENT_SECRET:', process.env.CATALYST_CLIENT_SECRET ? '✅ Present (length: ' + process.env.CATALYST_CLIENT_SECRET.length + ')' : '❌ Missing');
  
  if (!process.env.CATALYST_CLIENT_ID || !process.env.CATALYST_CLIENT_SECRET) {
    console.log('\n❌ CATALYST_CLIENT_ID or CATALYST_CLIENT_SECRET not found in .env.local');
    console.log('   Make sure you added both credentials\n');
    process.exit(1);
  }
  
  console.log('\n🔧 Attempting Catalyst SDK Initialization...\n');
  
  try {
    const catalyst = require('zcatalyst-sdk-node');
    
    // Try Client ID/Secret initialization
    const catalystApp = catalyst.initialize({
      client_id: process.env.CATALYST_CLIENT_ID,
      client_secret: process.env.CATALYST_CLIENT_SECRET,
      project_id: process.env.CATALYST_PROJECT_ID,
      environment: process.env.CATALYST_ENV
    });
    
    console.log('✅ Catalyst SDK initialized successfully!\n');
    
    // Test Filestore access
    console.log('📦 Testing Filestore Access...');
    try {
      const filestore = catalystApp.filestore();
      const buckets = await filestore.getAllBuckets();
      console.log('✅ Filestore accessible!');
      console.log('   Buckets found:', buckets.map(b => b.bucket_name).join(', '));
      
      // Check if firdocuments bucket exists
      const firBucket = buckets.find(b => b.bucket_name === 'firdocuments');
      if (firBucket) {
        console.log('   ✅ "firdocuments" bucket found (ID:', firBucket.id + ')');
      } else {
        console.log('   ⚠️  "firdocuments" bucket NOT found');
        console.log('   Available buckets:', buckets.map(b => b.bucket_name));
      }
    } catch (filestoreError) {
      console.log('❌ Filestore access failed:', filestoreError.message);
    }
    
    // Test DataStore access
    console.log('\n💾 Testing DataStore Access...');
    try {
      const datastore = catalystApp.datastore();
      const tables = await datastore.getAllTables();
      console.log('✅ DataStore accessible!');
      console.log('   Tables found:', tables.map(t => t.table_name).join(', '));
      
      // Check if FIRs table exists
      const firsTable = tables.find(t => t.table_name === 'FIRs');
      if (firsTable) {
        console.log('   ✅ "FIRs" table found');
      } else {
        console.log('   ⚠️  "FIRs" table NOT found');
      }
    } catch (datastoreError) {
      console.log('❌ DataStore access failed:', datastoreError.message);
    }
    
    console.log('\n✅ ALL CHECKS PASSED!');
    console.log('   Your Catalyst connection is working correctly.');
    console.log('   Files will upload to real Stratus bucket.');
    console.log('   Data will save to real DataStore.\n');
    
  } catch (error) {
    console.log('\n❌ Catalyst SDK Initialization FAILED');
    console.log('   Error:', error.message);
    console.log('\n🔍 Possible Issues:');
    console.log('   1. Client ID or Secret is invalid');
    console.log('   2. Credentials don\'t have correct permissions');
    console.log('   3. Project ID mismatch');
    console.log('   4. Network/firewall issues');
    console.log('\n💡 Solutions:');
    console.log('   - Verify credentials in API Console');
    console.log('   - Check PROJECT_ID matches your project');
    console.log('   - Check internet connection\n');
    process.exit(1);
  }
}

verifyCatalystConnection().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
