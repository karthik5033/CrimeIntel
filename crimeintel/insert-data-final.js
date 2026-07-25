(async () => {
  const p = '55949000000013025';
  const apiBase = `https://console.catalyst.zoho.in/baas/v1/project/${p}`;
  
  console.log('🚀 Getting tables...');
  const tableResp = await fetch(`${apiBase}/table`, { credentials: 'include' });
  const { data: tableData } = await tableResp.json();
  const tables = {};
  tableData.forEach(t => tables[t.table_name] = t.table_id || t.id);
  
  const files = ['Persons', 'FIRs', 'Cases', 'PoliceStations', 'Vehicles', 'PhoneRecords', 'BankAccounts', 'Weapons', 'Transactions', 'EntityRelationships'];
  const results = {};

  for (const file of files) {
    const tableId = tables[file];
    if (!tableId) continue;
    
    console.log(`\n📥 Fetching ${file} data from localhost...`);
    try {
      // The Next.js app on port 3000 has the seed data we just copied!
      const dataResp = await fetch(`http://localhost:3000/seed/${file}.json`);
      const rows = await dataResp.json();
      
      console.log(`📋 Pushing ${rows.length} rows to ${file}...`);
      
      // Catalyst handles array of rows for bulk insert!
      const insertResp = await fetch(`${apiBase}/table/${tableId}/row`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(rows)
      });
      
      if (insertResp.ok) {
        console.log(`  ✅ Successfully inserted into ${file}`);
        results[file] = `✅ ${rows.length} rows`;
      } else {
        const err = await insertResp.json();
        console.log(`  ❌ Failed for ${file}:`, err);
        results[file] = `❌ ERROR`;
      }
    } catch(e) {
      console.log(`  ❌ Error on ${file}:`, e.message);
      results[file] = '❌ ERROR';
    }
  }
  
  console.log('\n🎉 ALL DONE!', results);
  alert('Data insertion complete! Check the console to see the results!');
})();
