import { CatalystDataStore } from './lib/catalyst/datastore';
import fs from 'fs';

async function run() {
  try {
    const data = fs.readFileSync('data/seed/PoliceStations.json', 'utf-8');
    const stations = JSON.parse(data);
    console.log(`Uploading ${stations.length} police stations...`);
    await CatalystDataStore.insertPoliceStations(stations);
    console.log('Upload complete.');
  } catch (err) {
    console.error('Error uploading:', err);
  }
}

run();
