import { getCatalystApp } from './lib/catalyst';

async function test() {
  const app = getCatalystApp();
  const zcql = app.zcql();
  try {
    const res = await zcql.executeZCQLQuery("SELECT crime_type_en, COUNT(ROWID) FROM FIRs GROUP BY crime_type_en LIMIT 2");
    console.log("Response:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
