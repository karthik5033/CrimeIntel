#!/usr/bin/env python3
"""
Transforms Karnataka Police ER CSVs from crime_mock_db
into Next.js seed JSON files in crimeintel/data/seed/
"""
import csv
import json
import os

BASE = r"d:\coding_files\Projects\CrimeIntel\crime_mock_db"
TARGET = r"d:\coding_files\Projects\CrimeIntel\crimeintel\data\seed"

def read_csv(filename):
    path = os.path.join(BASE, filename)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))

cases_p1 = read_csv("CaseMaster_Part1.csv")
cases_p2 = read_csv("CaseMaster_Part2.csv")
cases = cases_p1 + cases_p2 if (cases_p1 or cases_p2) else read_csv("CaseMaster.csv")

accused = read_csv("Accused.csv")
complainants = read_csv("ComplainantDetails.csv")
victims = read_csv("Victim.csv")
units = read_csv("Unit.csv")
courts = read_csv("Court.csv")
sections = read_csv("Section_Updated.csv") or read_csv("Section.csv")
act_sections = read_csv("ActSectionAssociation.csv")
arrests = read_csv("ArrestSurrender.csv")
chargesheets = read_csv("ChargesheetDetails.csv")
subheads = read_csv("CrimeSubHead.csv")
heads = read_csv("CrimeHead.csv")
statuses = read_csv("CaseStatusMaster.csv")
districts = read_csv("District.csv")
employees = read_csv("Employee.csv")

subhead_map = {s["CrimeSubHeadID"]: s["CrimeHeadName"] for s in subheads}
status_map = {s["CaseStatusID"]: s["CaseStatusName"] for s in statuses}
district_map = {d["DistrictID"]: d["DistrictName"] for d in districts}

# 1. Transform FIRs & Cases
firs_json = []
cases_json = []

for c in cases:
    cid = c["CaseMasterID"]
    sh_id = c["CrimeMinorHeadID"]
    st_id = c["CaseStatusID"]
    
    crime_type = subhead_map.get(sh_id, "General Offence")
    status_name = status_map.get(st_id, "Under Investigation")
    
    try:
        lat = float(c["latitude"]) if c.get("latitude") else 12.9716
        lng = float(c.get("longitude")) if c.get("longitude") else 77.5946
    except:
        lat, lng = 12.9716, 77.5946
        
    fir_obj = {
        "id": f"FIR_{cid}",
        "fir_no": c.get("CrimeNo") or f"FIR/{cid}/2025",
        "case_no": c.get("CaseNo") or f"CASE_{cid}",
        "crime_type_id": f"CRIME_{sh_id}",
        "crime_type_en": crime_type,
        "crime_type_kn": crime_type,
        "police_station_id": f"PS_{c.get('PoliceStationID', '1')}",
        "district_id": f"DIST_{c.get('DistrictID', '1')}",
        "date": c.get("CrimeRegisteredDate", "2025-01-01"),
        "status_en": status_name,
        "description": c.get("BriefFacts", "Under active police investigation."),
        "lat": lat,
        "lng": lng
    }
    firs_json.append(fir_obj)
    
    case_obj = {
        "id": f"CASE_{cid}",
        "case_no": c.get("CaseNo") or f"CASE_{cid}",
        "status": status_name,
        "firs": [f"FIR_{cid}"],
        "summary_en": c.get("BriefFacts", "Case investigation record."),
        "primary_crime_type": crime_type,
        "latest_date": c.get("CrimeRegisteredDate", "2025-01-01")
    }
    cases_json.append(case_obj)

# 2. Transform Persons & Repeat Offenders
persons_json = []
relationships_json = []

# Detect repeat offenders in Accused
accused_counts = {}
for a in accused:
    name = a["AccusedName"]
    accused_counts[name] = accused_counts.get(name, 0) + 1

person_name_to_id = {}
repeat_offender_names = set()

for a in accused:
    aid = a["AccusedMasterID"]
    name = a["AccusedName"]
    cid = a["CaseMasterID"]
    count = accused_counts[name]
    is_repeat = count > 1
    
    if is_repeat:
        repeat_offender_names.add(name)
        if name in person_name_to_id:
            pid = person_name_to_id[name]
        else:
            pid = f"PERSON_ACCUSED_{aid}"
            person_name_to_id[name] = pid
            persons_json.append({
                "id": pid,
                "name_en": name,
                "name_kn": name,
                "age": int(a.get("AgeYear", 30)),
                "gender": "Female" if a.get("GenderID") == "F" else "Male",
                "district_id": "DIST_1",
                "risk_score": min(99, 65 + count * 8),
                "is_repeat_offender": True
            })
    else:
        pid = f"PERSON_ACCUSED_{aid}"
        persons_json.append({
            "id": pid,
            "name_en": name,
            "name_kn": name,
            "age": int(a.get("AgeYear", 30)),
            "gender": "Female" if a.get("GenderID") == "F" else "Male",
            "district_id": "DIST_1",
            "risk_score": 45,
            "is_repeat_offender": False
        })
        
    # Link Accused to FIR
    relationships_json.append({
        "id": f"REL_ACC_{aid}",
        "source": pid,
        "target": f"FIR_{cid}",
        "type": "ACCUSED_IN",
        "description": f"Accused in FIR {cid}"
    })

# Add Complainants
for comp in complainants:
    cid = comp["ComplainantID"]
    cmid = comp["CaseMasterID"]
    pid = f"PERSON_COMP_{cid}"
    persons_json.append({
        "id": pid,
        "name_en": comp["ComplainantName"],
        "name_kn": comp["ComplainantName"],
        "age": int(comp.get("AgeYear", 35)),
        "gender": "Female" if comp.get("GenderID") == "2" else "Male",
        "district_id": "DIST_1",
        "risk_score": 10,
        "is_repeat_offender": False
    })
    relationships_json.append({
        "id": f"REL_COMP_{cid}",
        "source": pid,
        "target": f"FIR_{cmid}",
        "type": "COMPLAINANT_OF",
        "description": f"Complainant for FIR {cmid}"
    })

# Add Repeat Offender cross-links (Graph edges between repeat offenders)
rep_list = list(repeat_offender_names)
for i in range(len(rep_list)):
    for j in range(i + 1, min(i + 4, len(rep_list))):
        p1 = person_name_to_id[rep_list[i]]
        p2 = person_name_to_id[rep_list[j]]
        relationships_json.append({
            "id": f"REL_SYND_{i}_{j}",
            "source": p1,
            "target": p2,
            "type": "KNOWN_ASSOCIATE",
            "description": "Linked through criminal network analysis"
        })

# 3. Police Stations
stations_json = []
for u in units:
    if u.get("TypeID") == "7" or u.get("UnitID"):
        uid = u["UnitID"]
        stations_json.append({
            "id": f"PS_{uid}",
            "name_en": u.get("UnitName", f"Police Station {uid}"),
            "district_id": f"DIST_{u.get('DistrictID', 1)}",
            "lat": 12.9716,
            "lng": 77.5946
        })

# Save all JSON files into crimeintel/data/seed/
os.makedirs(TARGET, exist_ok=True)
json.dump(firs_json, open(os.path.join(TARGET, "FIRs.json"), "w"), indent=2)
json.dump(cases_json, open(os.path.join(TARGET, "Cases.json"), "w"), indent=2)
json.dump(persons_json, open(os.path.join(TARGET, "Persons.json"), "w"), indent=2)
json.dump(relationships_json, open(os.path.join(TARGET, "EntityRelationships.json"), "w"), indent=2)
json.dump(stations_json, open(os.path.join(TARGET, "PoliceStations.json"), "w"), indent=2)

print(f"✨ Successfully transformed mock data into app seed files:")
print(f"   - FIRs.json: {len(firs_json)} records")
print(f"   - Cases.json: {len(cases_json)} records")
print(f"   - Persons.json: {len(persons_json)} records ({len(repeat_offender_names)} repeat offenders)")
print(f"   - EntityRelationships.json: {len(relationships_json)} graph edges")
print(f"   - PoliceStations.json: {len(stations_json)} records")
