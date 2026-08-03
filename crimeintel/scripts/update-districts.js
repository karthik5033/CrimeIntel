const fs = require('fs');
const path = require('path');

const seedDir = path.join(__dirname, '../data/seed');
const districts = ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Ballari'];

function updateDistrictsInFile(fileName) {
  const filePath = path.join(seedDir, fileName);
  if (!fs.existsSync(filePath)) return;

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;

    data.forEach((item, idx) => {
      if (item.district_id === 'DIST_1' || item.district_id === 'DIST_2') {
        // Deterministically map to a new district based on index so it's consistent across files if needed
        const newDist = districts[idx % districts.length];
        item.district_id = newDist;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Updated ${fileName} with real districts.`);
    }
  } catch (err) {
    console.error(`Failed to update ${fileName}:`, err);
  }
}

['FIRs.json', 'Cases.json', 'Persons.json'].forEach(updateDistrictsInFile);
console.log('District mapping complete.');
