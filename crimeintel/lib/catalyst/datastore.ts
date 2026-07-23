import { getCatalystApp } from './index';
import personsSeed from '../../data/seed/Persons.json';
import policeStationsSeed from '../../data/seed/PoliceStations.json';
import firsSeed from '../../data/seed/FIRs.json';
import casesSeed from '../../data/seed/Cases.json';
import vehiclesSeed from '../../data/seed/Vehicles.json';
import phoneRecordsSeed from '../../data/seed/PhoneRecords.json';
import bankAccountsSeed from '../../data/seed/BankAccounts.json';
import weaponsSeed from '../../data/seed/Weapons.json';
import entityRelationshipsSeed from '../../data/seed/EntityRelationships.json';
import socioEconomicSeed from '../../data/seed/SocioEconomicData.json';
import transactionsSeed from '../../data/seed/Transactions.json';

/**
 * DataStore API layer - Connects Next.js to Catalyst Data Store via ZCQL/SDK
 * Automatically falls back to seed dataset if ZCQL returns empty/unconfigured.
 */
export const CatalystDataStore = {
  // Persons Table
  getPersons: async (): Promise<any[]> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Persons');
        if (queryResult && queryResult.length > 0) {
          return queryResult.map((row: any) => row.Persons || row);
        }
      }
    } catch (e) {
      console.warn('Catalyst Data Store fetch Persons note:', (e as Error).message);
    }
    return personsSeed;
  },

  getPersonById: async (id: string): Promise<any | null> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery(`SELECT * FROM Persons WHERE id = '${id}'`);
        if (queryResult && queryResult.length > 0) {
          return queryResult[0].Persons || queryResult[0];
        }
      }
    } catch (e) {
      console.warn(`Catalyst Data Store fetch Person ${id} note:`, (e as Error).message);
    }
    return personsSeed.find((p: any) => p.id === id) || null;
  },

  // PoliceStations Table
  getPoliceStations: async (): Promise<any[]> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery('SELECT * FROM PoliceStations');
        if (queryResult && queryResult.length > 0) {
          return queryResult.map((row: any) => row.PoliceStations || row);
        }
      }
    } catch (e) {
      console.warn('Catalyst Data Store fetch PoliceStations note:', (e as Error).message);
    }
    return policeStationsSeed;
  },

  // FIRs Table
  getFIRs: async (): Promise<any[]> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery('SELECT * FROM FIRs');
        if (queryResult && queryResult.length > 0) {
          return queryResult.map((row: any) => row.FIRs || row);
        }
      }
    } catch (e) {
      console.warn('Catalyst Data Store fetch FIRs note:', (e as Error).message);
    }
    return firsSeed;
  },

  getFIRById: async (id: string): Promise<any | null> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery(`SELECT * FROM FIRs WHERE id = '${id}'`);
        if (queryResult && queryResult.length > 0) {
          return queryResult[0].FIRs || queryResult[0];
        }
      }
    } catch (e) {
      console.warn(`Catalyst Data Store fetch FIR ${id} note:`, (e as Error).message);
    }
    return firsSeed.find((f: any) => f.id === id) || null;
  },

  // Cases Table
  getCases: async (): Promise<any[]> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Cases');
        if (queryResult && queryResult.length > 0) {
          return queryResult.map((row: any) => row.Cases || row);
        }
      }
    } catch (e) {
      console.warn('Catalyst Data Store fetch Cases note:', (e as Error).message);
    }
    return casesSeed;
  },

  // Vehicles Table
  getVehicles: async (): Promise<any[]> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Vehicles');
        if (queryResult && queryResult.length > 0) {
          return queryResult.map((row: any) => row.Vehicles || row);
        }
      }
    } catch (e) {
      console.warn('Catalyst Data Store fetch Vehicles note:', (e as Error).message);
    }
    return vehiclesSeed;
  },

  // Phone Records Table
  getPhoneRecords: async (): Promise<any[]> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery('SELECT * FROM PhoneRecords');
        if (queryResult && queryResult.length > 0) {
          return queryResult.map((row: any) => row.PhoneRecords || row);
        }
      }
    } catch (e) {
      console.warn('Catalyst Data Store fetch PhoneRecords note:', (e as Error).message);
    }
    return phoneRecordsSeed;
  },

  // Bank Accounts Table
  getBankAccounts: async (): Promise<any[]> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery('SELECT * FROM BankAccounts');
        if (queryResult && queryResult.length > 0) {
          return queryResult.map((row: any) => row.BankAccounts || row);
        }
      }
    } catch (e) {
      console.warn('Catalyst Data Store fetch BankAccounts note:', (e as Error).message);
    }
    return bankAccountsSeed;
  },

  // Weapons Table
  getWeapons: async (): Promise<any[]> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Weapons');
        if (queryResult && queryResult.length > 0) {
          return queryResult.map((row: any) => row.Weapons || row);
        }
      }
    } catch (e) {
      console.warn('Catalyst Data Store fetch Weapons note:', (e as Error).message);
    }
    return weaponsSeed;
  },

  // Entity Relationships (Graph Edges) Table
  getEntityRelationships: async (): Promise<any[]> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery('SELECT * FROM EntityRelationships');
        if (queryResult && queryResult.length > 0) {
          return queryResult.map((row: any) => row.EntityRelationships || row);
        }
      }
    } catch (e) {
      console.warn('Catalyst Data Store fetch EntityRelationships note:', (e as Error).message);
    }
    return entityRelationshipsSeed;
  },

  getGraphForEntity: async (entityId: string): Promise<any[]> => {
    const allEdges = await CatalystDataStore.getEntityRelationships();
    return allEdges.filter((edge: any) => edge.source === entityId || edge.target === entityId);
  },

  // Socio Economic Data Table
  getSocioEconomicData: async (): Promise<any[]> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery('SELECT * FROM SocioEconomicData');
        if (queryResult && queryResult.length > 0) {
          return queryResult.map((row: any) => row.SocioEconomicData || row);
        }
      }
    } catch (e) {
      console.warn('Catalyst Data Store fetch SocioEconomicData note:', (e as Error).message);
    }
    return socioEconomicSeed;
  },

  // Financial Transactions Table
  getTransactions: async (): Promise<any[]> => {
    try {
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const queryResult = await zcql.executeZCQLQuery('SELECT * FROM Transactions');
        if (queryResult && queryResult.length > 0) {
          return queryResult.map((row: any) => row.Transactions || row);
        }
      }
    } catch (e) {
      console.warn('Catalyst Data Store fetch Transactions note:', (e as Error).message);
    }
    return transactionsSeed;
  }
};
