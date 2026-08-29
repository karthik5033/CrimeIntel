const fs = require('fs');
const turf = require('@turf/turf');

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const QUERY = `[out:json][timeout:250];
area["name"="Karnataka"]["admin_level"="4"]->.searchArea;
(
  node["amenity"="police"](area.searchArea);
  way["amenity"="police"](area.searchArea);
  relation["amenity"="police"](area.searchArea);
);
out center;`;

async function run() {
  console.log("Fetching police stations from Overpass API...");
  try {
    const url = OVERPASS_URL + '?data=' + encodeURIComponent(QUERY);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CrimeIntel/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Found ${data.elements.length} police stations.`);

    // Load districts for point-in-polygon
    const karnataka = JSON.parse(fs.readFileSync('public/karnataka.json', 'utf8'));
    const districtsList = JSON.parse(fs.readFileSync('data/seed/Districts.json', 'utf8'));
    const districtMap = {};
    districtsList.forEach(d => districtMap[d.name] = d.id);

    const finalStations = [];
    
    for (let i = 0; i < data.elements.length; i++) {
        const el = data.elements[i];
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        if (!lat || !lon) continue;

        let name = el.tags?.name || el.tags?.['name:en'] || "Police Station";

        // Find district
        const pt = turf.point([lon, lat]);
        let districtName = null;
        
        for (const feature of karnataka.features) {
            // some polygons might be multipolygons
            if (turf.booleanPointInPolygon(pt, feature)) {
                districtName = feature.properties.district;
                break;
            }
        }
        
        if (!districtName) {
            // Try to fallback
            if (el.tags?.['addr:district']) {
                districtName = el.tags['addr:district'];
            }
        }

        let dId = null;
        if (districtName) {
            // match district name
            const found = districtsList.find(d => d.name.toLowerCase().includes(districtName.toLowerCase()) || districtName.toLowerCase().includes(d.name.toLowerCase()));
            if (found) dId = found.id;
        }
        
        if (!dId) {
            // default to first district
            dId = districtsList[0].id; // Fallback
        }

        finalStations.push({
            id: `PS_REAL_${el.id}`,
            name_en: name,
            district_id: dId,
            lat: lat,
            lng: lon
        });
    }

    fs.writeFileSync('data/seed/PoliceStations.json', JSON.stringify(finalStations, null, 2));
    console.log(`Saved ${finalStations.length} police stations to data/seed/PoliceStations.json`);

  } catch(e) {
      console.error(e);
  }
}

run();
