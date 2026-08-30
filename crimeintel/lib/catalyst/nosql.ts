import { getCatalystAppAsync } from './index';

/**
 * Catalyst NoSQL Client
 * Handles storing chat sessions, reasoning outputs, document metadata, and unstructured search embeddings.
 */

/**
 * ChatSession Schema
 * Stored in Catalyst NoSQL ChatSessions table
 */
export interface ChatSession {
  session_id: string;           // Partition key
  updated_at: number;            // Last update timestamp (epoch ms)
  user_id?: string;              // Optional user identifier
  data: {
    entities: {
      crime_types: string[];
      districts: string[];
      person_names: string[];
      vehicle_numbers: string[];
      date_ranges: string[];
    };
    conversation_history: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    }>;
    active_context: {
      last_intent: string;
      last_query: string;
      accumulated_filters: Record<string, any>;
    };
  };
  ttl: number;                  // Epoch timestamp for auto-deletion (30 days)
}

/**
 * Creates an empty session template for new sessions
 */
export function createEmptySession(sessionId: string): ChatSession {
  const now = Date.now();
  const ttl = now + (30 * 24 * 60 * 60 * 1000); // 30 days from now
  
  return {
    session_id: sessionId,
    updated_at: now,
    data: {
      entities: {
        crime_types: [],
        districts: [],
        person_names: [],
        vehicle_numbers: [],
        date_ranges: []
      },
      conversation_history: [],
      active_context: {
        last_intent: '',
        last_query: '',
        accumulated_filters: {}
      }
    },
    ttl
  };
}

interface DocumentMetadata {
  fileId: string;
  fileName: string;
  fileUrl: string;
  bucketName: string;
  firNumber: string;
  uploadTime: string;
  fileSize: number;
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrText?: string;
  extractedEntities?: any;
  crimeType?: string;
  policeStation?: string;
  description?: string;
}

export const CatalystNoSQL = {
  /**
   * Save Document Metadata to NoSQL
   * Used for tracking FIR uploads, OCR status, and extracted entities
   */
  saveDocumentMetadata: async (metadata: DocumentMetadata): Promise<boolean> => {
    try {
      const app = await getCatalystAppAsync();
      // Ensure we use the proper NoSQL API instead of datastore
      const nosql = app.nosql();
      
      if (!nosql) {
        console.warn('⚠️ NoSQL not available, using fallback');
        return false;
      }

      const table = nosql.table('DocumentMetadata');
      
      // Use dynamic environment or context rather than hardcoding if needed
      // We import dynamically to avoid initialization issues during module load
      const { NoSQLItem } = require('zcatalyst-sdk-node/lib/no-sql');
      
      const item = NoSQLItem.from({
        file_id: metadata.fileId, // typically the partition key
        file_name: metadata.fileName,
        file_url: metadata.fileUrl,
        bucket_name: metadata.bucketName,
        fir_number: metadata.firNumber,
        upload_time: metadata.uploadTime,
        file_size: metadata.fileSize,
        ocr_status: metadata.ocrStatus,
        ocr_text: metadata.ocrText || null,
        extracted_entities: metadata.extractedEntities ? JSON.stringify(metadata.extractedEntities) : null,
        crime_type: metadata.crimeType || null,
        police_station: metadata.policeStation || null,
        description: metadata.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await table.insertItems({ item });
      console.log('✅ Document metadata saved to NoSQL');
      return true;
    } catch (error) {
      console.error('❌ Failed to save document metadata:', error);
      return false;
    }
  },

  /**
   * Update Document OCR Status
   */
  updateDocumentOCRStatus: async (
    fileId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    ocrText?: string,
    extractedEntities?: any
  ): Promise<boolean> => {
    try {
      const app = await getCatalystAppAsync();
      const nosql = app.nosql();
      
      if (!nosql) {
        return false;
      }

      const table = nosql.table('DocumentMetadata');
      const { NoSQLItem, NoSQLEnum, NoSQLMarshall } = require('zcatalyst-sdk-node/lib/no-sql');
      
      const updateAttributes = [
        {
          operation_type: NoSQLEnum.NoSQLUpdateOperationType.PUT,
          update_value: NoSQLMarshall.make(status),
          attribute_path: ['ocr_status']
        },
        {
          operation_type: NoSQLEnum.NoSQLUpdateOperationType.PUT,
          update_value: NoSQLMarshall.make(new Date().toISOString()),
          attribute_path: ['updated_at']
        }
      ];

      if (ocrText) {
        updateAttributes.push({
          operation_type: NoSQLEnum.NoSQLUpdateOperationType.PUT,
          update_value: NoSQLMarshall.make(ocrText),
          attribute_path: ['ocr_text']
        });
      }

      if (extractedEntities) {
        updateAttributes.push({
          operation_type: NoSQLEnum.NoSQLUpdateOperationType.PUT,
          update_value: NoSQLMarshall.make(JSON.stringify(extractedEntities)),
          attribute_path: ['extracted_entities']
        });
      }

      await table.updateItems({
        keys: NoSQLItem.from({ file_id: fileId }),
        update_attributes: updateAttributes
      });

      console.log('✅ Document OCR status updated');
      return true;
    } catch (error) {
      console.error('❌ Failed to update OCR status:', error);
      return false;
    }
  },

  /**
   * Get Document Metadata by File ID
   */
  getDocumentMetadata: async (fileId: string): Promise<DocumentMetadata | null> => {
    try {
      const app = await getCatalystAppAsync();
      const nosql = app.nosql();
      
      if (!nosql) {
        return null;
      }

      const table = nosql.table('DocumentMetadata');
      const { NoSQLItem, NoSQLUnMarshall } = require('zcatalyst-sdk-node/lib/no-sql');
      
      const response = await table.fetchItem({
        keys: NoSQLItem.from({ file_id: fileId }),
        consistent_read: true
      });
      
      if (response && response.length > 0) {
        const row = NoSQLUnMarshall.makeNative(response[0]);
        return {
          fileId: row.file_id as string,
          fileName: row.file_name as string,
          fileUrl: row.file_url as string,
          bucketName: row.bucket_name as string,
          firNumber: row.fir_number as string,
          uploadTime: row.upload_time as string,
          fileSize: row.file_size as number,
          ocrStatus: row.ocr_status as any,
          ocrText: row.ocr_text as string,
          extractedEntities: row.extracted_entities ? JSON.parse(row.extracted_entities as string) : undefined,
          crimeType: row.crime_type as string,
          policeStation: row.police_station as string,
          description: row.description as string
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get document metadata:', error);
      return null;
    }
  },

  // Save Chat Session
  saveChatSession: async (sessionId: string, sessionData: any): Promise<boolean> => {
    try {
      const app = await getCatalystAppAsync();
      const nosql = app.nosql();
      if (!nosql) {
        console.warn('⚠️ NoSQL not available, session not persisted');
        return false;
      }

      const table = nosql.table('ChatSessions');
      const { NoSQLItem, NoSQLEnum, NoSQLMarshall } = require('zcatalyst-sdk-node/lib/no-sql');
      
      const ttl = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days from now
      const updatedAt = Date.now();
      
      // Try update first (more efficient for existing sessions)
      try {
        const updateAttributes = [
          {
            operation_type: NoSQLEnum.NoSQLUpdateOperationType.PUT,
            update_value: NoSQLMarshall.make(JSON.stringify(sessionData)),
            attribute_path: ['data']
          },
          {
            operation_type: NoSQLEnum.NoSQLUpdateOperationType.PUT,
            update_value: NoSQLMarshall.make(updatedAt),
            attribute_path: ['updated_at']
          },
          {
            operation_type: NoSQLEnum.NoSQLUpdateOperationType.PUT,
            update_value: NoSQLMarshall.make(ttl),
            attribute_path: ['ttl']
          }
        ];
        
        await table.updateItems({
          keys: NoSQLItem.from({ session_id: sessionId }),
          update_attributes: updateAttributes
        });
        
        console.log(`✅ Updated session: ${sessionId}`);
        return true;
      } catch (updateError: any) {
        // If update fails (session doesn't exist), insert new
        if (updateError.message?.includes('not found') || updateError.code === 'ITEM_NOT_FOUND') {
          try {
            await table.insertItems({
              item: NoSQLItem.from({
                session_id: sessionId,
                data: JSON.stringify(sessionData),
                updated_at: updatedAt,
                ttl: ttl
              })
            });
            console.log(`✅ Created new session: ${sessionId}`);
            return true;
          } catch (insertError) {
            console.error('❌ Failed to insert session:', insertError);
            return false;
          }
        }
        console.error('❌ Failed to update session:', updateError);
        return false;
      }
    } catch (e) {
      console.warn('Catalyst NoSQL saveChatSession error:', (e as Error).message);
      return false;
    }
  },

  // Get Chat Session
  getChatSession: async (sessionId: string): Promise<ChatSession | null> => {
    try {
      const app = await getCatalystAppAsync();
      const nosql = app.nosql();
      if (!nosql) {
        console.warn('⚠️ NoSQL not available, returning empty session template');
        return createEmptySession(sessionId);
      }

      const table = nosql.table('ChatSessions');
      const { NoSQLItem, NoSQLUnMarshall } = require('zcatalyst-sdk-node/lib/no-sql');
      
      const response = await table.fetchItem({
        keys: NoSQLItem.from({ session_id: sessionId })
      });
      
      if (response && response.length > 0) {
        const row = NoSQLUnMarshall.makeNative(response[0]);
        if (row.data) {
          const sessionData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
          console.log(`✅ Retrieved session: ${sessionId}`);
          return {
            session_id: sessionId,
            updated_at: row.updated_at as number,
            user_id: row.user_id as string | undefined,
            data: sessionData,
            ttl: row.ttl as number
          };
        }
      }
      
      // Return empty template for new sessions (not null)
      console.log(`📝 New session (no existing data): ${sessionId}`);
      return createEmptySession(sessionId);
    } catch (e) {
      // Return null on error (distinguishable from new session)
      console.error('❌ Error fetching session:', (e as Error).message);
      return null;
    }
  },

  // Delete Chat Session
  deleteChatSession: async (sessionId: string) => {
    try {
      const app = await getCatalystAppAsync();
      const nosql = app.nosql();
      if (nosql) {
        const table = nosql.table('ChatSessions');
        const { NoSQLItem } = require('zcatalyst-sdk-node/lib/no-sql');
        
        await table.deleteItems({
          keys: NoSQLItem.from({ session_id: sessionId })
        });
        
        console.log(`✅ Deleted chat session ${sessionId} from NoSQL`);
        return true;
      }
    } catch (e) {
      console.warn('Catalyst NoSQL deleteChatSession fallback:', (e as Error).message);
    }
    return false;
  },

  // Save Reasoning Output
  saveReasoningOutput: async (queryId: string, reasoning: any) => {
    try {
      const app = await getCatalystAppAsync();
      const nosql = app.nosql();
      if (nosql) {
        const table = nosql.table('ReasoningOutputs');
        const { NoSQLItem } = require('zcatalyst-sdk-node/lib/no-sql');
        
        await table.insertItems({
          item: NoSQLItem.from({
            query_id: queryId,
            claim: reasoning.claim,
            data: JSON.stringify(reasoning),
            created_at: new Date().toISOString()
          })
        });
      }
    } catch (e) {
      console.warn('Catalyst NoSQL saveReasoningOutput fallback');
    }
  }
};
