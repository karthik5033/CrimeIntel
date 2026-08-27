import urllib.request
import urllib.parse
import json
import time

try:
    with open('data/seed/Districts.json', 'r', encoding='utf-8') as f:
        districts = json.load(f)
except Exception as e:
    print("Error reading districts:", e)
    exit(1)

real_stations = []
station_id = 1

for d in districts:
    dist_name = d.get('name', '')
    query = f"police station in {dist_name}, Karnataka"
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=6"
    print(f"Fetching for {dist_name}...")
    
    req = urllib.request.Request(url, headers={'User-Agent': 'CrimeIntel/1.0 (test@example.com)'})
    try:
        with urllib.request.urlopen(req) as response:
            results = json.loads(response.read().decode('utf-8'))
            for res in results:
                real_stations.append({
                    "id": f"PS_{station_id}",
                    "name_en": res.get('name') or "Police Station",
                    "district_id": d.get('id'),
                    "lat": float(res.get('lat')),
                    "lng": float(res.get('lon'))
                })
                station_id += 1
    except Exception as e:
        print(f"Error for {dist_name}: {e}")
    
    time.sleep(1) # Be nice to Nominatim API

with open('data/seed/PoliceStations.json', 'w') as f:
    json.dump(real_stations, f, indent=2)

print(f"Successfully saved {len(real_stations)} REAL police stations!")
