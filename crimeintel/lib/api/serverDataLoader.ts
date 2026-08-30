import { LocalDataStore } from '@/lib/db/localStore';

/**
 * ServerDataLoader — Server-side data access for Server Components
 * 
 * Strictly delegates to FastAPI for implemented endpoints.
 * Falls back to LocalDataStore for endpoints not yet in FastAPI.
 */
export const ServerDataLoader = {
  getPersons: async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/persons");
      return await res.json();
    } catch {
      return LocalDataStore.getPersons();
    }
  },
  getPersonById: (id: string) => LocalDataStore.getPersonById(id),

  getPoliceStations: () => LocalDataStore.getPoliceStations(),

  getFIRs: () => LocalDataStore.getFIRs(),
  getFIRById: async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/cases/${id}`);
      return await res.json();
    } catch {
      return LocalDataStore.getFIRById(id);
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
      return LocalDataStore.getCases();
    }
  },

  getVehicles: () => LocalDataStore.getVehicles(),
  getPhoneRecords: () => LocalDataStore.getPhoneRecords(),
  getBankAccounts: () => LocalDataStore.getBankAccounts(),
  getWeapons: () => LocalDataStore.getWeapons(),

  getEntityRelationships: () => LocalDataStore.getEntityRelationships(),
  getGraphForEntity: (id: string) => LocalDataStore.getGraphForEntity(id),

  getSocioEconomicData: () => LocalDataStore.getSocioEconomicData(),
  getTransactions: () => LocalDataStore.getTransactions(),

  getDistricts: () => LocalDataStore.getDistricts(),
  getNotifications: () => LocalDataStore.getNotifications(),
  getSystemHealth: () => LocalDataStore.getSystemHealth(),
  
  getAuditLogs: async () => {
    return [];
  },
};
