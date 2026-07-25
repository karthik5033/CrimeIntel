const https = require('https');

const TOKEN = 'w_1000.25db6c495322a064485d1295b54daccc.e816b33dea3618c3d562caa2abec8cc0';
const PROJECT_ID = '55949000000013025';

// Try different API hosts and paths
const attempts = [
  { host: 'api.catalyst.zoho.in', path: `/baas/v1/project/${PROJECT_ID}/table` },
  { host: 'api.catalyst.zoho.in', path: `/baas/v1/${PROJECT_ID}/table` },
  { host: 'console.catalyst.zoho.in', path: `/baas/60078981781/project/${PROJECT_ID}/Development/cloudscale/datastore/table` },
  { host: 'console.catalyst.zoho.in', path: `/baas/60078981781/project/${PROJECT_ID}/cloudscale/datastore/table` },
  { host: 'api.catalyst.zoho.in', path: `/baas/v1/project/${PROJECT_ID}/datastore/table` },
];

function makeRequest(host, path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: host,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Catalyst ${token}`,
        'Content-Type': 'application/json',
      }
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔍 Testing API endpoints to find the correct one...\n');
  
  for (const attempt of attempts) {
    console.log(`GET https://${attempt.host}${attempt.path}`);
    const result = await makeRequest(attempt.host, attempt.path, 'GET', null, TOKEN);
    console.log(`  Status: ${result.status}`);
    console.log(`  Response: ${JSON.stringify(result.data).substring(0, 300)}`);
    
    if (result.status === 200 && result.data?.data) {
      console.log('\n✅ FOUND WORKING ENDPOINT!');
      console.log(`Host: ${attempt.host}`);
      console.log(`Path: ${attempt.path}`);
      
      // List tables
      const tables = result.data.data;
      for (const t of tables) {
        console.log(`  Table: ${t.table_name} (ID: ${t.table_id})`);
      }
      
      // Now try creating a column
      const testTable = tables.find(t => t.table_name === 'Persons');
      if (testTable) {
        console.log(`\n🔧 Testing column creation on Persons (${testTable.table_id})...`);
        const colPath = `${attempt.path}/${testTable.table_id}/column`;
        const colResult = await makeRequest(attempt.host, colPath, 'POST', {
          column_name: 'test_api_col',
          data_type: 'text'
        }, TOKEN);
        console.log(`  Column creation status: ${colResult.status}`);
        console.log(`  Response: ${JSON.stringify(colResult.data).substring(0, 300)}`);
        
        if (colResult.status === 200 || colResult.status === 201) {
          console.log('\n🎉 COLUMN CREATION WORKS! Creating all columns now...');
          
          const tableColumns = {
            'Persons': ['id','name_en','name_kn','age','gender','district_id','risk_score','is_repeat_offender'],
            'FIRs': ['id','fir_no','case_no','crime_type_id','crime_type_en','crime_type_kn','police_station_id','district_id','date','status_en','description','lat','lng'],
            'Cases': ['id','case_no','status','firs','summary_en','primary_crime_type','latest_date'],
            'PoliceStations': ['id','name_en','district_id','lat','lng'],
            'Vehicles': ['id','license_plate','make','model','color'],
            'PhoneRecords': ['id','number','provider'],
            'BankAccounts': ['id','account_no','bank_name','ifsc'],
            'Weapons': ['id','type','description'],
            'Transactions': ['id','from_account_id','to_account_id','amount','timestamp','type','description','flagged','pattern'],
            'EntityRelationships': ['id','source','target','type','description']
          };
          
          for (const table of tables) {
            const cols = tableColumns[table.table_name];
            if (!cols) continue;
            
            console.log(`\n📋 ${table.table_name} (${table.table_id})`);
            for (const col of cols) {
              const cPath = `${attempt.path}/${table.table_id}/column`;
              const cResult = await makeRequest(attempt.host, cPath, 'POST', {
                column_name: col,
                data_type: 'text',
                is_mandatory: false,
                is_unique: false
              }, TOKEN);
              if (cResult.status === 200 || cResult.status === 201) {
                console.log(`  ✅ ${col}`);
              } else {
                console.log(`  ❌ ${col} (${cResult.status}): ${JSON.stringify(cResult.data).substring(0, 150)}`);
              }
            }
          }
          console.log('\n🎉 ALL DONE!');
        }
      }
      return;
    }
    console.log('');
  }
  
  console.log('\n❌ No working endpoint found.');
}

main().catch(console.error);
