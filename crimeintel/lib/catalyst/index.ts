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
    
    // Strategy 1: Use CLI authentication (from catalyst login)
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
    
    // Strategy 2: Token-based
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
            
            // Store by ROWID
            table.set(rowId, rowData);
            
            // ALSO store by fir_no for easy lookup
            if (row.fir_no) {
              const firKey = `firno_${row.fir_no}`;
              table.set(firKey, rowData);
              console.log(`📇 MOCK: Indexed ${tableName} row by fir_no: ${firKey}`);
            }
            
            return rowData;
          });
          console.log(`📊 MOCK: ${tableName} now has ${table.size} entries (including indexes)`);
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
            const key = `firno_${firNo}`;
            const row = table.get(key);
            
            if (row) {
              console.log(`✅ MOCK: Found FIR ${firNo}:`, Object.keys(row));
              return [{ [tableName]: row }];
            } else {
              console.log(`⚠️ MOCK: FIR ${firNo} not found. Available keys:`, Array.from(table.keys()).slice(0, 5));
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
          
          // Parse WHERE fir_no = 'X'
          const whereMatch = query.match(/WHERE\s+(?:fir_no\s*=\s*'([^']+)'|ROWID\s*=\s*([^\s]+))/i);
          
          if (whereMatch) {
            const firNo = whereMatch[1];
            const rowId = whereMatch[2];
            
            const table = mockDataStore.tables.get(tableName);
            if (table) {
              let targetRow: any = null;
              
              if (firNo) {
                targetRow = table.get(`firno_${firNo}`);
              } else if (rowId) {
                targetRow = table.get(rowId);
              }
              
              if (targetRow) {
                // Parse SET clauses
                const setMatch = query.match(/SET\s+(.+?)\s+WHERE/i);
                if (setMatch) {
                  const setClauses = setMatch[1];
                  // Simple parsing - extract field = 'value' pairs
                  const fieldMatches = setClauses.matchAll(/(\w+)\s*=\s*'([^']*)'/g);
                  for (const match of fieldMatches) {
                    const [, field, value] = match;
                    targetRow[field] = value;
                    console.log(`💾 MOCK: Updated ${tableName}.${field} = ${value.substring(0, 50)}...`);
                  }
                  // Also update numeric fields
                  const numMatches = setClauses.matchAll(/(\w+)\s*=\s*([0-9.]+)/g);
                  for (const match of numMatches) {
                    const [, field, value] = match;
                    targetRow[field] = parseFloat(value);
                    console.log(`💾 MOCK: Updated ${tableName}.${field} = ${value}`);
                  }
                }
                return { affected_rows: 1 };
              } else {
                console.log(`⚠️ MOCK: Row not found for update in ${tableName}`);
              }
            }
          }
          
          console.log('💾 MOCK: Update query executed (generic)');
          return { affected_rows: 1 };
        }
        
        return [];
      }
    })
  };
}
