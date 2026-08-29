
const fs = require('fs');

async function run() {
  console.log('Fetching Overpass API...');
  const query = `
    [out:json];
    area["name"="Karnataka"]["admin_level"="4"]->.searchArea;
    nwr["amenity"="police"](area.searchArea);
    out center;
  `;
  try {
    const params = new URLSearchParams();
    params.append('data', query);
    
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CrimeIntel/1.0 (test@example.com)'
      },
      body: params.toString()
    });
    const dataText = await res.text();
    if (!dataText.startsWith('{')) {
      console.log('Error HTML:', dataText.substring(0, 300));
      return;
    }
    const data = JSON.parse(dataText);
    console.log('Found:', data.elements.length, 'police stations');

    const districts = JSON.parse(fs.readFileSync('data/seed/Districts.json'));
    
    const realStations = data.elements.filter(e => e.lat || (e.center && e.center.lat)).map((e, index) => {
      const lat = e.lat || e.center.lat;
      const lng = e.lon || e.center.lon;
      const name = e.tags.name || `Police Station ${index + 1}`;
      
      let closestDist = districts[0];
      let minDist = Infinity;
      districts.forEach(d => {
        const dist = Math.pow(d.lat - lat, 2) + Math.pow(d.lng - lng, 2);
        if (dist < minDist) {
          minDist = dist;
          closestDist = d;
        }
      });

      return {
        id: `PS_REAL_${e.id}`,
        name_en: name,
        district_id: closestDist.id,
        lat: lat,
        lng: lng
      };
    });

    fs.writeFileSync('data/seed/PoliceStations.json', JSON.stringify(realStations, null, 2));
    console.log('Saved', realStations.length, 'real police stations to seed data.');
  } catch (err) {
    console.error(err);
  }
}

run();
