/**
 * Test Direct API Upload
 * Quick test to verify OAuth credentials work with Catalyst API
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');
const path = require('path');

const OAUTH_TOKEN_URL = 'https://accounts.zoho.in/oauth/v2/token';

async function testDirectAPI() {
  console.log('\n🔍 Testing Direct Catalyst API...\n');
  
  const clientId = process.env.CATALYST_CLIENT_ID;
  const clientSecret = process.env.CATALYST_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log('❌ Credentials missing from .env.local\n');
    process.exit(1);
  }
  
  console.log('✅ Credentials found');
  console.log('  Client ID:', clientId);
  console.log('  Client Secret:', clientSecret.substring(0, 10) + '...\n');
  
  // Step 1: Generate access token
  console.log('🔑 Generating access token...');
  
  const tokenData = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: 'ZohoCatalyst.projects.ALL ZohoCatalyst.filestore.CREATE ZohoCatalyst.datastore.CREATE'
  }).toString();
  
  const tokenOptions = {
    hostname: 'accounts.zoho.in',
    port: 443,
    path: '/oauth/v2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': tokenData.length
    }
  };
  
  const token = await new Promise((resolve, reject) => {
    const req = https.request(tokenOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.access_token) {
            console.log('✅ Access token generated!');
            console.log('  Token:', response.access_token.substring(0, 20) + '...');
            console.log('  Expires in:', response.expires_in, 'seconds\n');
            resolve(response.access_token);
          } else {
            console.log('❌ Token error:', response.error);
            console.log('  Description:', response.error_description || 'None');
            reject(new Error(response.error));
          }
        } catch (err) {
          console.log('❌ Parse error:', data);
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(tokenData);
    req.end();
  });
  
  // Step 2: Test file upload API
  console.log('📤 Testing file upload to Stratus...');
  const projectId = process.env.CATALYST_PROJECT_ID || '55949000000013025';
  const bucketName = 'firdocuments';
  
  // Create a test text file
  const testContent = `Test FIR Document
Created: ${new Date().toISOString()}
This is a test upload using Direct Catalyst API
Client ID: ${clientId}
`;
  
  const FormData = require('form-data');
  const form = new FormData();
  form.append('code', 'test-upload.txt');
  form.append('file', Buffer.from(testContent), {
    filename: 'test-upload.txt',
    contentType: 'text/plain'
  });
  
  const uploadUrl = `https://api.catalyst.zoho.in/baas/v1/project/${projectId}/folder/${bucketName}/file`;
  
  console.log('  Upload URL:', uploadUrl);
  console.log('  Bucket:', bucketName);
  console.log('  File:', 'test-upload.txt\n');
  
  const uploadResult = await new Promise((resolve, reject) => {
    const req = https.request(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        ...form.getHeaders()
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('📡 Response status:', res.statusCode);
        console.log('📡 Response:', data.substring(0, 200));
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const result = JSON.parse(data);
            console.log('\n✅ FILE UPLOADED TO REAL STRATUS!');
            console.log('  File ID:', result.data.file_id || result.data.id);
            console.log('  File Name:', result.data.file_name);
            console.log('  Status:', result.status);
            resolve(result);
          } catch (err) {
            console.log('✅ Upload successful (raw response):', data);
            resolve(data);
          }
        } else {
          console.log('❌ Upload failed:', data);
          reject(new Error(`Upload failed: ${res.statusCode}`));
        }
      });
    });
    req.on('error', (err) => {
      console.log('❌ Request error:', err.message);
      reject(err);
    });
    form.pipe(req);
  });
  
  console.log('\n✅ ALL TESTS PASSED!');
  console.log('\n🎉 Direct API is working! Your uploads will go to REAL Stratus!\n');
}

testDirectAPI().catch(error => {
  console.error('\n💥 Test failed:', error.message);
  process.exit(1);
});
