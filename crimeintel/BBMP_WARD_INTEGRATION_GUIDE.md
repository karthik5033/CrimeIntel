# BBMP Ward Boundary Integration Guide

## Overview
This guide helps you integrate authentic BBMP (Bruhat Bengaluru Mahanagara Palike) 198 ward boundaries into CrimeIntel.

## Official BBMP Ward Structure (2023)

BBMP has **198 wards** organized into **8 zones**:

| Zone | Wards | Assembly Constituencies |
|------|-------|------------------------|
| Yelahanka (Zone 1) | 1-28 | Yelahanka, Byatarayanapura |
| Dasarahalli (Zone 2) | 29-53 | Dasarahalli, Rajarajeshwari Nagar |
| Mahadevapura (Zone 3) | 54-85 | K.R. Puram, Mahadevapura, Marathahalli |
| Bommanahalli (Zone 4) | 86-111 | BTM Layout, Bommanahalli |
| East (Zone 5) | 112-141 | Shanti Nagar, CV Raman Nagar |
| South (Zone 6) | 142-171 | Basavanagudi, Jayanagar |
| West (Zone 7) | 172-189 | Rajajinagar, Mahalakshmi Layout |
| RR Nagar (Zone 8) | 190-198 | Rajarajeshwari Nagar |

## Step 1: Get Authentic BBMP Ward Boundaries

### Option A: Official BBMP GIS Data (Recommended)

Visit BBMP's official GIS portal:
- **URL**: https://bbmpeaasthi.karnataka.gov.in/ or https://dl.bbmpgov.in/
- **Contact**: BBMP Revenue Department for official shapefiles

### Option B: Open Data Sources

1. **DataMeet Municipal Data (CC BY 4.0 License)**
   ```bash
   # Clone the repository
   git clone https://github.com/datameet/Municipal_Spatial_Data.git
   cd Municipal_Spatial_Data/Bangalore
   ```

2. **OpenBangalore Data**
   ```bash
   # Clone the repository
   git clone https://github.com/openbangalore/bangalore.git
   cd bangalore/GIS/bbmpwards
   ```

3. **Convert Shapefile to GeoJSON** (if you get shapefiles):
   ```bash
   # Install GDAL
   # Windows: Download from https://gdal.org/download.html
   # Mac: brew install gdal
   # Linux: sudo apt-get install gdal-bin

   # Convert SHP to GeoJSON
   ogr2ogr -f GeoJSON bbmp_wards.geojson bbmpwards.shp
   ```

## Step 2: GeoJSON Format Requirements

Your `bbmp_wards.json` should have this structure:

```json
{
  "type": "FeatureCollection",
  "name": "BBMP_Wards_198",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "ward_no": 1,
        "ward_name": "Kempegowda Ward",
        "zone": "Yelahanka",
        "zone_no": 1,
        "assembly_constituency": "Yelahanka",
        "area_sqkm": 2.5,
        "population_2011": 25000
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [77.5960, 13.1050],
            [77.5970, 13.1050],
            [77.5970, 13.1060],
            [77.5960, 13.1060],
            [77.5960, 13.1050]
          ]
        ]
      }
    }
  ]
}
```

## Step 3: Update Your Application

### 3.1 Update Map Component

**File**: `components/map/GeospatialMap.tsx`

```typescript
import { useEffect, useState } from 'react';
import bbmpWards from '@/public/bbmp_wards.json';

export default function GeospatialMap() {
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  
  useEffect(() => {
    // Load ward boundaries
    map.addSource('bbmp-wards', {
      type: 'geojson',
      data: bbmpWards as any
    });
    
    // Add ward boundary layer
    map.addLayer({
      id: 'ward-boundaries',
      type: 'fill',
      source: 'bbmp-wards',
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'ward_no'], selectedWard],
          '#FF6B6B',  // Selected ward
          '#4A90E2'   // Default ward color
        ],
        'fill-opacity': 0.3
      }
    });
    
    // Add ward labels
    map.addLayer({
      id: 'ward-labels',
      type: 'symbol',
      source: 'bbmp-wards',
      layout: {
        'text-field': ['concat', 'Ward ', ['get', 'ward_no']],
        'text-size': 12,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
      },
      paint: {
        'text-color': '#000000',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 2
      }
    });
  }, [selectedWard]);
  
  return (
    <div className="relative w-full h-screen">
      {/* Map container */}
    </div>
  );
}
```

### 3.2 Update Database Schema

Add a `wards` table to Catalyst:

```sql
CREATE TABLE Wards (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ward_no INT NOT NULL UNIQUE,
  ward_name_en VARCHAR(100) NOT NULL,
  ward_name_kn VARCHAR(100),
  zone_no INT NOT NULL,
  zone_name VARCHAR(50) NOT NULL,
  assembly_constituency VARCHAR(100),
  area_sqkm DECIMAL(10, 2),
  population_2011 INT,
  boundary_geojson TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 Map FIRs to Wards

**Option 1: Using Geospatial Queries**
```typescript
// lib/geospatial/wardMapping.ts
import * as turf from '@turf/turf';
import bbmpWards from '@/public/bbmp_wards.json';

export function getWardForCoordinates(lat: number, lng: number): number | null {
  const point = turf.point([lng, lat]);
  
  for (const feature of bbmpWards.features) {
    const polygon = turf.polygon(feature.geometry.coordinates);
    if (turf.booleanPointInPolygon(point, polygon)) {
      return feature.properties.ward_no;
    }
  }
  
  return null;
}
```

**Option 2: Using Police Station to Ward Mapping**
```typescript
// lib/mappings/policeStationToWard.ts
export const POLICE_STATION_TO_WARD: Record<string, number> = {
  'PS_001': 45,  // Cubbon Park PS → Ward 45
  'PS_002': 46,  // High Grounds PS → Ward 46
  // ... map all police stations to their wards
};
```

## Step 4: UI Updates

### Update Analytics UI

**File**: `components/analytics/DistrictSelector.tsx` → `WardSelector.tsx`

```typescript
export default function WardSelector({ onWardChange }: Props) {
  const [wards, setWards] = useState<Ward[]>([]);
  
  useEffect(() => {
    fetch('/api/wards')
      .then(res => res.json())
      .then(data => setWards(data.wards));
  }, []);
  
  return (
    <select onChange={(e) => onWardChange(Number(e.target.value))}>
      <option value="">All Wards</option>
      {wards.map(ward => (
        <option key={ward.ward_no} value={ward.ward_no}>
          Ward {ward.ward_no} - {ward.ward_name_en}
        </option>
      ))}
    </select>
  );
}
```

## Step 5: Analytics Query Updates

Update SQL queries to use ward_no instead of district_id:

```typescript
// Before (District-based)
SELECT COUNT(*) as count, district_id
FROM FIRs 
WHERE district_id = 'DIST_001'
GROUP BY district_id;

// After (Ward-based)
SELECT COUNT(*) as count, ward_no
FROM FIRs 
WHERE ward_no = 45
GROUP BY ward_no;
```

## Step 6: Data Migration Script

```typescript
// scripts/migrate-to-wards.ts
import { CatalystDataStore } from '@/lib/catalyst';
import { getWardForCoordinates } from '@/lib/geospatial/wardMapping';

async function migrateToWards() {
  const firs = await CatalystDataStore.execute('SELECT * FROM FIRs');
  
  for (const fir of firs) {
    if (fir.latitude && fir.longitude) {
      const wardNo = getWardForCoordinates(fir.latitude, fir.longitude);
      
      if (wardNo) {
        await CatalystDataStore.execute(
          `UPDATE FIRs SET ward_no = ${wardNo} WHERE id = ${fir.id}`
        );
      }
    }
  }
  
  console.log(`Migrated ${firs.length} FIRs to wards`);
}
```

## Step 7: Testing

Test ward boundary display:
```bash
cd crimeintel
npm run dev
```

Visit: http://localhost:3001/map

You should see:
- ✅ All 198 ward boundaries displayed
- ✅ Ward labels showing ward numbers
- ✅ Click on ward to highlight and show crime stats
- ✅ Crime data aggregated by ward

## Alternative: Use Existing Police Districts

If ward boundaries are hard to obtain, **keep using police districts** but update the terminology:

1. Rename "Districts" → "Police Jurisdictions" in UI
2. Update labels: "District" → "Police Station Area"
3. Keep the existing district_id system

This is **valid** because:
- Crime data is **filed at police stations**
- Police jurisdictions are official administrative boundaries
- BBMP wards are for civic administration, not law enforcement

## Data Licenses & Attribution

If using DataMeet data:
```
BBMP Ward Boundaries by DataMeet India community (CC BY 4.0)
Source: https://github.com/datameet/Municipal_Spatial_Data
```

## Troubleshooting

**Issue**: GeoJSON file too large (>5MB)
**Solution**: Use Mapbox Vector Tiles or simplify geometries with `mapshaper`

```bash
npm install -g mapshaper
mapshaper bbmp_wards.geojson -simplify 10% -o bbmp_wards_simplified.geojson
```

**Issue**: Ward boundaries don't align with crime data
**Solution**: Create mapping table between police stations and wards

**Issue**: Can't find official GeoJSON
**Solution**: Contact BBMP GIS Cell or use DataMeet community data

---

## Next Steps

1. ✅ Obtain official BBMP ward GeoJSON (198 wards)
2. ✅ Replace `public/bangalore.json` with `public/bbmp_wards.json`
3. ✅ Update map component to display ward boundaries
4. ✅ Add ward_no column to FIRs table
5. ✅ Migrate existing crime data to ward numbers
6. ✅ Update analytics queries to use ward_no
7. ✅ Test ward-based crime visualization
8. ✅ Update UI labels (District → Ward)

---

**Need Help?**
- BBMP GIS Cell: contact via bbmp.gov.in
- DataMeet Community: https://datameet.org
- OpenBangalore: https://github.com/openbangalore
