/**
 * Direct Catalyst API Client
 * Bypasses the Catalyst SDK and uses direct HTTP calls to Catalyst REST APIs
 * This works with OAuth credentials (Client ID/Secret)
 */

const CATALYST_API_BASE = 'https://api.catalyst.zoho.in';
const OAUTH_TOKEN_URL = 'https://accounts.zoho.in/oauth/v2/token';

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Generate OAuth access token from Client ID/Secret
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

  const clientId = process.env.CATALYST_CLIENT_ID;
  const clientSecret = process.env.CATALYST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('CATALYST_CLIENT_ID and CATALYST_CLIENT_SECRET must be set in .env.local');
  }

  console.log('🔑 Generating new access token...');

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: 'ZohoCatalyst.projects.ALL ZohoCatalyst.filestore.CREATE ZohoCatalyst.datastore.CREATE'
  });

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OAuth token generation failed: ${error}`);
  }

  const data = await response.json();
  
  if (!data.access_token) {
    throw new Error('No access token in response');
  }

  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min before expiry

  console.log('✅ Access token generated (expires in', data.expires_in, 'seconds)');

  return cachedAccessToken as string;
}

/**
 * Upload file to Catalyst Stratus using direct API
 */
export async function uploadToStratus(file: File, bucketName: string = 'firdocuments'): Promise<{
  fileId: string;
  fileName: string;
  fileUrl: string;
}> {
  const token = await getAccessToken();
  const projectId = process.env.CATALYST_PROJECT_ID || '55949000000013025';

  // Create form data
  const formData = new FormData();
  formData.append('code', file.name);
  formData.append('file', file);

  const uploadUrl = `${CATALYST_API_BASE}/baas/v1/project/${projectId}/folder/${bucketName}/file`;

  console.log('📤 Direct API upload to:', uploadUrl);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stratus upload failed: ${response.status} ${error}`);
  }

  const result = await response.json();

  console.log('✅ Direct API upload successful:', result);

  return {
    fileId: result.data.file_id || result.data.id,
    fileName: result.data.file_name,
    fileUrl: result.data.file_url || `${CATALYST_API_BASE}/baas/v1/project/${projectId}/folder/${bucketName}/file/${result.data.file_id}/download`
  };
}

/**
 * Insert row into Catalyst DataStore using direct API
 */
export async function insertToDataStore(tableName: string, rows: any[]): Promise<any> {
  const token = await getAccessToken();
  const projectId = process.env.CATALYST_PROJECT_ID || '55949000000013025';

  const insertUrl = `${CATALYST_API_BASE}/baas/v1/project/${projectId}/table/${tableName}/row`;

  console.log('💾 Direct API insert to table:', tableName);

  const response = await fetch(insertUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: rows })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DataStore insert failed: ${response.status} ${error}`);
  }

  const result = await response.json();

  console.log('✅ Direct API insert successful');

  return result.data;
}

/**
 * Query Catalyst DataStore using direct API
 */
export async function queryDataStore(query: string): Promise<any[]> {
  const token = await getAccessToken();
  const projectId = process.env.CATALYST_PROJECT_ID || '55949000000013025';

  const queryUrl = `${CATALYST_API_BASE}/baas/v1/project/${projectId}/zcql`;

  console.log('🔍 Direct API query:', query);

  const response = await fetch(queryUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DataStore query failed: ${response.status} ${error}`);
  }

  const result = await response.json();

  return result.data || [];
}

/**
 * Check if direct API authentication is configured
 */
export function isDirectAPIConfigured(): boolean {
  return !!(process.env.CATALYST_CLIENT_ID && process.env.CATALYST_CLIENT_SECRET);
}
