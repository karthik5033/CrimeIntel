// PASTE THIS IN BRAVE CONSOLE (F12 -> Console)
// This intercepts the correct API path when you click "+ New Column" once,
// then uses that path to create ALL columns automatically.

(async () => {
  // Step 1: Monkey-patch fetch to capture the correct API path
  const originalFetch = window.fetch;
  let capturedColumnPath = null;
  
  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (url && args[1]?.method === 'POST' && url.includes('column')) {
      capturedColumnPath = url;
      console.log('🎯 CAPTURED column API path:', url);
    }
    return originalFetch.apply(this, args);
  };

  // Step 2: Prompt user to create ONE column manually
  alert('STEP 1: After clicking OK, manually click "+ New Column" on ANY table.\nAdd a column named "test123" with type "text" and click Save.\nThe script will capture the API path and auto-create ALL other columns.');
  
  // Wait for the user to create one column manually
  console.log('⏳ Waiting for you to manually create ONE column...');
  console.log('Click "+ New Column", add column "test123" (text type), and save it.');
  
  while (!capturedColumnPath) {
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('✅ Captured API path:', capturedColumnPath);
  
  // Step 3: Extract the path pattern
  // The captured path will be something like: /some/path/table/{tableId}/column
  // We need to replace the tableId part
  const pathParts = capturedColumnPath.split('/');
  const tableIdx = pathParts.indexOf('table') + 1;
  const capturedTableId = pathParts[tableIdx];
  
  // Function to build column path for any table
  function getColumnPath(tableId) {
    const parts = [...pathParts];
    parts[tableIdx] = tableId;
    return parts.join('/');
  }
  
  console.log('📋 Path pattern found. Now listing all tables...');
  
  // Step 4: Get list of tables - try to find them from the DOM
  // The table list is in the sidebar
  const tableElements = document.querySelectorAll('[class*="table-name"], [class*="tableName"], .zc-ds-table-list-item, .ds-table-item');
  console.log('Found table elements:', tableElements.length);
  
  // Alternative: try API with the correct base path
  const basePath = capturedColumnPath.substring(0, capturedColumnPath.indexOf('/table/'));
  console.log('Base path:', basePath);
  
  // Try listing tables
  let tables = {};
  try {
    const listResp = await originalFetch(basePath + '/table', { credentials: 'include' });
    if (listResp.ok) {
      const listData = await listResp.json();
      console.log('Tables list response:', listData);
      if (listData.data && Array.isArray(listData.data)) {
        for (const t of listData.data) {
          tables[t.table_name] = t.table_id || t.id;
        }
      }
    } else {
      console.log('Table list failed, status:', listResp.status);
    }
  } catch(e) {
    console.log('Table list error:', e);
  }
  
  // If API listing failed, try to get table IDs from the page
  if (Object.keys(tables).length === 0) {
    console.log('Trying to extract table IDs from the page DOM...');
    const allLinks = document.querySelectorAll('a[href*="table"], [data-table-id], [data-id]');
    allLinks.forEach(el => {
      console.log('Link:', el.textContent?.trim(), el.href || el.dataset);
    });
    
    // Ask user to help
    const tableIdsInput = prompt(
      'Could not auto-detect table IDs. Please click on each table in the sidebar and note their IDs from the URL.\n\n' +
      'Or just type "skip" and I will try clicking each table in the sidebar to find IDs.'
    );
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

  // Step 5: Create columns for all tables
  const results = {};
  for (const [tableName, columns] of Object.entries(tableColumns)) {
    const tid = tables[tableName];
    if (!tid) {
      console.log(`⚠️ Skipping ${tableName} - table ID not found`);
      results[tableName] = 'ID_NOT_FOUND';
      continue;
    }
    
    console.log(`\n📋 Adding columns to ${tableName}...`);
    let ok = 0;
    for (const col of columns) {
      try {
        const resp = await originalFetch(getColumnPath(tid), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ column_name: col, data_type: 'text', is_mandatory: false, is_unique: false })
        });
        if (resp.ok) {
          console.log(`  ✅ ${col}`);
          ok++;
        } else {
          const err = await resp.json();
          console.log(`  ❌ ${col}:`, err);
        }
      } catch(e) {
        console.log(`  ❌ ${col}: ${e.message}`);
      }
    }
    results[tableName] = `${ok}/${columns.length}`;
  }

  // Restore fetch
  window.fetch = originalFetch;
  
  console.log('\n🎉 RESULTS:', results);
  document.title = 'COLUMNS:' + JSON.stringify(results);
  alert('Done! Results:\n' + JSON.stringify(results, null, 2));
})();
