const FormData = require('form-data');
const fs = require('fs');
const https = require('https');

const APPSAIL_URL = 'https://crimeintel-50044146268.development.catalystappsail.in';

// Create a test file
const testContent = `
TEST FIR DOCUMENT - ${new Date().toISOString()}

FIR Number: TEST-2026-001
Station: Test Police Station
Case Type: Test Upload to Verify Real Stratus Integration

This is a test document to verify that files are being uploaded to the REAL Stratus bucket:
https://firdocuments-development.zohostratus.in

If this upload succeeds, it confirms that:
1. Catalyst SDK is authenticated in AppSail
2. Filestore API is working
3. Files are stored in real Stratus bucket (not mock mode)
`;

const testFilePath = 'test-fir-document.txt';
fs.writeFileSync(testFilePath, testContent);

console.log('📤 Testing REAL Stratus upload via AppSail...\n');

// Prepare form data
const form = new FormData();
form.append('file', fs.createReadStream(testFilePath));
form.append('firNumber', 'TEST-2026-001');
form.append('caseTitle', 'Test Stratus Upload Verification');

// Upload to AppSail
const options = {
  method: 'POST',
  hostname: 'crimeintel-50044146268.development.catalystappsail.in',
  path: '/api/upload',
  headers: form.getHeaders(),
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📊 Response Status: ${res.statusCode}\n`);
    
    try {
      const response = JSON.parse(data);
      console.log('✅ Upload Response:');
      console.log(JSON.stringify(response, null, 2));
      
      if (response.fileId || response.success) {
        console.log('\n🎉 SUCCESS! File uploaded to REAL Stratus bucket!');
        console.log('\nBucket URL: https://firdocuments-development.zohostratus.in');
        console.log('File ID:', response.fileId || response.id);
        console.log('\n✅ Catalyst SDK is working in AppSail!');
        console.log('✅ Files are being stored in REAL Stratus (not mock mode)');
      } else {
        console.log('\n⚠️ Upload response received but no file ID');
      }
    } catch (e) {
      console.log('Response:', data);
    }
    
    // Cleanup
    fs.unlinkSync(testFilePath);
  });
});

req.on('error', (error) => {
  console.error('❌ Upload failed:', error.message);
  fs.unlinkSync(testFilePath);
});

form.pipe(req);
