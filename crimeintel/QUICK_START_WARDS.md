# 🚀 Quick Start: BBMP Ward Boundaries

## ✅ Ready to Use Files

1. ✅ **Sample Ward Data**: `public/bbmp_wards_sample.json` (198 wards)
2. ✅ **React Component**: `components/map/WardBoundaryLayer.tsx`
3. ✅ **Integration Guide**: `BBMP_WARD_INTEGRATION_GUIDE.md`
4. ✅ **Solution Document**: `WARD_BOUNDARIES_SOLUTION.md`

---

## 🎯 Add Ward Boundaries in 3 Steps

### Step 1: Import the Component

**File**: `components/map/GeospatialMap.tsx`

```typescript
import WardBoundaryLayer from './WardBoundaryLayer';
```

### Step 2: Add to Your Map

```typescript
export default function GeospatialMap() {
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  
  return (
    <Map
      initialViewState={{
        longitude: 77.5946,
        latitude: 12.9716,
        zoom: 11
      }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {/* Add this line 👇 */}
      <WardBoundaryLayer
        visible={true}
        showLabels={true}
        highlightedWard={selectedWard}
        onWardClick={(wardNo, wardName) => {
          console.log(`Selected: ${wardName}`);
          setSelectedWard(wardNo);
        }}
      />
      
      {/* Your other layers */}
    </Map>
  );
}
```

### Step 3: Run and Test

```bash
npm run dev
```

Visit: http://localhost:3001/map

**You should see**:
- ✅ 198 ward boundaries displayed as grid
- ✅ Ward numbers labeled on map
- ✅ Click any ward to highlight it
- ✅ Console logs the ward name

---

## 🎨 Customization Options

### Toggle Ward Visibility

```typescript
<WardBoundaryLayer visible={showWards} />

<button onClick={() => setShowWards(!showWards)}>
  {showWards ? 'Hide' : 'Show'} Wards
</button>
```

### Highlight Specific Ward

```typescript
<WardBoundaryLayer highlightedWard={45} />
```

### Hide Ward Labels

```typescript
<WardBoundaryLayer showLabels={false} />
```

### Handle Ward Clicks

```typescript
<WardBoundaryLayer
  onWardClick={(wardNo, wardName) => {
    // Fetch crime data for this ward
    fetchCrimeData(wardNo);
    
    // Show info panel
    setInfoPanel({
      wardNo,
      wardName,
      open: true
    });
  }}
/>
```

---

## 📊 Display Ward Statistics

**Create**: `components/map/WardInfoPanel.tsx`

```typescript
interface WardInfoPanelProps {
  wardNo: number;
  wardName: string;
}

export default function WardInfoPanel({ wardNo, wardName }: WardInfoPanelProps) {
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    fetch(`/api/wards/${wardNo}/stats`)
      .then(res => res.json())
      .then(setStats);
  }, [wardNo]);
  
  return (
    <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-bold text-lg">{wardName}</h3>
      <div className="mt-2 space-y-1">
        <div>Zone: {stats?.zone}</div>
        <div>Total Cases: {stats?.totalCases || 0}</div>
        <div>Crime Rate: {stats?.crimeRate || 0}</div>
      </div>
    </div>
  );
}
```

**Usage**:

```typescript
export default function GeospatialMap() {
  const [selectedWard, setSelectedWard] = useState<{
    no: number;
    name: string;
  } | null>(null);
  
  return (
    <>
      <Map>
        <WardBoundaryLayer
          highlightedWard={selectedWard?.no}
          onWardClick={(wardNo, wardName) => {
            setSelectedWard({ no: wardNo, name: wardName });
          }}
        />
      </Map>
      
      {selectedWard && (
        <WardInfoPanel
          wardNo={selectedWard.no}
          wardName={selectedWard.name}
        />
      )}
    </>
  );
}
```

---

## 🔧 API Endpoint for Ward Stats

**Create**: `app/api/wards/[wardNo]/stats/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { CatalystDataStore } from '@/lib/catalyst';

export async function GET(
  request: Request,
  { params }: { params: { wardNo: string } }
) {
  try {
    const wardNo = parseInt(params.wardNo);
    
    // Query crime data for this ward
    const query = `
      SELECT 
        COUNT(*) as total_cases,
        crime_type_en,
        COUNT(CASE WHEN status = 'Under Investigation' THEN 1 END) as pending
      FROM FIRs
      WHERE ward_no = ${wardNo}
      GROUP BY crime_type_en
    `;
    
    const results = await CatalystDataStore.executeZCQLQuery(query);
    
    // Get ward metadata
    const wardData = {
      wardNo,
      wardName: `Ward ${wardNo}`,
      zone: getZoneForWard(wardNo),
      totalCases: results.reduce((sum, r) => sum + r.total_cases, 0),
      crimeTypes: results,
      crimeRate: calculateCrimeRate(results)
    };
    
    return NextResponse.json(wardData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ward stats' },
      { status: 500 }
    );
  }
}

function getZoneForWard(wardNo: number): string {
  if (wardNo <= 28) return 'Yelahanka';
  if (wardNo <= 53) return 'Dasarahalli';
  if (wardNo <= 85) return 'Mahadevapura';
  if (wardNo <= 111) return 'Bommanahalli';
  if (wardNo <= 141) return 'East';
  if (wardNo <= 171) return 'South';
  if (wardNo <= 189) return 'West';
  return 'RR Nagar';
}
```

---

## 🗺️ Add Zone Filter

**Create**: `components/filters/ZoneFilter.tsx`

```typescript
const ZONES = [
  { id: 1, name: 'Yelahanka', wards: '1-28' },
  { id: 2, name: 'Dasarahalli', wards: '29-53' },
  { id: 3, name: 'Mahadevapura', wards: '54-85' },
  { id: 4, name: 'Bommanahalli', wards: '86-111' },
  { id: 5, name: 'East', wards: '112-141' },
  { id: 6, name: 'South', wards: '142-171' },
  { id: 7, name: 'West', wards: '172-189' },
  { id: 8, name: 'RR Nagar', wards: '190-198' }
];

export default function ZoneFilter({ onZoneSelect }: Props) {
  return (
    <select onChange={(e) => onZoneSelect(e.target.value)}>
      <option value="">All Zones</option>
      {ZONES.map(zone => (
        <option key={zone.id} value={zone.name}>
          {zone.name} (Wards {zone.wards})
        </option>
      ))}
    </select>
  );
}
```

---

## ⚠️ Important Notes

### Sample Data Warning

The current data in `bbmp_wards_sample.json` is **SAMPLE DATA** with approximate grid-based boundaries.

**For Production**:
- Replace with official BBMP ward boundaries
- Request from: BBMP GIS Cell (https://bbmp.gov.in)
- Or use: DataMeet open data (https://github.com/datameet/Municipal_Spatial_Data)

### Police Districts vs BBMP Wards

Your current system uses **Police Districts** which is correct for crime data!

**Police Districts**:
- ✅ Where FIRs are filed
- ✅ Official law enforcement boundaries
- ✅ ~80 police station jurisdictions

**BBMP Wards**:
- 📋 Electoral/civic administration
- 📋 198 wards for municipal governance
- 📋 Not directly linked to crime filing

**Recommendation**: Keep both! Show police districts (primary) + BBMP wards (optional overlay)

---

## 🎯 Next Steps

1. ✅ **Test sample ward boundaries** (done above)
2. ⏳ **Request official BBMP data** (from BBMP GIS Cell)
3. ⏳ **Replace sample with official** (`public/bbmp_wards.json`)
4. ⏳ **Add ward_no column to FIRs table**
5. ⏳ **Map existing FIRs to wards** (using coordinates)
6. ⏳ **Update analytics to support ward filtering**

---

## 📚 Related Files

- **Full Guide**: `BBMP_WARD_INTEGRATION_GUIDE.md`
- **Solution Doc**: `WARD_BOUNDARIES_SOLUTION.md`
- **Data Fetcher**: `scripts/fetch-bbmp-wards.js`
- **Sample Data**: `public/bbmp_wards_sample.json`
- **Component**: `components/map/WardBoundaryLayer.tsx`

---

## 🆘 Troubleshooting

**Map doesn't show wards**
- Check if `bbmp_wards_sample.json` exists in `public/` folder
- Verify map is fully loaded before adding layer
- Check browser console for errors

**Ward labels not visible**
- Set `showLabels={true}` prop
- Zoom in closer (labels appear at zoom level 11+)
- Check if map font is loaded

**Ward boundaries wrong shape**
- Sample data uses grid approximation
- Replace with official BBMP boundaries for accurate shapes

**Can't click on wards**
- Ensure `onWardClick` prop is provided
- Check if fill layer is visible
- Verify z-index of other map layers

---

## ✅ Success Checklist

- [x] Sample ward data generated (198 wards)
- [x] WardBoundaryLayer component created
- [x] Integration guide documented
- [ ] Component added to GeospatialMap
- [ ] Ward boundaries visible on map
- [ ] Ward click handlers working
- [ ] Official BBMP data requested
- [ ] Ward stats API created
- [ ] Crime data mapped to wards

---

**Ready to go!** Add the component to your map and test it right now! 🚀
