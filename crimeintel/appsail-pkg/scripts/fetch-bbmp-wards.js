/**
 * BBMP Ward Data Fetcher
 * 
 * This script attempts to download authentic BBMP 198 ward boundaries
 * from multiple open data sources.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_SOURCES = [
  {
    name: 'DataMeet Municipal Spatial Data',
    urls: [
      'https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Bangalore/BBMP_Wards-2020.geojson',
      'https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Bangalore/BBMP_Wards-2008.geojson',
      'https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Bangalore/Wards-2008.geojson'
    ],
    license: 'CC BY 4.0',
    attribution: 'BBMP Ward Boundaries by DataMeet India community'
  },
  {
    name: 'OpenBangalore Converted Data',
    urls: [
      'https://gist.githubusercontent.com/Vonter/raw/bbmp-wards-198.geojson',
      'https://raw.githubusercontent.com/refractor07/Municipal_Spatial_Data/master/Bangalore/BBMP_Wards.geojson'
    ],
    license: 'Open Data',
    attribution: 'OpenBangalore Community'
  }
];

async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    console.log(`Attempting to download from: ${url}`);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ success: true, data: json, url });
          } catch (e) {
            reject(new Error(`Invalid JSON from ${url}: ${e.message}`));
          }
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode} from ${url}`));
      }
    }).on('error', (e) => {
      reject(new Error(`Network error from ${url}: ${e.message}`));
    });
  });
}

async function fetchBBMPWards() {
  console.log('🔍 Searching for BBMP Ward Boundaries...\n');
  
  for (const source of DATA_SOURCES) {
    console.log(`\n📦 Trying source: ${source.name}`);
    console.log(`   License: ${source.license}`);
    
    for (const url of source.urls) {
      try {
        const result = await downloadFile(url);
        
        if (result.success) {
          console.log(`\n✅ SUCCESS! Downloaded from: ${url}`);
          console.log(`   Features found: ${result.data.features?.length || 0}`);
          
          // Validate the data
          if (!result.data.features || result.data.features.length === 0) {
            console.log('⚠️  Warning: No features in GeoJSON');
            continue;
          }
          
          // Add attribution
          result.data.attribution = source.attribution;
          result.data.license = source.license;
          result.data.source_url = url;
          result.data.downloaded_at = new Date().toISOString();
          
          // Save to public folder
          const outputPath = path.join(__dirname, '..', 'public', 'bbmp_wards.json');
          fs.writeFileSync(outputPath, JSON.stringify(result.data, null, 2));
          
          console.log(`\n💾 Saved to: ${outputPath}`);
          console.log(`\n📊 Summary:`);
          console.log(`   Total Wards: ${result.data.features.length}`);
          console.log(`   License: ${source.license}`);
          console.log(`   Attribution: ${source.attribution}`);
          
          // Validate ward properties
          const firstFeature = result.data.features[0];
          console.log(`\n🏷️  Sample Ward Properties:`);
          console.log(JSON.stringify(firstFeature.properties, null, 2));
          
          return result.data;
        }
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
  }
  
  console.log('\n\n❌ Could not download ward boundaries from any source.');
  console.log('\n📝 Manual Options:');
  console.log('   1. Visit: https://github.com/datameet/Municipal_Spatial_Data');
  console.log('   2. Download BBMP ward shapefiles');
  console.log('   3. Convert to GeoJSON using GDAL:');
  console.log('      ogr2ogr -f GeoJSON bbmp_wards.json bbmpwards.shp');
  console.log('   4. Place the file in: public/bbmp_wards.json');
  console.log('\n   OR Contact BBMP GIS Cell: https://bbmp.gov.in');
  
  return null;
}

// Alternative: Generate sample ward data based on official BBMP ward list
function generateSampleWards() {
  console.log('\n\n🔧 Generating sample ward boundaries...');
  console.log('   Note: These are approximate boundaries for testing purposes only.');
  console.log('   Replace with official data before production use.\n');
  
  const zones = [
    { name: 'Yelahanka', wards: Array.from({length: 28}, (_, i) => i + 1) },
    { name: 'Dasarahalli', wards: Array.from({length: 25}, (_, i) => i + 29) },
    { name: 'Mahadevapura', wards: Array.from({length: 32}, (_, i) => i + 54) },
    { name: 'Bommanahalli', wards: Array.from({length: 26}, (_, i) => i + 86) },
    { name: 'East', wards: Array.from({length: 30}, (_, i) => i + 112) },
    { name: 'South', wards: Array.from({length: 30}, (_, i) => i + 142) },
    { name: 'West', wards: Array.from({length: 18}, (_, i) => i + 172) },
    { name: 'RR Nagar', wards: Array.from({length: 9}, (_, i) => i + 190) }
  ];
  
  // Bengaluru bounding box
  const minLng = 77.4500;
  const maxLng = 77.7500;
  const minLat = 12.8500;
  const maxLat = 13.1500;
  
  const features = [];
  let wardIndex = 0;
  
  zones.forEach((zone, zoneIdx) => {
    zone.wards.forEach((wardNo) => {
      const row = Math.floor(wardIndex / 14);
      const col = wardIndex % 14;
      
      const wardMinLng = minLng + (col * (maxLng - minLng) / 14);
      const wardMaxLng = minLng + ((col + 1) * (maxLng - minLng) / 14);
      const wardMinLat = minLat + (row * (maxLat - minLat) / 14);
      const wardMaxLat = minLat + ((row + 1) * (maxLat - minLat) / 14);
      
      features.push({
        type: 'Feature',
        properties: {
          ward_no: wardNo,
          ward_name: `Ward ${wardNo}`,
          zone: zone.name,
          zone_no: zoneIdx + 1,
          note: 'SAMPLE DATA - Replace with official boundaries'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [wardMinLng, wardMinLat],
            [wardMaxLng, wardMinLat],
            [wardMaxLng, wardMaxLat],
            [wardMinLng, wardMaxLat],
            [wardMinLng, wardMinLat]
          ]]
        }
      });
      
      wardIndex++;
    });
  });
  
  const geojson = {
    type: 'FeatureCollection',
    name: 'BBMP_Wards_198_SAMPLE',
    note: 'SAMPLE DATA - These are approximate ward boundaries for testing only. Replace with official BBMP data before production.',
    attribution: 'SAMPLE DATA - Not for production use',
    features
  };
  
  const outputPath = path.join(__dirname, '..', 'public', 'bbmp_wards_sample.json');
  fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
  
  console.log(`✅ Generated ${features.length} sample wards`);
  console.log(`💾 Saved to: ${outputPath}`);
  console.log('\n⚠️  WARNING: This is SAMPLE data. Boundaries are NOT accurate.');
  console.log('   Use only for UI testing. Replace with official data before production.\n');
  
  return geojson;
}

// Run the script
(async () => {
  const data = await fetchBBMPWards();
  
  if (!data) {
    console.log('\n\n⚠️  Would you like to generate sample ward data for testing? (y/n)');
    console.log('   Note: Sample data is NOT suitable for production use.');
    
    // For automation, generate sample data
    generateSampleWards();
  }
})();
