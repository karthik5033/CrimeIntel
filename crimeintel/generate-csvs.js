const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify/sync');

const seedDir = path.join(__dirname, 'data', 'seed');
const csvDir = path.join(__dirname, 'data', 'csv');

if (!fs.existsSync(csvDir)) {
  fs.mkdirSync(csvDir, { recursive: true });
}

const files = [
  'Persons',
  'PoliceStations',
  'FIRs',
  'Cases',
  'Vehicles',
  'PhoneRecords',
  'BankAccounts',
  'Weapons',
  'Transactions',
  'EntityRelationships'
];

files.forEach(file => {
  const jsonPath = path.join(seedDir, `${file}.json`);
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (data.length > 0) {
      // Flatten nested objects so CSV can handle them
      const flatData = data.map(record => {
        const flat = {};
        for (const [key, val] of Object.entries(record)) {
          if (val === null || val === undefined) flat[key] = '';
          else if (typeof val === 'object') flat[key] = JSON.stringify(val);
          else flat[key] = val;
        }
        return flat;
      });

      const csvContent = stringify(flatData, { header: true });
      fs.writeFileSync(path.join(csvDir, `${file}.csv`), csvContent);
      console.log(`Generated ${file}.csv`);
    }
  }
});
console.log('✅ All CSVs generated in data/csv/ folder!');
