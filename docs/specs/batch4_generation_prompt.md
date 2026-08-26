# Batch 4 Generation Prompt — People, Events & Legal Mappings

> **Instructions**: You already have the context from Batches 1–3. Upload this prompt alongside the existing CSVs (especially `CaseMaster_Part1.csv`, `CaseMaster_Part2.csv`, `Employee.csv`, `Court.csv`, `Unit.csv`, `District.csv`, `Section.csv`, `Act.csv`, `CrimeSubHead.csv`, `CaseStatusMaster.csv`, `OccupationMaster.csv`, `ReligionMaster.csv`, `CasteMaster.csv`). Generate all 6 tables below as **separate downloadable CSV files** (NOT inline code blocks — the files will be too large). Reference ONLY valid IDs that exist in the Batch 1–3 CSVs.

---

## CRITICAL CONSTRAINTS (READ FIRST)

1. **CaseMasterID range**: 1–1000 (split across CaseMaster_Part1 and Part2). Every FK referencing CaseMasterID MUST be in this range.
2. **EmployeeID range**: 1–200.
3. **CourtID range**: 1–41.
4. **PoliceStationID (UnitID)**: Only use UnitIDs where TypeID=7 (police stations). These are IDs in the range ~111–190 approximately. Check the Unit.csv to be sure.
5. **DistrictID range**: 1–31. StateID = 29 (Karnataka) for all.
6. **ActCode values**: IPC, CRPC, NDPS, ITACT, SCST, POCSO, ARMS, DOWRY, MVACT, EVID, DVACT, KPACT, WLPA, EXPLO, ITPA, JJACT, UAPA, POCA, NIACT, FOREIGN
7. **SectionCode**: Use composite key (ActCode, SectionCode) for lookups. Check Section.csv for valid combinations. **You must also append these missing sections to Section.csv** that are needed for realistic mappings:
   - IPC,411,"Dishonestly receiving stolen property",1
   - IPC,201,"Causing disappearance of evidence",1
   - IPC,397,"Robbery with attempt to cause death or grievous hurt",1
   - IPC,34,"Acts done by several persons in furtherance of common intention",1
   - IPC,120B,"Criminal conspiracy",1
   - IPC,506,"Criminal intimidation",1
   - IPC,323,"Punishment for voluntarily causing hurt",1
   - IPC,504,"Intentional insult to provoke breach of peace",1
   - IPC,147,"Punishment for rioting",1
   - IPC,148,"Rioting armed with deadly weapon",1
   - IPC,149,"Every member of unlawful assembly guilty of offence",1
   - IPC,395,"Punishment for dacoity",1
   - IPC,457,"Lurking house-trespass by night to commit offence",1
   - IPC,380,"Theft in dwelling house",1
   - ITACT,66C,"Identity theft",1
   - ITACT,66D,"Cheating by personation using computer resource",1
   - NDPS,20,"Punishment for contravention in relation to cannabis",1
   - NDPS,22,"Punishment for contravention in relation to psychotropic substances",1
   - NDPS,29,"Punishment for abetment and criminal conspiracy",1
8. **GenderID for Accused**: Use string values "M", "F", "T" (NOT integers — schema says "mentioned as M/F/T")
9. **GenderID for ComplainantDetails and Victim**: Use integers 1 (Male), 2 (Female), 3 (Transgender)
10. **OccupationID range**: 1–20
11. **ReligionID range**: 1–8
12. **CasteID (caste_master_id) range**: 1–10
13. **CaseStatusID mapping** (for filtering which cases get chargesheets/arrests):
    - 1 = Under Investigation
    - 2 = Charge Sheeted
    - 3 = Convicted
    - 4 = Acquitted
    - 5 = Closed (Undetected)
    - 6 = Closed (False Case)
    - 7 = Pending Trial
    - 8 = Referred to Another PS
    - 9 = Compromised
    - 10 = Abated

---

## TABLE 1: ComplainantDetails.csv

**Columns**: `ComplainantID,CaseMasterID,ComplainantName,AgeYear,OccupationID,ReligionID,CasteID,GenderID`

**Generate 1000 rows** (one complainant per CaseMaster, IDs 1–1000):

- **ComplainantID**: Sequential 1–1000
- **CaseMasterID**: 1–1000 (one-to-one mapping: ComplainantID N → CaseMasterID N)
- **ComplainantName**: Realistic Karnataka names. Mix:
  - Kannada Hindu male: Ramesh, Venkatesh, Basavaraj, Hanumantha, Siddappa, Nagaraj, Manjunath, Shivakumar, Ravi, Prakash, Rajesh, Gururaj, Mahesh, Suresh, Ganesh, Vijaykumar, Anil, Deepak, Mahadeva, Rangaswamy
  - Kannada Hindu female: Lakshmi, Savitri, Gayathri, Pushpa, Meena, Anitha, Bharathi, Shanthala, Roopa, Geetha, Padma, Saraswathi, Nandini, Revathi, Kavitha, Suma, Sunitha, Divya
  - Muslim male: Mohammed Sharif, Abdul Kareem, Syed Hussain, Imran Ahmed, Faiz Ur Rahman, Akbar Ali, Rizwan Khan, Saleem Baig
  - Muslim female: Fatima, Ayesha, Nasreen, Shabana, Rehana, Zubaida
  - Christian: Joseph, Anthony, Maria, Grace, David, Peter, Cecilia, Rosemary
  - Add last names: Gowda, Naidu, Shetty, Reddy, Patil, Hegde, Rao, Nayak, Swamy, Murthy, Char, Achar, Bhat
  - **Each name MUST be unique** — append initials or father's names to deduplicate (e.g., "Ramesh K", "Ramesh S Gowda", "Ramesh B Naidu")
- **AgeYear**: 18–75, bell-curve around 30–45. Weighted: 18–25 (15%), 26–35 (30%), 36–45 (30%), 46–55 (15%), 56–75 (10%)
- **OccupationID**: Weighted — 1 (Farmer) 20%, 7 (Daily Wage) 18%, 3 (Private Employee) 15%, 4 (Business) 10%, 6 (Homemaker) 10%, 5 (Student) 8%, 16 (IT Professional) 5%, 8 (Auto/Taxi Driver) 4%, rest split across 2,9,10,11,12,13,14,15,17,18,19,20
- **ReligionID**: 1 (Hindu) 75%, 2 (Muslim) 15%, 3 (Christian) 5%, 4–8 split 5%
- **CasteID**: 2 (OBC) 35%, 1 (General) 20%, 3 (SC) 15%, 4 (ST) 8%, 8 (2A) 7%, 9 (2B) 5%, 5–7 and 10 split rest
- **GenderID**: 1 (Male) 60%, 2 (Female) 38%, 3 (Transgender) 2%

---

## TABLE 2: Victim.csv

**Columns**: `VictimMasterID,CaseMasterID,VictimName,AgeYear,GenderID,VictimPolice`

**Generate 1200 rows**:

- **VictimMasterID**: Sequential 1–1200
- **CaseMasterID**: 1–1000. Distribution:
  - ~800 cases get exactly 1 victim
  - ~150 cases get 2 victims
  - ~50 cases get 3 victims (gang rapes, dacoities, riots)
  - Every CaseMasterID 1–1000 must appear at least once
- **VictimName**: Same name pool as ComplainantDetails. For ~15% of cases, the victim name should MATCH the complainant name for that case (complainant IS the victim). For the rest, generate different names.
- **AgeYear**: Depends on CrimeMinorHeadID of the linked CaseMaster:
  - CrimeSubHead 16–19 (Crimes Against Children): ages 1–17
  - CrimeSubHead 11–15, 48–51 (Crimes Against Women / Sexual Offences): ages 14–60, weighted 18–35
  - CrimeSubHead 1–5 (Crimes Against Body): ages 18–70
  - All others: ages 18–70, bell-curve 25–45
- **GenderID**: integer
  - For Crimes Against Women subheads (11–15, 48–51): 95% female (2), 5% male (1)
  - For Crimes Against Children (16–19): 55% male (1), 45% female (2)
  - All others: 65% male (1), 33% female (2), 2% transgender (3)
- **VictimPolice**: "0" for 98% of victims, "1" for 2% (police personnel attacked on duty — preferably in Rioting/Assault cases, CrimeSubHead 4, 37, 38)

---

## TABLE 3: Accused.csv — **MOST CRITICAL FOR INTELLIGENCE FEATURES**

**Columns**: `AccusedMasterID,CaseMasterID,AccusedName,AgeYear,GenderID,PersonID`

**Generate 1500 rows**:

- **AccusedMasterID**: Sequential 1–1500
- **CaseMasterID**: 1–1000. Distribution:
  - ~600 cases get 1 accused
  - ~250 cases get 2 accused
  - ~100 cases get 3 accused
  - ~30 cases get 4–5 accused (gang crimes, dacoity, rioting)
  - ~20 cases get 6–8 accused (organized crime, riots)
  - Every CaseMasterID 1–1000 must appear at least once
- **PersonID**: Sequential per case: A1, A2, A3... (reset for each CaseMasterID)
- **AccusedName**: Same Karnataka name pool, BUT:

### REPEAT OFFENDERS (CRITICAL — THIS POWERS THE CRIMINAL NETWORK GRAPH):
Create **exactly 30 repeat offenders** who appear across multiple CaseMasterIDs with THE EXACT SAME NAME SPELLING. These are the backbone of the intelligence analytics:

| # | Repeat Offender Name | Alias | Crime Pattern | Appearances | Target CaseMasterIDs (pick from these CrimeSubHeads) |
|---|---|---|---|---|---|
| 1 | Raju alias Bullet Raju | Bullet Raju | Vehicle Theft (SubHead 10) | 4–5 FIRs | Pick from Vehicle Theft cases |
| 2 | Suresh alias Chain Suresh | Chain Suresh | Chain Snatching (SubHead 55) | 4–5 FIRs | Pick from Chain Snatching cases |
| 3 | Mohammed Sharif | — | Robbery (SubHead 7) | 3–4 FIRs | Pick from Robbery cases |
| 4 | Deepak Kumar alias Cyber Deepak | Cyber Deepak | Online Fraud (SubHead 27) | 3–4 FIRs | Pick from Cyber Crime cases |
| 5 | Srinivas alias Nari Srinivas | Nari Srinivas | Drug Peddling (SubHead 34) | 3–4 FIRs | Pick from NDPS cases |
| 6 | Manoj Patil | — | Burglary (SubHead 9) | 3 FIRs | Pick from Burglary cases |
| 7 | Imran Ahmed alias Immi | Immi | Robbery (SubHead 7) | 3 FIRs | Pick from Robbery cases |
| 8 | Ravi alias Katthi Ravi | Katthi Ravi | Assault (SubHead 4) | 3 FIRs | Pick from Assault cases |
| 9 | Satish alias Satta Satish | Satta Satish | Cheating (SubHead 23) | 3 FIRs | Pick from Economic Offence cases |
| 10 | Darshan alias Daaru Darshan | Daaru Darshan | Drunken Driving (SubHead 42) & Hit-Run (41) | 3 FIRs | Pick from Traffic cases |
| 11 | Lokesh alias Looti Lokesh | Looti Lokesh | Theft (SubHead 6) | 3 FIRs | Pick from Theft cases |
| 12 | Prasad alias Rowdy Prasad | Rowdy Prasad | Rioting (SubHead 37) | 3 FIRs | Pick from Public Order cases |
| 13 | Naveen alias Natti Naveen | Natti Naveen | Forgery (SubHead 25) | 2–3 FIRs | Pick from Forgery cases |
| 14 | Manja alias Ganja Manja | Ganja Manja | Ganja Possession (SubHead 32) | 3 FIRs | Pick from NDPS cases |
| 15 | Yusuf Khan | — | Dacoity (SubHead 8) | 2–3 FIRs | Pick from Dacoity cases |
| 16 | Basavaraj alias Basya | Basya | Domestic Violence (SubHead 12) | 3 FIRs | Pick from Women-related cases |
| 17 | Vinay alias Auto Vinay | Auto Vinay | Vehicle Theft (SubHead 10) | 3 FIRs | Pick from Vehicle Theft cases |
| 18 | Arun alias Arni | Arni | Chain Snatching (SubHead 55) | 2–3 FIRs | Pick from Chain Snatching cases |
| 19 | Shamsher alias Bullet | Bullet | Arms (SubHead 35) | 2 FIRs | Pick from Arms cases |
| 20 | Kiran alias Kiri | Kiri | Identity Theft (SubHead 28) | 2–3 FIRs | Pick from Cyber Crime cases |
| 21 | Papanna alias Paapi | Paapi | Murder (SubHead 1) | 2 FIRs | Pick from Murder cases |
| 22 | Muniyappa alias Muni | Muni | Stalking (SubHead 14) | 2 FIRs | Pick from Stalking cases |
| 23 | Shivu alias Sand Shivu | Sand Shivu | Illegal Sand Mining (SubHead 43) | 2 FIRs | Pick from Environment cases |
| 24 | Faisal alias Fizz | Fizz | Drug Peddling (SubHead 34) | 2 FIRs | Pick from NDPS cases |
| 25 | Chandru alias Chinna | Chinna | Theft (SubHead 6) | 2–3 FIRs | Pick from Theft cases |
| 26 | Harish alias Rowdy Harish | Rowdy Harish | Assault (SubHead 4) | 2 FIRs | Pick from Assault cases |
| 27 | Puttaswamy alias Land Puttu | Land Puttu | Land Fraud (SubHead 47) | 2 FIRs | Pick from Document Fraud cases |
| 28 | Shabbir alias Shabba | Shabba | Cheating (SubHead 23) | 2 FIRs | Pick from Economic Offence cases |
| 29 | Rakesh alias Rocky | Rocky | Attempt to Murder (SubHead 2) | 2 FIRs | Pick from Attempt to Murder cases |
| 30 | Nagesh alias Naaga | Naaga | Wildlife Poaching (SubHead 45) | 2 FIRs | Pick from Environment cases |

**IMPORTANT**: For repeat offenders, the `AccusedName` MUST be identical character-for-character across all their appearances. The age can vary by ±1 year (time passing between FIRs). GenderID should be consistent.

- **AgeYear (non-repeat)**: 18–55, bell-curve 22–35
- **GenderID**: "M" for 92%, "F" for 7%, "T" for 1%

---

## TABLE 4: ActSectionAssociation.csv

**Columns**: `CaseMasterID,ActID,SectionID,ActOrderID,SectionOrderID`

**Generate ~2000 rows** (each CaseMaster gets 1–5 act-section combos):

- **ActID**: Use the ActCode string (e.g., "IPC", "NDPS"), NOT an integer
- **SectionID**: Use the SectionCode (e.g., "302", "379"), NOT an integer

### Mapping rules by CrimeMinorHeadID (CrimeSubHead):

| CrimeSubHead | Crime | Primary Act-Sections | Additional (add for ~30% of cases) |
|---|---|---|---|
| 1 (Murder) | IPC 302 | + IPC 201, IPC 34 | IPC 120B for conspiracy |
| 2 (Attempt to Murder) | IPC 307 | + IPC 323, IPC 34 | IPC 506 |
| 3 (Culpable Homicide) | IPC 304B or IPC 302 | | |
| 4 (Assault) | IPC 323 | + IPC 504, IPC 506 | |
| 5 (Grievous Hurt) | IPC 326 | + IPC 323, IPC 34 | |
| 6 (Theft) | IPC 379 | + IPC 411 | IPC 457 for night break-in |
| 7 (Robbery) | IPC 392 | + IPC 397, IPC 34 | IPC 506 |
| 8 (Dacoity) | IPC 395 | + IPC 397, IPC 34, IPC 120B | |
| 9 (Burglary) | IPC 457 | + IPC 380, IPC 379 | |
| 10 (Vehicle Theft) | IPC 379 | + IPC 411 | MVACT 39 |
| 11 (Dowry Death) | IPC 304B | + IPC 498A, DOWRY 3 | DOWRY 4 |
| 12 (Domestic Violence) | IPC 498A | + DVACT 3, IPC 506 | DOWRY 3 |
| 13 (Sexual Harassment) | IPC 354 | + IPC 506 | |
| 14 (Stalking) | IPC 354D | + IPC 506 | |
| 15 (Acid Attack) | IPC 326A | + IPC 307 | |
| 16–19 (Children) | POCSO 4 or POCSO 6 | + IPC 376 for sexual, JJACT 75 | |
| 20–22 (SC/ST) | SCST 3 | + IPC 323, IPC 504 | |
| 23 (Cheating) | IPC 420 | + IPC 406 | IPC 120B |
| 24 (Criminal Breach) | IPC 406 | + IPC 420 | |
| 25 (Forgery) | IPC 465 | + IPC 468, IPC 471 | |
| 26 (Bank Fraud) | IPC 420 | + IPC 406, IPC 120B | |
| 27 (Online Fraud) | ITACT 66 | + ITACT 66C, ITACT 66D, IPC 420 | |
| 28 (Identity Theft) | ITACT 66C | + ITACT 66D, IPC 420 | |
| 29 (Cyber Stalking) | ITACT 66A | + IPC 354D, IPC 506 | |
| 30 (Data Theft) | ITACT 43 | + ITACT 66 | |
| 31 (Phishing) | ITACT 66D | + IPC 420 | |
| 32 (Ganja) | NDPS 20 | + NDPS 29 | |
| 33 (NDPS Trafficking) | NDPS 21 | + NDPS 29, NDPS 22 | |
| 34 (Drug Peddling) | NDPS 22 | + NDPS 29, NDPS 20 | |
| 35 (Illegal Firearm) | ARMS 25 | + ARMS 27 | |
| 36 (Arms Manufacturing) | ARMS 5 | + ARMS 25 | EXPLO 3 |
| 37 (Rioting) | IPC 147 | + IPC 148, IPC 149, IPC 323 | |
| 38 (Unlawful Assembly) | IPC 141 | + IPC 143, IPC 147 | |
| 39 (Promoting Enmity) | IPC 153A | + IPC 505 | |
| 40 (Rash Driving) | IPC 279 | + IPC 337, MVACT 184 | |
| 41 (Hit and Run) | IPC 304A | + IPC 279, MVACT 134 | |
| 42 (Drunken Driving) | MVACT 185 | + IPC 279 | |
| 43 (Sand Mining) | KPACT 98 | + KPACT 41 | |
| 44 (Tree Felling) | KPACT 33 | + WLPA 51 | |
| 45 (Wildlife Poaching) | WLPA 9 | + WLPA 51 | |
| 46 (Forged Documents) | IPC 465 | + IPC 468, IPC 471 | |
| 47 (Land Fraud) | IPC 420 | + IPC 465, IPC 467 | |
| 48 (Rape) | IPC 376 | + IPC 506 | POCSO 4 if victim minor |
| 49 (Gang Rape) | IPC 376D | + IPC 34, IPC 506 | |
| 50 (Outraging Modesty) | IPC 354 | + IPC 509 | |
| 51 (Unnatural Offence) | IPC 377 | | |
| 52 (Criminal Intimidation) | IPC 506 | + IPC 504 | |
| 53 (Defamation) | IPC 500 | + IPC 501 | |
| 54 (Mischief) | IPC 427 | + IPC 425 | |
| 55 (Chain Snatching) | IPC 392 | + IPC 356, IPC 34 | |

- **ActOrderID**: Sequential per CaseMasterID starting at 1 (one per unique Act)
- **SectionOrderID**: Sequential per Act per CaseMasterID starting at 1

**IMPORTANT**: Before generating, first output an updated `Section.csv` that appends the missing sections listed in the constraints above. Do NOT remove any existing rows.

---

## TABLE 5: ArrestSurrender.csv

**Columns**: `ArrestSurrenderID,CaseMasterID,ArrestSurrenderTypeID,ArrestSurrenderDate,ArrestSurrenderStateId,ArrestSurrenderDistrictId,PoliceStationID,IOID,CourtID,AccusedMasterID,IsAccused,IsComplainantAccused`

**Generate 600 rows**:

- **ArrestSurrenderID**: Sequential 1–600
- **CaseMasterID**: ONLY from cases with CaseStatusID IN (1, 2, 3, 4, 7) — i.e., Under Investigation, Charge Sheeted, Convicted, Acquitted, Pending Trial. Do NOT create arrests for Undetected (5), False Case (6), Referred (8), Compromised (9), Abated (10).
- **ArrestSurrenderTypeID**: 1 (Arrest) for 83%, 2 (Surrender) for 17%
- **ArrestSurrenderDate**: MUST be after CrimeRegisteredDate for that CaseMasterID. Add 1–180 days randomly (weighted: 1–7 days 40%, 8–30 days 30%, 31–90 days 20%, 91–180 days 10%)
- **ArrestSurrenderStateId**: 29 (Karnataka) for 90%. For 10%, use other Indian states (1–36 range, pick from State.csv)
- **ArrestSurrenderDistrictId**: For Karnataka arrests, use the same DistrictID as the PoliceStation from the CaseMaster. For out-of-state, use DistrictID 1 (a placeholder).
- **PoliceStationID**: For Karnataka arrests, use same PoliceStationID as CaseMaster. For out-of-state, use the originating PS.
- **IOID**: Valid EmployeeID (1–200). Prefer employees from the same Unit/District as the case.
- **CourtID**: Valid CourtID (1–41). Match DistrictID where possible.
- **AccusedMasterID**: Valid AccusedMasterID from Accused.csv (1–1500). The accused should belong to the same CaseMasterID.
- **IsAccused**: 1 for 97%, 0 for 3%
- **IsComplainantAccused**: 0 for 97%, 1 for 3% (counter-cases where complainant is also accused)

---

## TABLE 6: ChargesheetDetails.csv

**Columns**: `CSID,CaseMasterID,csdate,cstype,PolicePersonID`

**Generate 350 rows**:

- **CSID**: Sequential 1–350
- **CaseMasterID**: ONLY from cases with CaseStatusID IN (2, 3, 4, 7) — Charge Sheeted, Convicted, Acquitted, Pending Trial. Each qualifying case should get exactly 1 chargesheet.
- **csdate**: MUST be after CrimeRegisteredDate. Add 30–180 days (weighted: 30–60 days 30%, 61–90 days 35%, 91–120 days 20%, 121–180 days 15%)
- **cstype**: "A" (Chargesheet) for 70%, "B" (False Case) for 15%, "C" (Undetected) for 15%
- **PolicePersonID**: Valid EmployeeID (1–200). Should be from the same unit/district where the case was registered.

---

## OUTPUT FORMAT

Generate these as **7 separate downloadable CSV files**:

1. `Section_Updated.csv` — Existing Section.csv + appended missing sections
2. `ComplainantDetails.csv` — 1000 rows
3. `Victim.csv` — 1200 rows
4. `Accused.csv` — 1500 rows
5. `ActSectionAssociation.csv` — ~2000 rows
6. `ArrestSurrender.csv` — 600 rows
7. `ChargesheetDetails.csv` — 350 rows

**DO NOT truncate any file.** Every CSV must have ALL rows. If a file is too large for one output, split it into Part1/Part2 like CaseMaster was handled.

## VALIDATION CHECKLIST (Run before outputting)

- [ ] Every AccusedMasterID in ArrestSurrender exists in Accused.csv
- [ ] Every CaseMasterID in all tables is in range 1–1000
- [ ] Every EmployeeID (IOID, PolicePersonID) is in range 1–200
- [ ] Every CourtID is in range 1–41
- [ ] ArrestSurrenderDate > CrimeRegisteredDate for its CaseMasterID
- [ ] csdate > CrimeRegisteredDate for its CaseMasterID
- [ ] All 30 repeat offenders have identical AccusedName across appearances
- [ ] GenderID in Accused uses "M"/"F"/"T" (strings), GenderID in ComplainantDetails and Victim uses 1/2/3 (integers)
- [ ] ActID in ActSectionAssociation uses ActCode strings (e.g. "IPC"), not integers
- [ ] No ArrestSurrender rows for CaseStatusID 5, 6, 8, 9, 10
- [ ] No ChargesheetDetails rows for CaseStatusID 1, 5, 6, 8, 9, 10
- [ ] Every CaseMasterID 1–1000 appears in ComplainantDetails at least once
- [ ] Every CaseMasterID 1–1000 appears in Victim at least once
- [ ] Every CaseMasterID 1–1000 appears in Accused at least once
- [ ] Every CaseMasterID 1–1000 appears in ActSectionAssociation at least once
