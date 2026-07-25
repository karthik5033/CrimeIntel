// FINAL SCRIPT - Paste in Brave Console (F12 -> Console)
// This script clicks through the UI programmatically to add columns

(async () => {
  // Intercept ALL network requests to find the correct API pattern
  const originalXHR = XMLHttpRequest.prototype.open;
  const originalFetch = window.fetch;
  let apiPattern = null;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (method === 'POST' && url.includes('column')) {
      apiPattern = url;
      console.log('🎯 XHR CAPTURED:', url);
    }
    return originalXHR.call(this, method, url, ...args);
  };

  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (url && args[1]?.method === 'POST' && url.includes('column')) {
      apiPattern = url;
      console.log('🎯 FETCH CAPTURED:', url);
    }
    return originalFetch.apply(this, args);
  };

  // Table definitions
  const allColumns = {
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

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  alert('After clicking OK:\n1. Click on "Persons" table in the sidebar\n2. Click "+ New Column"\n3. Add a column called "id" with type "text"\n4. Click "Create"\n\nThe script will capture the API and auto-create ALL remaining columns.');

  // Wait for the API pattern to be captured
  console.log('⏳ Waiting... Please create ONE column manually (name: "id", type: "text")');

  while (!apiPattern) {
    await sleep(1000);
    // Also check if we can find it from DOM
    const perf = performance.getEntriesByType('resource');
    for (const entry of perf) {
      if (entry.name.includes('column') && entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch') {
        apiPattern = entry.name;
        console.log('🎯 PERF CAPTURED:', entry.name);
      }
    }
  }

  console.log('✅ Got API pattern:', apiPattern);

  // Extract: the part before /table/{id}/column
  // apiPattern looks like: https://host/some/path/table/55949XXXXX/column
  const match = apiPattern.match(/(.+\/table\/)(\d+)(\/column.*)/);
  if (!match) {
    console.error('❌ Could not parse API pattern:', apiPattern);
    return;
  }

  const [, prefix, capturedTableId, suffix] = match;
  console.log('Prefix:', prefix);
  console.log('Table ID captured:', capturedTableId);
  console.log('Suffix:', suffix);

  // Now we need table IDs for all tables
  // Click each table in the sidebar and read the URL to get their IDs
  const tableNameToId = {};
  
  // Find all table links in the sidebar
  const sidebarItems = document.querySelectorAll('.zc-ds-table-list .zc-ds-tname, [class*="table-list"] [class*="tname"], .ds-table-list-item');
  console.log('Sidebar items found:', sidebarItems.length);

  // Alternative: scan all elements for table names
  const allElements = document.querySelectorAll('*');
  const tableLinks = [];
  for (const el of allElements) {
    const text = el.textContent?.trim();
    if (text && Object.keys(allColumns).includes(text) && el.children.length === 0) {
      // This is likely a table name element
      if (!tableLinks.find(t => t.text === text)) {
        tableLinks.push({ el, text });
      }
    }
  }
  
  console.log('Found table name elements:', tableLinks.map(t => t.text));

  for (const { el, text: tableName } of tableLinks) {
    console.log(`Clicking on table: ${tableName}`);
    el.click();
    await sleep(2000); // Wait for URL to update
    
    // Get table ID from the URL hash
    const hash = window.location.hash;
    const tableIdMatch = hash.match(/tables\/(\d+)/);
    if (tableIdMatch) {
      tableNameToId[tableName] = tableIdMatch[1];
      console.log(`  ${tableName} -> ${tableIdMatch[1]}`);
    } else {
      console.log(`  Could not find ID for ${tableName} in hash: ${hash}`);
      // Try from the schema view - look for table ID text
      const schemaText = document.body.innerText;
      const idMatch = schemaText.match(/Table ID\s*:\s*(\d+)/);
      if (idMatch) {
        tableNameToId[tableName] = idMatch[1];
        console.log(`  ${tableName} -> ${idMatch[1]} (from schema)`);
      }
    }
  }

  console.log('\nTable IDs found:', tableNameToId);

  // Now create columns for each table
  const results = {};
  for (const [tableName, columns] of Object.entries(allColumns)) {
    const tableId = tableNameToId[tableName];
    if (!tableId) {
      results[tableName] = 'NO_ID';
      console.log(`⚠️ Skipping ${tableName} - no ID found`);
      continue;
    }

    const columnUrl = prefix + tableId + suffix;
    console.log(`\n📋 ${tableName} (${tableId}) - URL: ${columnUrl}`);
    
    let ok = 0;
    for (const col of columns) {
      // Skip 'id' for the table where we already manually created it
      if (tableId === capturedTableId && col === 'id') {
        console.log(`  ⏭️ ${col} (already created manually)`);
        ok++;
        continue;
      }
      
      try {
        const resp = await originalFetch(columnUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            column_name: col,
            data_type: 'text',
            is_mandatory: false,
            is_unique: false
          })
        });
        if (resp.ok) {
          console.log(`  ✅ ${col}`);
          ok++;
        } else {
          const err = await resp.json().catch(() => ({}));
          console.log(`  ❌ ${col}: ${resp.status}`, err);
        }
      } catch(e) {
        console.log(`  ❌ ${col}: ${e.message}`);
      }
    }
    results[tableName] = `${ok}/${columns.length}`;
  }

  // Restore
  XMLHttpRequest.prototype.open = originalXHR;
  window.fetch = originalFetch;

  console.log('\n🎉 FINAL RESULTS:', results);
  document.title = 'COLUMNS:' + JSON.stringify(results);
  alert('✅ Done! Results:\n' + JSON.stringify(results, null, 2));
})();
