import { getCatalystAppAsync } from './index';

/**
 * Builds a parameterized ZCQL query with safe parameter substitution.
 * Escapes single quotes by doubling them (ZCQL standard) to prevent SQL injection.
 * 
 * @param baseQuery - Query template with {param} placeholders
 * @param params - Object mapping parameter names to values
 * @returns Safe query string with parameters substituted
 * 
 * @example
 * buildParameterizedQuery(
 *   "SELECT * FROM Persons WHERE ROWID = '{id}'",
 *   { id: "P-123" }
 * )
 * // Returns: "SELECT * FROM Persons WHERE ROWID = 'P-123'"
 * 
 * @example
 * // Handles SQL injection by escaping quotes
 * buildParameterizedQuery(
 *   "SELECT * FROM Persons WHERE ROWID = '{id}'",
 *   { id: "'; DROP TABLE Persons; --" }
 * )
 * // Returns: "SELECT * FROM Persons WHERE ROWID = '''; DROP TABLE Persons; --'"
 */
function buildParameterizedQuery(
  baseQuery: string,
  params: Record<string, string | number>
): string {
  let query = baseQuery;
  
  // Escape single quotes in string parameters (ZCQL standard: double them)
  const escaped: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Escape single quotes by doubling them
      escaped[key] = value.replace(/'/g, "''");
    } else {
      // Convert numbers to strings without quotes
      escaped[key] = String(value);
    }
  }
  
  // Replace placeholders with escaped values
  for (const [key, value] of Object.entries(escaped)) {
    const placeholder = `{${key}}`;
    query = query.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }
  
  return query;
}

/**
 * DataStore API layer - Connects Next.js to Catalyst Data Store via ZCQL/SDK
 * NO FALLBACKS - If Catalyst is not configured or empty, operations will fail.
 * This forces proper data loading and proves real Catalyst integration.
 */
export const CatalystDataStore = {
  // Persons Table
  getPersons: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Persons');
    return queryResult.map((row: any) => row.Persons || row);
  },

  getPersonById: async (id: string): Promise<any | null> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const query = buildParameterizedQuery(
      "SELECT * FROM Persons WHERE ROWID = '{id}'",
      { id }
    );
    const queryResult = await zcql.executeZCQLQuery(query);
    return queryResult.length > 0 ? (queryResult[0].Persons || queryResult[0]) : null;
  },

  // PoliceStations Table
  getPoliceStations: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM PoliceStations');
    return queryResult.map((row: any) => row.PoliceStations || row);
  },

  // FIRs Table
  getFIRs: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM FIRs ORDER BY date DESC');
    return queryResult.map((row: any) => row.FIRs || row);
  },

  getFIRById: async (id: string): Promise<any | null> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    // Try by ROWID first
    const rowidQuery = buildParameterizedQuery(
      "SELECT * FROM FIRs WHERE ROWID = '{id}'",
      { id }
    );
    const rowidResult = await zcql.executeZCQLQuery(rowidQuery);
    if (rowidResult.length > 0) {
      return rowidResult[0].FIRs || rowidResult[0];
    }

    // Try by fir_no field (for uploaded FIRs stored with fir_no)
    const firNoQuery = buildParameterizedQuery(
      "SELECT * FROM FIRs WHERE fir_no = '{id}'",
      { id }
    );
    const firNoResult = await zcql.executeZCQLQuery(firNoQuery);
    if (firNoResult.length > 0) {
      return firNoResult[0].FIRs || firNoResult[0];
    }

    // Try by id field
    const idQuery = buildParameterizedQuery(
      "SELECT * FROM FIRs WHERE id = '{id}'",
      { id }
    );
    const idResult = await zcql.executeZCQLQuery(idQuery);
    if (idResult.length > 0) {
      return idResult[0].FIRs || idResult[0];
    }

    return null;
  },

  // Cases Table
  getCases: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Cases');
    return queryResult.map((row: any) => row.Cases || row);
  },

  // Vehicles Table
  getVehicles: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Vehicles');
    return queryResult.map((row: any) => row.Vehicles || row);
  },

  // Phone Records Table
  getPhoneRecords: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM PhoneRecords');
    return queryResult.map((row: any) => row.PhoneRecords || row);
  },

  // Bank Accounts Table
  getBankAccounts: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM BankAccounts');
    return queryResult.map((row: any) => row.BankAccounts || row);
  },

  // Weapons Table
  getWeapons: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Weapons');
    return queryResult.map((row: any) => row.Weapons || row);
  },

  // Entity Relationships (Graph Edges) Table
  getEntityRelationships: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM EntityRelationships');
    return queryResult.map((row: any) => row.EntityRelationships || row);
  },

  getGraphForEntity: async (entityId: string): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    // Try source/target fields (original schema)
    const query = buildParameterizedQuery(
      "SELECT * FROM EntityRelationships WHERE source = '{entityId}' OR target = '{entityId}'",
      { entityId }
    );
    const queryResult = await zcql.executeZCQLQuery(query);
    let results = queryResult.map((row: any) => row.EntityRelationships || row);

    // Also try fir_id / source_entity_id / target_entity_id fields (uploaded FIRs schema)
    if (results.length === 0) {
      const altQuery = buildParameterizedQuery(
        "SELECT * FROM EntityRelationships WHERE fir_id = '{entityId}'",
        { entityId }
      );
      const altResult = await zcql.executeZCQLQuery(altQuery);
      results = altResult.map((row: any) => row.EntityRelationships || row);
    }

    return results;
  },

  // Socio Economic Data Table
  getSocioEconomicData: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM SocioEconomicData');
    return queryResult.map((row: any) => row.SocioEconomicData || row);
  },

  // Financial Transactions Table
  getTransactions: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Transactions');
    return queryResult.map((row: any) => row.Transactions || row);
  },

  // Districts Table
  getDistricts: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    if (!zcql) throw new Error('Catalyst ZCQL not initialized.');
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Districts');
    return queryResult.map((row: any) => row.Districts || row);
  },

  // Notifications Table
  getNotifications: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    if (!zcql) throw new Error('Catalyst ZCQL not initialized.');
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Notifications ORDER BY timestamp DESC');
    return queryResult.map((row: any) => row.Notifications || row);
  },

  // System Health Table
  getSystemHealth: async (): Promise<any[]> => {
    const app = await getCatalystAppAsync();
    const zcql = app.zcql();
    if (!zcql) throw new Error('Catalyst ZCQL not initialized.');
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM SystemHealth');
    return queryResult.map((row: any) => row.SystemHealth || row);
  },

  // Insert Methods for Data Loading
  insertFIRs: async (firs: any[]): Promise<void> => {
    const app = await getCatalystAppAsync();
    const table = app.datastore().table('FIRs');
    
    const batchSize = 100;
    for (let i = 0; i < firs.length; i += batchSize) {
      const batch = firs.slice(i, i + batchSize);
      await table.insertRows(batch);
      console.log(`Loaded ${Math.min(i + batchSize, firs.length)} / ${firs.length} FIRs`);
    }
  },

  insertPersons: async (persons: any[]): Promise<void> => {
    const app = await getCatalystAppAsync();
    const table = app.datastore().table('Persons');
    
    const batchSize = 100;
    for (let i = 0; i < persons.length; i += batchSize) {
      const batch = persons.slice(i, i + batchSize);
      await table.insertRows(batch);
      console.log(`Loaded ${Math.min(i + batchSize, persons.length)} / ${persons.length} Persons`);
    }
  },

  insertVehicles: async (vehicles: any[]): Promise<void> => {
    const app = await getCatalystAppAsync();
    const table = app.datastore().table('Vehicles');
    
    const batchSize = 100;
    for (let i = 0; i < vehicles.length; i += batchSize) {
      const batch = vehicles.slice(i, i + batchSize);
      await table.insertRows(batch);
    }
  },

  insertPoliceStations: async (stations: any[]): Promise<void> => {
    const app = await getCatalystAppAsync();
    const table = app.datastore().table('PoliceStations');
    
    const batchSize = 100;
    for (let i = 0; i < stations.length; i += batchSize) {
      const batch = stations.slice(i, i + batchSize);
      await table.insertRows(batch);
      console.log(`Loaded ${Math.min(i + batchSize, stations.length)} / ${stations.length} Police Stations`);
    }
  },

  insertRelationships: async (relationships: any[]): Promise<void> => {
    const app = await getCatalystAppAsync();
    const table = app.datastore().table('EntityRelationships');
    
    const batchSize = 100;
    for (let i = 0; i < relationships.length; i += batchSize) {
      const batch = relationships.slice(i, i + batchSize);
      await table.insertRows(batch);
    }
  },

  insertTransactions: async (transactions: any[]): Promise<void> => {
    const app = await getCatalystAppAsync();
    const table = app.datastore().table('Transactions');
    
    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      await table.insertRows(batch);
      console.log(`Loaded ${Math.min(i + batchSize, transactions.length)} / ${transactions.length} Transactions`);
    }
  }
};
