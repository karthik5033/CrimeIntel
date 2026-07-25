import path from 'path';
import fs from 'fs';

export const catalystConfig = {
  projectId: process.env.CATALYST_PROJECT_ID || process.env.NEXT_PUBLIC_CATALYST_PROJECT_ID || '55949000000013025',
  environment: process.env.CATALYST_ENV || process.env.NEXT_PUBLIC_CATALYST_ENV || 'Development',
  projectName: 'Project-Rainfall'
};

let catalystInstance: any = null;

// Check if we should use mock mode
const USE_MOCK = process.env.USE_MOCK_CATALYST === 'true' || process.env.NODE_ENV === 'test';

// Persistent mock data store (shared across requests)
const mockDataStore = {
  files: new Map<string, any>(),
  tables: new Map<string, Map<string, any>>() // tableName -> Map<rowId, rowData>
};

// Initialize tables
['FIRs', 'Persons', 'Vehicles', 'PhoneRecords', 'Weapons', 'BankAccounts', 'EntityRelationships', 'Embeddings'].forEach(table => {
  if (!mockDataStore.tables.has(table)) {
    mockDataStore.tables.set(table, new Map());
  }
});

export function getCatalystApp(req?: any): any {
  // If running in browser client, throw error
  if (typeof window !== 'undefined') {
    throw new Error('Catalyst SDK cannot be used on the client. Use API routes instead.');
  }

  // Return existing instance if already initialized
  if (catalystInstance) {
    return catalystInstance;
  }

  // If mock mode, return mock instance
  if (USE_MOCK) {
    console.log('⚠️ Using MOCK Catalyst instance');
    catalystInstance = createMockCatalystInstance();
    return catalystInstance;
  }

  // Real Catalyst SDK initialization
  try {
    const catalyst = require('zcatalyst-sdk-node');
    
    console.log('🔧 Initializing Catalyst SDK...');
    
    // Check for Catalyst config directory (created by catalyst login)
    const homeDir = process.env.USERPROFILE || process.env.HOME || '';
    const catalystConfigPath = path.join(homeDir, '.zcatalyst');
    const hasCliConfig = fs.existsSync(catalystConfigPath);
    
    console.log('Environment:', {
      projectId: catalystConfig.projectId,
      environment: catalystConfig.environment,
      hasCliConfig,
      catalystConfigPath
    });
    
    // Strategy 1: Use local .catalystrc file in project directory
    const projectCatalystRc = path.join(process.cwd(), '.catalystrc');
    if (fs.existsSync(projectCatalystRc)) {
      try {
        console.log('📋 Using local .catalystrc from project directory:', projectCatalystRc);
        // Initialize without auth - SDK will use local .catalystrc
        catalystInstance = catalyst.initialize();
        console.log('✅ Local .catalystrc authentication successful');
        return catalystInstance;
      } catch (localConfigError) {
        console.warn('⚠️ Local .catalystrc authentication failed:', (localConfigError as Error).message);
      }
    }
    
    // Strategy 2: Use CLI authentication (from catalyst login in home directory)
    if (hasCliConfig) {
      try {
        console.log('📋 Using CLI authentication from', catalystConfigPath);
        catalystInstance = catalyst.initialize();
        console.log('✅ CLI authentication successful');
        return catalystInstance;
      } catch (cliError) {
        console.warn('⚠️ CLI authentication failed:', (cliError as Error).message);
      }
    }
    
    // Strategy 3: Client ID/Secret authentication
    const clientId = process.env.CATALYST_CLIENT_ID;
    const clientSecret = process.env.CATALYST_CLIENT_SECRET;
    if (clientId && clientSecret) {
      try {
        console.log('🔑 Using Client ID/Secret authentication');
        catalystInstance = catalyst.initialize({
          client_id: clientId,
          client_secret: clientSecret,
          project_id: catalystConfig.projectId,
          environment: catalystConfig.environment
        });
        console.log('✅ Client ID/Secret authentication successful');
        return catalystInstance;
      } catch (clientError) {
        console.warn('⚠️ Client ID/Secret authentication failed:', (clientError as Error).message);
      }
    }
    
    // Strategy 4: Token-based (legacy)
    const token = process.env.CATALYST_TOKEN;
    if (token) {
      try {
        console.log('🔑 Using token authentication');
        catalystInstance = catalyst.initialize({
          type: 'token',
          token: token
        });
        console.log('✅ Token authentication successful');
        return catalystInstance;
      } catch (tokenError) {
        console.warn('⚠️ Token authentication failed:', (tokenError as Error).message);
      }
    }
    
    // If all fail, throw error
    throw new Error(
      'Catalyst SDK initialization failed. Please run: catalyst login\n' +
      'Or set CATALYST_TOKEN in .env.local'
    );
    
  } catch (error) {
    console.error('❌ Catalyst initialization failed:', (error as Error).message);
    console.error('⚠️ Falling back to MOCK mode for development');
    
    // Fallback to mock mode instead of crashing
    catalystInstance = createMockCatalystInstance();
    return catalystInstance;
  }
}

// Mock Catalyst instance for development/testing
function createMockCatalystInstance() {
  // Load seed data on first initialization
  if (!mockDataStore.tables.get('FIRs')?.size) {
    console.log('📦 Loading seed data into mock store...');
    try {
      const firsSeed = require('../../data/seed/FIRs.json');
      const personsSeed = require('../../data/seed/Persons.json');
      const vehiclesSeed = require('../../data/seed/Vehicles.json');
      const relationshipsSeed = require('../../data/seed/EntityRelationships.json');
      
      // Load FIRs
      const firsTable = mockDataStore.tables.get('FIRs')!;
      firsSeed.forEach((fir: any, i: number) => {
        const rowId = `SEED_ROW_FIR_${i}`;
        firsTable.set(rowId, { ROWID: rowId, ...fir });
      });
      console.log(`✅ Loaded ${firsSeed.length} FIRs into mock store`);
      
      // Load Persons
      const personsTable = mockDataStore.tables.get('Persons')!;
      personsSeed.forEach((person: any, i: number) => {
        const rowId = `SEED_ROW_PERSON_${i}`;
        personsTable.set(rowId, { ROWID: rowId, ...person });
      });
      console.log(`✅ Loaded ${personsSeed.length} Persons into mock store`);
      
      // Load Vehicles
      const vehiclesTable = mockDataStore.tables.get('Vehicles')!;
      vehiclesSeed.forEach((vehicle: any, i: number) => {
        const rowId = `SEED_ROW_VEHICLE_${i}`;
        vehiclesTable.set(rowId, { ROWID: rowId, ...vehicle });
      });
      console.log(`✅ Loaded ${vehiclesSeed.length} Vehicles into mock store`);
      
      // Load Entity Relationships
      const relationshipsTable = mockDataStore.tables.get('EntityRelationships')!;
      relationshipsSeed.forEach((rel: any, i: number) => {
        const rowId = `SEED_ROW_REL_${i}`;
        relationshipsTable.set(rowId, { ROWID: rowId, ...rel });
      });
      console.log(`✅ Loaded ${relationshipsSeed.length} Relationships into mock store`);
      
      console.log('🎉 Seed data loaded successfully!');
    } catch (error) {
      console.warn('⚠️ Could not load seed data:', (error as Error).message);
    }
  }
  
  return {
    filestore: () => ({
      getAllBuckets: async () => {
        return [
          { bucket_name: 'fir_documents', id: '55949000000025368' },
          { bucket_name: 'evidence_files', id: '55949000000025369' }
        ];
      },
      bucket: (name: string) => ({
        uploadFile: async ({ code, name: fileName, fileobj }: any) => {
          const fileId = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          mockDataStore.files.set(fileId, { code, fileName, buffer: fileobj, uploadTime: new Date() });
          console.log('📤 MOCK: File uploaded:', fileName, 'ID:', fileId);
          return {
            id: fileId,
            url: `/mock-files/${name}/${code}`,
            file_name: fileName
          };
        },
        getFileDetails: async (fileId: string) => {
          const file = mockDataStore.files.get(fileId);
          if (!file) throw new Error('File not found');
          return {
            id: fileId,
            file_name: file.fileName,
            url: `/mock-files/${file.fileName}`
          };
        },
        getDownloadUrl: async (fileId: string) => {
          return `/mock-files/download/${fileId}`;
        },
        deleteFile: async (fileId: string) => {
          mockDataStore.files.delete(fileId);
          console.log('🗑️ MOCK: File deleted:', fileId);
          return true;
        }
      })
    }),
    datastore: () => ({
      getAllTables: async () => {
        return Array.from(mockDataStore.tables.keys()).map(name => ({ table_name: name }));
      },
      table: (tableName: string) => ({
        insertRows: async (rows: any[]) => {
          console.log(`💾 MOCK: Inserting ${rows.length} rows into ${tableName}`);
          if (!mockDataStore.tables.has(tableName)) {
            mockDataStore.tables.set(tableName, new Map());
          }
          const table = mockDataStore.tables.get(tableName)!;
          const inserted = rows.map((row, i) => {
            const rowId = `MOCK_ROW_${Date.now()}_${i}`;
            const rowData = { ROWID: rowId, ...row };
            
            // ONLY store by ROWID (no more dual indexing)
            table.set(rowId, rowData);
            console.log(`📇 MOCK: Stored ${tableName} row with ROWID: ${rowId}, fir_no: ${row.fir_no || 'N/A'}`);
            
            return rowData;
          });
          console.log(`📊 MOCK: ${tableName} now has ${table.size} entries`);
          console.log(`🔑 MOCK: Available keys:`, Array.from(table.keys()).slice(0, 10));
          return inserted;
        },
        getRows: async () => {
          const table = mockDataStore.tables.get(tableName);
          if (!table) return [];
          return Array.from(table.values()).filter(row => !row.ROWID.startsWith('MOCK_ROW'));
        }
      })
    }),
    zcql: () => ({
      executeZCQLQuery: async (query: string) => {
        console.log('🔍 MOCK ZCQL:', query.substring(0, 150));
        
        // Parse SELECT queries
        if (query.toUpperCase().includes('SELECT')) {
          const tableMatch = query.match(/FROM\s+(\w+)/i);
          const tableName = tableMatch ? tableMatch[1] : 'FIRs';
          
          const table = mockDataStore.tables.get(tableName);
          if (!table) {
            console.log(`⚠️ MOCK: Table ${tableName} not found`);
            return [];
          }
          
          // Parse WHERE fir_no = 'X'
          const whereMatch = query.match(/WHERE\s+fir_no\s*=\s*'([^']+)'/i);
          if (whereMatch) {
            const firNo = whereMatch[1];
            
            // Scan all rows for matching fir_no
            let row: any = null;
            for (const [key, value] of table.entries()) {
              if (value.fir_no === firNo) {
                row = value;
                console.log(`✅ MOCK: Found FIR ${firNo} by scanning (key: ${key})`);
                break;
              }
            }
            
            if (row) {
              console.log(`📋 MOCK: FIR ${firNo} fields:`, Object.keys(row));
              console.log(`📄 MOCK: OCR text length:`, row.ocr_text?.length || 0);
              console.log(`📊 MOCK: OCR status:`, row.ocr_status);
              console.log(`🔎 MOCK DEBUG: Full row data:`, JSON.stringify(row).substring(0, 200));
              console.log(`🔎 MOCK DEBUG: ocr_text value:`, row.ocr_text ? `"${row.ocr_text.substring(0, 50)}..."` : 'null/undefined');
              return [{ [tableName]: row }];
            } else {
              console.log(`❌ MOCK: FIR ${firNo} not found anywhere`);
              console.log(`🔑 MOCK: Table ${tableName} has ${table.size} entries`);
              console.log(`🔑 MOCK: Sample keys:`, Array.from(table.keys()).slice(0, 10));
              console.log(`🔑 MOCK: Sample fir_nos:`, Array.from(table.values()).map(v => v.fir_no).filter(Boolean).slice(0, 5));
              return [];
            }
          }
          
          // Return all rows
          const allRows = Array.from(table.values())
            .filter(row => !String(row.ROWID || '').includes('firno_'));
          console.log(`📊 MOCK: Returning ${allRows.length} rows from ${tableName}`);
          return allRows.map(row => ({ [tableName]: row }));
        }
        
        // Parse UPDATE queries
        if (query.toUpperCase().includes('UPDATE')) {
          const tableMatch = query.match(/UPDATE\s+(\w+)/i);
          const tableName = tableMatch ? tableMatch[1] : 'FIRs';
          
          // Parse WHERE fir_no = 'X' or ROWID = X
          const whereMatch = query.match(/WHERE\s+(?:fir_no\s*=\s*'([^']+)'|ROWID\s*=\s*([^\s]+))/i);
          
          if (whereMatch) {
            const firNo = whereMatch[1];
            const rowId = whereMatch[2];
            
            const table = mockDataStore.tables.get(tableName);
            if (table) {
              let targetRow: any = null;
              let targetKey: string = '';
              
              // Find the row to update
              if (firNo) {
                // Scan for FIR by fir_no
                for (const [key, value] of table.entries()) {
                  if (value.fir_no === firNo) {
                    targetRow = value;
                    targetKey = key;
                    console.log(`🔍 MOCK: Found row by fir_no (key: ${key})`);
                    break;
                  }
                }
              } else if (rowId) {
                // Direct ROWID lookup
                targetRow = table.get(rowId);
                targetKey = rowId;
                console.log(`🔍 MOCK: Found row by ROWID (key: ${rowId})`);
              }
              
              if (targetRow) {
                // Parse SET clauses (handle multi-line queries)
                const setMatch = query.match(/SET\s+([\s\S]+?)\s+WHERE/i);
                if (setMatch) {
                  const setClauses = setMatch[1];
                  
                  // Extract field = 'value' pairs (strings, including multi-line values)
                  const stringFieldRegex = /(\w+)\s*=\s*'((?:[^'\\]|\\.)*)'/g;
                  let match;
                  while ((match = stringFieldRegex.exec(setClauses)) !== null) {
                    const field = match[1];
                    const value = match[2];
                    console.log(`🔧 MOCK: Setting ${field} (length: ${value.length} chars)`);
                    targetRow[field] = value;
                  }
                  
                  // Extract numeric fields
                  const numMatches = setClauses.matchAll(/(\w+)\s*=\s*([0-9.]+)/g);
                  for (const match of numMatches) {
                    const [, field, value] = match;
                    const numValue = parseFloat(value);
                    console.log(`🔧 MOCK: Setting ${field} = ${numValue}`);
                    targetRow[field] = numValue;
                  }
                  
                  console.log(`💾 MOCK: Updated row ${targetKey}`);
                  console.log(`✅ MOCK: New ocr_text length: ${targetRow.ocr_text?.length || 0}`);
                  console.log(`✅ MOCK: New ocr_status: ${targetRow.ocr_status}`);
                }
                
                return { affected_rows: 1 };
              } else {
                console.log(`❌ MOCK: Row not found for update in ${tableName}`);
                console.log(`🔑 MOCK: Searched for:`, firNo ? `fir_no=${firNo}` : `ROWID=${rowId}`);
              }
            }
          }
          
          console.log('💾 MOCK: Update query executed (generic fallback)');
          return { affected_rows: 1 };
        }
        
        return [];
      }
    })
  };
}
