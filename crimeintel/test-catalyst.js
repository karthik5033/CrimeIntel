require('dotenv').config({ path: '.env.local' });

async function test() {
  const clientId = process.env.CATALYST_CLIENT_ID;
  const clientSecret = process.env.CATALYST_CLIENT_SECRET;
  const refreshToken = process.env.CATALYST_REFRESH_TOKEN;
  const projectId = process.env.CATALYST_PROJECT_ID;

  // 1. Get Token
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const res = await fetch('https://accounts.zoho.in/oauth/v2/token', { method: 'POST', body: params });
  const tokenData = await res.json();
  const token = tokenData.access_token;
  console.log('Got Token:', !!token);

  // 2. Test BaaS ZCQL Endpoint
  const queryUrl1 = `https://api.catalyst.zoho.in/baas/v1/project/${projectId}/zcql`;
  const res1 = await fetch(queryUrl1, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'SELECT * FROM FIRs LIMIT 2' })
  });
  console.log('BaaS Response:', res1.status, await res1.text());

  // 3. Test Server ZCQL Endpoint
  const queryUrl2 = `https://api.catalyst.zoho.in/server/v1/project/${projectId}/zcql/execute`;
  const res2 = await fetch(queryUrl2, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'SELECT * FROM FIRs LIMIT 2' })
  });
  console.log('Server Response:', res2.status, await res2.text());
}

test().catch(console.error);
