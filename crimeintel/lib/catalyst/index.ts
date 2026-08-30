import path from 'path';
import fs from 'fs';
import { createFileStoreCatalystInstance } from '@/lib/db/fileStore';

export const catalystConfig = {
  projectId: process.env.CATALYST_PROJECT_ID || process.env.NEXT_PUBLIC_CATALYST_PROJECT_ID || '55949000000013025',
  environment: process.env.CATALYST_ENV || process.env.NEXT_PUBLIC_CATALYST_ENV || 'Development',
  projectName: 'Project-Rainfall'
};

let catalystInstance: any = null;

// USE_MOCK is only true in test environments now; local dev uses the persistent FileStore
const USE_MOCK = process.env.NODE_ENV === 'test';

// Persistent mock data store (shared across requests and Next.js hot-reloads)
const globalAny = global as any;

  globalAny.__mockDataStore = {
    files: new Map<string, any>(),
    tables: new Map<string, Map<string, any>>() // tableName -> Map<rowId, rowData>
  };

  // Initialize tables
  ['FIRs', 'Persons', 'Vehicles', 'PhoneRecords', 'Weapons', 'BankAccounts', 'EntityRelationships', 'Embeddings', 'Districts', 'Notifications', 'SystemHealth', 'PoliceStations'].forEach(table => {
    globalAny.__mockDataStore.tables.set(table, new Map());
  });

// Ensure all new tables exist in case of hot-reload from an older global state
['Districts', 'Notifications', 'SystemHealth'].forEach(table => {
  if (!globalAny.__mockDataStore.tables.has(table)) {
    globalAny.__mockDataStore.tables.set(table, new Map());
  }
});

const mockDataStore = globalAny.__mockDataStore;

// Singleton init promise to deduplicate concurrent init calls
let initPromise: Promise<any> | null = null;

/**
 * getCatalystApp - Returns the Catalyst SDK app instance.
 * 
 * CRITICAL DESIGN: This function is NOT async. It returns the cached instance
 * synchronously when available. This is required because 40+ callers in the
 * codebase call it without `await`.
 * 
 * On first call (before eager init completes), it returns the mock instance
 * to avoid breaking callers. The eager init at module load populates the
 * real instance for subsequent calls.
 */
export function getCatalystApp(req?: any): any {
  // If running in browser client, throw error
  if (typeof window !== 'undefined') {
    throw new Error('Catalyst SDK cannot be used on the client. Use API routes instead.');
  }

  // Return existing instance if already initialized
  if (catalystInstance) {
    return catalystInstance;
  }

  // If mock mode (tests only), return file store instance
  if (USE_MOCK) {
    catalystInstance = createFileStoreCatalystInstance();
    return catalystInstance;
  }

  // Async init hasn't completed yet — return file store for now.
  // The eager init will replace this with the real Catalyst SDK once ready.
  console.warn('⚠️ Catalyst SDK not yet initialized. Using FileStore temporarily.');
  catalystInstance = createFileStoreCatalystInstance();
  return catalystInstance;
}

/**
 * Async version of getCatalystApp for callers that CAN await.
 * Waits for the real SDK to initialize before returning.
 */
export async function getCatalystAppAsync(req?: any): Promise<any> {
  if (catalystInstance) return catalystInstance;
  
  if (USE_MOCK) {
    catalystInstance = createFileStoreCatalystInstance();
    return catalystInstance;
  }

  // Wait for eager init to complete
  if (initPromise) {
    return initPromise;
  }

  // Trigger init if not started
  initPromise = performAsyncInit();
  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

/**
 * Synchronous accessor for callers that cannot await.
 * Returns the cached instance or null if not yet initialized.
 * Most callers should use getCatalystApp() instead.
 */
export function getCatalystAppSync(): any {
  if (catalystInstance) return catalystInstance;
  if (USE_MOCK) {
    catalystInstance = createFileStoreCatalystInstance();
    return catalystInstance;
  }
  return null;
}

async function performAsyncInit(): Promise<any> {
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
    
    // Strategy 3: OAuth Refresh Token authentication
    const clientId = process.env.CATALYST_CLIENT_ID;
    const clientSecret = process.env.CATALYST_CLIENT_SECRET;
    const refreshToken = process.env.CATALYST_REFRESH_TOKEN;
    
    if (clientId && clientSecret && refreshToken) {
      try {
        console.log('🔑 Using OAuth Refresh Token authentication');
        const { getSharedAccessToken } = require('./auth');
        const accessToken = await getSharedAccessToken();
        catalystInstance = catalyst.initialize({
          type: 'token',
          token: accessToken,
          project_id: catalystConfig.projectId,
          environment: catalystConfig.environment
        });
        console.log('✅ OAuth Refresh Token authentication successful');
        return catalystInstance;
      } catch (oauthError) {
        console.warn('⚠️ OAuth Refresh Token authentication failed:', (oauthError as Error).message);
      }
    }
    
    // Fallback: Try Client ID/Secret without refresh token
    if (clientId && clientSecret) {
      try {
        console.log('🔑 Using Client ID/Secret authentication (fallback)');
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
    
    throw new Error(
      'Catalyst SDK initialization failed. Please run: catalyst login\n' +
      'Or set CATALYST_TOKEN in .env.local'
    );
    
  } catch (error) {
    console.warn('⚠️ Catalyst initialization failed:', (error as Error).message);
    
    // Fall back to persistent FileStore for local development.
    // On AppSail, Catalyst SDK always initializes successfully so this branch is never hit.
    console.warn('💾 Falling back to FileStore (persistent local store) for development.');
    catalystInstance = createFileStoreCatalystInstance();
    return catalystInstance;
  }
}

// ── Eager initialization at module load ──────────────────────────────────
// Kick off SDK init as soon as this module is first imported.
// By the time the first API request arrives, catalystInstance should already be populated.
if (typeof window === 'undefined') {
  getCatalystAppAsync().catch((err: Error) => {
    console.warn('⚠️ Eager Catalyst init failed, will use mock:', err.message);
  });
}

// Mock Catalyst instance for development/testing
function createMockCatalystInstance() {
  // Load seed data on first initialization or if Districts is missing
  if (!mockDataStore.tables.get('FIRs')?.size || !mockDataStore.tables.get('Districts')?.size) {
    console.log('📦 Loading seed data into mock store...');
    try {
      const firsSeed = require('../../data/seed/FIRs.json');
      const personsSeed = require('../../data/seed/Persons.json');
      const vehiclesSeed = require('../../data/seed/Vehicles.json');
      const relationshipsSeed = require('../../data/seed/EntityRelationships.json');
      const districtsSeed = require('../../data/seed/Districts.json');
      const notificationsSeed = require('../../data/seed/Notifications.json');
      const systemHealthSeed = require('../../data/seed/SystemHealth.json');
      const policeStationsSeed = require('../../data/seed/PoliceStations.json');
      
      // Load PoliceStations
      const psTable = mockDataStore.tables.get('PoliceStations')!;
      policeStationsSeed.forEach((ps: any) => {
        psTable.set(ps.id, { ROWID: ps.id, ...ps });
      });
      console.log(`✅ Loaded ${policeStationsSeed.length} PoliceStations into mock store`);

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
      
      // Load Districts
      const districtsTable = mockDataStore.tables.get('Districts')!;
      districtsSeed.forEach((dist: any) => {
        districtsTable.set(dist.id, { ROWID: dist.id, ...dist });
      });
      console.log(`✅ Loaded ${districtsSeed.length} Districts into mock store`);

      // Load Notifications
      const notificationsTable = mockDataStore.tables.get('Notifications')!;
      notificationsSeed.forEach((notif: any) => {
        notificationsTable.set(notif.id, { ROWID: notif.id, ...notif });
      });
      console.log(`✅ Loaded ${notificationsSeed.length} Notifications into mock store`);

      // Load System Health
      const systemHealthTable = mockDataStore.tables.get('SystemHealth')!;
      systemHealthSeed.forEach((health: any) => {
        systemHealthTable.set(health.id, { ROWID: health.id, ...health });
      });
      console.log(`✅ Loaded ${systemHealthSeed.length} SystemHealth records into mock store`);
      
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
        insertRow: async (row: any) => {
          console.log(`💾 MOCK: Inserting 1 row into ${tableName}`);
          if (!mockDataStore.tables.has(tableName)) {
            mockDataStore.tables.set(tableName, new Map());
          }
          const table = mockDataStore.tables.get(tableName)!;
          const rowId = `MOCK_ROW_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
        // Use direct API if configured (avoids fake local search when we want real data)
        if (process.env.USE_MOCK_CATALYST !== 'true' && process.env.CATALYST_CLIENT_ID) {
           console.log('🔍 PROXY ZCQL:', query.substring(0, 150));
           const { queryDataStore } = require('./direct-api');
           return await queryDataStore(query);
        }
        
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
          
          // Get all base rows first
          let allRows = Array.from(table.values())
            .filter((row: any) => !String(row.ROWID || '').includes('firno_'));

          // Check if it's a LIKE query (full-text search)
          const likeMatch = query.match(/LIKE\s+'%([^%]+)%'/i);
          if (likeMatch) {
            const searchTerm = likeMatch[1].toLowerCase();
            allRows = allRows.filter((row: any) => {
              // Search across all string fields in the row
              return Object.values(row).some(v => 
                typeof v === 'string' && v.toLowerCase().includes(searchTerm)
              );
            });
            console.log(`📊 MOCK: LIKE query matched ${allRows.length} rows from ${tableName}`);
            return allRows.map(row => ({ [tableName]: row }));
          }

          // Parse WHERE clause to handle multiple AND conditions
          const whereIndex = query.toUpperCase().indexOf('WHERE');
          if (whereIndex !== -1) {
            let whereClause = query.substring(whereIndex + 5).trim();
            
            // Remove LIMIT if present
            const limitIndex = whereClause.toUpperCase().indexOf('LIMIT');
            let limit = 2000;
            if (limitIndex !== -1) {
              const limitStr = whereClause.substring(limitIndex + 5).trim();
              limit = parseInt(limitStr, 10) || 2000;
              whereClause = whereClause.substring(0, limitIndex).trim();
            }

            // Split conditions by AND
            const conditionsStr = whereClause.split(/\s+AND\s+/i);
            const conditions = conditionsStr.map(cond => {
              const match = cond.trim().match(/([\w\.]+)\s*(?:=|LIKE)\s*'([^']+)'/i);
              return match ? { field: match[1].replace('FIRs.', ''), value: match[2], isLike: cond.toUpperCase().includes('LIKE') } : null;
            }).filter(c => c !== null);

            if (conditions.length > 0) {
              // Scan all rows to see which ones match all conditions
              let matchingRows: any[] = [];
              for (const [key, value] of table.entries()) {
                let matchesAll = true;
                for (const cond of conditions) {
                  if (!cond) continue;
                  const rowValue = String(value[cond.field] || '').toLowerCase();
                  const condValue = String(cond.value).toLowerCase();
                  
                  if (cond.isLike) {
                    const cleanTerm = condValue.replace(/%/g, '');
                    if (!rowValue.includes(cleanTerm)) {
                      matchesAll = false;
                      break;
                    }
                  } else {
                    if (rowValue !== condValue) {
                      matchesAll = false;
                      break;
                    }
                  }
                }
                
                if (matchesAll) {
                  matchingRows.push(value);
                }
              }

              if (matchingRows.length > 0) {
                console.log(`✅ MOCK: Found ${matchingRows.length} rows matching WHERE clause`);
                return matchingRows.slice(0, limit).map((r: any) => ({ [tableName]: r }));
              } else {
                console.log(`❌ MOCK: Found 0 rows matching WHERE clause`);
                return [];
              }
            }
          }
          
          // Return all rows if no condition matched
          const limitMatch = query.match(/LIMIT\s+(\d+)/i);
          const limit = limitMatch ? parseInt(limitMatch[1], 10) : 2000;
          console.log(`📊 MOCK: Returning ${limit} rows from ${tableName} out of ${allRows.length} total`);
          return allRows.slice(0, limit).map(row => ({ [tableName]: row }));
        }
        
        // Parse UPDATE queries
        if (query.toUpperCase().includes('UPDATE')) {
          const tableMatch = query.match(/UPDATE\s+(\w+)/i);
          const tableName = tableMatch ? tableMatch[1] : 'FIRs';
          
          // Parse WHERE clause for UPDATE (simplified)
          const whereMatch = query.match(/WHERE\s+(?:(\w+)\s*=\s*'([^']+)'|ROWID\s*=\s*([^\s]+))/i);
          
          if (whereMatch) {
            const fieldName = whereMatch[1];
            const fieldValue = whereMatch[2];
            const rowId = whereMatch[3];
            
            const table = mockDataStore.tables.get(tableName);
            if (table) {
              let targetRow: any = null;
              let targetKey: string = '';
              
              // Find the row to update
              if (fieldName && fieldValue) {
                // Scan for row by field name/value
                for (const [key, value] of table.entries()) {
                  if (value[fieldName] === fieldValue) {
                    targetRow = value;
                    targetKey = key;
                    console.log(`🔍 MOCK: Found row by ${fieldName}=${fieldValue} (key: ${key})`);
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
                console.log(`🔑 MOCK: Searched for:`, fieldName ? `${fieldName}=${fieldValue}` : `ROWID=${rowId}`);
              }
            }
          }
          console.log('💾 MOCK: Update query executed (generic fallback)');
          return { affected_rows: 1 };
        }
        
        // Parse INSERT queries
        if (query.toUpperCase().includes('INSERT INTO')) {
          const tableMatch = query.match(/INSERT\s+INTO\s+(\w+)/i);
          const tableName = tableMatch ? tableMatch[1] : 'FIRs';
          
          const table = mockDataStore.tables.get(tableName);
          if (table) {
            // Very simple regex for VALUES ('val1', 'val2')
            const valuesMatch = query.match(/VALUES\s*\((.+?)\)/i);
            const columnsMatch = query.match(/\((.+?)\)\s+VALUES/i);
            
            if (valuesMatch && columnsMatch) {
              const cols = columnsMatch[1].split(',').map(c => c.trim());
              const vals = valuesMatch[1].split(',').map(v => v.trim().replace(/^'|'$/g, '').replace(/''/g, "'"));
              
              const newRow: any = { ROWID: `MOCK_ROW_${Date.now()}` };
              cols.forEach((col, idx) => {
                newRow[col] = vals[idx];
              });
              
              table.set(newRow.ROWID, newRow);
              console.log(`💾 MOCK: Inserted new row into ${tableName}:`, newRow.ROWID);
              return { affected_rows: 1, ROWID: newRow.ROWID };
            }
          }
          console.log('💾 MOCK: Insert query executed (generic fallback)');
          return { affected_rows: 1, ROWID: `MOCK_ROW_${Date.now()}` };
        }
        
        return [];
      }
    }),
    quickML: () => ({
      predict: async (endpointKey: string, inputData: any) => {
        // Parse the new messages format
        let prompt = inputData.prompt || '';
        let systemPrompt = '';
        let rawContext = inputData.context || '';
        
        if (inputData.messages && Array.isArray(inputData.messages)) {
          const sysMsg = inputData.messages.find((m: any) => m.role === 'system');
          if (sysMsg) systemPrompt = sysMsg.content;
          
          const userMsg = inputData.messages.find((m: any) => m.role === 'user');
          if (userMsg) {
            const userContent = userMsg.content;
            const contextParts = userContent.split('\n\nContext: ');
            prompt = contextParts[0] || '';
            if (prompt.startsWith('Query: ')) {
              prompt = prompt.substring(7);
            }
            if (contextParts.length > 1) {
              rawContext = contextParts[1];
            }
          }
        }

        // Mock 1: Reasoning Engine
        if (systemPrompt.includes('Criminological Reasoning Engine') || prompt.includes('Routine Activity Theory')) {
           return {
             text: JSON.stringify({
               id: `res-${Date.now()}`,
               query: prompt,
               claim: "Identified potential organized crime patterns based on the provided context.",
               mechanisms: [
                 {
                   name: "Routine Activity Patterns",
                   description: "Multiple incidents occur at similar times and locations, suggesting a structured approach.",
                   theory: "Routine Activity Theory",
                   factors: ["Temporal clustering", "Spatial clustering"]
                 }
               ],
               evidence: [
                 { id: "sys-01", type: "Statistic", description: "Aggregated incident reports indicating a trend." }
               ],
               alternatives: [
                 {
                   hypothesis: "Random unrelated incidents",
                   status: "Rejected",
                   reasoning: "The similarity in MO and geographic proximity reduces the likelihood of random chance."
                 }
               ],
               confidence: {
                 level: "High",
                 score: 85,
                 factors: ["Consistent modus operandi", "Repeated suspect descriptions"]
               },
               timestamp: new Date().toISOString()
             })
           };
        }

        // Mock 2: Intent Classifier
        if (prompt.includes('investigative assistant intent classifier')) {
          throw new Error("Mock QuickML Intent Classifier offline to trigger robust heuristic fallback");
        }

        // Mock 3: Chat Summary
        let contextArray = [];
        let queryIntent = "";
        try {
          if (rawContext) {
            const parsedCtx = JSON.parse(rawContext);
            contextArray = parsedCtx.ragContext || [];
            queryIntent = parsedCtx.intent || "";
          }
        } catch (e) {}

        let totalRecords = 0;
        let allItems: any[] = [];
        contextArray.forEach((ctx: any) => {
          if (ctx.data && Array.isArray(ctx.data)) {
            totalRecords += ctx.data.length;
            allItems.push(...ctx.data);
          }
        });

        let summary = "";
        if (queryIntent === 'CONVERSATIONAL' || (!prompt.includes('murder') && !prompt.includes('theft') && totalRecords === 0)) {
          summary += "Hello! I am the CrimeIntel Assistant. I can help you search for FIRs, analyze crime trends, and investigate connections. How can I assist you today?";
        } else if (totalRecords > 0) {
          const suspects = allItems.filter(i => i.type === 'Suspect' || i.name_en);
          const firs = allItems.filter(i => i.crime_type_en || i.type === 'FIR' || i.fir_no);
          const analytics = allItems.filter(i => i.type === 'AnalyticsResult');
          
          if (analytics.length > 0) {
            summary += `I have analyzed the intelligence data to answer your analytical query. `;
            const hotspots = analytics.filter(a => a.metric === 'Hotspot');
            if (hotspots.length > 0) {
              summary += `The top crime hotspots are: `;
              const hotspotStrings = hotspots.map(h => `${h.location} (${h.incident_count} incidents)`);
              summary += `${hotspotStrings.join(', ')}. `;
            } else {
              analytics.forEach(a => {
                if (a.analysis) summary += `${a.analysis} `;
              });
            }
          }
          
          if (suspects.length > 0) {
            const names = Array.from(new Set(suspects.map(s => s.title || s.name_en))).join(', ');
            summary += `I have located ${suspects.length} suspect profile${suspects.length > 1 ? 's' : ''}, specifically for ${names}. `;
          }
          
          if (firs.length > 0) {
            const crimeTypes = Array.from(new Set(firs.map(f => f.crime_type_en || f.primary_crime_type).filter(Boolean)));
            const statuses = Array.from(new Set(firs.map(f => f.status_en).filter(Boolean)));
            
            summary += `I found ${firs.length} incident record${firs.length > 1 ? 's' : ''}`;
            if (crimeTypes.length > 0) {
              summary += ` primarily involving ${crimeTypes.join(' and ')}`;
            }
            summary += `. `;
            
            if (statuses.length > 0) {
              summary += `The current statuses of these cases include: ${statuses.join(', ')}. `;
            }
          }
          
          summary += "\n\nPlease review the data table and semantic matches below for full details.";
        } else {
          summary += "I've scanned the databases but couldn't find any specific intelligence matching your query. Try broadening your search or providing a different name/keyword.";
        }

        return { text: summary };
      },
      embeddings: async (endpointKey: string, inputData: any) => {
        console.log(`🧠 MOCK QuickML embeddings called for endpoint: ${endpointKey}`);
        return { embedding: new Array(768).fill(0.1) };
      }
    }),
    nosql: () => ({
      table: (tableName: string) => ({
        insertItems: async ({ item }: any) => {
          console.log(`💾 MOCK NoSQL: Inserting 1 item into ${tableName}`);
          if (!mockDataStore.tables.has(tableName)) {
            mockDataStore.tables.set(tableName, new Map());
          }
          const table = mockDataStore.tables.get(tableName);
          // Just store it directly for mock purposes
          const id = Date.now().toString();
          table.set(id, item);
          return { status: 'success' };
        },
        updateItems: async ({ keys, update_attributes }: any) => {
          console.log(`💾 MOCK NoSQL: Updating items in ${tableName}`);
          return { status: 'success' };
        },
        fetchItem: async ({ keys }: any) => {
          console.log(`🔍 MOCK NoSQL: Fetching item from ${tableName}`);
          // Return an empty array in mock mode to simulate not found, or a generic mock object if needed
          return [];
        },
        deleteItems: async ({ keys }: any) => {
          console.log(`🗑️ MOCK NoSQL: Deleting item from ${tableName}`);
          return { status: 'success' };
        }
      })
    })
  };
}
