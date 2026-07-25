export const catalystConfig = {
  projectId: process.env.NEXT_PUBLIC_CATALYST_PROJECT_ID || 'missing-project-id',
  environment: process.env.NEXT_PUBLIC_CATALYST_ENV || 'Development',
};

let catalystInstance: any = null;

export function getCatalystApp(req?: any): any {
  // If running in browser client, we should throw an error to enforce API route usage
  if (typeof window !== 'undefined') {
    throw new Error('Catalyst SDK cannot be used on the client. Use API routes instead.');
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
    console.error('Catalyst SDK Server Initialization failed:', (error as Error).message);
    throw new Error(`Failed to initialize real Catalyst SDK: ${(error as Error).message}`);
  }
}
