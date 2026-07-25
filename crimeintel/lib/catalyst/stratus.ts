import { getCatalystApp } from './index';

/**
 * Catalyst Stratus Object Storage Client
 * Handles uploading and retrieving evidence files, FIR PDFs, and case attachments.
 * 
 * Phase 1 Integration: FIR Upload Pipeline
 * - Upload FIR PDFs to Stratus
 * - Store only URLs in Data Store (not PDFs themselves)
 * - Support OCR processing workflow
 */

// Updated to match actual Catalyst Stratus bucket name (no underscores allowed)
const FIR_BUCKET_NAME = 'firdocuments';
const EVIDENCE_BUCKET_NAME = 'evidencefiles';

interface UploadResult {
  fileId: string;
  fileName: string;
  fileUrl: string;
  bucketName: string;
  uploadTime: string;
  fileSize: number;
}

export const CatalystStratus = {
  /**
   * Phase 1 Step 1: Upload FIR PDF to Stratus
   * 
   * @param file - File object or Buffer
   * @param firNumber - FIR number for naming convention
   * @returns Upload metadata including fileId and URL
   */
  uploadFIR: async (file: File | Buffer, firNumber?: string): Promise<UploadResult> => {
    console.log('🔧 Starting uploadFIR...');
    console.log('File type:', file instanceof Buffer ? 'Buffer' : 'File');
    console.log('File size:', file instanceof Buffer ? file.length : file.size);
    
    const app = getCatalystApp();
    const filestream = app.filestore();
    
    if (!filestream) {
      throw new Error('Catalyst Stratus not initialized. Check your Catalyst configuration.');
    }

    try {
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const originalName = file instanceof File ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : 'document.pdf';
      const fileName = firNumber 
        ? `FIR_${firNumber}_${timestamp}.pdf`
        : `FIR_${timestamp}_${originalName}`;

      console.log('📝 Generated filename:', fileName);

      // Get bucket
      const bucket = filestream.bucket(FIR_BUCKET_NAME);
      console.log('📦 Got bucket:', FIR_BUCKET_NAME);
      
      // Convert file to buffer
      let fileBuffer: Buffer;
      let fileSize: number;
      
      if (file instanceof Buffer) {
        console.log('✅ File is already a Buffer');
        fileBuffer = file;
        fileSize = file.length;
      } else {
        console.log('🔄 Converting File to Buffer...');
        try {
          const arrayBuffer = await file.arrayBuffer();
          console.log('✅ Got ArrayBuffer, size:', arrayBuffer.byteLength);
          fileBuffer = Buffer.from(arrayBuffer);
          console.log('✅ Converted to Buffer, size:', fileBuffer.length);
          fileSize = file.size;
        } catch (conversionError) {
          console.error('❌ Failed to convert file:', conversionError);
          throw new Error(`File conversion failed: ${(conversionError as Error).message}`);
        }
      }

      // Verify buffer
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('File buffer is empty');
      }

      console.log('📤 Uploading to Stratus...');
      console.log('Upload params:', {
        code: fileName,
        name: fileName,
        bufferLength: fileBuffer.length
      });

      // Upload file to Catalyst Stratus
      const uploadedFile = await bucket.uploadFile({
        code: fileName,
        name: fileName,
        fileobj: fileBuffer
      });

      console.log('✅ Upload successful!');
      console.log('File ID:', uploadedFile.id);
      console.log('File URL:', uploadedFile.url);

      return {
        fileId: uploadedFile.id.toString(),
        fileName: fileName,
        fileUrl: uploadedFile.url || `${FIR_BUCKET_NAME}/${fileName}`,
        bucketName: FIR_BUCKET_NAME,
        uploadTime: new Date().toISOString(),
        fileSize: fileSize
      };
    } catch (error) {
      console.error('❌ Stratus upload error:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      throw new Error(`Failed to upload FIR to Stratus: ${(error as Error).message}`);
    }
  },

  /**
   * Phase 1 Step 1: Get FIR from Stratus
   * 
   * @param fileId - File ID from Stratus
   * @returns File download URL
   */
  getFIR: async (fileId: string): Promise<{ url: string; fileName: string }> => {
    const app = getCatalystApp();
    const filestream = app.filestore();
    
    if (!filestream) {
      throw new Error('Catalyst Stratus not initialized.');
    }

    try {
      const bucket = filestream.bucket(FIR_BUCKET_NAME);
      const file = await bucket.getFileDetails(fileId);
      
      // Generate download URL
      const downloadUrl = await bucket.getDownloadUrl(fileId);
      
      return {
        url: downloadUrl || file.url,
        fileName: file.file_name
      };
    } catch (error) {
      console.error('Stratus get file error:', error);
      throw new Error(`Failed to get FIR from Stratus: ${(error as Error).message}`);
    }
  },

  /**
   * Phase 1 Step 1: Delete FIR from Stratus
   * 
   * @param fileId - File ID to delete
   * @returns Success status
   */
  deleteFIR: async (fileId: string): Promise<boolean> => {
    const app = getCatalystApp();
    const filestream = app.filestore();
    
    if (!filestream) {
      throw new Error('Catalyst Stratus not initialized.');
    }

    try {
      const bucket = filestream.bucket(FIR_BUCKET_NAME);
      await bucket.deleteFile(fileId);
      return true;
    } catch (error) {
      console.error('Stratus delete file error:', error);
      throw new Error(`Failed to delete FIR from Stratus: ${(error as Error).message}`);
    }
  },

  /**
   * Upload evidence file (images, videos, documents)
   */
  uploadEvidence: async (file: File | Buffer, caseId: string, evidenceType: string): Promise<UploadResult> => {
    const app = getCatalystApp();
    const filestream = app.filestore();
    
    if (!filestream) {
      throw new Error('Catalyst Stratus not initialized.');
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = file instanceof File ? file.name.split('.').pop() : 'bin';
      const fileName = `${caseId}_${evidenceType}_${timestamp}.${extension}`;

      const bucket = filestream.bucket(EVIDENCE_BUCKET_NAME);
      
      let uploadedFile;
      if (file instanceof Buffer) {
        uploadedFile = await bucket.uploadFile({
          code: fileName,
          name: fileName,
          fileobj: file
        });
      } else {
        const buffer = Buffer.from(await file.arrayBuffer());
        uploadedFile = await bucket.uploadFile({
          code: fileName,
          name: fileName,
          fileobj: buffer
        });
      }

      return {
        fileId: uploadedFile.id.toString(),
        fileName: fileName,
        fileUrl: uploadedFile.url || `${EVIDENCE_BUCKET_NAME}/${fileName}`,
        bucketName: EVIDENCE_BUCKET_NAME,
        uploadTime: new Date().toISOString(),
        fileSize: file instanceof Buffer ? file.length : file.size
      };
    } catch (error) {
      console.error('Evidence upload error:', error);
      throw new Error(`Failed to upload evidence: ${(error as Error).message}`);
    }
  },

  /**
   * Generic file upload for backward compatibility
   */
  uploadFile: async (bucketName: string, fileName: string, fileBuffer: Buffer | Blob): Promise<string | null> => {
    try {
      const app = getCatalystApp();
      const filestream = app.filestore();
      
      if (filestream) {
        const bucket = filestream.bucket(bucketName);
        const buffer = fileBuffer instanceof Blob 
          ? Buffer.from(await fileBuffer.arrayBuffer())
          : fileBuffer;
          
        const fileObj = await bucket.uploadFile({
          code: fileName,
          name: fileName,
          fileobj: buffer
        });
        return fileObj.url || `${bucketName}/${fileName}`;
      }
    } catch (e) {
      console.warn('Catalyst Stratus upload error:', (e as Error).message);
      throw e;
    }
    return null;
  },

  /**
   * Get file download URL
   */
  getFileUrl: async (bucketName: string, fileId: string): Promise<string> => {
    try {
      const app = getCatalystApp();
      const filestream = app.filestore();
      
      if (filestream) {
        const bucket = filestream.bucket(bucketName);
        const url = await bucket.getDownloadUrl(fileId);
        return url;
      }
    } catch (e) {
      console.warn('Catalyst Stratus get URL error:', (e as Error).message);
    }
    return `${bucketName}/${fileId}`;
  },

  /**
   * Initialize FIR bucket (run once during setup)
   */
  initializeBuckets: async (): Promise<void> => {
    const app = getCatalystApp();
    const filestream = app.filestore();
    
    if (!filestream) {
      throw new Error('Catalyst Stratus not initialized.');
    }

    try {
      // Note: Buckets must be created via Catalyst Console
      // This method just verifies they exist
      const buckets = await filestream.getAllBuckets();
      const bucketNames = buckets.map((b: any) => b.bucket_name);
      
      if (!bucketNames.includes(FIR_BUCKET_NAME)) {
        console.warn(`Bucket "${FIR_BUCKET_NAME}" not found. Please create it in Catalyst Console.`);
      }
      
      if (!bucketNames.includes(EVIDENCE_BUCKET_NAME)) {
        console.warn(`Bucket "${EVIDENCE_BUCKET_NAME}" not found. Please create it in Catalyst Console.`);
      }
      
      console.log('Available buckets:', bucketNames.join(', '));
    } catch (error) {
      console.error('Failed to initialize buckets:', error);
    }
  }
};
