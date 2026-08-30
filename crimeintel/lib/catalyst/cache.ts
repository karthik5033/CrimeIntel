import { getCatalystAppAsync } from './index';

/**
 * Catalyst Cache Segment Wrapper
 * Provides fast in-memory caching for hot queries, KPI aggregations, and graph subgraphs.
 */
export const CatalystCache = {
  get: async (key: string): Promise<any | null> => {
    try {
      const app = await getCatalystAppAsync();
      const cache = app.cache();
      if (cache) {
        const segment = cache.segment();
        const value = await segment.get(key);
        if (value) {
          return JSON.parse(value);
        }
      }
    } catch (e) {
      // Silent cache miss
    }
    return null;
  },

  put: async (key: string, value: any, ttlInMinutes: number = 10): Promise<boolean> => {
    try {
      const app = await getCatalystAppAsync();
      const cache = app.cache();
      if (cache) {
        const segment = cache.segment();
        await segment.put(key, JSON.stringify(value), ttlInMinutes);
        return true;
      }
    } catch (e) {
      console.warn('Catalyst Cache put note:', (e as Error).message);
    }
    return false;
  },

  delete: async (key: string): Promise<boolean> => {
    try {
      const app = await getCatalystAppAsync();
      const cache = app.cache();
      if (cache) {
        const segment = cache.segment();
        await segment.delete(key);
        return true;
      }
    } catch (e) {
      // Fallback
    }
    return false;
  }
};
