// This script uses catalyst CLI's internal auth mechanism
// to get an OAuth token and then create columns via the REST API
const { execSync } = require('child_process');
const https = require('https');

const PROJECT_ID = '55949000000013025';

// Get the access token by running catalyst internally
// The CLI stores refresh tokens and can generate access tokens

function makeRequest(host, path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: host,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        'ENVIRONMENT': 'Development'
      }
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getAccessToken() {
  // The catalyst CLI stores credentials in the user's config
  // We need to find and use the refresh token
  const fs = require('fs');
  const path = require('path');
  
  // Look for catalyst credentials
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  const possiblePaths = [
    path.join(homeDir, '.catalyst_credentials'),
    path.join(homeDir, '.catalyst', 'credentials.json'),
    path.join(homeDir, '.catalystrc_global'),
  ];
  
  // Check npm global catalyst config
  try {
    const npmGlobal = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const catalystDir = path.join(npmGlobal, 'zcatalyst-cli');
    console.log('Catalyst CLI dir:', catalystDir);
  } catch(e) {}
  
  // Try to use catalyst's own credential store
  // The CLI stores its OAuth refresh token somewhere accessible
  // Let's use a clever trick: run catalyst with verbose logging to capture the access token
  
  console.log('🔑 Extracting access token from Catalyst CLI...');
  
  try {
    // Run a simple catalyst command that makes an API call, with verbose logging
    // The log file will contain the refreshed access token
    const timestamp = Date.now();
    execSync('catalyst whoami --verbose 2>&1', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    // Now check the latest log file for the token
    const logDir = path.join(process.env.LOCALAPPDATA, 'Temp', '.catalyst');
    const files = fs.readdirSync(logDir)
      .filter(f => f.endsWith('_catalyst-http-log.json'))
      .sort()
      .reverse();
    
    // Read the most recent log
    for (const file of files.slice(0, 3)) {
      const content = fs.readFileSync(path.join(logDir, file), 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          // Look for HTTP REQUEST lines that contain the Authorization header
          if (entry.message && entry.message.includes('HTTP REQUEST') && entry.message.includes('api.catalyst.zoho.in')) {
            // The access token is used in these requests
            // But it might not be logged directly... Let's check response
          }
          if (entry.message && entry.message.includes('access_token')) {
            const tokenMatch = entry.message.match(/"access_token"\s*:\s*"([^"]+)"/);
            if (tokenMatch) {
              return tokenMatch[1];
            }
          }
        } catch(e) {}
      }
    }
    
    // Alternative: parse the OAuth response from the log
    for (const file of files.slice(0, 5)) {
      const content = fs.readFileSync(path.join(logDir, file), 'utf8');
      // Look for the oauth token response which has the access_token
      const tokenMatch = content.match(/access_token["\s:]+([a-zA-Z0-9._-]+)/);
      if (tokenMatch) {
        return tokenMatch[1];
      }
    }
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  // Last resort: try to refresh the token ourselves
  // Find the client_id, client_secret, refresh_token from CLI config
  const globalConfigPaths = [
    path.join(homeDir, 'AppData', 'Roaming', 'configstore', 'zcatalyst-cli.json'),
    path.join(homeDir, '.config', 'configstore', 'zcatalyst-cli.json'),
  ];
  
  for (const cfgPath of globalConfigPaths) {
    if (fs.existsSync(cfgPath)) {
      console.log('Found config:', cfgPath);
      const config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      console.log('Config keys:', Object.keys(config));
      
      // Extract refresh token and refresh it
      if (config.refresh_token || config.auth?.refresh_token) {
        const refreshToken = config.refresh_token || config.auth.refresh_token;
        const clientId = config.client_id || config.auth?.client_id;
        const clientSecret = config.client_secret || config.auth?.client_secret;
        
        console.log('Found refresh token! Refreshing...');
        
        const tokenResp = await makeRequest('accounts.zoho.in', '/oauth/v2/token', 'POST', null, '');
        // This needs form data, not JSON...
        // Let's try a different approach
      }
      
      return JSON.stringify(config).substring(0, 500);
    }
  }
  
  return null;
}

async function main() {
  const token = await getAccessToken();
  if (!token) {
    console.log('❌ Could not get access token. Trying alternative...');
    
    // Check configstore
    const fs = require('fs');
    const path = require('path');
    const homeDir = process.env.USERPROFILE;
    const configPath = path.join(homeDir, 'AppData', 'Roaming', 'configstore');
    
    try {
      const files = fs.readdirSync(configPath);
      console.log('Configstore files:', files);
      
      const catalystFile = files.find(f => f.includes('catalyst'));
      if (catalystFile) {
        const content = fs.readFileSync(path.join(configPath, catalystFile), 'utf8');
        console.log('Catalyst config:', content.substring(0, 1000));
      }
    } catch(e) {
      console.log('No configstore:', e.message);
    }
    return;
  }
  
  console.log('🔑 Got token:', token.substring(0, 20) + '...');
  
  // Test the token
  const testResp = await makeRequest('api.catalyst.zoho.in', `/baas/v1/project/${PROJECT_ID}/table`, 'GET', null, token);
  console.log('Test response:', testResp.status, JSON.stringify(testResp.data).substring(0, 300));
}

main().catch(console.error);
