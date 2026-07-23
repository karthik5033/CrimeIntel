import { getCatalystApp } from './index';

/**
 * Catalyst SmartBrowz Client
 * Headless browser PDF generation for reports, case files, and analytics export.
 */
export const CatalystSmartBrowz = {
  /**
   * Generates a PDF report from HTML content or URL using Catalyst SmartBrowz
   */
  generatePdf: async (htmlContent: string, title: string = 'CrimeIntel Report'): Promise<Buffer | null> => {
    try {
      const app = getCatalystApp();
      // Execute SmartBrowz service via Catalyst PDF/Headless Browser component
      if (app.smartbrowz) {
        const result = await app.smartbrowz().convertHtmlToPdf({
          html: htmlContent,
          options: {
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
          }
        });
        return result;
      }
    } catch (e) {
      console.warn('Catalyst SmartBrowz PDF note:', (e as Error).message);
    }
    return null;
  }
};
