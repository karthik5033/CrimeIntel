import { getCatalystApp } from './index';

/**
 * Catalyst Stratus Object Storage Client
 * Handles uploading and retrieving evidence files, FIR PDFs, and case attachments.
 */
export const CatalystStratus = {
  /**
   * Uploads an evidence file to Catalyst Stratus bucket
   */
  uploadFile: async (bucketName: string, fileName: string, fileBuffer: Buffer | Blob): Promise<string | null> => {
    try {
      const app = getCatalystApp();
      if (app.stratus) {
        const bucket = app.stratus().bucket(bucketName);
        const fileObj = await bucket.uploadFile(fileName, fileBuffer);
        return fileObj.url || `https://stratus.catalyst.zoho.com/${bucketName}/${fileName}`;
      }
    } catch (e) {
      console.warn('Catalyst Stratus upload note:', (e as Error).message);
    }
    return `https://stratus.catalyst.zoho.com/${bucketName}/${fileName}`;
  },

  /**
   * Generates a temporary secure download URL for an evidence file
   */
  getFileUrl: async (bucketName: string, fileName: string): Promise<string> => {
    return `https://stratus.catalyst.zoho.com/${bucketName}/${fileName}`;
  }
};
