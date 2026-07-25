// PASTE THIS IN YOUR BRAVE BROWSER CONSOLE (F12 -> Console tab)
// while on the Catalyst Data Store page
// This script adds columns to the tables that were already created

(async () => {
  // First, get list of all tables to find their IDs
  const basePath = '/baas/60078981781/project/55949000000013025';
  
  // Try to list tables first
  console.log('📋 Fetching existing tables...');
  const listResp = await fetch(basePath + '/datastore/table', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  const listData = await listResp.json();
  console.log('Tables response:', listData);
  
  // Extract table info
  const existingTables = {};
  if (listData.data) {
    for (const t of listData.data) {
      existingTables[t.table_name] = t.table_id;
      console.log(`  Found: ${t.table_name} (ID: ${t.table_id})`);
    }
  }

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

  // Try multiple API path formats for column creation
  const pathFormats = [
    (tid) => `${basePath}/datastore/table/${tid}/column`,
    (tid) => `${basePath}/datastore/tables/${tid}/column`,
    (tid) => `${basePath}/datastore/table/${tid}/columns`,
    (tid) => `/baas/v1/project/55949000000013025/table/${tid}/column`,
  ];

  // Test with first table's first column to find the right path
  const testTableName = Object.keys(tableColumns).find(name => existingTables[name]);
  if (!testTableName) {
    console.error('❌ No tables found!');
    return;
  }
  const testTid = existingTables[testTableName];
  
  let workingPath = null;
  for (const pathFn of pathFormats) {
    const testPath = pathFn(testTid);
    console.log(`🔍 Testing path: ${testPath}`);
    const testResp = await fetch(testPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ column_name: 'test_col_probe', data_type: 'text' })
    });
    console.log(`  Status: ${testResp.status}`);
    if (testResp.status === 200 || testResp.status === 201) {
      workingPath = pathFn;
      console.log(`✅ Found working path format!`);
      // Delete the test column if possible
      break;
    }
    const errData = await testResp.json();
    console.log(`  Response:`, errData);
  }

  if (!workingPath) {
    // Try intercepting the UI's network request
    console.log('⚠️ No API path worked. Trying alternative approach...');
    // Try using the full URL path from the page
    const pageUrl = window.location.pathname;
    console.log('Page URL path:', pageUrl);
    
    // Try with page's base path
    const altPath = (tid) => `${pageUrl.split('#')[0]}datastore/table/${tid}/column`;
    const altResp = await fetch(altPath(testTid), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ column_name: 'test_col_probe2', data_type: 'text' })
    });
    console.log('Alt path status:', altResp.status);
    if (altResp.status === 200 || altResp.status === 201) {
      workingPath = altPath;
    }
  }

  if (!workingPath) {
    console.error('❌ Could not find working API path for column creation.');
    console.log('Please try clicking "+ New Column" manually for one table and check the Network tab for the correct API endpoint.');
    return;
  }

  // Now create all columns
  const results = {};
  for (const [tableName, columns] of Object.entries(tableColumns)) {
    const tid = existingTables[tableName];
    if (!tid) {
      results[tableName] = 'TABLE_NOT_FOUND';
      continue;
    }
    
    console.log(`\n📋 Adding columns to ${tableName} (${tid})`);
    let success = 0;
    for (const col of columns) {
      const resp = await fetch(workingPath(tid), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ column_name: col, data_type: 'text' })
      });
      if (resp.status === 200 || resp.status === 201) {
        console.log(`  ✅ ${col}`);
        success++;
      } else {
        const err = await resp.json();
        console.log(`  ❌ ${col}:`, err);
      }
    }
    results[tableName] = `${success}/${columns.length}`;
  }

  console.log('\n🎉 Results:', results);
  document.title = 'COLUMNS:' + JSON.stringify(results);
  alert('Column creation complete! Check console for details.');
})();
