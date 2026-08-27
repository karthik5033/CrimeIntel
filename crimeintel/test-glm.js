const fs = require('fs');
async function run() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });
  
  const res = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.CATALYST_CLIENT_ID,
      client_secret: env.CATALYST_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'ZohoCatalyst.projects.ALL ZohoCatalyst.filestore.CREATE ZohoCatalyst.datastore.CREATE QuickML.deployment.READ'
    }).toString()
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error("Token fail:", data);
    return;
  }
  const token = data.access_token;

  const payload = {
    model: "crm-di-glm47b_30b_it",
    messages: [{ role: 'user', content: 'hello' }]
  };
  
  let options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'CATALYST-ORG': env.CATALYST_ORG_ID || '60078981781',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      "zoho-inputstream": JSON.stringify(payload)
    }).toString()
  };
  
  const qmlRes = await fetch('https://api.catalyst.zoho.in/quickml/v1/project/55949000000013025/glm/chat', options);
  console.log('UrlEncoded result:', qmlRes.status, await qmlRes.text());
}
run();
