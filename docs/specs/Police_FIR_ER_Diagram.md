# Police FIR System — ER Diagram

**Karnataka Police Department | Confidential**

## DB Schema

Entity Relationship Diagram — Database Design Document
Karnataka Police Department

### Color Legend

| Term | Meaning |
|---|---|
| PK — Primary Key | Uniquely identifies each record in the table |
| FK — Foreign Key | References the Primary Key of another table |
| Alternate row | Alternating row shading for readability |
| Normal column | Regular data column with no key constraint |

## Table Definitions

### CaseMaster

| Column Name | Type | Key | Description |
|---|---|---|---|
| CaseMasterID | INT | PK | Primary key — unique identifier for each FIR/case |
| CrimeNo | VARCHAR | | Crime Number is assigned at the police station level and is linked to the corresponding PoliceStationID. The Crime Number follows a structured format consisting of: 1 digit Case Category Code + 4 digit District ID + 4 digit Police Station ID (Unit ID) + 4 digit Year + 5 digit Running Serial Number. A separate running serial number is maintained for each police station, case category, and year.<br><br>Examples:<br>FIR: 104430006202600001<br>UDR: 304430006202600001<br>Zero FIR: 804430006202600001<br>PAR: 404430006202600001 |
| CaseNo | VARCHAR | | The Case Number is generated at the police station level and is associated with the corresponding PoliceStationID. For each case category, a unique serial number is maintained per police station and per year. The format is YYYY + 5-digit running serial number (e.g., 202600001). (Last 9 digits from CrimeNo) |
| CrimeRegisteredDate | DATE | | Date when the FIR was registered |
| PolicePersonID | INT | FK | FK → Employee.EmployeeID — officer who registered the FIR |
| PoliceStationID | INT | FK | FK → Unit.UnitID — police station where FIR is registered |
| CaseCategoryID | INT | FK | FK → CaseCategory.CaseCategoryID — category |
| GravityOffenceID | INT | FK | FK → GravityOffence.GravityOffenceID — gravity level of the offence |
| CrimeMajorHeadID | INT | FK | FK → CrimeHead.CrimeHeadID — major crime head classification |
| CrimeMinorHeadID | INT | FK | FK → CrimeSubHead.CrimeSubHeadID — minor crime sub-head classification |
| CaseStatusID | INT | FK | FK → CaseStatusMaster.CaseStatusID — current status of the case |
| CourtID | INT | FK | FK → Court.CourtID — court where the case is being heard |
| IncidentFromDate | DATETIME | | Start date and time of the incident |
| IncidentToDate | DATETIME | | End date and time of the incident |
| InfoReceivedPSDate | DATETIME | | Date and time when police station received information about the incident |
| latitude | DECIMAL | | GPS latitude coordinate of the incident location |
| longitude | DECIMAL | | GPS longitude coordinate of the incident location |
| BriefFacts | Nvarchar(Max) | | Summary of the case |

### ComplainantDetails

| Column Name | Type | Key | Description |
|---|---|---|---|
| ComplainantID | INT | PK | Primary key — unique identifier for the complainant |
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID — FIR/case filed by this complainant |
| ComplainantName | VARCHAR | | Full name of the complainant |
| AgeYear | INT | | Age of the complainant |
| OccupationID | INT | FK | FK → OccupationMaster.OccupationID — occupation of the complainant |
| ReligionID | INT | FK | FK → ReligionMaster.ReligionID — religion of the complainant |
| CasteID | INT | FK | FK → CasteMaster.caste_master_id — caste of the complainant |
| GenderID | INT | | Gender of the complainant (lookup value) |

### ActSectionAssociation

| Column Name | Type | Key | Description |
|---|---|---|---|
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID — FIR/case this act-section applies to |
| ActID | INT | FK | FK → Act.ActCode — legal act under which charges are framed |
| SectionID | INT | FK | FK → Section.SectionCode — specific section of the act invoked |
| ActOrderID | INT | | Display/print order of the act within the case |
| SectionOrderID | INT | | Display/print order of the section under the act |

### Victim

| Column Name | Type | Key | Description |
|---|---|---|---|
| VictimMasterID | INT | PK | Primary key — unique identifier for each victim |
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID — FIR/case this victim belongs to |
| VictimName | VARCHAR | | Full name of the victim |
| AgeYear | INT | | Age of the victim in years |
| GenderID | INT | | Gender of the victim (lookup value) like m, f, t |
| VictimPolice | VARCHAR | | If Victim is police then 1 else 0 |

### Accused

| Column Name | Type | Key | Description |
|---|---|---|---|
| AccusedMasterID | INT | PK | Primary key — unique identifier for each accused person |
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID — FIR/case this accused is linked to |
| AccusedName | VARCHAR | | Full name of the accused |
| AgeYear | INT | | Age of the accused |
| GenderID | INT | | Gender of the accused mentioned as M/F/T |
| PersonID | VARCHAR | | Accused Sorting like A1, A2, A3…. |

### ArrestSurrender

| Column Name | Type | Key | Description |
|---|---|---|---|
| ArrestSurrenderID | INT | PK | Primary key — unique identifier for each arrest/surrender event |
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID — FIR/case linked to this arrest/surrender |
| ArrestSurrenderTypeID | INT | | Type of event: arrest or voluntary surrender (lookup value) |
| ArrestSurrenderDate | DATE | | Date of arrest or surrender |
| ArrestSurrenderStateId | INT | FK | FK → State.StateID — state where arrest/surrender occurred |
| ArrestSurrenderDistrictId | INT | FK | FK → District.DistrictID — district where arrest/surrender occurred |
| PoliceStationID | INT | FK | FK → Unit.UnitID — police station handling the arrest |
| IOID | INT | FK | FK → Employee.EmployeeID — Investigating Officer who made the arrest |
| CourtID | INT | FK | FK → Court.CourtID — court before which accused was produced |
| AccusedMasterID | INT | FK | FK → Accused.AccusedMasterID — accused person linked to this arrest/surrender |
| IsAccused | BIT | | Flag (0/1): whether the person is the primary accused in the case |
| IsComplainantAccused | BIT | | Flag (0/1): whether the complainant is also listed as accused |

### Act

| Column Name | Type | Key | Description |
|---|---|---|---|
| ActCode | VARCHAR | PK | Primary key — unique code for the legal act (e.g. IPC, NDPS) |
| ActDescription | VARCHAR | | Full official name/description of the act |
| ShortName | VARCHAR | | Abbreviated/common name of the act |
| Active | BIT | | Whether the act is currently active and usable (1=Active, 0=Inactive) |

### Section

| Column Name | Type | Key | Description |
|---|---|---|---|
| ActCode | VARCHAR | FK | FK → Act.ActCode — parent act this section belongs to |
| SectionCode | VARCHAR | | Section number/code (e.g. 302, 307) |
| SectionDescription | VARCHAR | | Full description of the section |
| Active | BIT | | Whether the section is currently active (1=Active, 0=Inactive) |

### CrimeHeadActSection

| Column Name | Type | Key | Description |
|---|---|---|---|
| CrimeHeadID | INT | FK | FK → CrimeHead.CrimeHeadID — crime head this act-section combination maps to |
| ActCode | VARCHAR | FK | FK → Act.ActCode — legal act linked to this crime head |
| SectionCode | VARCHAR | | Section code from the act applicable to this crime head |

### CrimeHead

| Column Name | Type | Key | Description |
|---|---|---|---|
| CrimeHeadID | INT | PK | Primary key — unique identifier for the major crime head |
| CrimeGroupName | VARCHAR | | Name of the crime group/major head (e.g. Crimes Against Body) |
| Active | BIT | | Whether this crime head is active (1=Active, 0=Inactive) |

### CrimeSubHead

| Column Name | Type | Key | Description |
|---|---|---|---|
| CrimeSubHeadID | INT | PK | Primary key — unique identifier for the crime sub-head |
| CrimeHeadID | INT | FK | FK → CrimeHead.CrimeHeadID — parent major crime head this belongs to |
| CrimeHeadName | VARCHAR | | Name of this crime sub-head (e.g. Murder, Robbery) |
| SeqID | INT | | Display/sort sequence number for ordering sub-heads |

### CasteMaster

| Column Name | Type | Key | Description |
|---|---|---|---|
| caste_master_id | INT | PK | Primary key — unique identifier for each caste. Referenced by ComplainantDetails.CasteID |
| caste_master_name | VARCHAR | | Name of the caste |

### ReligionMaster

| Column Name | Type | Key | Description |
|---|---|---|---|
| ReligionID | INT | PK | Primary key — unique identifier for each religion. Referenced by ComplainantDetails.ReligionID |
| ReligionName | VARCHAR | | Name of the religion (e.g. Hindu, Muslim, Christian) |

### OccupationMaster

| Column Name | Type | Key | Description |
|---|---|---|---|
| OccupationID | INT | PK | Primary key — unique identifier for each occupation. Referenced by ComplainantDetails.OccupationID |
| OccupationName | VARCHAR | | Name of the occupation (e.g. Farmer, Government Employee) |

### CaseStatusMaster

| Column Name | Type | Key | Description |
|---|---|---|---|
| CaseStatusID | INT | PK | Primary key — unique identifier for each case status. Referenced by CaseMaster.CaseStatusID |
| CaseStatusName | VARCHAR | | Name of the status (e.g. Under Investigation, Charge Sheeted, Closed) |

### Court

| Column Name | Type | Key | Description |
|---|---|---|---|
| CourtID | INT | PK | Primary key — unique identifier for the court. Referenced by CaseMaster.CourtID, ArrestSurrender.CourtID |
| CourtName | VARCHAR | | Full name of the court |
| DistrictID | INT | FK | FK → District.DistrictID — district where the court is located |
| StateID | INT | FK | FK → State.StateID — state where the court is located |
| Active | BIT | | Whether the court is active (1=Active, 0=Inactive) |

### District

| Column Name | Type | Key | Description |
|---|---|---|---|
| DistrictID | INT | PK | Primary key — unique identifier for the district. Referenced by Court, Unit, Employee, ArrestSurrender |
| DistrictName | VARCHAR | | Name of the district |
| StateID | INT | FK | FK → State.StateID — state this district belongs to |
| Active | BIT | | Whether the district record is active (1=Active, 0=Inactive) |

### State

| Column Name | Type | Key | Description |
|---|---|---|---|
| StateID | INT | PK | Primary key — unique identifier for the state. Referenced by Court, District, Unit, ArrestSurrender |
| StateName | VARCHAR | | Name of the state |
| NationalityID | INT | | Nationality reference ID |
| Active | BIT | | Whether the state record is active (1=Active, 0=Inactive) |

### Unit

| Column Name | Type | Key | Description |
|---|---|---|---|
| UnitID | INT | PK | Primary key — unique identifier for the police unit. Referenced by CaseMaster.PoliceStationID, Employee.UnitID, ArrestSurrender.PoliceStationID |
| UnitName | VARCHAR | | Name of the unit or police station |
| TypeID | INT | FK | FK → UnitType.UnitTypeID — type/category of the unit |
| ParentUnit | INT | | Parent unit ID for hierarchy (self-reference to UnitID) |
| NationalityID | INT | | Nationality reference ID |
| StateID | INT | FK | FK → State.StateID — state the unit belongs to |
| DistrictID | INT | FK | FK → District.DistrictID — district the unit belongs to |
| Active | BIT | | Whether the unit is active (1=Active, 0=Inactive) |

### UnitType

| Column Name | Type | Key | Description |
|---|---|---|---|
| UnitTypeID | INT | PK | Primary key — unique identifier for the unit type. Referenced by Unit.TypeID |
| UnitTypeName | VARCHAR | | Name of the unit type (e.g. Police Station, Circle Office) |
| CityDistState | VARCHAR | | Operational level: City / District / State |
| Hierarchy | INT | | Hierarchy level number (lower = higher authority) |
| Active | BIT | | Whether the unit type is active (1=Active, 0=Inactive) |

### Rank

| Column Name | Type | Key | Description |
|---|---|---|---|
| RankID | INT | PK | Primary key — unique identifier for the rank. Referenced by Employee.RankID |
| RankName | VARCHAR | | Name of the police rank (e.g. Constable, Inspector, DSP) |
| Hierarchy | INT | | Rank hierarchy level (lower = higher rank) |
| Active | BIT | | Whether the rank is active (1=Active, 0=Inactive) |

### Designation

| Column Name | Type | Key | Description |
|---|---|---|---|
| DesignationID | INT | PK | Primary key — unique identifier for the designation. Referenced by Employee.DesignationID |
| DesignationName | VARCHAR | | Name of the designation (e.g. Investigating Officer, SHO) |
| Active | BIT | | Whether the designation is active (1=Active, 0=Inactive) |
| SortOrder | INT | | Display sort order for dropdowns/reports |

### Employee

| Column Name | Type | Key | Description |
|---|---|---|---|
| EmployeeID | INT | PK | Primary key — unique identifier for the police employee. Referenced by CaseMaster.PolicePersonID, ArrestSurrender.IOID |
| DistrictID | INT | FK | FK → District.DistrictID — district the employee is currently posted in |
| UnitID | INT | FK | FK → Unit.UnitID — unit/police station the employee is assigned to |
| RankID | INT | FK | FK → Rank.RankID — current rank of the employee |
| DesignationID | INT | FK | FK → Designation.DesignationID — current designation of the employee |
| KGID | VARCHAR | | Karnataka Government ID (unique government employee number) |
| FirstName | VARCHAR | | First name of the employee |
| EmployeeDOB | DATE | | Date of birth of the employee |
| GenderID | INT | | Gender of the employee (lookup value) |
| BloodGroupID | INT | | Blood group of the employee (lookup value) |
| PhysicallyChallenged | BIT | | Flag: whether the employee is physically challenged (1=Yes, 0=No) |
| AppointmentDate | DATE | | Date of appointment to government service |

### CaseCategory

| Column Name | Type | Key | Description |
|---|---|---|---|
| CaseCategoryID | INT | PK | Primary key — unique identifier for the case category. Referenced by CaseMaster.CaseCategoryID |
| LookupValue | VARCHAR | | Category name (FIR, UDR, PAR..) |

### GravityOffence

| Column Name | Type | Key | Description |
|---|---|---|---|
| GravityOffenceID | INT | PK | Primary key — unique identifier for the gravity level. Referenced by CaseMaster.GravityOffenceID |
| LookupValue | VARCHAR | | Gravity description (e.g. Heinous, Non-Heinous) |

### ChargesheetDetails

| Column Name | Type | Key | Description |
|---|---|---|---|
| CSID | INT | PK | Primary key — unique identifier for the chargesheet |
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID — FIR/case filed by this complainant |
| csdate | DATETIME | | Chargesheeted date |
| cstype | CHAR | | Final report type A-> Chargesheet, B->False Case, C->Undetected |
| PolicePersonID | INT | FK | FK → employeeMaster.employee ID |

## Relationship Matrix

Defines all foreign key relationships between tables, including cardinality and a brief description.

| Parent Table | Parent Column | Relationship | Child Table | Child Column | Description |
|---|---|---|---|---|---|
| CaseMaster | CaseMasterID | One to Many | Victim | CaseMasterID | One FIR can have multiple victims |
| CaseMaster | CaseMasterID | One to Many | Accused | CaseMasterID | One FIR can have multiple accused persons |
| CaseMaster | CaseMasterID | One to Many | ArrestSurrender | CaseMasterID | One FIR can have multiple arrest/surrender events |
| CaseMaster | CaseMasterID | One to Many | ComplainantDetails | CaseMasterID | One FIR can have multiple complainants |
| CaseMaster | CaseMasterID | One to Many | ActSectionAssociation | CaseMasterID | One FIR can invoke multiple act-sections |
| CaseMaster | CaseMasterID | One to One | Inv_OccuranceTime | CaseMasterID | One FIR has one occurrence time/location record |
| CaseMaster | CaseCategoryID | Many to One | CaseCategory | CaseCategoryID | Many FIRs can share the same category |
| CaseMaster | GravityOffenceID | Many to One | GravityOffence | GravityOffenceID | Many FIRs can have the same gravity level |
| CaseMaster | CrimeMajorHeadID | Many to One | CrimeHead | CrimeHeadID | Many FIRs can share the same major crime head |
| CaseMaster | CrimeMinorHeadID | Many to One | CrimeSubHead | CrimeSubHeadID | Many FIRs can share the same crime sub-head |
| CaseMaster | CaseStatusID | Many to One | CaseStatusMaster | CaseStatusID | Many FIRs can have the same status |
| CaseMaster | CourtID | Many to One | Court | CourtID | Many FIRs can be tried in the same court |
| CaseMaster | PolicePersonID | Many to One | Employee | EmployeeID | Many FIRs can be registered by the same employee |
| ArrestSurrender | AccusedMasterID (via junction) | One to Many | inv_arrestsurrenderaccused | ArrestSurrenderID | One arrest event can link multiple accused via junction |
| inv_arrestsurrenderaccused | ArrestSurrenderID | Many to One | ArrestSurrender | ArrestSurrenderID | Junction links to the arrest/surrender event |
| ArrestSurrender | ArrestSurrenderStateId | Many to One | State | StateID | Many arrest events can occur in the same state |
| ArrestSurrender | ArrestSurrenderDistrictId | Many to One | District | DistrictID | Many arrest events can occur in the same district |
| ArrestSurrender | CourtID | Many to One | Court | CourtID | Accused may be produced before a court |
| ArrestSurrender | IOID | Many to One | Employee | EmployeeID | Many arrests can be made by the same IO |
| ComplainantDetails | OccupationID | Many to One | OccupationMaster | OccupationID | Many complainants can share the same occupation |
| ComplainantDetails | ReligionID | Many to One | ReligionMaster | ReligionID | Many complainants can share the same religion |
| ComplainantDetails | CasteID | Many to One | CasteMaster | caste_master_id | Many complainants can belong to the same caste |
| ActSectionAssociation | ActID | Many to One | Act | ActCode | Many case-sections can reference the same act |
| ActSectionAssociation | SectionID | Many to One | Section | SectionCode | Many cases can use the same section |
| CrimeSubHead | CrimeHeadID | Many to One | CrimeHead | CrimeHeadID | Multiple sub-heads fall under one major crime head |
| CrimeHead | CrimeHeadID | One to Many | CrimeHeadActSection | CrimeHeadID | One crime head can map to multiple act-sections |
| Act | ActCode | One to Many | CrimeHeadActSection | ActCode | One act can be linked to multiple crime heads |
| Act | ActCode | One to Many | Section | ActCode | One act contains multiple sections |
| Court | DistrictID | Many to One | District | DistrictID | Many courts can be in the same district |
| District | StateID | Many to One | State | StateID | Many districts belong to one state |
| Unit | TypeID | Many to One | UnitType | UnitTypeID | Many units share the same unit type |
| Unit | StateID | Many to One | State | StateID | Many units are located in the same state |
| Unit | DistrictID | Many to One | District | DistrictID | Many units belong to the same district |
| Employee | DistrictID | Many to One | District | DistrictID | Many employees posted in the same district |
| Employee | UnitID | Many to One | Unit | UnitID | Many employees assigned to the same unit |
| Employee | RankID | Many to One | Rank | RankID | Many employees can hold the same rank |
| Employee | DesignationID | Many to One | Designation | DesignationID | Many employees can have the same designation |
