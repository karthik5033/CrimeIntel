import urllib.request
import urllib.parse
import json

query = """
[out:json];
area["name"="Karnataka"]["admin_level"="4"]->.searchArea;
nwr["amenity"="police"](area.searchArea);
out center;
"""

url = "https://overpass-api.de/api/interpreter"
data = urllib.parse.urlencode({'data': query}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'User-Agent': 'KarnatakaPoliceFetcher/1.0 (dev@ksp.gov.in)'})

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        
    elements = result.get('elements', [])
    print(f"Found {len(elements)} police stations via Overpass!")
    
    # Load districts
    with open('data/seed/Districts.json', 'r', encoding='utf-8') as f:
        districts = json.load(f)
        
    real_stations = []
    for idx, e in enumerate(elements):
        lat = e.get('lat') or (e.get('center', {}).get('lat'))
        lng = e.get('lon') or (e.get('center', {}).get('lon'))
        
        if not lat or not lng:
            continue
            
        tags = e.get('tags', {})
        name = tags.get('name:en') or tags.get('name') or f"Police Station {idx+1}"
        
        # Find closest district
        closest_dist = districts[0]
        min_dist = float('inf')
        for d in districts:
            dist = (d['lat'] - lat)**2 + (d['lng'] - lng)**2
            if dist < min_dist:
                min_dist = dist
                closest_dist = d
                
        real_stations.append({
            "id": f"PS_REAL_{e['id']}",
            "name_en": name,
            "district_id": closest_dist['id'],
            "lat": lat,
            "lng": lng
        })
        
    with open('data/seed/PoliceStations.json', 'w', encoding='utf-8') as f:
        json.dump(real_stations, f, indent=2)
        
    print(f"Saved {len(real_stations)} stations to seed file.")
except Exception as e:
    print("Error:", e)
