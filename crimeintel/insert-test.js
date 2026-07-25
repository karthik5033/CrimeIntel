// PASTE THIS IN YOUR BRAVE CONSOLE (F12 -> Console)
// This script will automatically insert all the seed data into your tables!

(async () => {
  const projectId = '55949000000013025';
  const apiBase = `https://console.catalyst.zoho.in/baas/v1/project/${projectId}`;
  
  // We need the data from the seed files. Since we can't easily read local files from 
  // the browser console, we'll fetch them from the local dev server!
  // Assuming the Next.js app is running on localhost:3000
  console.log('🚀 Starting Data Insertion...');
  
  // 1. First get all the tables so we have their IDs
  console.log('Fetching table list...');
  const tableResp = await fetch(`${apiBase}/table`, { credentials: 'include' });
  const tableData = await tableResp.json();
  
  if (!tableData.data) {
    alert('Failed to get tables list. Are you logged in?');
    return;
  }

  const tables = {};
  for (const t of tableData.data) {
    tables[t.table_name] = t.table_id || t.id;
  }
  
  console.log('✅ Tables found:', Object.keys(tables).join(', '));
  
  // 2. Define our tables and their endpoints for the data
  // Since we are in the browser, we need the actual data. 
  // Let's provide the exact JSON payload for Persons as a test to prove it works!
  const testData = {
    'Persons': [
      {
        "id": "p_101",
        "name_en": "Ramesh Kumar",
        "name_kn": "ರಮೇಶ್ ಕುಮಾರ್",
        "age": "34",
        "gender": "Male",
        "district_id": "d_01",
        "risk_score": "85",
        "is_repeat_offender": "true"
      },
      {
        "id": "p_102",
        "name_en": "Suresh Gowda",
        "name_kn": "ಸುರೇಶ್ ಗೌಡ",
        "age": "29",
        "gender": "Male",
        "district_id": "d_01",
        "risk_score": "45",
        "is_repeat_offender": "false"
      }
    ]
  };

  const results = {};
  
  for (const [tableName, rows] of Object.entries(testData)) {
    const tableId = tables[tableName];
    if (!tableId) {
      console.log(`❌ Table ${tableName} not found in Catalyst!`);
      continue;
    }
    
    console.log(`\n📋 Inserting ${rows.length} rows into ${tableName}...`);
    
    try {
      const resp = await fetch(`${apiBase}/table/${tableId}/row`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(rows) // Catalyst accepts array of rows for bulk insert
      });
      
      const result = await resp.json();
      if (resp.ok) {
        console.log(`  ✅ Successfully inserted into ${tableName}`);
        console.log(result);
        results[tableName] = 'SUCCESS';
      } else {
        console.log(`  ❌ Failed to insert into ${tableName}:`, result);
        results[tableName] = `FAIL: ${JSON.stringify(result)}`;
      }
    } catch (e) {
      console.log(`  ❌ Error inserting into ${tableName}:`, e.message);
      results[tableName] = 'ERROR';
    }
  }
  
  console.log('🎉 DONE!', results);
  alert('Data insertion test complete! Check console.');
})();
