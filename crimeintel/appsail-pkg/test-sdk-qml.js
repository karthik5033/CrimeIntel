require('dotenv').config({ path: '.env.local' });
const catalyst = require('zcatalyst-sdk-node');

async function run() {
  // Use a hardcoded token for testing, or try to generate one if rate limit passed
  const res = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.CATALYST_CLIENT_ID,
      client_secret: process.env.CATALYST_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'ZohoCatalyst.projects.ALL ZohoCatalyst.filestore.CREATE ZohoCatalyst.datastore.CREATE QuickML.deployment.READ'
    }).toString()
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error("Token fail:", data);
    return;
  }
  
  const app = catalyst.initialize({
    headers: {
      'x-zc-projectid': '55949000000013025',
      'x-zc-admin-cred-token': data.access_token,
      'x-zc-admin-cred-type': 'token',
      'x-zc-user-type': 'admin',
      'x-zc-project-domain': 'catalyst.zoho.in'
    }
  });
  
  console.log("SDK Initialized!");
  
  const payload = {
    model: "crm-di-glm47b_30b_it",
    messages: [{ role: 'user', content: 'hello' }]
  };
  
  try {
    const qml = app.quickML();
    const result = await qml.predict('mock_endpoint_key', payload);
    console.log("Predict result:", result);
  } catch (e) {
    console.error("Predict error:", e);
  }
}
run();
