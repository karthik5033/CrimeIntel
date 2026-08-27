import urllib.request
import urllib.parse
import json

query = """
[out:json];
area["name"="Karnataka"]->.a;
nwr["amenity"="police"](area.a);
out center;
"""

url = "https://lz4.overpass-api.de/api/interpreter"
data = urllib.parse.urlencode({'data': query}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print(f"Found {len(result.get('elements', []))} police stations")
        with open("osm_police.json", "w") as f:
            json.dump(result, f)
except Exception as e:
    print(f"Error: {e}")
