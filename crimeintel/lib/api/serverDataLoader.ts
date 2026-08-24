import { CatalystDataStore } from '@/lib/catalyst/datastore';

/**
 * ServerDataLoader — Server-side data access for Server Components
 * 
 * Strictly delegates to CatalystDataStore to enforce database connectivity.
 * No local file fallbacks are permitted here.
 */
export const ServerDataLoader = {
  getPersons: () => CatalystDataStore.getPersons(),
  getPersonById: (id: string) => CatalystDataStore.getPersonById(id),

  getPoliceStations: () => CatalystDataStore.getPoliceStations(),

  getFIRs: () => CatalystDataStore.getFIRs(),
  getFIRById: (id: string) => CatalystDataStore.getFIRById(id),

  getCases: () => CatalystDataStore.getCases(),

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
