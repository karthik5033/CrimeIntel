import urllib.request, urllib.parse, json

query = """[out:json][timeout:250];
area["name"="Karnataka"]["admin_level"="4"]->.searchArea;
nwr["amenity"="police"](area.searchArea);
out center;"""

url = 'https://overpass-api.de/api/interpreter'
data = urllib.parse.urlencode({'data': query}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CrimeIntel/1.0', 'Accept': '*/*'})
try:
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        print(f"Success: {len(res_data['elements'])} elements")
        with open('osm_police.json', 'w') as f:
            json.dump(res_data, f)
except Exception as e:
    print('Error:', e)
