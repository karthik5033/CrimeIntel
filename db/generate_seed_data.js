const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'output');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// Ensure sub-directories for different Catalyst Services
const dirs = {
  dataStore: path.join(outDir, 'Catalyst_DataStore'),
  noSql: path.join(outDir, 'Catalyst_NoSQL'),
  stratus: path.join(outDir, 'Catalyst_Stratus_Metadata'),
  cache: path.join(outDir, 'Catalyst_Cache')
};

Object.values(dirs).forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d);
});

let idCounters = {};
function nextId(table) {
  if (!idCounters[table]) idCounters[table] = 1;
  return idCounters[table]++;
}
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ==========================================
// 1. CATALYST DATA STORE (Relational Schema)
// ==========================================
const State = [{ StateID: 1, StateName: 'Karnataka', NationalityID: 1, Active: 1 }];
const District = [
  { DistrictID: 443, DistrictName: 'Bengaluru Urban', StateID: 1, Active: 1 },
  { DistrictID: 444, DistrictName: 'Mysuru', StateID: 1, Active: 1 },
  { DistrictID: 445, DistrictName: 'Mangaluru', StateID: 1, Active: 1 }
];
const Court = [
  { CourtID: 1, CourtName: '1st ACMM Bengaluru', DistrictID: 443, StateID: 1, Active: 1 },
  { CourtID: 2, CourtName: 'District Sessions Court Mysuru', DistrictID: 444, StateID: 1, Active: 1 }
];
const UnitType = [
  { UnitTypeID: 1, UnitTypeName: 'Police Station', CityDistState: 'City', Hierarchy: 1, Active: 1 }
];
const Unit = [
  { UnitID: 6, UnitName: 'Whitefield PS', TypeID: 1, ParentUnit: null, NationalityID: 1, StateID: 1, DistrictID: 443, Active: 1 },
  { UnitID: 7, UnitName: 'Koramangala PS', TypeID: 1, ParentUnit: null, NationalityID: 1, StateID: 1, DistrictID: 443, Active: 1 },
  { UnitID: 8, UnitName: 'Devaraja PS', TypeID: 1, ParentUnit: null, NationalityID: 1, StateID: 1, DistrictID: 444, Active: 1 }
];
const Rank = [ { RankID: 1, RankName: 'Constable', Hierarchy: 1, Active: 1 }, { RankID: 3, RankName: 'Inspector', Hierarchy: 3, Active: 1 } ];
const Designation = [ { DesignationID: 1, DesignationName: 'Investigating Officer', Active: 1, SortOrder: 1 } ];
const CaseCategory = [ { CaseCategoryID: 1, LookupValue: 'FIR' }, { CaseCategoryID: 3, LookupValue: 'UDR' } ];
const CaseStatusMaster = [ { CaseStatusID: 1, CaseStatusName: 'Under Investigation' }, { CaseStatusID: 2, CaseStatusName: 'Charge Sheeted' }, { CaseStatusID: 3, CaseStatusName: 'Closed' } ];
const GravityOffence = [ { GravityOffenceID: 1, LookupValue: 'Heinous' }, { GravityOffenceID: 2, LookupValue: 'Non-Heinous' } ];
const CrimeHead = [ { CrimeHeadID: 1, CrimeGroupName: 'Crimes Against Body', Active: 1 }, { CrimeHeadID: 2, CrimeGroupName: 'Crimes Against Property', Active: 1 } ];
const CrimeSubHead = [ { CrimeSubHeadID: 1, CrimeHeadID: 1, CrimeHeadName: 'Murder', SeqID: 1 }, { CrimeSubHeadID: 3, CrimeHeadID: 2, CrimeHeadName: 'Robbery', SeqID: 1 } ];
const Act = [ { ActCode: 'IPC', ActDescription: 'Indian Penal Code', ShortName: 'IPC', Active: 1 } ];
const Section = [ { ActCode: 'IPC', SectionCode: '302', SectionDescription: 'Punishment for murder', Active: 1 }, { ActCode: 'IPC', SectionCode: '392', SectionDescription: 'Punishment for robbery', Active: 1 } ];
const CrimeHeadActSection = [ { CrimeHeadID: 1, ActCode: 'IPC', SectionCode: '302' }, { CrimeHeadID: 2, ActCode: 'IPC', SectionCode: '392' } ];
const CasteMaster = [ { caste_master_id: 1, caste_master_name: 'General' } ];
const ReligionMaster = [ { ReligionID: 1, ReligionName: 'Hindu' } ];
const OccupationMaster = [ { OccupationID: 1, OccupationName: 'Private Employee' } ];

const Employee = [];
for (let i = 0; i < 50; i++) {
  Employee.push({
    EmployeeID: nextId('Employee'), DistrictID: randomChoice(District).DistrictID, UnitID: randomChoice(Unit).UnitID,
    RankID: randomChoice(Rank).RankID, DesignationID: randomChoice(Designation).DesignationID,
    KGID: 'KGID' + faker.string.numeric(6), FirstName: faker.person.firstName(),
    EmployeeDOB: faker.date.birthdate({ min: 25, max: 60, mode: 'age' }).toISOString().split('T')[0],
    GenderID: randomChoice([1, 2]), BloodGroupID: 1, PhysicallyChallenged: 0,
    AppointmentDate: faker.date.past({ years: 10 }).toISOString().split('T')[0]
  });
}

const CaseMaster = [];
const ComplainantDetails = [];
const Victim = [];
const Accused = [];
const ArrestSurrender = [];
const ActSectionAssociation = [];
const ChargesheetDetails = [];

// ==========================================
// 2. CATALYST NOSQL (Semi-structured / JSON)
// ==========================================
const NoSqlCaseNarratives = [];
const NoSqlReasoningLogs = [];

// ==========================================
// 3. CATALYST STRATUS (Blob Storage Metadata)
// ==========================================
const StratusEvidenceFiles = [];

// ==========================================
// 4. CATALYST CACHE (Key-Value)
// ==========================================
const CacheHotspotScores = {};

function generateCrimeNo(cat, dist, unit, yr, ser) {
  return `${cat}${dist.toString().padStart(4, '0')}${unit.toString().padStart(4, '0')}${yr}${ser.toString().padStart(5, '0')}`;
}

const numCases = 1000; // GENERATING ~1000 DATASET AS REQUESTED
let stationSerialCounters = {};

for (let i = 0; i < numCases; i++) {
  const caseId = nextId('CaseMaster');
  const unit = randomChoice(Unit);
  const districtId = unit.DistrictID;
  const category = randomChoice(CaseCategory);
  const year = randomChoice([2023, 2024, 2025, 2026]);
  
  const serialKey = `${unit.UnitID}_${category.CaseCategoryID}_${year}`;
  if (!stationSerialCounters[serialKey]) stationSerialCounters[serialKey] = 1;
  const serial = stationSerialCounters[serialKey]++;
  
  const crimeNo = generateCrimeNo(category.CaseCategoryID, districtId, unit.UnitID, year, serial);
  const caseNo = `${year}${serial.toString().padStart(5, '0')}`;
  const incidentDate = faker.date.recent({ days: 365 });
  const registeredDate = faker.date.soon({ days: 2, refDate: incidentDate });
  const subHead = randomChoice(CrimeSubHead);
  const head = CrimeHead.find(h => h.CrimeHeadID === subHead.CrimeHeadID);
  const status = randomChoice(CaseStatusMaster);
  const policePerson = randomChoice(Employee);
  const lat = faker.location.latitude({ min: 12.8, max: 13.1, precision: 6 });
  const lng = faker.location.longitude({ min: 77.5, max: 77.8, precision: 6 });
  
  // Data Store: FIR Record
  CaseMaster.push({
    CaseMasterID: caseId, CrimeNo: crimeNo, CaseNo: caseNo, CrimeRegisteredDate: registeredDate.toISOString().split('T')[0],
    PolicePersonID: policePerson.EmployeeID, PoliceStationID: unit.UnitID, CaseCategoryID: category.CaseCategoryID,
    GravityOffenceID: randomChoice(GravityOffence).GravityOffenceID, CrimeMajorHeadID: head.CrimeHeadID,
    CrimeMinorHeadID: subHead.CrimeSubHeadID, CaseStatusID: status.CaseStatusID, CourtID: randomChoice(Court).CourtID,
    IncidentFromDate: incidentDate.toISOString(), IncidentToDate: incidentDate.toISOString(), InfoReceivedPSDate: registeredDate.toISOString(),
    latitude: lat, longitude: lng, BriefFacts: faker.lorem.sentences(2)
  });

  // NoSQL: Rich Case Narrative
  NoSqlCaseNarratives.push({
    documentId: faker.string.uuid(),
    caseMasterId: caseId,
    crimeNo: crimeNo,
    fullNarrative: faker.lorem.paragraphs(3),
    extractedKeywords: faker.helpers.arrayElements(['weapon', 'night', 'two-wheeler', 'assault', 'gang', 'cyber'], 3),
    officerNotes: [
      { timestamp: faker.date.recent().toISOString(), note: "Witness claims they saw a blue vehicle." }
    ]
  });

  // Stratus: Evidence files metadata
  if (randomInt(0, 1) === 1) {
    StratusEvidenceFiles.push({
      fileId: faker.string.uuid(),
      caseMasterId: caseId,
      stratusBucketPath: `/evidence/firs/${crimeNo}_scanned.pdf`,
      fileType: 'application/pdf',
      ocrProcessed: true,
      extractedTextSize: randomInt(1000, 5000)
    });
  }

  // Act Section Association
  const possibleSections = CrimeHeadActSection.filter(chas => chas.CrimeHeadID === head.CrimeHeadID);
  if (possibleSections.length > 0) {
    const sect = randomChoice(possibleSections);
    ActSectionAssociation.push({ CaseMasterID: caseId, ActID: sect.ActCode, SectionID: sect.SectionCode, ActOrderID: 1, SectionOrderID: 1 });
  }

  // Complainant, Victim, Accused
  ComplainantDetails.push({ ComplainantID: nextId('Complainant'), CaseMasterID: caseId, ComplainantName: faker.person.fullName(), AgeYear: randomInt(18, 70), OccupationID: 1, ReligionID: 1, CasteID: 1, GenderID: 1 });
  Victim.push({ VictimMasterID: nextId('Victim'), CaseMasterID: caseId, VictimName: faker.person.fullName(), AgeYear: randomInt(10, 80), GenderID: 1, VictimPolice: '0' });
  
  const accId = nextId('Accused');
  Accused.push({ AccusedMasterID: accId, CaseMasterID: caseId, AccusedName: faker.person.fullName(), AgeYear: randomInt(18, 60), GenderID: 1, PersonID: `P${accId}` });

  if (status.CaseStatusID >= 2) {
    ArrestSurrender.push({ ArrestSurrenderID: nextId('ArrestSurrender'), CaseMasterID: caseId, ArrestSurrenderTypeID: 1, ArrestSurrenderDate: registeredDate.toISOString().split('T')[0], ArrestSurrenderStateId: 1, ArrestSurrenderDistrictId: districtId, PoliceStationID: unit.UnitID, IOID: policePerson.EmployeeID, CourtID: 1, AccusedMasterID: accId, IsAccused: 1, IsComplainantAccused: 0 });
    ChargesheetDetails.push({ CSID: nextId('Chargesheet'), CaseMasterID: caseId, csdate: registeredDate.toISOString(), cstype: 'A', PolicePersonID: policePerson.EmployeeID });
  }

  // Update Hotspot Cache
  const geoHashKey = `geo_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  if (!CacheHotspotScores[geoHashKey]) {
    CacheHotspotScores[geoHashKey] = { severityScore: 0, caseIds: [] };
  }
  CacheHotspotScores[geoHashKey].severityScore += (status.CaseStatusID === 1 ? 2 : 1);
  CacheHotspotScores[geoHashKey].caseIds.push(caseId);
}

// Generate Reasoning Logs (NoSQL)
for(let i=0; i<100; i++) {
  NoSqlReasoningLogs.push({
    logId: faker.string.uuid(),
    query: faker.lorem.sentence(),
    catalystCircuitTrace: {
      sqlAgent: { success: true, rowsFetched: randomInt(1, 10) },
      ocrAgent: { success: true, matchedFiles: randomInt(0, 2) },
      verifierAgent: { confidenceScore: faker.number.float({ min: 0.7, max: 0.99, fractionDigits: 2 }) }
    },
    timestamp: faker.date.recent().toISOString()
  });
}

// Export files
const dsData = { State, District, Court, UnitType, Unit, Rank, Designation, CaseCategory, CaseStatusMaster, GravityOffence, CrimeHead, CrimeSubHead, Act, Section, CrimeHeadActSection, CasteMaster, ReligionMaster, OccupationMaster, Employee, CaseMaster, ActSectionAssociation, ComplainantDetails, Victim, Accused, ArrestSurrender, ChargesheetDetails };
for (const [t, d] of Object.entries(dsData)) {
  fs.writeFileSync(path.join(dirs.dataStore, `${t}.json`), JSON.stringify(d, null, 2));
}

fs.writeFileSync(path.join(dirs.noSql, `CaseNarratives.json`), JSON.stringify(NoSqlCaseNarratives, null, 2));
fs.writeFileSync(path.join(dirs.noSql, `ReasoningLogs.json`), JSON.stringify(NoSqlReasoningLogs, null, 2));
fs.writeFileSync(path.join(dirs.stratus, `EvidenceFiles.json`), JSON.stringify(StratusEvidenceFiles, null, 2));
fs.writeFileSync(path.join(dirs.cache, `HotspotScores.json`), JSON.stringify(CacheHotspotScores, null, 2));

console.log(`Successfully generated 1000 synthetic cases targeting the FULL ZOHO CATALYST STACK!`);
