#!/usr/bin/env python3
"""
Generate 5 enriched/flattened CSVs for QuickML pipelines.
Reads raw Batch 1-4 CSVs from crime_mock_db/ and outputs enriched versions.
"""
import csv
import os
from datetime import datetime, timedelta
from collections import defaultdict
import random

random.seed(42)

BASE = r"d:\coding_files\Projects\CrimeIntel\crime_mock_db"
OUT = BASE  # output to same folder

def read_csv(filename):
    path = os.path.join(BASE, filename)
    if not os.path.exists(path):
        print(f"  [WARN] {filename} not found, skipping")
        return []
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

def write_csv(filename, rows, fieldnames):
    path = os.path.join(OUT, filename)
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"  [OK] {filename} -> {len(rows)} rows, {len(fieldnames)} columns")

def safe_int(val, default=0):
    try:
        return int(val)
    except (ValueError, TypeError):
        return default

def parse_date(val):
    """Parse various date formats from the CSVs."""
    if not val or val.strip() == "":
        return None
    for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"]:
        try:
            return datetime.strptime(val.strip(), fmt)
        except ValueError:
            continue
    return None

# ============================================================
# STEP 0: Load all raw tables
# ============================================================
print("Loading raw CSVs...")
case_master = read_csv("CaseMaster.csv")
accused = read_csv("Accused.csv")
victim = read_csv("Victim.csv")
complainant = read_csv("ComplainantDetails.csv")
arrest = read_csv("ArrestSurrender.csv")
chargesheet = read_csv("ChargesheetDetails.csv")
act_section = read_csv("ActSectionAssociation.csv")
district = read_csv("District.csv")
unit = read_csv("Unit.csv")
employee = read_csv("Employee.csv")
crime_head = read_csv("CrimeHead.csv")
crime_sub_head = read_csv("CrimeSubHead.csv")
gravity = read_csv("GravityOffence.csv")
case_status = read_csv("CaseStatusMaster.csv")
section = read_csv("Section_Updated.csv")

# Build lookup dicts
print("Building lookups...")
unit_map = {row.get("UnitID", ""): row for row in unit}
district_map = {row.get("DistrictID", ""): row for row in district}
crime_head_map = {row.get("CrimeHeadID", ""): row for row in crime_head}
crime_sub_head_map = {row.get("CrimeSubHeadID", ""): row for row in crime_sub_head}
gravity_map = {}
for row in gravity:
    gid = row.get("GravityOffenceID", row.get("GravityID", ""))
    gravity_map[gid] = row
case_status_map = {row.get("CaseStatusID", ""): row for row in case_status}
case_master_map = {row.get("CaseMasterID", ""): row for row in case_master}

# Map PoliceStationID -> DistrictName via Unit table
def get_district_name(police_station_id):
    u = unit_map.get(str(police_station_id), {})
    did = u.get("DistrictID", "")
    d = district_map.get(str(did), {})
    return d.get("DistrictName", "Unknown")

def get_unit_name(police_station_id):
    u = unit_map.get(str(police_station_id), {})
    return u.get("UnitName", "Unknown")

# Which CaseMasterIDs have chargesheets?
chargesheet_cases = set()
for row in chargesheet:
    chargesheet_cases.add(row.get("CaseMasterID", ""))

# Crime category classification
VIOLENT_HEADS = {"1", "2", "3", "4", "5"}  # Adjust based on actual CrimeHeadIDs
PROPERTY_HEADS = {"6", "7", "8"}
CYBER_HEADS = {"9", "10"}

# ============================================================
# CSV 1: CaseMaster_Enriched.csv
# ============================================================
print("\n--- Generating CaseMaster_Enriched.csv ---")
enriched_cases = []
for row in case_master:
    cm_id = row.get("CaseMasterID", "")
    ps_id = row.get("PoliceStationID", "")
    major_id = row.get("CrimeMajorHeadID", "")
    minor_id = row.get("CrimeMinorHeadID", "")
    grav_id = row.get("GravityOffenceID", "")
    status_id = row.get("CaseStatusID", "")
    
    # Lookups
    district_name = get_district_name(ps_id)
    unit_name = get_unit_name(ps_id)
    crime_group = crime_head_map.get(str(major_id), {}).get("CrimeGroupName", "Unknown")
    crime_sub = crime_sub_head_map.get(str(minor_id), {}).get("CrimeHeadName", "Unknown")
    gravity_label = gravity_map.get(str(grav_id), {}).get("GravityOffenceName", gravity_map.get(str(grav_id), {}).get("GravityName", "Unknown"))
    status_label = case_status_map.get(str(status_id), {}).get("CaseStatusName", case_status_map.get(str(status_id), {}).get("StatusName", "Unknown"))
    
    # Derived date features
    incident_from = parse_date(row.get("IncidentFromDate", ""))
    incident_to = parse_date(row.get("IncidentToDate", ""))
    info_received = parse_date(row.get("InfoReceivedPSDate", ""))
    reg_date = parse_date(row.get("CrimeRegisteredDate", ""))
    
    duration_hours = 0
    if incident_from and incident_to:
        duration_hours = round((incident_to - incident_from).total_seconds() / 3600, 1)
    
    reporting_delay_hours = 0
    if incident_from and info_received:
        reporting_delay_hours = round((info_received - incident_from).total_seconds() / 3600, 1)
    
    incident_month = incident_from.month if incident_from else 0
    incident_dow = incident_from.weekday() if incident_from else 0  # 0=Monday
    incident_hour = incident_from.hour if incident_from else 0
    is_night = 1 if (incident_hour >= 20 or incident_hour <= 6) else 0
    
    has_chargesheet = 1 if cm_id in chargesheet_cases else 0
    is_resolved = 1 if safe_int(status_id) in [3, 4, 5, 6, 7] else 0  # Adjust based on actual status IDs
    
    enriched_cases.append({
        "CaseMasterID": cm_id,
        "CrimeNo": row.get("CrimeNo", ""),
        "CaseNo": row.get("CaseNo", ""),
        "CrimeRegisteredDate": row.get("CrimeRegisteredDate", ""),
        "PoliceStationID": ps_id,
        "UnitName": unit_name,
        "DistrictName": district_name,
        "CaseCategoryID": row.get("CaseCategoryID", ""),
        "GravityOffenceID": grav_id,
        "GravityLabel": gravity_label,
        "CrimeMajorHeadID": major_id,
        "CrimeGroupName": crime_group,
        "CrimeMinorHeadID": minor_id,
        "CrimeSubHeadName": crime_sub,
        "CaseStatusID": status_id,
        "CaseStatusName": status_label,
        "CourtID": row.get("CourtID", ""),
        "latitude": row.get("latitude", ""),
        "longitude": row.get("longitude", ""),
        "IncidentDurationHours": duration_hours,
        "ReportingDelayHours": reporting_delay_hours,
        "IncidentMonth": incident_month,
        "IncidentDayOfWeek": incident_dow,
        "IncidentHour": incident_hour,
        "IsNightTime": is_night,
        "HasChargesheet": has_chargesheet,
        "IsResolved": is_resolved,
    })

if enriched_cases:
    write_csv("CaseMaster_Enriched.csv", enriched_cases, list(enriched_cases[0].keys()))

# ============================================================
# CSV 2: Accused_Enriched.csv
# ============================================================
print("\n--- Generating Accused_Enriched.csv ---")

# Count FIRs per PersonID (repeat offender detection)
person_fir_count = defaultdict(int)
person_cases = defaultdict(list)
for row in accused:
    pid = row.get("PersonID", "")
    if pid:
        person_fir_count[pid] += 1
        person_cases[pid].append(row.get("CaseMasterID", ""))

enriched_accused = []
for row in accused:
    cm_id = row.get("CaseMasterID", "")
    pid = row.get("PersonID", "")
    case_row = case_master_map.get(str(cm_id), {})
    ps_id = case_row.get("PoliceStationID", "")
    major_id = case_row.get("CrimeMajorHeadID", "")
    grav_id = case_row.get("GravityOffenceID", "")
    
    fir_count = person_fir_count.get(pid, 1)
    is_repeat = 1 if fir_count > 1 else 0
    
    # Compute a risk score based on multiple factors
    base_risk = min(100, fir_count * 25)  # Repeat offenses add risk
    gravity_bonus = 15 if safe_int(grav_id) == 1 else (10 if safe_int(grav_id) == 2 else 0)
    # Young males have statistically higher recidivism (criminology literature)
    age = safe_int(row.get("AgeYear", "30"))
    age_factor = 10 if 18 <= age <= 30 else (5 if 30 < age <= 45 else 0)
    risk_score = min(100, max(5, base_risk + gravity_bonus + age_factor + random.randint(-5, 10)))
    
    enriched_accused.append({
        "AccusedMasterID": row.get("AccusedMasterID", ""),
        "CaseMasterID": cm_id,
        "AccusedName": row.get("AccusedName", ""),
        "AgeYear": row.get("AgeYear", ""),
        "GenderID": row.get("GenderID", ""),
        "PersonID": pid,
        "DistrictName": get_district_name(ps_id),
        "CrimeMajorHeadID": major_id,
        "CrimeGroupName": crime_head_map.get(str(major_id), {}).get("CrimeGroupName", "Unknown"),
        "GravityOffenceID": grav_id,
        "FIR_Count": fir_count,
        "IsRepeatOffender": is_repeat,
        "RiskScore": risk_score,
    })

if enriched_accused:
    write_csv("Accused_Enriched.csv", enriched_accused, list(enriched_accused[0].keys()))

# ============================================================
# CSV 3: ArrestTimeline.csv
# ============================================================
print("\n--- Generating ArrestTimeline.csv ---")
arrest_timeline = []
for row in arrest:
    cm_id = row.get("CaseMasterID", "")
    case_row = case_master_map.get(str(cm_id), {})
    
    reg_date = parse_date(case_row.get("CrimeRegisteredDate", ""))
    arrest_date = parse_date(row.get("ArrestSurrenderDate", ""))
    
    delay_days = 0
    if reg_date and arrest_date:
        delay_days = max(0, (arrest_date - reg_date).days)
    
    ps_id = case_row.get("PoliceStationID", "")
    major_id = case_row.get("CrimeMajorHeadID", "")
    grav_id = case_row.get("GravityOffenceID", "")
    
    incident_from = parse_date(case_row.get("IncidentFromDate", ""))
    is_night = 0
    if incident_from:
        is_night = 1 if (incident_from.hour >= 20 or incident_from.hour <= 6) else 0
    
    arrest_timeline.append({
        "ArrestSurrenderID": row.get("ArrestSurrenderID", ""),
        "CaseMasterID": cm_id,
        "ArrestSurrenderTypeID": row.get("ArrestSurrenderTypeID", ""),
        "ArrestSurrenderDate": row.get("ArrestSurrenderDate", ""),
        "CrimeRegisteredDate": case_row.get("CrimeRegisteredDate", ""),
        "ArrestDelayDays": delay_days,
        "DistrictName": get_district_name(ps_id),
        "CrimeMajorHeadID": major_id,
        "CrimeGroupName": crime_head_map.get(str(major_id), {}).get("CrimeGroupName", "Unknown"),
        "GravityOffenceID": grav_id,
        "IsNightTime": is_night,
        "AccusedMasterID": row.get("AccusedMasterID", ""),
        "IsAccused": row.get("IsAccused", ""),
    })

if arrest_timeline:
    write_csv("ArrestTimeline.csv", arrest_timeline, list(arrest_timeline[0].keys()))

# ============================================================
# CSV 4: DistrictCrimeAggregated.csv
# ============================================================
print("\n--- Generating DistrictCrimeAggregated.csv ---")

# Aggregate by district
district_stats = defaultdict(lambda: {
    "TotalFIRs": 0,
    "ViolentCrimeCount": 0,
    "PropertyCrimeCount": 0,
    "CyberCrimeCount": 0,
    "TotalArrestDelay": 0,
    "ArrestCount": 0,
    "RepeatOffenderCount": 0,
    "ChargeSheetCount": 0,
})

for row in case_master:
    ps_id = row.get("PoliceStationID", "")
    dn = get_district_name(ps_id)
    major_id = str(row.get("CrimeMajorHeadID", ""))
    cm_id = row.get("CaseMasterID", "")
    
    district_stats[dn]["TotalFIRs"] += 1
    if major_id in VIOLENT_HEADS:
        district_stats[dn]["ViolentCrimeCount"] += 1
    elif major_id in PROPERTY_HEADS:
        district_stats[dn]["PropertyCrimeCount"] += 1
    elif major_id in CYBER_HEADS:
        district_stats[dn]["CyberCrimeCount"] += 1
    
    if cm_id in chargesheet_cases:
        district_stats[dn]["ChargeSheetCount"] += 1

# Add arrest delay stats
for row in arrest_timeline:
    dn = row.get("DistrictName", "Unknown")
    district_stats[dn]["TotalArrestDelay"] += row.get("ArrestDelayDays", 0)
    district_stats[dn]["ArrestCount"] += 1

# Count repeat offenders per district
district_repeat = defaultdict(set)
for row in enriched_accused:
    if row["IsRepeatOffender"] == 1:
        district_repeat[row["DistrictName"]].add(row["PersonID"])

for dn in district_stats:
    district_stats[dn]["RepeatOffenderCount"] = len(district_repeat.get(dn, set()))

# Build output
agg_rows = []
all_firs = [v["TotalFIRs"] for v in district_stats.values()]
max_firs = max(all_firs) if all_firs else 1

for dn, stats in sorted(district_stats.items()):
    if dn == "Unknown":
        continue
    avg_delay = round(stats["TotalArrestDelay"] / max(stats["ArrestCount"], 1), 1)
    cs_rate = round(stats["ChargeSheetCount"] / max(stats["TotalFIRs"], 1), 3)
    
    # Composite risk score (0-100)
    fir_norm = stats["TotalFIRs"] / max(max_firs, 1)
    violent_factor = min(1, stats["ViolentCrimeCount"] / max(stats["TotalFIRs"], 1) * 2)
    repeat_factor = min(1, stats["RepeatOffenderCount"] / 10)
    delay_factor = min(1, avg_delay / 60)
    cs_penalty = max(0, 1 - cs_rate)  # Low chargesheet rate = higher risk
    
    risk_score = round(min(100, max(5,
        fir_norm * 30 +
        violent_factor * 25 +
        repeat_factor * 20 +
        delay_factor * 10 +
        cs_penalty * 15
    )))
    
    risk_level = "HIGH" if risk_score >= 65 else ("MEDIUM" if risk_score >= 35 else "LOW")
    
    # Find the district ID from district table
    did = ""
    for d in district:
        if d.get("DistrictName", "") == dn:
            did = d.get("DistrictID", "")
            break
    
    agg_rows.append({
        "DistrictID": did,
        "DistrictName": dn,
        "TotalFIRs": stats["TotalFIRs"],
        "ViolentCrimeCount": stats["ViolentCrimeCount"],
        "PropertyCrimeCount": stats["PropertyCrimeCount"],
        "CyberCrimeCount": stats["CyberCrimeCount"],
        "AvgArrestDelayDays": avg_delay,
        "RepeatOffenderCount": stats["RepeatOffenderCount"],
        "ChargeSheetRate": cs_rate,
        "RiskScore": risk_score,
        "RiskLevel": risk_level,
    })

if agg_rows:
    write_csv("DistrictCrimeAggregated.csv", agg_rows, list(agg_rows[0].keys()))

# ============================================================
# CSV 5: MonthlyDistrictCounts.csv
# ============================================================
print("\n--- Generating MonthlyDistrictCounts.csv ---")
monthly_counts = defaultdict(lambda: {"IncidentCount": 0, "ViolentCount": 0, "PropertyCount": 0})

for row in case_master:
    reg_date = parse_date(row.get("CrimeRegisteredDate", ""))
    if not reg_date:
        continue
    
    ps_id = row.get("PoliceStationID", "")
    dn = get_district_name(ps_id)
    if dn == "Unknown":
        continue
    
    ym = reg_date.strftime("%Y-%m")
    major_id = str(row.get("CrimeMajorHeadID", ""))
    
    key = (ym, dn)
    monthly_counts[key]["IncidentCount"] += 1
    if major_id in VIOLENT_HEADS:
        monthly_counts[key]["ViolentCount"] += 1
    if major_id in PROPERTY_HEADS:
        monthly_counts[key]["PropertyCount"] += 1

monthly_rows = []
for (ym, dn), counts in sorted(monthly_counts.items()):
    monthly_rows.append({
        "YearMonth": ym,
        "DistrictName": dn,
        "IncidentCount": counts["IncidentCount"],
        "ViolentCount": counts["ViolentCount"],
        "PropertyCount": counts["PropertyCount"],
    })

if monthly_rows:
    write_csv("MonthlyDistrictCounts.csv", monthly_rows, list(monthly_rows[0].keys()))

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "="*60)
print("GENERATION COMPLETE!")
print("="*60)
output_files = [
    "CaseMaster_Enriched.csv",
    "Accused_Enriched.csv",
    "ArrestTimeline.csv",
    "DistrictCrimeAggregated.csv",
    "MonthlyDistrictCounts.csv",
]
for f in output_files:
    path = os.path.join(OUT, f)
    if os.path.exists(path):
        size = os.path.getsize(path)
        with open(path, encoding="utf-8", newline="") as fh:
            rows = sum(1 for _ in fh) - 1
        print(f"  {f}: {rows} rows, {size/1024:.1f} KB")
    else:
        print(f"  {f}: MISSING!")
