import path from 'path';
import fs from 'fs';

/**
 * ServerDataLoader — Server-side data access for Server Components
 * 
 * Tries Catalyst SDK first (when deployed), falls back to local seed JSON files.
 * Use this in Server Components (pages without "use client").
 * For Client Components, use DataClient from '@/lib/api/dataClient' instead.
 */

const SEED_DIR = path.join(process.cwd(), 'data', 'seed');

function loadSeedFile(tableName: string): any[] {
  const filePath = path.join(SEED_DIR, `${tableName}.json`);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function queryTable(tableName: string): Promise<any[]> {
  // Try Catalyst SDK first
  try {
    const { getCatalystApp } = require('@/lib/catalyst');
    const app = getCatalystApp();
    const zcql = app.zcql();
    if (zcql) {
      const result = await zcql.executeZCQLQuery(`SELECT * FROM ${tableName}`);
      return result.map((row: any) => row[tableName] || row);
    }
  } catch {
    // Catalyst not available — use local seed data
  }
  return loadSeedFile(tableName);
}

export const ServerDataLoader = {
  getPersons: () => queryTable('Persons'),
  getPersonById: async (id: string) => {
    const all = await queryTable('Persons');
    return all.find((p: any) => String(p.ROWID) === id || String(p.id) === id || String(p.person_id) === id) || null;
  },

  getPoliceStations: () => queryTable('PoliceStations'),

  getFIRs: () => queryTable('FIRs'),
  getFIRById: async (id: string) => {
    const all = await queryTable('FIRs');
    return all.find((f: any) => String(f.ROWID) === id || String(f.id) === id || f.fir_no === id) || null;
  },

  getCases: () => queryTable('Cases'),

  getVehicles: () => queryTable('Vehicles'),
  getPhoneRecords: () => queryTable('PhoneRecords'),
  getBankAccounts: () => queryTable('BankAccounts'),
  getWeapons: () => queryTable('Weapons'),

  getEntityRelationships: () => queryTable('EntityRelationships'),
  getGraphForEntity: async (entityId: string) => {
    const all = await queryTable('EntityRelationships');
    return all.filter((r: any) =>
      String(r.source) === entityId || String(r.target) === entityId ||
      String(r.source_entity_id) === entityId || String(r.target_entity_id) === entityId
    );
  },

  getSocioEconomicData: () => queryTable('SocioEconomicData'),
  getTransactions: () => queryTable('Transactions'),
};
