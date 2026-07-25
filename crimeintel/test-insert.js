const catalyst = require('zcatalyst-sdk-node');
const personsSeed = require('./data/seed/Persons.json');

async function testInsert() {
  try {
    // Try to initialize using the CLI credentials
    const app = catalyst.initialize();
    console.log('Catalyst app initialized successfully!');
    
    const datastore = app.datastore();
    const table = datastore.table('Persons');
    
    console.log('Testing insert of one person...');
    const person = personsSeed[0];
    
    const insertResult = await table.insertRow(person);
    console.log('Insert Result:', insertResult);
    
  } catch(e) {
    console.error('Error:', e.message);
    if (e.message.includes('Authentication')) {
      console.log('Need OAuth token to run locally.');
    }
  }
}

testInsert();
