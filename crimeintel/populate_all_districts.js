const fs = require('fs');
const turf = require('@turf/turf');

function run() {
    const geojson = JSON.parse(fs.readFileSync('public/karnataka_smoothed.json', 'utf8'));
    const districts = [];

    geojson.features.forEach(feature => {
        const name = feature.properties.district;
        if (!name) return;

        // Calculate centroid
        const centroid = turf.centroid(feature);
        const lng = centroid.geometry.coordinates[0];
        const lat = centroid.geometry.coordinates[1];

        // Ensure no duplicates
        if (!districts.find(d => d.id === name)) {
            districts.push({
                id: name,
                name: name,
                name_kn: name, // We don't have kn translation easily, so use english
                lat: lat,
                lng: lng,
                zone: "State",
                division: "State",
                officers_deployed: Math.floor(Math.random() * 500) + 200
            });
        }
    });

    fs.writeFileSync('data/seed/Districts.json', JSON.stringify(districts, null, 2));
    console.log(`Generated Districts.json with ${districts.length} districts.`);

    // Fix FIRs, Cases, Persons
    const mapping = {
        'Bengaluru': 'Bengaluru Urban',
        'Mangaluru': 'Dakshina Kannada',
        'Hubballi': 'Dharwad',
        'Hubballi-Dharwad': 'Dharwad',
        'DIST_1': 'Bengaluru Urban',
        'DIST_2': 'Mysuru',
        'DIST_3': 'Dakshina Kannada',
        'DIST_4': 'Dharwad',
        'DIST_5': 'Belagavi'
    };

    ['FIRs.json', 'Cases.json', 'Persons.json'].forEach(file => {
        const p = `data/seed/${file}`;
        if (fs.existsSync(p)) {
            const data = JSON.parse(fs.readFileSync(p, 'utf8'));
            let modified = false;
            data.forEach(item => {
                if (item.district_id && mapping[item.district_id]) {
                    item.district_id = mapping[item.district_id];
                    modified = true;
                }
            });
            if (modified) {
                fs.writeFileSync(p, JSON.stringify(data, null, 2));
                console.log(`Fixed district mappings in ${file}`);
            }
        }
    });
}

run();
