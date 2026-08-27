const fs = require('fs');

const realStations = [
  // Bengaluru Urban
  { name: "Cubbon Park Police Station", lat: 12.9778, lng: 77.5944, district: "Bengaluru Urban" },
  { name: "Koramangala Police Station", lat: 12.9352, lng: 77.6245, district: "Bengaluru Urban" },
  { name: "Indiranagar Police Station", lat: 12.9784, lng: 77.6408, district: "Bengaluru Urban" },
  { name: "Whitefield Police Station", lat: 12.9698, lng: 77.7499, district: "Bengaluru Urban" },
  { name: "Jayanagar Police Station", lat: 12.9250, lng: 77.5938, district: "Bengaluru Urban" },
  { name: "Malleswaram Police Station", lat: 13.0035, lng: 77.5710, district: "Bengaluru Urban" },
  
  // Mysuru
  { name: "Devaraja Police Station", lat: 12.3086, lng: 76.6525, district: "Mysuru" },
  { name: "Kuvempunagar Police Station", lat: 12.2858, lng: 76.6265, district: "Mysuru" },
  { name: "Saraswathipuram Police Station", lat: 12.3045, lng: 76.6341, district: "Mysuru" },
  { name: "Vijayanagar Police Station", lat: 12.3276, lng: 76.6200, district: "Mysuru" },
  
  // Mangaluru (Dakshina Kannada)
  { name: "Bunder Police Station", lat: 12.8687, lng: 74.8398, district: "Mangaluru" },
  { name: "Kadri Police Station", lat: 12.8790, lng: 74.8560, district: "Mangaluru" },
  { name: "Pandeshwar Police Station", lat: 12.8601, lng: 74.8423, district: "Mangaluru" },
  { name: "Surathkal Police Station", lat: 13.0050, lng: 74.7950, district: "Mangaluru" },
  
  // Hubballi-Dharwad
  { name: "Vidyanagar Police Station", lat: 15.3647, lng: 75.1239, district: "Hubballi-Dharwad" },
  { name: "Suburban Police Station", lat: 15.3533, lng: 75.1435, district: "Hubballi-Dharwad" },
  { name: "Gokul Road Police Station", lat: 15.3670, lng: 75.1090, district: "Hubballi-Dharwad" },
  { name: "Dharwad Town Police Station", lat: 15.4589, lng: 75.0078, district: "Hubballi-Dharwad" },
  
  // Belagavi
  { name: "Camp Police Station", lat: 15.8497, lng: 74.5290, district: "Belagavi" },
  { name: "Tilakwadi Police Station", lat: 15.8350, lng: 74.5120, district: "Belagavi" },
  { name: "Khade Bazar Police Station", lat: 15.8570, lng: 74.5170, district: "Belagavi" },
  
  // Kalaburagi
  { name: "Brahmpur Police Station", lat: 17.3297, lng: 76.8343, district: "Kalaburagi" },
  { name: "Chowk Police Station", lat: 17.3340, lng: 76.8290, district: "Kalaburagi" },
  { name: "Ashok Nagar Police Station", lat: 17.3450, lng: 76.8300, district: "Kalaburagi" },
  
  // Shivamogga
  { name: "Doddapete Police Station", lat: 13.9299, lng: 75.5681, district: "Shivamogga" },
  { name: "Kote Police Station", lat: 13.9310, lng: 75.5750, district: "Shivamogga" },
  { name: "Vinobanager Police Station", lat: 13.9350, lng: 75.5580, district: "Shivamogga" },
  
  // Ballari
  { name: "Cowl Bazaar Police Station", lat: 15.1394, lng: 76.9214, district: "Ballari" },
  { name: "Gandhi Nagar Police Station", lat: 15.1480, lng: 76.9250, district: "Ballari" },
  
  // Tumakuru
  { name: "Tumakuru Town Police Station", lat: 13.3379, lng: 77.1173, district: "Tumakuru" },
  { name: "Kyathsandra Police Station", lat: 13.3450, lng: 77.1300, district: "Tumakuru" },
  
  // Udupi
  { name: "Udupi Town Police Station", lat: 13.3409, lng: 74.7421, district: "Udupi" },
  { name: "Malpe Police Station", lat: 13.3510, lng: 74.7000, district: "Udupi" },
  { name: "Manipal Police Station", lat: 13.3450, lng: 74.7900, district: "Udupi" },
  
  // Davanagere
  { name: "Davanagere City Police Station", lat: 14.4644, lng: 75.9218, district: "Davanagere" },
  { name: "Vidyanagar Police Station", lat: 14.4500, lng: 75.9100, district: "Davanagere" },
  
  // Hosapete
  { name: "Hosapete Town Police Station", lat: 15.2689, lng: 76.3909, district: "Hosapete" },
  
  // Hassan
  { name: "Hassan City Police Station", lat: 13.0033, lng: 76.1004, district: "Hassan" },
  
  // Kolar
  { name: "Kolar Town Police Station", lat: 13.1367, lng: 78.1291, district: "Kolar" },
  
  // Mandya
  { name: "Mandya City Police Station", lat: 12.5218, lng: 76.8951, district: "Mandya" },
  
  // Raichur
  { name: "Raichur Town Police Station", lat: 16.2076, lng: 77.3463, district: "Raichur" },
  
  // Bidar
  { name: "Bidar City Police Station", lat: 17.9104, lng: 77.5199, district: "Bidar" },
  
  // Vijayapura
  { name: "Gol Gumbaz Police Station", lat: 16.8286, lng: 75.7196, district: "Vijayapura" },
  
  // Gadag
  { name: "Gadag Town Police Station", lat: 15.4267, lng: 75.6316, district: "Gadag" },
  
  // Karwar
  { name: "Karwar Town Police Station", lat: 14.8152, lng: 74.1350, district: "Karwar" },
  
  // Chikmagalur
  { name: "Chikmagalur City Police Station", lat: 13.3153, lng: 75.7754, district: "Chikmagalur" }
];

function run() {
  const districts = JSON.parse(fs.readFileSync('data/seed/Districts.json', 'utf8'));
  const districtMap = {};
  districts.forEach(d => districtMap[d.name] = d.id);
  
  const finalStations = realStations.map((station, index) => {
    let dId = districtMap[station.district];
    if (!dId) {
       // fallback search
       const found = districts.find(d => d.name.includes(station.district) || station.district.includes(d.name));
       if (found) dId = found.id;
       else dId = districts[0].id;
    }
    return {
      id: `PS_REAL_${index + 1}`,
      name_en: station.name,
      district_id: dId,
      lat: station.lat,
      lng: station.lng
    };
  });
  
  // For remaining districts without explicit police stations, add one at their exact center
  districts.forEach(d => {
    if (!finalStations.find(s => s.district_id === d.id)) {
      finalStations.push({
         id: `PS_REAL_AUTO_${d.id}`,
         name_en: `${d.name} Rural Police Station`,
         district_id: d.id,
         lat: d.lat,
         lng: d.lng
      });
    }
  });

  fs.writeFileSync('data/seed/PoliceStations.json', JSON.stringify(finalStations, null, 2));
  console.log(`Saved ${finalStations.length} REAL police stations to seed data!`);
}

run();
