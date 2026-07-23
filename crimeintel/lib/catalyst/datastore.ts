import { getCatalystApp } from './index';
import personsData from '@/data/seed/Persons.json';
import policeStationsData from '@/data/seed/PoliceStations.json';
import firsData from '@/data/seed/FIRs.json';
import casesData from '@/data/seed/Cases.json';
import vehiclesData from '@/data/seed/Vehicles.json';
import phoneRecordsData from '@/data/seed/PhoneRecords.json';
import bankAccountsData from '@/data/seed/BankAccounts.json';
import weaponsData from '@/data/seed/Weapons.json';
import entityRelationshipsData from '@/data/seed/EntityRelationships.json';
import socioEconomicData from '@/data/seed/SocioEconomicData.json';
import transactionsData from '@/data/seed/Transactions.json';

/**
 * DataStore API layer - Connects Next.js to Catalyst Data Store via ZCQL/SDK
 * with fallback to initial seed datasets.
 */
export const CatalystDataStore = {
  // Persons Table
  getPersons: async () => {
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
      console.warn('Catalyst Data Store fetch Persons falling back to seed:', (e as Error).message);
    }
    return personsData;
  },

  getPersonById: async (id: string) => {
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
      // Fallback
    }
    return personsData.find((p: any) => p.id === id);
  },

  // PoliceStations Table
  getPoliceStations: async () => {
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
      console.warn('Catalyst Data Store fetch PoliceStations fallback');
    }
    return policeStationsData;
  },

  // FIRs Table
  getFIRs: async () => {
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
      console.warn('Catalyst Data Store fetch FIRs fallback');
    }
    return firsData;
  },

  getFIRById: async (id: string) => {
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
      // Fallback
    }
    return firsData.find((f: any) => f.id === id);
  },

  // Cases Table
  getCases: async () => {
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
      console.warn('Catalyst Data Store fetch Cases fallback');
    }
    return casesData;
  },

  // Vehicles Table
  getVehicles: async () => {
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
      console.warn('Catalyst Data Store fetch Vehicles fallback');
    }
    return vehiclesData;
  },

  // Phone Records Table
  getPhoneRecords: async () => {
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
      console.warn('Catalyst Data Store fetch PhoneRecords fallback');
    }
    return phoneRecordsData;
  },

  // Bank Accounts Table
  getBankAccounts: async () => {
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
      console.warn('Catalyst Data Store fetch BankAccounts fallback');
    }
    return bankAccountsData;
  },

  // Weapons Table
  getWeapons: async () => {
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
      console.warn('Catalyst Data Store fetch Weapons fallback');
    }
    return weaponsData;
  },

  // Entity Relationships (Graph Edges) Table
  getEntityRelationships: async () => {
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
      console.warn('Catalyst Data Store fetch EntityRelationships fallback');
    }
    return entityRelationshipsData;
  },

  getGraphForEntity: async (entityId: string) => {
    const allEdges = await CatalystDataStore.getEntityRelationships();
    return allEdges.filter((edge: any) => edge.source === entityId || edge.target === entityId);
  },

  // Socio Economic Data Table
  getSocioEconomicData: async () => {
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
      console.warn('Catalyst Data Store fetch SocioEconomicData fallback');
    }
    return socioEconomicData;
  },

  // Financial Transactions Table
  getTransactions: async () => {
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
      console.warn('Catalyst Data Store fetch Transactions fallback');
    }
    return transactionsData;
  }
};
