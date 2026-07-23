import { getCatalystApp } from './index';

export interface EmailOptions {
  toEmail: string;
  subject: string;
  content: string;
  htmlContent?: string;
  fromEmail?: string;
}

/**
 * Catalyst Mail Client Wrapper
 * Handles sending transactional emails for alerts, case assignments, and digests.
 */
export const CatalystMail = {
  /**
   * Sends transactional email using Catalyst Mail service
   */
  sendEmail: async (options: EmailOptions): Promise<boolean> => {
    try {
      const app = getCatalystApp();
      if (app.email) {
        await app.email().sendMail({
          from_email: options.fromEmail || 'alerts@crimeintel.ksp.gov.in',
          to_email: [options.toEmail],
          subject: options.subject,
          content: options.content,
          html_mode: options.htmlContent ? true : false,
          body: options.htmlContent || options.content,
        });
        return true;
      }
    } catch (e) {
      console.warn('Catalyst Mail send note:', (e as Error).message);
    }
    return false;
  },

  /**
   * Dispatches Critical Alert notification email
   */
  sendAlertNotification: async (toEmail: string, alertTitle: string, alertReasoning: string) => {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #ef4444;">🚨 CrimeIntel Critical Alert</h2>
        <h3>${alertTitle}</h3>
        <p>${alertReasoning}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">Karnataka State Police — CrimeIntel Automated Intelligence System</p>
      </div>
    `;
    return CatalystMail.sendEmail({
      toEmail,
      subject: `🚨 CRITICAL ALERT: ${alertTitle}`,
      content: alertReasoning,
      htmlContent: html
    });
  }
};
