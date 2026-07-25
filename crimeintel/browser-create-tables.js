// ============================================================
// PASTE THIS INTO YOUR BRAVE BROWSER CONSOLE (F12 -> Console)
// while on the Catalyst Data Store page
// ============================================================
// This script uses Catalyst's internal API (same requests the UI makes)
// to create all tables and columns automatically.

(async function() {
  // Extract CSRF token and cookies from the current page session
  const projectId = '55949000000013025';
  const envId = '60078981781';
  
  const tables = [
    { name: 'Persons', cols: ['id','name_en','name_kn','age','gender','district_id','risk_score','is_repeat_offender'] },
    { name: 'FIRs', cols: ['id','fir_no','case_no','crime_type_id','crime_type_en','crime_type_kn','police_station_id','district_id','date','status_en','description','lat','lng'] },
    { name: 'Cases', cols: ['id','case_no','status','firs','summary_en','primary_crime_type','latest_date'] },
    { name: 'PoliceStations', cols: ['id','name_en','district_id','lat','lng'] },
    { name: 'Vehicles', cols: ['id','license_plate','make','model','color'] },
    { name: 'PhoneRecords', cols: ['id','number','provider'] },
    { name: 'BankAccounts', cols: ['id','account_no','bank_name','ifsc'] },
    { name: 'Weapons', cols: ['id','type','description'] },
    { name: 'Transactions', cols: ['id','from_account_id','to_account_id','amount','timestamp','type','description','flagged','pattern'] },
    { name: 'EntityRelationships', cols: ['id','source','target','type','description'] },
  ];

  const baseUrl = window.location.origin;
  
  // Try to find the correct API path from the current URL
  // The console URL pattern is: /baas/{org}/{...}/project/{projectId}/Development#/cloudscale/datastore
  const pathMatch = window.location.pathname.match(/\/baas\/(\d+)\/(\d+)\/(\d+)\/project\/(\d+)/);
  
  if (!pathMatch) {
    console.error('❌ Cannot detect API path. Make sure you are on the Data Store page.');
    return;
  }
  
  const [, p1, p2, p3, pId] = pathMatch;
  const apiBase = `${baseUrl}/baas/${p1}/${p2}/${p3}/project/${pId}`;
  
  console.log('🚀 Starting table creation...');
  console.log('API Base:', apiBase);
  
  for (const table of tables) {
    console.log(`\n📋 Creating table: ${table.name}`);
    
    try {
      // Create table
      const createResp = await fetch(`${apiBase}/datastore/table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ table_name: table.name })
      });
      
      const createData = await createResp.json();
      
      if (createResp.ok && createData.data) {
        const tableId = createData.data.table_id;
        console.log(`  ✅ Table "${table.name}" created (ID: ${tableId})`);
        
        // Add columns
        for (const col of table.cols) {
          try {
            const colResp = await fetch(`${apiBase}/datastore/table/${tableId}/column`, {
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
            const colData = await colResp.json();
            if (colResp.ok) {
              console.log(`    ✅ Column "${col}" added`);
            } else {
              console.log(`    ❌ Column "${col}" failed:`, colData);
            }
          } catch (colErr) {
            console.log(`    ❌ Column "${col}" error:`, colErr.message);
          }
        }
      } else {
        console.log(`  ❌ Table "${table.name}" failed:`, createData);
      }
    } catch (err) {
      console.log(`  ❌ Table "${table.name}" error:`, err.message);
    }
  }
  
  console.log('\n🎉 Done! Refresh the page to see all tables.');
  alert('✅ All tables created! Refresh the page.');
})();
