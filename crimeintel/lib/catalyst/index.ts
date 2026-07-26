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

// Persistent mock data store (shared across requests and Next.js hot-reloads)
const globalAny = global as any;

if (!globalAny.__mockDataStore) {
  globalAny.__mockDataStore = {
    files: new Map<string, any>(),
    tables: new Map<string, Map<string, any>>() // tableName -> Map<rowId, rowData>
  };

  // Initialize tables
  ['FIRs', 'Persons', 'Vehicles', 'PhoneRecords', 'Weapons', 'BankAccounts', 'EntityRelationships', 'Embeddings', 'DocumentMetadata', 'ChatSessions', 'ReasoningOutputs'].forEach(table => {
    globalAny.__mockDataStore.tables.set(table, new Map());
  });
}

const mockDataStore = globalAny.__mockDataStore;

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
    
    // Check Windows AppData path as well
    const appDataPath = process.env.APPDATA ? path.join(process.env.APPDATA, 'zcatalyst-cli-nodejs', 'Config') : '';
    
    const hasCliConfig = fs.existsSync(catalystConfigPath) || (appDataPath && fs.existsSync(appDataPath));
    
    console.log('Environment:', {
      projectId: catalystConfig.projectId,
      environment: catalystConfig.environment,
      hasCliConfig,
      catalystConfigPath: fs.existsSync(catalystConfigPath) ? catalystConfigPath : appDataPath
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
    console.warn('⚠️ Catalyst initialization failed:', (error as Error).message);
    console.warn('⚠️ Falling back to MOCK mode for development');
    
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
      
      // Load Transactions
      try {
        const transactionsSeed = require('../../data/seed/Transactions.json');
        const transactionsTable = mockDataStore.tables.get('Transactions')!;
        if (!transactionsTable) {
          mockDataStore.tables.set('Transactions', new Map());
        }
        const table = mockDataStore.tables.get('Transactions')!;
        transactionsSeed.forEach((tx: any, i: number) => {
          const rowId = `SEED_ROW_TX_${i}`;
          table.set(rowId, { ROWID: rowId, ...tx });
        });
        console.log(`✅ Loaded ${transactionsSeed.length} Transactions into mock store`);
      } catch (err) {
        console.warn('⚠️ Could not load Transactions seed data:', (err as Error).message);
      }
      
      // Load SocioEconomicData
      try {
        const socioSeed = require('../../data/seed/SocioEconomicData.json');
        mockDataStore.tables.set('SocioEconomicData', new Map());
        const table = mockDataStore.tables.get('SocioEconomicData')!;
        socioSeed.forEach((item: any, i: number) => {
          const rowId = `SEED_ROW_SOCIO_${i}`;
          table.set(rowId, { ROWID: rowId, ...item });
        });
        console.log(`✅ Loaded ${socioSeed.length} SocioEconomicData into mock store`);
      } catch (err) {
        console.warn('⚠️ Could not load SocioEconomicData seed data:', (err as Error).message);
      }
      
      console.log('🎉 Seed data loaded successfully!');
    } catch (error) {
      console.warn('⚠️ Could not load seed data:', (error as Error).message);
    }
  }
  
  return {
    auth: () => ({
      getCurrentUser: async () => null,
      login: async () => ({}),
      logout: async () => ({}),
    }),
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
        insertRow: async (row: any) => {
          console.log(`💾 MOCK: Inserting row into ${tableName}`);
          if (!mockDataStore.tables.has(tableName)) {
            mockDataStore.tables.set(tableName, new Map());
          }
          const table = mockDataStore.tables.get(tableName)!;
          const rowId = `MOCK_ROW_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const rowData = { ROWID: rowId, ...row };
          table.set(rowId, rowData);
          return rowData;
        },
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
          return Array.from(table.values()).filter((row: any) => !row.ROWID.startsWith('MOCK_ROW'));
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
          
          // Parse WHERE clause
          const whereClauseMatch = query.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);
          if (whereClauseMatch) {
            const rawWhere = whereClauseMatch[1].trim();
            const equalsMatches = Array.from(rawWhere.matchAll(/(\w+)\s*=\s*'([^']+)'/g));

            if (equalsMatches.length > 0) {
              let matches = Array.from(table.values()).filter((row: any) => {
                if (rawWhere.toUpperCase().includes(' OR ')) {
                  return equalsMatches.some(([, col, val]) => {
                    return row[col] === val || row.ROWID === val || row.id === val;
                  });
                } else {
                  return equalsMatches.every(([, col, val]) => {
                    if (col === 'ROWID') {
                      return row.ROWID === val || row.id === val || row.fir_no === val;
                    }
                    return row[col] === val || row.id === val;
                  });
                }
              });

              // Special fallback for fir_no if not found
              const firMatch = rawWhere.match(/fir_no\s*=\s*'([^']+)'/i);
              if (matches.length === 0 && firMatch) {
                const firNo = firMatch[1];
                let row: any = null;
                try {
                  const seedPath = path.join(process.cwd(), 'data', 'seed', `${tableName}.json`);
                  if (fs.existsSync(seedPath)) {
                    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
                    const found = seedData.find((item: any) => item.fir_no === firNo || item.id === firNo);
                    if (found) {
                      row = { ROWID: `MOCK_ROW_${Date.now()}`, ...found };
                      table.set(row.ROWID, row);
                    }
                  }
                } catch (e) {}

                if (!row && firNo.startsWith('FIR-')) {
                  row = {
                    ROWID: `MOCK_ROW_${Date.now()}`,
                    fir_no: firNo,
                    case_no: `CASE-${Date.now().toString().slice(-6)}`,
                    crime_type_en: 'Cyber Fraud / Financial Scam',
                    description: 'Uploaded FIR document under processing.',
                    date: new Date().toISOString().split('T')[0],
                    police_station_id: 'PS-CyberCrime-01',
                    status_en: 'Under Investigation',
                    ocr_status: 'pending'
                  };
                  table.set(row.ROWID, row);
                }

                if (row) {
                  matches = [row];
                }
              }

              console.log(`📊 MOCK ZCQL: Found ${matches.length} matching rows in ${tableName}`);
              return matches.map(row => ({ [tableName]: row }));
            }
          }
          
          // Return all rows if no WHERE clause
          const allRows = Array.from(table.values())
            .filter((row: any) => !String(row.ROWID || '').includes('firno_'));
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
                  
                  // Extract field = 'value' pairs (strings, including multi-line values and escaped quotes)
                  const fieldMatches = setClauses.matchAll(/(\w+)\s*=\s*'((?:''|[^'])*)'/g);
                  for (const match of fieldMatches) {
                    const [, field, value] = match;
                    const unescaped = value.replace(/''/g, "'");
                    console.log(`🔧 MOCK: Setting ${field} (length: ${unescaped.length} chars)`);
                    targetRow[field] = unescaped;
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
    }),
    zia: () => ({
      speechToText: async ({ audio, language_code }: any) => {
        console.log(`🎙️ MOCK ZIA: Transcribing audio (${language_code})`);
        return { text: language_code === 'kn-IN' ? 'ವಾಹನ ಕಳ್ಳತನ' : 'Show me vehicle theft cases in Bengaluru.' };
      },
      textToSpeech: async ({ text, language_code }: any) => {
        console.log(`🔊 MOCK ZIA: Synthesizing speech (${language_code}): ${text}`);
        return new ArrayBuffer(0);
      }
    }),
    quickml: () => ({
      predict: async ({ prompt, context }: any) => {
        console.log(`🧠 MOCK QuickML: Generating response for prompt: "${prompt}"`);
        
        const evidence = context.ragContext || [];
        let dataCount = 0;
        let dataSummary = "";
        
        evidence.forEach((e: any) => {
          if (Array.isArray(e.data)) {
            dataCount += e.data.length;
            if (dataCount > 0 && !dataSummary) {
              const first = e.data[0];
              if (first.crime_type_en) {
                dataSummary = `Most of these are related to ${first.crime_type_en}. For example, Case ${first.case_no} (Status: ${first.status_en}).`;
              }
            }
          }
        });

        if (dataCount === 0) {
          return { text: "Based on the intelligence database, I couldn't find any relevant records matching your request." };
        }

        const responseText = `I analyzed ${dataCount} relevant records from the database regarding your query about "${prompt}". ${dataSummary} Please review the data table below for full details on the retrieved FIRs and cases.`;
        
        return { text: responseText };
      },
      embeddings: async ({ text }: any) => {
        console.log(`🧠 MOCK QuickML: Generating embeddings for "${text}"`);
        return { embedding: [0.1, 0.2, 0.3] };
      }
    })
  };
}
