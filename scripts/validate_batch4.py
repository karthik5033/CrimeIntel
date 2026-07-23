import os, csv
base = r"d:\coding_files\Projects\CrimeIntel\crime_mock_db"
files = ["Section_Updated.csv","ComplainantDetails.csv","Victim.csv","Accused.csv",
         "ActSectionAssociation.csv","ArrestSurrender.csv","ChargesheetDetails.csv"]
for f in files:
    path = os.path.join(base, f)
    with open(path, encoding="utf-8") as fh:
        rows = sum(1 for _ in fh) - 1
    print(f"{f}: {rows} rows")

# Quick repeat offender check
print("\n-- Repeat Offenders --")
with open(os.path.join(base, "Accused.csv"), encoding="utf-8") as fh:
    reader = csv.DictReader(fh)
    name_counts = {}
    for row in reader:
        n = row["AccusedName"]
        name_counts[n] = name_counts.get(n, 0) + 1
repeats = {k:v for k,v in name_counts.items() if v >= 2}
print(f"Total repeat offenders (2+ appearances): {len(repeats)}")
for name, count in sorted(repeats.items(), key=lambda x: -x[1])[:15]:
    print(f"  {name}: {count} FIRs")

# Validate arrest dates
print("\n-- Arrest Date Validation --")
cases = {}
for part in ["CaseMaster_Part1.csv", "CaseMaster_Part2.csv"]:
    with open(os.path.join(base, part), encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            cases[int(row["CaseMasterID"])] = row["CrimeRegisteredDate"]
ok = bad = 0
with open(os.path.join(base, "ArrestSurrender.csv"), encoding="utf-8") as fh:
    for row in csv.DictReader(fh):
        cid = int(row["CaseMasterID"])
        if cid in cases:
            if row["ArrestSurrenderDate"] >= cases[cid]:
                ok += 1
            else:
                bad += 1
print(f"  Dates OK: {ok}, Dates BAD: {bad}")
