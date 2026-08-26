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
  ['FIRs', 'Persons', 'Vehicles', 'PhoneRecords', 'Weapons', 'BankAccounts', 'EntityRelationships', 'Embeddings', 'Districts', 'Notifications', 'SystemHealth'].forEach(table => {
    globalAny.__mockDataStore.tables.set(table, new Map());
  });
}

// Ensure all new tables exist in case of hot-reload from an older global state
['Districts', 'Notifications', 'SystemHealth'].forEach(table => {
  if (!globalAny.__mockDataStore.tables.has(table)) {
    globalAny.__mockDataStore.tables.set(table, new Map());
  }
});

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

          // Parse strict WHERE clause (simplified and safe)
          const whereMatch = query.match(/WHERE\s+(\w+)\s*=\s*'([^']+)'/i);
          if (whereMatch) {
            const [, fieldName, fieldValue] = whereMatch;
            
            // Scan all rows for matching field
            let matchingRows: any[] = [];
            for (const [key, value] of table.entries()) {
              if (String(value[fieldName]).toLowerCase() === String(fieldValue).toLowerCase()) {
                matchingRows.push(value);
              }
            }

            if (matchingRows.length > 0) {
              const limitMatch = query.match(/LIMIT\s+(\d+)/i);
              const limit = limitMatch ? parseInt(limitMatch[1], 10) : 20;
              console.log(`✅ MOCK: Found ${matchingRows.length} rows for ${fieldName}=${fieldValue}`);
              return matchingRows.slice(0, limit).map((r: any) => ({ [tableName]: r }));
            }

            if (matchingRows.length === 0 && fieldValue.startsWith('FIR-')) {
              // Dynamically create entry for newly ingested FIR
              let row: any = {
                ROWID: `MOCK_ROW_${Date.now()}`,
                fir_no: fieldValue,
                case_no: `CASE-${Date.now().toString().slice(-6)}`,
                crime_type_en: 'Cyber Fraud / Financial Scam',
                description: 'Uploaded FIR document under processing.',
                status_en: 'Under Investigation',
                district_id: 'DIST_1',
                police_station_id: 'PS_1',
                date: new Date().toISOString().split('T')[0]
              };
              table.set(row.ROWID, row);
              console.log(`📄 MOCK: Created dynamic FIR: ${fieldValue}`);
              return [{ [tableName]: row }];
            } else {
              console.log(`❌ MOCK: ${fieldName}=${fieldValue} not found anywhere. Returning generic rows for demo.`);
              const limitMatch = query.match(/LIMIT\s+(\d+)/i);
              const limit = limitMatch ? parseInt(limitMatch[1], 10) : 20;
              return allRows.slice(0, limit).map((r: any) => ({ [tableName]: r }));
            }
          }
          
          // Return all rows if no condition matched
          const limitMatch = query.match(/LIMIT\s+(\d+)/i);
          const limit = limitMatch ? parseInt(limitMatch[1], 10) : 20;
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
        const groqKey = process.env.GROQ_API_KEY;
        const prompt = inputData.prompt || '';
        
        if (groqKey) {
          try {
            console.log('🤖 MOCK QuickML: Forwarding to Groq API for realistic mock');
            let systemMessage = "You are an expert AI Intelligence Copilot for the Karnataka State Police. Based on the provided Context (JSON data of FIRs, Cases, etc.), answer the User's Query clearly and concisely in natural language. DO NOT output any SQL, Python code, or instructions on how to query. Simply summarize the records from the context.";
            let userMessage = prompt;
            
            if (inputData.context) {
               userMessage = `Context:\n${inputData.context}\n\nQuery:\n${prompt}`;
            }

            const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
              },
              body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                  { role: 'system', content: systemMessage },
                  { role: 'user', content: userMessage }
                ],
                temperature: 0.3
              })
            });

            if (response.ok) {
              const data = await response.json();
              const text = data.choices[0].message.content || "No response generated";
              return { text };
            } else {
              const errorText = await response.text();
              console.warn('❌ MOCK QuickML Groq API fallback failed:', errorText);
              return { text: `API Error: The Groq API returned an error. Details: ${errorText}` };
            }
          } catch (e: any) {
            console.error('❌ MOCK QuickML Groq API fallback error:', e);
            return { text: `API Connection Error: ${e.message}` };
          }
        }

        // Pure local mock without external API dependencies
        if (prompt.includes('intent classifier')) {
          console.log('🤖 MOCK QuickML: Intent classifier fallback triggered, throwing error to force heuristic classification.');
          throw new Error("Local intent classification fallback");
        }

        let contextArray = [];
        let queryIntent = "";
        try {
          if (inputData.context) {
            const parsedCtx = JSON.parse(inputData.context);
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
        if (queryIntent === 'CONVERSATIONAL') {
          summary += "Hello! I am the CrimeIntel Assistant. I can help you search for FIRs, analyze crime trends, and investigate connections. How can I assist you today?";
        } else if (totalRecords > 0) {
          const suspects = allItems.filter(i => i.type === 'Suspect' || i.name_en);
          const firs = allItems.filter(i => i.crime_type_en || i.type === 'FIR');
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
