require('dotenv').config({ path: '.env.local' });
const { getAccessToken } = require('./lib/catalyst/direct-api');

async function run() {
  const token = await getAccessToken();
  console.log("Token:", token.substring(0, 15) + "...");
  
  const payload = {
    model: "crm-di-glm47b_30b_it",
    messages: [{ role: 'user', content: 'hello' }]
  };
  
  let options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'CATALYST-ORG': process.env.CATALYST_ORG_ID || '60078981781',
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
