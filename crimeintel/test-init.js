require('dotenv').config({ path: '.env.local' });
const { getCatalystAppAsync } = require('./lib/catalyst');

async function testInit() {
  try {
    const app = await getCatalystAppAsync();
    console.log("App initialized.");
    if (app && app.datastore) {
      console.log("Datastore available.");
      const zcql = app.zcql();
      const res = await zcql.executeZCQLQuery("SELECT * FROM FIRs LIMIT 2");
      console.log("ZCQL Result:", res);
    }
  } catch(e) {
    console.error("Init Error:", e);
  }
}
testInit();
