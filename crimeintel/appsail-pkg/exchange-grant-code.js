/**
 * Exchange Zoho Self-Client Authorization Code for a permanent Refresh Token
 * 
 * Usage:
 *   node exchange-grant-code.js <YOUR_GRANT_CODE>
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const code = process.argv[2];

if (!code) {
  console.log('\n❌ Please provide the Grant Code / Authorization Code from Zoho API Console.');
  console.log('Usage: node exchange-grant-code.js <GRANT_CODE>\n');
  process.exit(1);
}

const clientId = process.env.CATALYST_CLIENT_ID;
const clientSecret = process.env.CATALYST_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.log('❌ CATALYST_CLIENT_ID or CATALYST_CLIENT_SECRET missing in .env.local\n');
  process.exit(1);
}

async function exchangeCode() {
  console.log('\n🔄 Exchanging Authorization Code for Refresh Token via Zoho Accounts (.in)...');
  console.log('  Client ID:', clientId);
  
  const tokenUrl = 'https://accounts.zoho.in/oauth/v2/token';
  const params = new URLSearchParams({
    code: code.trim(),
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    grant_type: 'authorization_code'
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await response.json();

    if (data.error) {
      console.error('\n❌ Zoho OAuth Error:', data.error);
      if (data.error === 'invalid_code') {
        console.error('👉 The grant code might have expired (they are valid for only 2-5 minutes) or was already used.');
      } else if (data.error === 'invalid_client') {
        console.error('👉 Client ID or Client Secret is incorrect in .env.local.');
      }
      process.exit(1);
    }

    if (!data.refresh_token) {
      console.error('\n⚠️ No refresh_token returned in response:', data);
      console.log('Ensure you generated the code with scope "ZohoCatalyst.projects.ALL" and offline access.');
      process.exit(1);
    }

    console.log('\n✅ Refresh Token Generated Successfully!');
    console.log('----------------------------------------------------');
    console.log('Refresh Token:', data.refresh_token);
    console.log('Access Token:', data.access_token);
    console.log('Expires In:', data.expires_in, 'seconds');
    console.log('----------------------------------------------------');

    // Automatically update .env.local
    const envPath = path.join(__dirname, '.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');

    if (envContent.includes('CATALYST_REFRESH_TOKEN=')) {
      envContent = envContent.replace(/CATALYST_REFRESH_TOKEN=.*/g, `CATALYST_REFRESH_TOKEN=${data.refresh_token}`);
      envContent = envContent.replace(/#\s*CATALYST_REFRESH_TOKEN=.*/g, `CATALYST_REFRESH_TOKEN=${data.refresh_token}`);
    } else {
      envContent += `\nCATALYST_REFRESH_TOKEN=${data.refresh_token}\n`;
    }

    // Set USE_MOCK_CATALYST to false
    envContent = envContent.replace(/USE_MOCK_CATALYST=true/g, 'USE_MOCK_CATALYST=false');

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('💾 Updated .env.local automatically:');
    console.log('   - CATALYST_REFRESH_TOKEN set');
    console.log('   - USE_MOCK_CATALYST set to false\n');

  } catch (err) {
    console.error('❌ Request failed:', err.message);
    process.exit(1);
  }
}

exchangeCode();
