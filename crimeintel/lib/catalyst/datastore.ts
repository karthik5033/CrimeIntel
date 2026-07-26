import { getCatalystApp } from './index';

/**
 * DataStore API layer - Connects Next.js to Catalyst Data Store via ZCQL/SDK
 * NO FALLBACKS - If Catalyst is not configured or empty, operations will fail.
 * This forces proper data loading and proves real Catalyst integration.
 */
export const CatalystDataStore = {
  // Persons Table
  getPersons: async (): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Persons');
    return queryResult.map((row: any) => row.Persons || row);
  },

  getPersonById: async (id: string): Promise<any | null> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery(`SELECT * FROM Persons WHERE ROWID = '${id}'`);
    return queryResult.length > 0 ? (queryResult[0].Persons || queryResult[0]) : null;
  },

  // PoliceStations Table
  getPoliceStations: async (): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM PoliceStations');
    return queryResult.map((row: any) => row.PoliceStations || row);
  },

  // FIRs Table
  getFIRs: async (): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM FIRs ORDER BY date DESC');
    return queryResult.map((row: any) => row.FIRs || row);
  },

  getFIRById: async (id: string): Promise<any | null> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery(`SELECT * FROM FIRs WHERE ROWID = '${id}'`);
    return queryResult.length > 0 ? (queryResult[0].FIRs || queryResult[0]) : null;
  },

  // Cases Table
  getCases: async (): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Cases');
    return queryResult.map((row: any) => row.Cases || row);
  },

  // Vehicles Table
  getVehicles: async (): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Vehicles');
    return queryResult.map((row: any) => row.Vehicles || row);
  },

  // Phone Records Table
  getPhoneRecords: async (): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM PhoneRecords');
    return queryResult.map((row: any) => row.PhoneRecords || row);
  },

  // Bank Accounts Table
  getBankAccounts: async (): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM BankAccounts');
    return queryResult.map((row: any) => row.BankAccounts || row);
  },

  // Weapons Table
  getWeapons: async (): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Weapons');
    return queryResult.map((row: any) => row.Weapons || row);
  },

  // Entity Relationships (Graph Edges) Table
  getEntityRelationships: async (): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM EntityRelationships');
    return queryResult.map((row: any) => row.EntityRelationships || row);
  },

  getGraphForEntity: async (entityId: string): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery(
      `SELECT * FROM EntityRelationships WHERE source = '${entityId}' OR target = '${entityId}'`
    );
    return queryResult.map((row: any) => row.EntityRelationships || row);
  },

  // Socio Economic Data Table
  getSocioEconomicData: async (): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM SocioEconomicData');
    return queryResult.map((row: any) => row.SocioEconomicData || row);
  },

  // Financial Transactions Table
  getTransactions: async (): Promise<any[]> => {
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    if (!zcql) {
      throw new Error('Catalyst ZCQL not initialized. Check your Catalyst configuration.');
    }
    
    const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Transactions');
    return queryResult.map((row: any) => row.Transactions || row);
  },

  // Insert Methods for Data Loading
  insertFIRs: async (firs: any[]): Promise<void> => {
    const app = getCatalystApp();
    const table = app.datastore().table('FIRs');
    
    const batchSize = 100;
    for (let i = 0; i < firs.length; i += batchSize) {
      const batch = firs.slice(i, i + batchSize);
      await table.insertRows(batch);
      console.log(`Loaded ${Math.min(i + batchSize, firs.length)} / ${firs.length} FIRs`);
    }
  },

  insertPersons: async (persons: any[]): Promise<void> => {
    const app = getCatalystApp();
    const table = app.datastore().table('Persons');
    
    const batchSize = 100;
    for (let i = 0; i < persons.length; i += batchSize) {
      const batch = persons.slice(i, i + batchSize);
      await table.insertRows(batch);
      console.log(`Loaded ${Math.min(i + batchSize, persons.length)} / ${persons.length} Persons`);
    }
  },

  insertVehicles: async (vehicles: any[]): Promise<void> => {
    const app = getCatalystApp();
    const table = app.datastore().table('Vehicles');
    
    const batchSize = 100;
    for (let i = 0; i < vehicles.length; i += batchSize) {
      const batch = vehicles.slice(i, i + batchSize);
      await table.insertRows(batch);
    }
  },

  insertRelationships: async (relationships: any[]): Promise<void> => {
    const app = getCatalystApp();
    const table = app.datastore().table('EntityRelationships');
    
    const batchSize = 100;
    for (let i = 0; i < relationships.length; i += batchSize) {
      const batch = relationships.slice(i, i + batchSize);
      await table.insertRows(batch);
    }
  },

  insertTransactions: async (transactions: any[]): Promise<void> => {
    const app = getCatalystApp();
    const table = app.datastore().table('Transactions');
    
    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      await table.insertRows(batch);
      console.log(`Loaded ${Math.min(i + batchSize, transactions.length)} / ${transactions.length} Transactions`);
    }
  }
};
