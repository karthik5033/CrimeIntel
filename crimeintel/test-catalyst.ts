import { getCatalystApp } from './lib/catalyst';

async function test() {
  console.log('Testing catalyst initialization...');
  try {
    const app = getCatalystApp();
    const ds = app.datastore();
    console.log('Datastore initialized successfully!');
  } catch (e) {
    console.error('Failed:', e);
  }
}

test();
