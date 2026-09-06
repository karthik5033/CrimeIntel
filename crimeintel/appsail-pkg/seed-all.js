require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
async function getSharedAccessToken() {
  const clientId = process.env.CATALYST_CLIENT_ID;
  const clientSecret = process.env.CATALYST_CLIENT_SECRET;
  const refreshToken = process.env.CATALYST_REFRESH_TOKEN;
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });
  
  const res = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    body: params
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("No token returned");
  return data.access_token;
}

async function seed() {
  try {
    const catalyst = require('zcatalyst-sdk-node');
    
    // Auth
    console.log('Authenticating...');
    let app;
    if (process.env.CATALYST_CLIENT_ID) {
      const token = await getSharedAccessToken();
      app = catalyst.initialize({
        type: 'token',
        token: token,
        project_id: process.env.CATALYST_PROJECT_ID,
        environment: process.env.CATALYST_ENV || 'Development'
      });
    } else {
      app = catalyst.initialize();
    }
    
    const datastore = app.datastore();
    const seedDir = path.join(__dirname, 'data/seed');
    const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const tableName = file.replace('.json', '');
      const filePath = path.join(seedDir, file);
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (!Array.isArray(data) || data.length === 0) continue;
      
      const table = datastore.table(tableName);
      let inserted = 0;
      const batchSize = 100;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await table.insertRows(batch);
        inserted += batch.length;
        console.log(`[Seed] Inserted ${inserted}/${data.length} into ${tableName}`);
      }
    }
    console.log('Done!');
  } catch(e) {
    console.error('Error:', e);
  }
}

seed();
