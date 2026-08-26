# Synthetic Data Generation Prompt for Karnataka Police FIR System

> **Instructions**: Upload the `Police_FIR_ER_Diagram.md` file along with this prompt to Gemini. Generate data in the batch order specified below. Each batch builds on the previous one.

---

## BATCH 1: Lookup & Master Tables (Generate First)

### Prompt:

```
I have attached the ER Diagram schema for the Karnataka Police FIR System. I need you to generate realistic synthetic data as CSV files for the following LOOKUP/MASTER tables. These are small reference tables that all other tables depend on.

Generate CSVs with headers matching EXACTLY the column names from the schema. Use comma-separated format. Output each table as a separate CSV code block clearly labeled.

### Tables to generate:

1. **State** — Generate 30 Indian states + UTs. Karnataka StateID = 29. Include all real Indian states.

2. **District** — Generate ALL 31 districts of Karnataka with real names:
   - Bagalkote, Ballari (Bellary), Belagavi (Belgaum), Bengaluru Rural, Bengaluru Urban, Bidar, Chamarajanagara, Chikkaballapura, Chikkamagaluru, Chitradurga, Dakshina Kannada, Davanagere, Dharwad, Gadag, Hassan, Haveri, Kalaburagi (Gulbarga), Kodagu, Kolar, Koppal, Mandya, Mysuru, Raichur, Ramanagara, Shivamogga, Tumakuru, Udupi, Uttara Kannada, Vijayanagara, Vijayapura, Yadgir
   - All with StateID = 29, Active = 1
   - DistrictID should be sequential starting from 1

3. **CaseCategory** — Generate exactly these rows:
   | CaseCategoryID | LookupValue |
   | 1 | FIR |
   | 2 | NCR |
   | 3 | UDR |
   | 4 | PAR |
   | 5 | CSR |
   | 8 | Zero FIR |

4. **GravityOffence** — Generate:
   | GravityOffenceID | LookupValue |
   | 1 | Heinous |
   | 2 | Non-Heinous |
   | 3 | Economic Offence |

5. **CaseStatusMaster** — Generate 10 realistic statuses:
   Under Investigation, Charge Sheeted, Convicted, Acquitted, Closed (Undetected), Closed (False Case), Pending Trial, Referred to Another PS, Compromised, Abated

6. **CrimeHead** — Generate 15 major crime head groups based on real NCRB categories:
   - Crimes Against Body
   - Crimes Against Property  
   - Crimes Against Women
   - Crimes Against Children
   - Crimes Against SCs/STs
   - Economic Offences
   - Cyber Crimes
   - Drug/Narcotic Offences
   - Arms Act Offences
   - Crimes Against Public Order
   - Traffic Related Offences
   - Environmental Offences
   - Crimes Related to Documents/Property
   - Sexual Offences
   - Other IPC Crimes

7. **CrimeSubHead** — Generate 50-60 crime sub-heads mapped to the CrimeHeads above. Examples:
   - Under "Crimes Against Body": Murder (302), Attempt to Murder (307), Culpable Homicide, Assault, Kidnapping, Grievous Hurt
   - Under "Crimes Against Property": Theft, Robbery, Dacoity, Burglary, Vehicle Theft, Chain Snatching
   - Under "Crimes Against Women": Dowry Death, Domestic Violence, Sexual Harassment, Stalking, Acid Attack
   - Under "Cyber Crimes": Online Fraud, Identity Theft, Cyber Stalking, Data Theft, Phishing
   - Under "Drug/Narcotic Offences": Ganja Possession, NDPS Trafficking, Drug Peddling
   - etc. for all heads. Include SeqID for ordering.

8. **Act** — Generate 20 real Indian legal acts:
   - IPC (Indian Penal Code) / BNS (Bharatiya Nyaya Sanhita)
   - CrPC / BNSS
   - NDPS Act
   - IT Act
   - SC/ST Prevention of Atrocities Act
   - POCSO Act
   - Arms Act
   - Dowry Prohibition Act
   - Motor Vehicles Act
   - Indian Evidence Act / BSA
   - Domestic Violence Act
   - Karnataka Police Act
   - Wildlife Protection Act
   - Explosives Act
   - Immoral Traffic Prevention Act
   - Juvenile Justice Act
   - UAPA
   - Prevention of Corruption Act
   - Negotiable Instruments Act
   - Foreigners Act

9. **Section** — Generate 80-100 commonly used sections across the Acts above:
   - IPC: 302, 307, 376, 420, 498A, 354, 304B, 379, 392, 395, 406, 409, 419, 468, 471, 506, 509, 323, 324, 326, 341, 342, 363, 366, 370, 384, 386, 427, 447, 452, 504, 34, 120B etc.
   - NDPS: 8, 15, 18, 20, 21, 22, 25, 27, 29
   - IT Act: 43, 66, 66A, 66B, 66C, 66D, 66E, 67
   - POCSO: 3, 4, 5, 6, 7, 8
   - Arms Act: 25, 27, 29
   - Include SectionDescription for each

10. **CrimeHeadActSection** — Map the crime heads to their relevant act-section combinations (30-50 mappings)

11. **Rank** — Generate 15 Karnataka Police ranks in hierarchy order:
    Director General of Police, Additional DGP, Inspector General, Deputy IG, Superintendent of Police, Additional SP, Deputy SP, Circle Inspector, Police Inspector, Police Sub-Inspector, Assistant Sub-Inspector, Head Constable, Police Constable, Special Reserve Inspector, Armed Reserve Constable

12. **Designation** — Generate 12 designations:
    Station House Officer (SHO), Investigating Officer (IO), Circle Inspector, Town Inspector, Rural Inspector, Crime Inspector, Traffic Inspector, Cyber Crime Inspector, Womens Help Desk, Control Room Officer, Beat Constable, Court Duty Officer

13. **UnitType** — Generate 8 types:
    Police Station, Circle Office, Sub-Division, District Police Office, Range Office, Zone Office, Police Headquarters, Traffic Police Station

14. **OccupationMaster** — Generate 20 occupations:
    Farmer, Government Employee, Private Employee, Business, Student, Homemaker, Daily Wage Worker, Auto/Taxi Driver, Teacher, Doctor, Lawyer, Engineer, Shopkeeper, Retired, Unemployed, IT Professional, Construction Worker, Vendor/Hawker, Military/Para-Military, Other

15. **ReligionMaster** — Generate 8:
    Hindu, Muslim, Christian, Jain, Buddhist, Sikh, Parsi, Other

16. **CasteMaster** — Generate 10 categories:
    General, OBC, SC, ST, OBC-A, OBC-B, Category-1, 2A, 2B, 3A, 3B

Output all as separate, clearly labeled CSV code blocks. Ensure all IDs are consistent and cross-referenceable.
```

---

## BATCH 2: Core Entity Tables (Generate Second)

### Prompt:

```
Using the lookup/master data generated in Batch 1 (attached or referenced), now generate the CORE ENTITY tables. These are medium-sized tables that the transactional FIR data will reference.

### Tables to generate:

1. **Unit** (Police Stations) — Generate 80 police stations across Karnataka:
   - Distribute across all 31 districts, with more stations in Bengaluru Urban (15), Mysuru (8), Belagavi (6), Mangaluru/DK (6), and fewer in smaller districts (1-3 each)
   - Use realistic Karnataka police station names like:
     Bengaluru: Cubbon Park PS, Whitefield PS, Electronic City PS, Koramangala PS, Jayanagar PS, HSR Layout PS, Indiranagar PS, Marathahalli PS, Yelahanka PS, KR Puram PS, Banashankari PS, Rajajinagar PS, Hebbal PS, Peenya PS, Basavanagudi PS
     Mysuru: Devaraja PS, Jayalakshmipuram PS, Nazarbad PS, Vijayanagar PS
     Belagavi: Camp PS, Market PS, Tilakwadi PS
     etc.
   - TypeID should reference UnitType (mostly = 1 for Police Station)
   - ParentUnit should create a realistic hierarchy (PS -> Circle -> Sub-Division -> District)
   - All StateID = 29, DistrictID matching the district
   - Active = 1

2. **Court** — Generate 40 courts across Karnataka:
   - High Court of Karnataka (Bengaluru)
   - 31 District & Sessions Courts (one per district)  
   - 5-8 additional courts: JMFC courts, Metropolitan Magistrate courts, Special Courts (NDPS, POCSO, SC/ST)
   - Use real court names where possible
   - Active = 1

3. **Employee** (Police Officers) — Generate 200 employees:
   - Distribute across the 80 police stations
   - Use realistic Kannada/South Indian names: mix of first names like Ramesh, Suresh, Manjunath, Basavaraj, Shivakumar, Priya, Lakshmi, Deepa, Kavitha, Anand, Vinay, Srinivas, Nagaraj, Jagadish, Ravi, Mahesh, Chandrashekhar, etc.
   - Ranks: ~2 SPs, ~5 DSPs, ~10 CIs, ~30 PIs, ~50 PSIs, ~40 ASIs, ~30 HCs, ~33 PCs
   - Realistic DOBs (ages 25-58), appointment dates
   - GenderID: ~85% male (1), ~15% female (2)
   - KGID format: "KG" + 6 digit number
   - BloodGroupID: random 1-8
   - PhysicallyChallenged: 98% = 0, 2% = 1

Output all as separate, clearly labeled CSV code blocks with exact column names from the schema.
```

---

## BATCH 3: Transactional Data — CaseMaster (Generate Third — MOST IMPORTANT)

### Prompt:

```
Now generate the MAIN TRANSACTIONAL TABLE — CaseMaster (FIRs). This is the most critical table. Generate 1000 FIR records.

Using the lookup data from Batch 1 and entity data from Batch 2, generate the CaseMaster table.

### Rules for CrimeNo format:
CrimeNo = [1 digit CaseCategory] + [4 digit DistrictID padded] + [4 digit UnitID padded] + [4 digit Year] + [5 digit serial]

Examples:
- FIR (category 1): 100010001202400001
- UDR (category 3): 300010001202400001  
- Zero FIR (category 8): 800010001202400001

### CaseNo format:
CaseNo = YYYY + 5-digit serial (last 9 digits of CrimeNo)

### Distribution requirements for 1000 FIRs:

**By CaseCategory:**
- FIR (1): 700 (~70%)
- UDR (3): 120 (~12%)
- NCR (2): 80 (~8%)
- PAR (4): 50 (~5%)
- Zero FIR (8): 30 (~3%)
- CSR (5): 20 (~2%)

**By CrimeHead (realistic distribution):**
- Crimes Against Property: 25% (Theft, Robbery, Burglary, Vehicle Theft, Chain Snatching)
- Crimes Against Body: 15% (Murder, Assault, Kidnapping, Attempt to Murder)
- Crimes Against Women: 12% (Dowry, DV, Harassment, Stalking)
- Cyber Crimes: 10% (Online Fraud, Phishing, Identity Theft)
- Economic Offences: 8% (Cheating, Forgery, Criminal Breach of Trust)
- Drug/Narcotic: 7%
- Traffic Related: 6%
- Crimes Against Children: 4%
- Crimes Against Public Order: 4%
- Other categories: remaining 9%

**By District (realistic for Karnataka):**
- Bengaluru Urban: 30% (it's the biggest city)
- Mysuru: 8%
- Belagavi: 6%
- Dakshina Kannada: 5%
- Tumakuru: 4%
- Other districts: distribute remaining ~47% somewhat evenly

**By Year:**
- 2024: 400 FIRs
- 2025: 400 FIRs
- 2026 (up to July): 200 FIRs

**By CaseStatus:**
- Under Investigation: 35%
- Charge Sheeted: 25%
- Pending Trial: 15%
- Convicted: 5%
- Acquitted: 3%
- Closed (Undetected): 8%
- Closed (False Case): 4%
- Others: 5%

**By GravityOffence:**
- Heinous: 20%
- Non-Heinous: 70%
- Economic: 10%

**Date patterns:**
- CrimeRegisteredDate: between 2024-01-01 and 2026-07-20
- IncidentFromDate: same day or 1-7 days before registration
- IncidentToDate: same as IncidentFromDate or up to 2 days after
- InfoReceivedPSDate: between IncidentToDate and CrimeRegisteredDate

**Location:**
- latitude/longitude should be realistic Karnataka coordinates
  - Bengaluru: lat 12.9-13.1, lon 77.5-77.7
  - Mysuru: lat 12.3-12.35, lon 76.6-76.7
  - Belagavi: lat 15.8-15.9, lon 74.5-74.6
  - Mangaluru: lat 12.85-12.92, lon 74.8-74.9
  - Other districts: use realistic coordinates

**BriefFacts:**
Generate realistic 2-4 sentence FIR summaries in English. Examples:
- "The complainant reported that unknown persons broke into their house at night and stole gold jewellery worth Rs 2,50,000 and cash Rs 50,000. The incident occurred while the family was away for a wedding."
- "The accused, known to the victim, assaulted her with a sharp weapon following a domestic dispute. The victim sustained injuries and was admitted to the district hospital."
- "The complainant received a phone call from an unknown person claiming to be a bank official. The caller obtained OTP and transferred Rs 1,45,000 from the complainant's account."
- Make them varied and realistic for each crime type.

**IMPORTANT — Crime Networks & Patterns (for Intelligence features):**
Create these intentional patterns in the data:
1. **Repeat offender pattern**: ~20 CaseMasterIDs should have the same accused persons appearing across 2-4 different FIRs (you'll link via Accused table in Batch 4)
2. **Geographic clusters**: Create 3-4 "hotspot" police stations with disproportionately more FIRs
3. **Temporal spikes**: Create a noticeable spike in vehicle theft during Oct-Dec 2025 (festival season)
4. **Serial pattern**: 5-6 chain snatching cases in Bengaluru with similar MO in BriefFacts (suggesting a serial offender)

**PolicePersonID** and **PoliceStationID** must reference valid Employee and Unit IDs from Batch 2.
**CourtID** should reference valid Court IDs from Batch 2 (only for cases that are Charge Sheeted/Convicted/Acquitted/Pending Trial).

Output as a CSV with exact column headers from the schema. Since 1000 rows is large, you can split into 2 outputs of 500 each.
```

---

## BATCH 4: People & Events Tables (Generate Fourth)

### Prompt:

```
Using the CaseMaster data from Batch 3, now generate the PEOPLE and EVENTS tables. Reference valid CaseMasterIDs from Batch 3.

### Tables to generate:

1. **ComplainantDetails** — Generate 1000 complainants (1 per CaseMaster, approximately):
   - Realistic Karnataka names (mix of Kannada, Urdu, Telugu, Tamil names common in Karnataka)
   - Male names: Ramesh, Venkatesh, Mohammed, Raju, Basavaraj, Hanumantha, Siddappa, Nagaraj, etc.
   - Female names: Lakshmi, Savitri, Fatima, Gayathri, Pushpa, Meena, Anitha, etc.
   - AgeYear: 18-75, bell curve around 30-45
   - GenderID: ~60% male (1), ~38% female (2), ~2% transgender (3)
   - OccupationID: weighted — more Farmers, Daily Wage, Private Employees
   - ReligionID: weighted — ~75% Hindu, ~15% Muslim, ~5% Christian, ~5% others (Karnataka demographics)
   - CasteID: realistic distribution

2. **Victim** — Generate 1200 victims:
   - Most cases have 1 victim, some have 2-3
   - Names similar style as complainants (sometimes same as complainant)
   - AgeYear: 1-80, with realistic distribution per crime type:
     - Crimes Against Children: ages 1-18
     - Crimes Against Women: ages 15-60
     - Others: 18-70
   - VictimPolice: "1" for ~2% of victims (cases where police were attacked), "0" for rest

3. **Accused** — Generate 1500 accused persons:
   - Most cases have 1-2 accused, some gang cases have 3-8
   - PersonID: A1, A2, A3... per case
   - **CRITICAL FOR INTELLIGENCE**: Create ~30 "repeat offenders" who appear across multiple CaseMasterIDs. Use the SAME AccusedName across different FIRs to simulate repeat criminals. Examples:
     - "Raju alias Bullet Raju" — appears in 4 vehicle theft FIRs
     - "Mohammed Sharif" — appears in 3 robbery cases  
     - "Suresh alias Chain Suresh" — appears in 5 chain snatching cases
     - "Deepak Kumar" — appears in 3 cyber fraud cases
     - Create 25-30 such repeat offenders with 2-5 appearances each
   - AgeYear: 18-55, bell curve around 22-35
   - GenderID: ~92% male, ~7% female, ~1% other

4. **ArrestSurrender** — Generate 600 arrest/surrender records:
   - ~500 arrests (ArrestSurrenderTypeID = 1), ~100 surrenders (= 2)
   - Only for cases with status = Charge Sheeted, Convicted, Under Investigation (not for Undetected/False cases)
   - ArrestSurrenderDate: after the CrimeRegisteredDate, within 1-180 days
   - Most arrests in the same district as the crime, ~10% in different districts
   - IOID must reference valid Employee IDs
   - AccusedMasterID must reference valid Accused IDs
   - IsAccused = 1 for most, IsComplainantAccused = 1 for ~3% (counter cases)

5. **ActSectionAssociation** — Generate 2000 act-section mappings:
   - Each CaseMaster should have 1-5 act-section combinations
   - Map realistically:
     - Murder cases: IPC 302, 201 (destruction of evidence)
     - Theft: IPC 379, 411 (receiving stolen property)
     - Robbery: IPC 392, 397, 34 (common intention)
     - Dowry: IPC 498A, 304B, Dowry Prohibition Act
     - Cyber Fraud: IT Act 66, 66C, 66D + IPC 420
     - Drug cases: NDPS Act sections
     - Gang cases: Add IPC 120B (conspiracy), 34 (common intention)
   - ActOrderID and SectionOrderID for display ordering (1, 2, 3...)

6. **ChargesheetDetails** — Generate 350 chargesheets:
   - Only for cases with CaseStatus = Charge Sheeted, Convicted, Acquitted, Pending Trial
   - csdate: 30-180 days after CrimeRegisteredDate
   - cstype: "A" (Chargesheet) for 70%, "B" (False Case) for 15%, "C" (Undetected) for 15%
   - PolicePersonID: valid Employee ID (the IO who filed the chargesheet)

Output all as separate, clearly labeled CSV code blocks with exact column headers.
```

---

## BATCH 5: Verification & Quality Check

### Prompt:

```
Review all the CSV data generated in Batches 1-4 and verify:

1. **Referential Integrity**: Every FK value in child tables exists as a PK in the parent table
2. **CrimeNo Format**: All CrimeNo values follow the exact format: [1 digit category][4 digit district padded][4 digit unit padded][4 digit year][5 digit serial]
3. **Date Consistency**: IncidentFromDate <= IncidentToDate <= InfoReceivedPSDate <= CrimeRegisteredDate
4. **Repeat Offender Check**: Confirm that 25-30 accused names appear across multiple CaseMasterIDs
5. **District-Unit Consistency**: The PoliceStationID in CaseMaster should belong to a Unit in the correct district
6. **Status-Court Consistency**: Cases with CourtID should have appropriate CaseStatus (not "Under Investigation")
7. **Crime Pattern Validation**: Verify the festival-season vehicle theft spike exists in Oct-Dec 2025

List any violations found and output corrected rows.
```

---

## GENERATION TIPS

- **Total expected records**: ~7000+ rows across all tables
- **Generate Batch 1 first** — everything else depends on those IDs
- **Keep track of IDs** — especially CaseMasterID, AccusedMasterID, EmployeeID, UnitID across batches
- **If Gemini hits output limits**, ask it to continue from where it stopped
- **Save each batch's CSV output** before moving to the next batch
