/**
 * Generate Catalyst Access Token from Client ID/Secret
 * This converts your OAuth credentials into an access token
 * 
 * Usage: node generate-access-token.js
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const querystring = require('querystring');

async function generateAccessToken() {
  console.log('\n🔑 Generating Catalyst Access Token...\n');
  
  const clientId = process.env.CATALYST_CLIENT_ID;
  const clientSecret = process.env.CATALYST_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log('❌ CLIENT_ID or CLIENT_SECRET missing from .env.local\n');
    process.exit(1);
  }
  
  console.log('📋 Using credentials:');
  console.log('  Client ID:', clientId);
  console.log('  Client Secret:', clientSecret.substring(0, 10) + '...\n');
  
  // OAuth token endpoint for Zoho
  const tokenData = querystring.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: 'ZohoCatalyst.projects.ALL'
  });
  
  const options = {
    hostname: 'accounts.zoho.in',
    port: 443,
    path: '/oauth/v2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': tokenData.length
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📡 Response received\n');
        
        try {
          const response = JSON.parse(data);
          
          if (response.access_token) {
            console.log('✅ Access Token Generated Successfully!\n');
            console.log('───────────────────────────────────────────────────');
            console.log('Add this to your .env.local file:');
            console.log('───────────────────────────────────────────────────\n');
            console.log(`CATALYST_TOKEN=${response.access_token}\n`);
            console.log('───────────────────────────────────────────────────\n');
            console.log('Token expires in:', response.expires_in, 'seconds');
            console.log('Token type:', response.api_domain);
            console.log('\n✅ Copy the line above and add it to .env.local\n');
            resolve(response.access_token);
          } else if (response.error) {
            console.log('❌ Error generating token:', response.error);
            console.log('   Description:', response.error_description || 'No description');
            console.log('\n🔍 Common Issues:');
            console.log('   - Client ID/Secret might be invalid');
            console.log('   - Credentials might not have Catalyst scope');
            console.log('   - Project might be deleted or suspended\n');
            reject(new Error(response.error));
          } else {
            console.log('❌ Unexpected response:', data);
            reject(new Error('Unexpected response format'));
          }
        } catch (err) {
          console.log('❌ Failed to parse response:', data);
          reject(err);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Request failed:', err.message);
      reject(err);
    });
    
    req.write(tokenData);
    req.end();
  });
}

generateAccessToken().catch(error => {
  console.error('\n💥 Failed to generate token');
  process.exit(1);
});
