import { getCatalystApp } from './index';

export interface CatalystEventPayload {
  eventName: 'FIR_CREATED' | 'PERSON_UPDATED' | 'CASE_STATUS_CHANGED' | 'ALERT_TRIGGERED';
  data: Record<string, any>;
  timestamp?: string;
}

/**
 * Catalyst Signals Client Wrapper
 * Handles pub/sub event broadcasting across the CrimeIntel platform.
 */
export const CatalystSignals = {
  /**
   * Publishes an event to Catalyst Signals event bus
   */
  publishEvent: async (payload: CatalystEventPayload): Promise<boolean> => {
    try {
      const app = getCatalystApp();
      if (app.signals) {
        await app.signals().publish({
          topic: 'crimeintel_events',
          event: payload.eventName,
          payload: {
            ...payload.data,
            timestamp: payload.timestamp || new Date().toISOString()
          }
        });
        return true;
      }
    } catch (e) {
      console.warn('Catalyst Signals publish note:', (e as Error).message);
    }
    return false;
  }
};
