// Stub for Catalyst SDK Wrapper
// In a real Catalyst environment, this would import 'zcatalyst-sdk-node' or the web SDK

export const catalystConfig = {
  projectId: process.env.NEXT_PUBLIC_CATALYST_PROJECT_ID,
  environment: process.env.NEXT_PUBLIC_CATALYST_ENV || 'Development',
};

// Mock Catalyst App Instance
class CatalystApp {
  public auth() {
    return {
      getCurrentUser: async () => ({ id: '123', email: 'officer@ksp.gov.in', role: 'Inspector' }),
      login: async () => true,
      logout: async () => true,
    };
  }

  public datastore() {
    return {
      table: (tableName: string) => ({
        getAllRows: async () => [],
        insertRow: async (data: any) => ({ ...data, id: Date.now().toString() }),
      }),
    };
  }

  public functions() {
    return {
      execute: async (functionName: string, payload: any) => {
        console.log(`Executing function ${functionName} with payload`, payload);
        return { success: true, data: {} };
      }
    }
  }
}

let catalystInstance: CatalystApp | null = null;

export function getCatalystApp(): CatalystApp {
  if (!catalystInstance) {
    catalystInstance = new CatalystApp();
  }
  return catalystInstance;
}
