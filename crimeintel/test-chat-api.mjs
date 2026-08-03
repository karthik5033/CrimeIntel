import https from 'https';

const APPSAIL_URL = 'crimeintel-50044146268.development.catalystappsail.in';

const data = JSON.stringify({
  message: "Show me recent theft cases in Bengaluru",
  language: "en",
  sessionId: "test-session-123"
});

const options = {
  hostname: APPSAIL_URL,
  port: 443,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testing Chat API on AppSail...\n');

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log(`📊 Status Code: ${res.statusCode}\n`);
    
    try {
      const response = JSON.parse(responseData);
      console.log('✅ Chat API Response:');
      console.log(JSON.stringify(response, null, 2));
      
      if (response.text_summary) {
        console.log('\n📝 Summary:', response.text_summary.substring(0, 200));
      }
      
      if (response.data_table) {
        console.log(`\n📊 Data Table: ${response.data_table.length} records`);
      }
      
      if (response.error) {
        console.log('\n❌ Error:', response.error);
      }
    } catch (e) {
      console.log('Raw Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(data);
req.end();
