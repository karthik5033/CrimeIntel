/**
 * DataClient — Client-side data access layer
 * 
 * Uses fetch() to call /api/data which handles Catalyst SDK or local seed fallback.
 * This is safe to use in "use client" components.
 */

async function fetchTable(tableName: string): Promise<any[]> {
  const res = await fetch(`/api/data?table=${tableName}`);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `Failed to fetch ${tableName}`);
  }
  const json = await res.json();
  return json.data || [];
}

export const DataClient = {
  // Persons
  getPersons: () => fetchTable('Persons'),
  getPersonById: async (id: string) => {
    const all = await fetchTable('Persons');
    return all.find((p: any) => String(p.ROWID) === id || String(p.id) === id || String(p.person_id) === id) || null;
  },

  // Police Stations
  getPoliceStations: () => fetchTable('PoliceStations'),

  // FIRs
  getFIRs: () => fetchTable('FIRs'),
  getFIRById: async (id: string) => {
    const all = await fetchTable('FIRs');
    return all.find((f: any) => String(f.ROWID) === id || String(f.id) === id || f.fir_no === id) || null;
  },

  // Cases
  getCases: () => fetchTable('Cases'),

  // Vehicles
  getVehicles: () => fetchTable('Vehicles'),

  // Phone Records
  getPhoneRecords: () => fetchTable('PhoneRecords'),

  // Bank Accounts
  getBankAccounts: () => fetchTable('BankAccounts'),

  // Weapons
  getWeapons: () => fetchTable('Weapons'),

  // Entity Relationships (Graph Edges)
  getEntityRelationships: () => fetchTable('EntityRelationships'),
  getGraphForEntity: async (entityId: string) => {
    const all = await fetchTable('EntityRelationships');
    return all.filter((r: any) =>
      String(r.source) === entityId || String(r.target) === entityId ||
      String(r.source_entity_id) === entityId || String(r.target_entity_id) === entityId
    );
  },

  // Socio Economic Data
  getSocioEconomicData: () => fetchTable('SocioEconomicData'),

  // Transactions
  getTransactions: () => fetchTable('Transactions'),
};
