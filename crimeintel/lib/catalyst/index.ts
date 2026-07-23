export const catalystConfig = {
  projectId: process.env.NEXT_PUBLIC_CATALYST_PROJECT_ID || 'missing-project-id',
  environment: process.env.NEXT_PUBLIC_CATALYST_ENV || 'Development',
};

let catalystInstance: any = null;

export function getCatalystApp(req?: any): any {
  // If running in browser client, return safe client interface
  if (typeof window !== 'undefined') {
    return {
      auth: () => ({
        getCurrentUser: async () => ({ id: 'U10943', email: 'officer@ksp.gov.in', role: 'Inspector' }),
      }),
      datastore: () => ({
        table: (tableName: string) => ({
          getAllRows: async () => [],
          insertRow: async (data: any) => ({ ...data, id: Date.now().toString() }),
        }),
      }),
      zcql: () => ({
        executeZCQLQuery: async () => []
      }),
      cache: () => ({
        segment: () => ({
          get: async () => null,
          put: async () => {},
          delete: async () => {}
        })
      }),
      zia: () => ({
        extractText: async () => ({ text: '' })
      }),
      quickml: () => ({
        embeddings: async () => ({ embedding: [] })
      })
    };
  }

  // Server-side execution only: dynamically load zcatalyst-sdk-node
  try {
    const catalyst = require('zcatalyst-sdk-node');
    if (req) {
      return catalyst.initialize(req);
    }
    if (!catalystInstance) {
      catalystInstance = catalyst.initialize({
        project_id: catalystConfig.projectId,
        environment: catalystConfig.environment,
      });
    }
    return catalystInstance;
  } catch (error) {
    console.warn('Catalyst SDK Server Initialization note:', (error as Error).message);
    return {
      datastore: () => ({
        table: (tableName: string) => ({
          getAllRows: async () => [],
          insertRow: async (data: any) => ({ ...data, id: Date.now().toString() }),
        }),
      }),
      auth: () => ({
        getCurrentUser: async () => ({ id: 'U10943', email: 'officer@ksp.gov.in', role: 'Inspector' }),
      }),
      functions: () => ({
        execute: async (fn: string, payload: any) => ({ success: true, data: {} }),
      }),
      zcql: () => ({
        executeZCQLQuery: async () => []
      }),
      cache: () => ({
        segment: () => ({
          get: async () => null,
          put: async () => {},
          delete: async () => {}
        })
      }),
      zia: () => ({
        extractText: async () => ({ text: '' })
      }),
      quickml: () => ({
        embeddings: async () => ({ embedding: [] })
      })
    };
  }
}
