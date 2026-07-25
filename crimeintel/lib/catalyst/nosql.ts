import { getCatalystApp } from './index';

/**
 * Catalyst NoSQL Client
 * Handles storing chat sessions, reasoning outputs, document metadata, and unstructured search embeddings.
 */

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
      const app = getCatalystApp();
      const datastore = app.datastore();
      
      if (!datastore) {
        console.warn('⚠️ NoSQL not available, using fallback');
        return false;
      }

      const table = datastore.table('DocumentMetadata');
      
      const row = {
        file_id: metadata.fileId,
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
      };

      await table.insertRow(row);
      console.log('✅ Document metadata saved to NoSQL/DataStore');
      return true;
    } catch (error) {
      console.error('❌ Failed to save document metadata:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack
      });
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
      const app = getCatalystApp();
      const datastore = app.datastore();
      
      if (!datastore) {
        return false;
      }

      const table = datastore.table('DocumentMetadata');
      
      const updateData: any = {
        ocr_status: status,
        updated_at: new Date().toISOString()
      };

      if (ocrText) {
        updateData.ocr_text = ocrText;
      }

      if (extractedEntities) {
        updateData.extracted_entities = JSON.stringify(extractedEntities);
      }

      await table.updateRow({
        ROWID: fileId,
        ...updateData
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
      const app = getCatalystApp();
      const datastore = app.datastore();
      
      if (!datastore) {
        return null;
      }

      const table = datastore.table('DocumentMetadata');
      const rows = await table.getRows();
      
      const row = rows.find((r: any) => r.file_id === fileId);
      
      if (!row) {
        return null;
      }

      return {
        fileId: row.file_id,
        fileName: row.file_name,
        fileUrl: row.file_url,
        bucketName: row.bucket_name,
        firNumber: row.fir_number,
        uploadTime: row.upload_time,
        fileSize: row.file_size,
        ocrStatus: row.ocr_status,
        ocrText: row.ocr_text,
        extractedEntities: row.extracted_entities ? JSON.parse(row.extracted_entities) : undefined,
        crimeType: row.crime_type,
        policeStation: row.police_station,
        description: row.description
      };
    } catch (error) {
      console.error('❌ Failed to get document metadata:', error);
      return null;
    }
  },

  /**
   * List All Documents
   */
  listDocuments: async (): Promise<DocumentMetadata[]> => {
    try {
      const app = getCatalystApp();
      const datastore = app.datastore();
      
      if (!datastore) {
        return [];
      }

      const table = datastore.table('DocumentMetadata');
      const rows = await table.getRows();
      
      return rows.map((row: any) => ({
        fileId: row.file_id,
        fileName: row.file_name,
        fileUrl: row.file_url,
        bucketName: row.bucket_name,
        firNumber: row.fir_number,
        uploadTime: row.upload_time,
        fileSize: row.file_size,
        ocrStatus: row.ocr_status,
        ocrText: row.ocr_text,
        extractedEntities: row.extracted_entities ? JSON.parse(row.extracted_entities) : undefined,
        crimeType: row.crime_type,
        policeStation: row.police_station,
        description: row.description
      }));
    } catch (error) {
      console.error('❌ Failed to list documents:', error);
      return [];
    }
  },

  // Save Chat Session
  saveChatSession: async (sessionId: string, sessionData: any) => {
    try {
      const app = getCatalystApp();
      const datastore = app.datastore();
      if (datastore) {
        const table = datastore.table('ChatSessions');
        await table.insertRow({
          session_id: sessionId,
          data: JSON.stringify(sessionData),
          updated_at: new Date().toISOString()
        });
        return true;
      }
    } catch (e) {
      console.warn('Catalyst NoSQL saveChatSession fallback:', (e as Error).message);
    }
    return false;
  },

  // Get Chat Session
  getChatSession: async (sessionId: string) => {
    try {
      const app = getCatalystApp();
      const datastore = app.datastore();
      if (datastore) {
        const table = datastore.table('ChatSessions');
        const rows = await table.getRows();
        const row = rows.find((r: any) => r.session_id === sessionId);
        if (row && row.data) {
          return JSON.parse(row.data);
        }
      }
    } catch (e) {
      // Fallback
    }
    return null;
  },

  // Save Reasoning Output
  saveReasoningOutput: async (queryId: string, reasoning: any) => {
    try {
      const app = getCatalystApp();
      const datastore = app.datastore();
      if (datastore) {
        const table = datastore.table('ReasoningOutputs');
        await table.insertRow({
          query_id: queryId,
          claim: reasoning.claim,
          data: JSON.stringify(reasoning),
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Catalyst NoSQL saveReasoningOutput fallback');
    }
  }
};
