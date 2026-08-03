/**
 * Test script to verify Stratus upload with OAuth credentials
 */

import fs from 'fs';

const CLIENT_ID = '1000.GFPQ50BD1CPNJPXG4WYEI4P5SRRACL';
const CLIENT_SECRET = '8e510f56499febdaabfb1580153bd39649f5afccb7';
const PROJECT_ID = '55949000000013025';
const BUCKET_NAME = 'firdocuments';

async function getAccessToken() {
  console.log('🔑 Getting OAuth access token...');
  
  // Try method 1: client_credentials
  try {
    console.log('Trying client_credentials grant...');
    const params1 = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'ZohoCatalyst.filestore.ALL'
    });

    const response1 = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params1.toString()
    });

    const data1 = await response1.json();
    
    if (response1.ok && data1.access_token) {
      console.log('✅ Access token received via client_credentials');
      console.log('Token expires in:', data1.expires_in, 'seconds');
      return data1.access_token;
    }
    
    console.log('❌ client_credentials failed:', data1);
  } catch (e) {
    console.log('❌ client_credentials error:', e.message);
  }

  // Try method 2: Direct token endpoint
  try {
    console.log('\nTrying direct self-client authentication...');
    const params2 = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'ZohoCatalyst.filestore.ALL'
    });

    const response2 = await fetch('https://accounts.zoho.in/oauth/v2/auth/token/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params2.toString()
    });

    const data2 = await response2.json();
    
    if (response2.ok && data2.access_token) {
      console.log('✅ Access token received via direct auth');
      return data2.access_token;
    }
    
    console.log('❌ Direct auth failed:', data2);
  } catch (e) {
    console.log('❌ Direct auth error:', e.message);
  }

  throw new Error('All OAuth methods failed. Check API Console settings.');
}

async function uploadTestFile(token) {
  console.log('\n📤 Testing file upload to Stratus...');
  
  // Create a test PDF content
  const testContent = `%PDF-1.4
Test FIR Upload PDF`;

  // Write to temp file
  const testFile = './test-upload.pdf';
  fs.writeFileSync(testFile, testContent);
  
  console.log('📝 Created test PDF file');
  
  // Create form data
  const form = new FormData();
  const fileBuffer = fs.readFileSync(testFile);
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  form.append('code', 'test-fir-upload.pdf');
  form.append('file', blob, 'test-fir-upload.pdf');

  const uploadUrl = `https://api.catalyst.zoho.in/baas/v1/project/${PROJECT_ID}/folder/${BUCKET_NAME}/file`;
  
  console.log('🌐 Upload URL:', uploadUrl);
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`
    },
    body: form
  });

  const result = await response.json();
  
  // Clean up test file
  fs.unlinkSync(testFile);
  
  if (!response.ok) {
    console.error('❌ Upload failed:', result);
    throw new Error(`Upload failed: ${JSON.stringify(result)}`);
  }

  console.log('✅ Upload successful!');
  console.log('File ID:', result.data?.file_id || result.data?.id);
  console.log('File URL:', result.data?.file_url);
  
  return result.data;
}

async function main() {
  try {
    console.log('🚀 Testing Catalyst Stratus Upload\n');
    console.log('Project ID:', PROJECT_ID);
    console.log('Bucket:', BUCKET_NAME);
    console.log('---\n');
    
    const token = await getAccessToken();
    const uploadResult = await uploadTestFile(token);
    
    console.log('\n✅ TEST PASSED!');
    console.log('Your Stratus bucket is working correctly!');
    console.log('\nNext step: Check Catalyst Console → Stratus → firdocuments bucket');
    console.log('You should see: test-fir-upload.pdf');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify OAuth credentials are correct');
    console.error('2. Check if bucket "firdocuments" exists');
    console.error('3. Verify project ID is correct');
    process.exit(1);
  }
}

main();
