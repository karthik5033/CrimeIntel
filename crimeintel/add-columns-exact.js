(async () => {
  const projectId = '55949000000013025';
  const apiBase = `https://console.catalyst.zoho.in/baas/v1/project/${projectId}`;
  
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

  console.log('🚀 Fetching table list...');
  const tableResp = await fetch(`${apiBase}/table`, { credentials: 'include' });
  const tableData = await tableResp.json();
  
  if (!tableData.data) {
    alert('Failed to get tables. See console.');
    return;
  }

  const tables = {};
  for (const t of tableData.data) {
    tables[t.table_name] = t.table_id || t.id;
  }
  
  console.log('✅ Tables found:', tables);
  
  const results = {};
  for (const [tableName, columns] of Object.entries(allColumns)) {
    const tableId = tables[tableName];
    if (!tableId) continue;
    
    console.log(`\n📋 Adding columns to ${tableName}...`);
    let ok = 0;
    for (const col of columns) {
      const resp = await fetch(`${apiBase}/table/${tableId}/column`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ column_name: col, data_type: 'text' })
      });
      if (resp.ok) {
        console.log(`  ✅ ${col}`);
        ok++;
      }
    }
    results[tableName] = `${ok}/${columns.length}`;
  }
  
  console.log('🎉 DONE!', results);
  alert('✅ ALL COLUMNS CREATED!');
})();
