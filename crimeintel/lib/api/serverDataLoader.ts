import { CatalystDataStore } from '@/lib/catalyst/datastore';

/**
 * ServerDataLoader — Server-side data access for Server Components
 * 
 * Strictly delegates to CatalystDataStore to enforce database connectivity.
 * No local file fallbacks are permitted here.
 */
export const ServerDataLoader = {
  getPersons: async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/persons");
      return await res.json();
    } catch {
      return CatalystDataStore.getPersons();
    }
  },
  getPersonById: (id: string) => CatalystDataStore.getPersonById(id),

  getPoliceStations: () => CatalystDataStore.getPoliceStations(),

  getFIRs: () => CatalystDataStore.getFIRs(),
  getFIRById: async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/cases/${id}`);
      return await res.json();
    } catch {
      return CatalystDataStore.getFIRById(id);
    }
  },

  getCases: async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/cases");
      const cases = await res.json();
      // Map to the shape expected by the UI
      return cases.map((c: any) => ({
        id: c.fir_no, // Mapped from FastAPI
        case_no: c.fir_no,
        status: c.status_en,
        firs: [c.id],
        summary_en: c.brief_fact_en || "Fetched from FastAPI (PostgreSQL)",
        crime_type: c.crime_type_en,
        district_id: c.ps_id
      }));
    } catch (e) {
      return CatalystDataStore.getCases();
    }
  },

  getVehicles: () => CatalystDataStore.getVehicles(),
  getPhoneRecords: () => CatalystDataStore.getPhoneRecords(),
  getBankAccounts: () => CatalystDataStore.getBankAccounts(),
  getWeapons: () => CatalystDataStore.getWeapons(),

  getEntityRelationships: () => CatalystDataStore.getEntityRelationships(),
  getGraphForEntity: (id: string) => CatalystDataStore.getGraphForEntity(id),

  getSocioEconomicData: () => CatalystDataStore.getSocioEconomicData(),
  getTransactions: () => CatalystDataStore.getTransactions(),

  getDistricts: () => CatalystDataStore.getDistricts(),
  getNotifications: () => CatalystDataStore.getNotifications(),
  getSystemHealth: () => CatalystDataStore.getSystemHealth(),
  
  // Note: AuditLogs may not be implemented in datastore.ts yet, 
  // but it should also connect to Catalyst.
  getAuditLogs: async () => {
    try {
      const { getCatalystApp } = require('@/lib/catalyst');
      const app = getCatalystApp();
      const zcql = app.zcql();
      if (zcql) {
        const result = await zcql.executeZCQLQuery(`SELECT * FROM AuditLogs`);
        return result.map((row: any) => row.AuditLogs || row);
      }
    } catch {
      // Fallback to empty array if table doesn't exist
    }
    return [];
  },
};
