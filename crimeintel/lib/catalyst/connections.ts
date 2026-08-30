import { getCatalystAppAsync } from './index';

/**
 * Catalyst Connections Client Wrapper
 * Manages OAuth tokens and 3rd-party integration credentials (Zoho, Maps APIs, external police databases).
 */
export const CatalystConnections = {
  /**
   * Retrieves an active OAuth access token from Catalyst Connections store
   */
  getAccessToken: async (connectorName: string): Promise<string | null> => {
    try {
      const app = await getCatalystAppAsync();
      if (app.connection) {
        const conn = await app.connection(connectorName).getAccessToken();
        return conn;
      }
    } catch (e) {
      console.warn('Catalyst Connections note:', (e as Error).message);
    }
    return null;
  }
};
