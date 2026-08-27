/**
 * Phase 1 Step 6: Entity Storage Service
 * 
 * Stores extracted entities into their respective Catalyst Data Store tables:
 * - Persons → Persons table
 * - Vehicles → Vehicles table
 * - Phones → PhoneRecords table
 * - Locations → (embedded in FIR or separate Locations table)
 * - Weapons → Weapons table
 * - Bank Accounts → BankAccounts table
 * 
 * Flow:
 * OCR Text → Entity Extraction → Entity Storage → Data Store Tables
 * 
 * Each entity is linked to its source FIR via foreign keys
 */

import { getCatalystApp } from '@/lib/catalyst';
import type {
  ExtractedPerson,
  ExtractedVehicle,
  ExtractedPhone,
  ExtractedWeapon,
  ExtractedBankAccount,
  ExtractionResult,
} from './entityExtractor';

/**
 * Builds a parameterized ZCQL query with safe parameter substitution.
 * Escapes single quotes by doubling them (ZCQL standard) to prevent SQL injection.
 */
function buildParameterizedQuery(
  baseQuery: string,
  params: Record<string, string | number>
): string {
  let query = baseQuery;
  
  // Escape single quotes in string parameters
  const escaped: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      escaped[key] = value.replace(/'/g, "''");
    } else {
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

export interface StorageResult {
  personsStored: number;
  vehiclesStored: number;
  phonesStored: number;
  weaponsStored: number;
  bankAccountsStored: number;
  errors: string[];
  success: boolean;
}

export class EntityStorage {
  /**
   * Store all extracted entities from a FIR
   */
  static async storeEntities(
    extractionResult: ExtractionResult,
    firId: string,
    caseId?: string
  ): Promise<StorageResult> {
    const result: StorageResult = {
      personsStored: 0,
      vehiclesStored: 0,
      phonesStored: 0,
      weaponsStored: 0,
      bankAccountsStored: 0,
      errors: [],
      success: false,
    };

    console.log(`💾 Storing entities for FIR: ${firId}`);

    try {
      // Store persons
      result.personsStored = await this.storePersons(
        extractionResult.persons,
        firId,
        caseId
      );

      // Store vehicles
      result.vehiclesStored = await this.storeVehicles(
        extractionResult.vehicles,
        firId,
        caseId
      );

      // Store phones
      result.phonesStored = await this.storePhones(
        extractionResult.phones,
        firId,
        caseId
      );

      // Store weapons
      result.weaponsStored = await this.storeWeapons(
        extractionResult.weapons,
        firId,
        caseId
      );

      // Store bank accounts
      result.bankAccountsStored = await this.storeBankAccounts(
        extractionResult.bankAccounts,
        firId,
        caseId
      );

      result.success = true;

      console.log('✅ Entity storage completed:');
      console.log(`   - ${result.personsStored} persons`);
      console.log(`   - ${result.vehiclesStored} vehicles`);
      console.log(`   - ${result.phonesStored} phone records`);
      console.log(`   - ${result.weaponsStored} weapons`);
      console.log(`   - ${result.bankAccountsStored} bank accounts`);

    } catch (error) {
      console.error('❌ Entity storage error:', error);
      result.errors.push((error as Error).message);
      result.success = false;
    }

    return result;
  }

  /**
   * Store persons in Persons table
   */
  private static async storePersons(
    persons: ExtractedPerson[],
    firId: string,
    caseId?: string
  ): Promise<number> {
    if (persons.length === 0) return 0;

    const app = getCatalystApp();
    const table = app.datastore().table('Persons');

    const records = persons.map((person) => ({
      id: person.id,
      name: person.name,
      age: person.age || null,
      gender: person.gender || null,
      role: person.role,
      phone: person.phone || null,
      address: person.address || null,
      aadhaar: person.aadhaar || null,
      fir_id: firId,
      case_id: caseId || null,
      extracted_from_ocr: true,
      extraction_date: new Date().toISOString(),
    }));

    try {
      await table.insertRows(records);
      return records.length;
    } catch (error) {
      console.error('Failed to store persons:', error);
      // Try one by one if batch fails
      let stored = 0;
      for (const record of records) {
        try {
          await table.insertRow(record);
          stored++;
        } catch (e) {
          console.error(`Failed to store person ${record.name}:`, e);
        }
      }
      return stored;
    }
  }

  /**
   * Store vehicles in Vehicles table
   */
  private static async storeVehicles(
    vehicles: ExtractedVehicle[],
    firId: string,
    caseId?: string
  ): Promise<number> {
    if (vehicles.length === 0) return 0;

    const app = getCatalystApp();
    const table = app.datastore().table('Vehicles');

    const records = vehicles.map((vehicle) => ({
      id: vehicle.id,
      registration: vehicle.registration,
      type: vehicle.type || 'Unknown',
      color: vehicle.color || null,
      make: vehicle.make || null,
      model: vehicle.model || null,
      owner: vehicle.owner || null,
      fir_id: firId,
      case_id: caseId || null,
      extracted_from_ocr: true,
      extraction_date: new Date().toISOString(),
    }));

    try {
      await table.insertRows(records);
      return records.length;
    } catch (error) {
      console.error('Failed to store vehicles:', error);
      let stored = 0;
      for (const record of records) {
        try {
          await table.insertRow(record);
          stored++;
        } catch (e) {
          console.error(`Failed to store vehicle ${record.registration}:`, e);
        }
      }
      return stored;
    }
  }

  /**
   * Store phone records in PhoneRecords table
   */
  private static async storePhones(
    phones: ExtractedPhone[],
    firId: string,
    caseId?: string
  ): Promise<number> {
    if (phones.length === 0) return 0;

    const app = getCatalystApp();
    const table = app.datastore().table('PhoneRecords');

    const records = phones.map((phone) => ({
      id: phone.id,
      number: phone.number,
      imei: phone.imei || null,
      owner: phone.owner || null,
      type: phone.type || 'Mobile',
      fir_id: firId,
      case_id: caseId || null,
      extracted_from_ocr: true,
      extraction_date: new Date().toISOString(),
    }));

    try {
      await table.insertRows(records);
      return records.length;
    } catch (error) {
      console.error('Failed to store phone records:', error);
      let stored = 0;
      for (const record of records) {
        try {
          await table.insertRow(record);
          stored++;
        } catch (e) {
          console.error(`Failed to store phone ${record.number}:`, e);
        }
      }
      return stored;
    }
  }

  /**
   * Store weapons in Weapons table
   */
  private static async storeWeapons(
    weapons: ExtractedWeapon[],
    firId: string,
    caseId?: string
  ): Promise<number> {
    if (weapons.length === 0) return 0;

    const app = getCatalystApp();
    const table = app.datastore().table('Weapons');

    const records = weapons.map((weapon) => ({
      id: weapon.id,
      type: weapon.type,
      description: weapon.description || null,
      serial_number: weapon.serialNumber || null,
      fir_id: firId,
      case_id: caseId || null,
      extracted_from_ocr: true,
      extraction_date: new Date().toISOString(),
    }));

    try {
      await table.insertRows(records);
      return records.length;
    } catch (error) {
      console.error('Failed to store weapons:', error);
      let stored = 0;
      for (const record of records) {
        try {
          await table.insertRow(record);
          stored++;
        } catch (e) {
          console.error(`Failed to store weapon ${record.type}:`, e);
        }
      }
      return stored;
    }
  }

  /**
   * Store bank accounts in BankAccounts table
   */
  private static async storeBankAccounts(
    accounts: ExtractedBankAccount[],
    firId: string,
    caseId?: string
  ): Promise<number> {
    if (accounts.length === 0) return 0;

    const app = getCatalystApp();
    const table = app.datastore().table('BankAccounts');

    const records = accounts.map((account) => ({
      id: account.id,
      account_number: account.accountNumber,
      bank_name: account.bankName || null,
      ifsc: account.ifsc || null,
      holder: account.holder || null,
      fir_id: firId,
      case_id: caseId || null,
      extracted_from_ocr: true,
      extraction_date: new Date().toISOString(),
    }));

    try {
      await table.insertRows(records);
      return records.length;
    } catch (error) {
      console.error('Failed to store bank accounts:', error);
      let stored = 0;
      for (const record of records) {
        try {
          await table.insertRow(record);
          stored++;
        } catch (e) {
          console.error(`Failed to store account ${record.account_number}:`, e);
        }
      }
      return stored;
    }
  }

  /**
   * Check if entity already exists to avoid duplicates
   */
  static async checkDuplicates(
    entityType: 'person' | 'vehicle' | 'phone',
    identifier: string
  ): Promise<boolean> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    try {
      let query = '';
      
      switch (entityType) {
        case 'person':
          query = `SELECT COUNT(*) as count FROM Persons WHERE name = '${identifier}'`;
          break;
        case 'vehicle':
          query = `SELECT COUNT(*) as count FROM Vehicles WHERE registration = '${identifier}'`;
          break;
        case 'phone':
          query = `SELECT COUNT(*) as count FROM PhoneRecords WHERE number = '${identifier}'`;
          break;
      }

      const result = await zcql.executeZCQLQuery(query);
      const count = result[0]?.count || 0;
      
      return count > 0;
    } catch (error) {
      console.error('Duplicate check failed:', error);
      return false;
    }
  }

  /**
   * Update FIR with extraction summary
   */
  static async updateFIRExtractionStatus(
    firId: string,
    storageResult: StorageResult
  ): Promise<void> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    try {
      const summary = {
        persons: storageResult.personsStored,
        vehicles: storageResult.vehiclesStored,
        phones: storageResult.phonesStored,
        weapons: storageResult.weaponsStored,
        bankAccounts: storageResult.bankAccountsStored,
        extractionDate: new Date().toISOString(),
      };

      // Note: This requires an 'extraction_summary' column in FIRs table
      // For now, we'll just log it
      console.log(`FIR ${firId} extraction summary:`, summary);

      // Future: Store summary in FIR record
      // await zcql.executeZCQLQuery(
      //   `UPDATE FIRs SET extraction_summary = '${JSON.stringify(summary)}' 
      //    WHERE fir_no = '${firId}'`
      // );
    } catch (error) {
      console.error('Failed to update FIR extraction status:', error);
    }
  }

  /**
   * Get entities linked to a FIR
   */
  static async getEntitiesForFIR(firId: string): Promise<{
    persons: any[];
    vehicles: any[];
    phones: any[];
    weapons: any[];
    bankAccounts: any[];
  }> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    try {
      const [persons, vehicles, phones, weapons, bankAccounts] = await Promise.all([
        zcql.executeZCQLQuery(buildParameterizedQuery("SELECT * FROM Persons WHERE fir_id = '{firId}'", { firId })),
        zcql.executeZCQLQuery(buildParameterizedQuery("SELECT * FROM Vehicles WHERE fir_id = '{firId}'", { firId })),
        zcql.executeZCQLQuery(buildParameterizedQuery("SELECT * FROM PhoneRecords WHERE fir_id = '{firId}'", { firId })),
        zcql.executeZCQLQuery(buildParameterizedQuery("SELECT * FROM Weapons WHERE fir_id = '{firId}'", { firId })),
        zcql.executeZCQLQuery(buildParameterizedQuery("SELECT * FROM BankAccounts WHERE fir_id = '{firId}'", { firId })),
      ]);

      return {
        persons: persons.map((r: any) => r.Persons || r),
        vehicles: vehicles.map((r: any) => r.Vehicles || r),
        phones: phones.map((r: any) => r.PhoneRecords || r),
        weapons: weapons.map((r: any) => r.Weapons || r),
        bankAccounts: bankAccounts.map((r: any) => r.BankAccounts || r),
      };
    } catch (error) {
      console.error('Failed to get entities for FIR:', error);
      throw error;
    }
  }

  /**
   * Delete entities linked to a FIR (for cleanup/reprocessing)
   */
  static async deleteEntitiesForFIR(firId: string): Promise<void> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    try {
      await Promise.all([
        zcql.executeZCQLQuery(buildParameterizedQuery("DELETE FROM Persons WHERE fir_id = '{firId}'", { firId })),
        zcql.executeZCQLQuery(buildParameterizedQuery("DELETE FROM Vehicles WHERE fir_id = '{firId}'", { firId })),
        zcql.executeZCQLQuery(buildParameterizedQuery("DELETE FROM PhoneRecords WHERE fir_id = '{firId}'", { firId })),
        zcql.executeZCQLQuery(buildParameterizedQuery("DELETE FROM Weapons WHERE fir_id = '{firId}'", { firId })),
        zcql.executeZCQLQuery(buildParameterizedQuery("DELETE FROM BankAccounts WHERE fir_id = '{firId}'", { firId })),
      ]);

      console.log(`✅ Deleted all entities for FIR: ${firId}`);
    } catch (error) {
      console.error('Failed to delete entities:', error);
      throw error;
    }
  }
}
