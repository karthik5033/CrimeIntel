const fs = require('fs');

// 1. Read existing districts
const districtsData = JSON.parse(fs.readFileSync('data/seed/Districts.json', 'utf8'));

// 2. Create map and assign IDs
const nameToId = {};
districtsData.forEach((d, i) => {
    const newId = `DIST_${i + 1}`;
    nameToId[d.name] = newId;
    d.id = newId; // Update ID
});

// Write Districts
fs.writeFileSync('data/seed/Districts.json', JSON.stringify(districtsData, null, 2));
console.log('Updated Districts.json');

// 3. Update FIRs, Cases, Persons, PoliceStations
const filesToUpdate = ['FIRs.json', 'Cases.json', 'Persons.json', 'PoliceStations.json'];

filesToUpdate.forEach(file => {
    const p = `data/seed/${file}`;
    if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        let modified = false;
        
        data.forEach(item => {
            // Find existing name
            const currentDistrictName = item.district_id || item.district; 
            
            if (currentDistrictName && nameToId[currentDistrictName]) {
                item.district_id = nameToId[currentDistrictName];
                item.district_name = currentDistrictName; // +district name
                if (item.district) delete item.district; // cleanup old field if any
                modified = true;
            }
        });
        
        if (modified) {
            fs.writeFileSync(p, JSON.stringify(data, null, 2));
            console.log(`Updated ${file} with district_id and district_name`);
        }
    }
});
