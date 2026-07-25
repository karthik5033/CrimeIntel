const https = require('https');

const TOKEN = 'w_1000.25db6c495322a064485d1295b54daccc.e816b33dea3618c3d562caa2abec8cc0';
const PROJECT_ID = '55949000000013025';
const ENV_ID = '60078981781';
const BASE_URL = `console.catalyst.zoho.in`;

// All tables and their columns to create
const tables = [
  {
    table_name: 'Persons',
    columns: [
      { column_name: 'id', data_type: 'varchar', max_length: 255 },
      { column_name: 'name_en', data_type: 'varchar', max_length: 255 },
      { column_name: 'name_kn', data_type: 'varchar', max_length: 500 },
      { column_name: 'age', data_type: 'varchar', max_length: 50 },
      { column_name: 'gender', data_type: 'varchar', max_length: 50 },
      { column_name: 'district_id', data_type: 'varchar', max_length: 255 },
      { column_name: 'risk_score', data_type: 'varchar', max_length: 50 },
      { column_name: 'is_repeat_offender', data_type: 'varchar', max_length: 50 },
    ]
  },
  {
    table_name: 'FIRs',
    columns: [
      { column_name: 'id', data_type: 'varchar', max_length: 255 },
      { column_name: 'fir_no', data_type: 'varchar', max_length: 255 },
      { column_name: 'case_no', data_type: 'varchar', max_length: 255 },
      { column_name: 'crime_type_id', data_type: 'varchar', max_length: 255 },
      { column_name: 'crime_type_en', data_type: 'varchar', max_length: 500 },
      { column_name: 'crime_type_kn', data_type: 'varchar', max_length: 500 },
      { column_name: 'police_station_id', data_type: 'varchar', max_length: 255 },
      { column_name: 'district_id', data_type: 'varchar', max_length: 255 },
      { column_name: 'date', data_type: 'varchar', max_length: 255 },
      { column_name: 'status_en', data_type: 'varchar', max_length: 255 },
      { column_name: 'description', data_type: 'text', max_length: 2000 },
      { column_name: 'lat', data_type: 'varchar', max_length: 100 },
      { column_name: 'lng', data_type: 'varchar', max_length: 100 },
    ]
  },
  {
    table_name: 'Cases',
    columns: [
      { column_name: 'id', data_type: 'varchar', max_length: 255 },
      { column_name: 'case_no', data_type: 'varchar', max_length: 255 },
      { column_name: 'status', data_type: 'varchar', max_length: 255 },
      { column_name: 'firs', data_type: 'text', max_length: 2000 },
      { column_name: 'summary_en', data_type: 'text', max_length: 2000 },
      { column_name: 'primary_crime_type', data_type: 'varchar', max_length: 255 },
      { column_name: 'latest_date', data_type: 'varchar', max_length: 255 },
    ]
  },
  {
    table_name: 'PoliceStations',
    columns: [
      { column_name: 'id', data_type: 'varchar', max_length: 255 },
      { column_name: 'name_en', data_type: 'varchar', max_length: 500 },
      { column_name: 'district_id', data_type: 'varchar', max_length: 255 },
      { column_name: 'lat', data_type: 'varchar', max_length: 100 },
      { column_name: 'lng', data_type: 'varchar', max_length: 100 },
    ]
  },
  {
    table_name: 'Vehicles',
    columns: [
      { column_name: 'id', data_type: 'varchar', max_length: 255 },
      { column_name: 'license_plate', data_type: 'varchar', max_length: 255 },
      { column_name: 'make', data_type: 'varchar', max_length: 255 },
      { column_name: 'model', data_type: 'varchar', max_length: 255 },
      { column_name: 'color', data_type: 'varchar', max_length: 100 },
    ]
  },
  {
    table_name: 'PhoneRecords',
    columns: [
      { column_name: 'id', data_type: 'varchar', max_length: 255 },
      { column_name: 'number', data_type: 'varchar', max_length: 255 },
      { column_name: 'provider', data_type: 'varchar', max_length: 255 },
    ]
  },
  {
    table_name: 'BankAccounts',
    columns: [
      { column_name: 'id', data_type: 'varchar', max_length: 255 },
      { column_name: 'account_no', data_type: 'varchar', max_length: 255 },
      { column_name: 'bank_name', data_type: 'varchar', max_length: 255 },
      { column_name: 'ifsc', data_type: 'varchar', max_length: 100 },
    ]
  },
  {
    table_name: 'Weapons',
    columns: [
      { column_name: 'id', data_type: 'varchar', max_length: 255 },
      { column_name: 'type', data_type: 'varchar', max_length: 255 },
      { column_name: 'description', data_type: 'text', max_length: 2000 },
    ]
  },
  {
    table_name: 'Transactions',
    columns: [
      { column_name: 'id', data_type: 'varchar', max_length: 255 },
      { column_name: 'from_account_id', data_type: 'varchar', max_length: 255 },
      { column_name: 'to_account_id', data_type: 'varchar', max_length: 255 },
      { column_name: 'amount', data_type: 'varchar', max_length: 100 },
      { column_name: 'timestamp', data_type: 'varchar', max_length: 255 },
      { column_name: 'type', data_type: 'varchar', max_length: 255 },
      { column_name: 'description', data_type: 'text', max_length: 2000 },
      { column_name: 'flagged', data_type: 'varchar', max_length: 50 },
      { column_name: 'pattern', data_type: 'varchar', max_length: 255 },
    ]
  },
  {
    table_name: 'EntityRelationships',
    columns: [
      { column_name: 'id', data_type: 'varchar', max_length: 255 },
      { column_name: 'source', data_type: 'varchar', max_length: 255 },
      { column_name: 'target', data_type: 'varchar', max_length: 255 },
      { column_name: 'type', data_type: 'varchar', max_length: 255 },
      { column_name: 'description', data_type: 'text', max_length: 2000 },
    ]
  }
];

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: BASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Catalyst ${TOKEN}`,
        'Content-Type': 'application/json',
        'Environment': ENV_ID,
      }
    };
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    req.on('error', (e) => reject(e));
    if (data) req.write(data);
    req.end();
  });
}

async function createTable(tableName) {
  const path = `/baas/${ENV_ID}/project/${PROJECT_ID}/Development/cloudscale/datastore/table`;
  const body = { table_name: tableName };
  const result = await makeRequest('POST', path, body);
  return result;
}

async function createColumn(tableId, col) {
  const path = `/baas/${ENV_ID}/project/${PROJECT_ID}/Development/cloudscale/datastore/table/${tableId}/column`;
  const body = {
    column_name: col.column_name,
    data_type: col.data_type === 'text' ? 'text' : 'varchar',
    max_length: col.max_length || 255,
    is_mandatory: false,
    is_unique: false,
  };
  const result = await makeRequest('POST', path, body);
  return result;
}

async function main() {
  console.log('🚀 Starting table creation via Catalyst REST API...\n');
  
  for (const table of tables) {
    process.stdout.write(`Creating table "${table.table_name}"... `);
    const tableResult = await createTable(table.table_name);
    
    if (tableResult.status === 200 || tableResult.status === 201) {
      const tableId = tableResult.data?.data?.table_id || tableResult.data?.table_id;
      console.log(`✅ Created (ID: ${tableId})`);
      
      if (tableId) {
        for (const col of table.columns) {
          process.stdout.write(`  Adding column "${col.column_name}"... `);
          const colResult = await createColumn(tableId, col);
          if (colResult.status === 200 || colResult.status === 201) {
            console.log('✅');
          } else {
            console.log(`❌ ${colResult.status} - ${JSON.stringify(colResult.data).substring(0, 200)}`);
          }
        }
      }
    } else {
      console.log(`❌ ${tableResult.status} - ${JSON.stringify(tableResult.data).substring(0, 300)}`);
    }
    console.log('');
  }
  
  console.log('🎉 Done! All tables created.');
}

main().catch(console.error);
