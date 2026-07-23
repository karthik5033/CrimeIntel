const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../crimeintel/data/seed');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Helper: Counters for ID generation
let idCounters = {};
function nextId(prefix) {
  if (!idCounters[prefix]) idCounters[prefix] = 1;
  return `${prefix}_${idCounters[prefix]++}`;
}
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// --- DATA DICTIONARIES (English + Kannada) ---
const KANNADA_DISTRICTS = [
  { id: 'DIST_1', en: 'Bengaluru Urban', kn: 'ಬೆಂಗಳೂರು ನಗರ' },
  { id: 'DIST_2', en: 'Mysuru', kn: 'ಮೈಸೂರು' },
  { id: 'DIST_3', en: 'Mangaluru', kn: 'ಮಂಗಳೂರು' },
  { id: 'DIST_4', en: 'Hubballi-Dharwad', kn: 'ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ' },
  { id: 'DIST_5', en: 'Belagavi', kn: 'ಬೆಳಗಾವಿ' },
];

const KANNADA_CRIME_TYPES = [
  { id: 'CRIME_1', en: 'Vehicle Theft', kn: 'ವಾಹನ ಕಳವು', severity: 2 },
  { id: 'CRIME_2', en: 'Robbery', kn: 'ಸುಲಿಗೆ', severity: 4 },
  { id: 'CRIME_3', en: 'Cyber Fraud', kn: 'ಸೈಬರ್ ವಂಚನೆ', severity: 3 },
  { id: 'CRIME_4', en: 'Murder', kn: 'ಕೊಲೆ', severity: 5 },
  { id: 'CRIME_5', en: 'Assault', kn: 'ಹಲ್ಲೆ', severity: 3 },
  { id: 'CRIME_6', en: 'Drug Trafficking', kn: 'ಮಾದಕವಸ್ತು ಸಾಗಣೆ', severity: 4 },
  { id: 'CRIME_7', en: 'Extortion', kn: 'ಬೆದರಿಕೆ', severity: 4 },
];

const COMMON_NAMES = [
  { en: 'Rajesh Kumar', kn: 'ರಾಜೇಶ್ ಕುಮಾರ್' },
  { en: 'Suresh Babu', kn: 'ಸುರೇಶ್ ಬಾಬು' },
  { en: 'Manjunath Gowda', kn: 'ಮಂಜುನಾಥ್ ಗೌಡ' },
  { en: 'Anitha Reddy', kn: 'ಅನಿತಾ ರೆಡ್ಡಿ' },
  { en: 'Mohammed Ali', kn: 'ಮೊಹಮ್ಮದ್ ಅಲಿ' },
  { en: 'Pooja Sharma', kn: 'ಪೂಜಾ ಶರ್ಮಾ' },
  { en: 'Kiran Desai', kn: 'ಕಿರಣ್ ದೇಸಾಯಿ' },
  { en: 'Venkatesh Rao', kn: 'ವೆಂಕಟೇಶ್ ರಾವ್' },
  { en: 'Lakshmi Narayan', kn: 'ಲಕ್ಷ್ಮಿ ನಾರಾಯಣ್' },
  { en: 'Abdul Hameed', kn: 'ಅಬ್ದುಲ್ ಹಮೀದ್' }
];

// --- ARRAYS FOR OUTPUT ---
const Persons = [];
const PoliceStations = [];
const FIRs = [];
const Cases = [];
const Vehicles = [];
const PhoneRecords = [];
const BankAccounts = [];
const Weapons = [];
const EntityRelationships = []; // { source, target, type, properties }
const SocioEconomicData = [];

// 1. Generate Police Stations (50+)
for (let i = 0; i < 50; i++) {
  const dist = randomChoice(KANNADA_DISTRICTS);
  PoliceStations.push({
    id: nextId('PS'),
    name_en: `${faker.location.city()} PS`,
    name_kn: `${faker.location.city()} ಪೊಲೀಸ್ ಠಾಣೆ`, // pseudo-kannada fallback
    district_id: dist.id,
    district_name_en: dist.en,
    district_name_kn: dist.kn,
    lat: faker.location.latitude({ min: 12.0, max: 18.0 }),
    lng: faker.location.longitude({ min: 74.0, max: 78.0 }),
  });
}

// 2. Generate Persons (500+)
for (let i = 0; i < 500; i++) {
  const isCommon = randomInt(1, 10) > 8;
  const nameObj = isCommon ? randomChoice(COMMON_NAMES) : { en: faker.person.fullName(), kn: faker.person.fullName() };
  
  Persons.push({
    id: nextId('PERSON'),
    name_en: nameObj.en,
    name_kn: nameObj.kn,
    age: randomInt(15, 75),
    gender: randomChoice(['Male', 'Female']),
    address_en: faker.location.streetAddress(),
    district_id: randomChoice(KANNADA_DISTRICTS).id,
    risk_score: randomInt(0, 100),
    is_repeat_offender: randomInt(1, 100) > 90 // 10% repeat offenders
  });
}

// 3. Generate Vehicles, Phones, Banks, Weapons
for(let i=0; i<150; i++) Vehicles.push({ id: nextId('VEHICLE'), license_plate: faker.vehicle.vrm(), make: faker.vehicle.manufacturer(), model: faker.vehicle.model(), color: faker.vehicle.color() });
for(let i=0; i<300; i++) PhoneRecords.push({ id: nextId('PHONE'), number: faker.phone.number({ style: 'national' }), provider: randomChoice(['Jio', 'Airtel', 'Vi', 'BSNL']) });
for(let i=0; i<100; i++) BankAccounts.push({ id: nextId('BANK'), account_no: faker.finance.accountNumber(), bank_name: randomChoice(['SBI', 'HDFC', 'ICICI', 'Axis']), ifsc: 'IFSC' + randomInt(1000, 9999) });
for(let i=0; i<40; i++) Weapons.push({ id: nextId('WEAPON'), type: randomChoice(['Knife', 'Machete', 'Pistol', 'Iron Rod']), description: faker.lorem.words(3) });

// Connect persons to these assets
Persons.forEach(person => {
  if (randomInt(1, 10) > 5) {
    const v = randomChoice(Vehicles);
    EntityRelationships.push({ source: person.id, target: v.id, type: 'OWNS' });
  }
  if (randomInt(1, 10) > 2) {
    const p = randomChoice(PhoneRecords);
    EntityRelationships.push({ source: person.id, target: p.id, type: 'USES' });
  }
  if (randomInt(1, 10) > 7) {
    const b = randomChoice(BankAccounts);
    EntityRelationships.push({ source: person.id, target: b.id, type: 'HAS_ACCOUNT' });
  }
});

// Phone calls
for(let i=0; i<500; i++) {
  EntityRelationships.push({
    source: randomChoice(PhoneRecords).id,
    target: randomChoice(PhoneRecords).id,
    type: 'CALLED',
    properties: { duration: randomInt(10, 3600), timestamp: faker.date.recent().toISOString() }
  });
}

// 4. Generate FIRs (200+) and Cases (80+)
let caseCounter = 0;
for (let i = 0; i < 200; i++) {
  const fir_id = nextId('FIR');
  const crimeType = randomChoice(KANNADA_CRIME_TYPES);
  const ps = randomChoice(PoliceStations);
  
  FIRs.push({
    id: fir_id,
    fir_no: `FIR/${randomInt(100, 999)}/${2023 + randomInt(0, 3)}`,
    crime_type_id: crimeType.id,
    crime_type_en: crimeType.en,
    crime_type_kn: crimeType.kn,
    police_station_id: ps.id,
    date: faker.date.past({ years: 2 }).toISOString(),
    status_en: randomChoice(['Under Investigation', 'Charge Sheeted', 'Closed']),
    description: faker.lorem.paragraphs(2),
    lat: ps.lat + faker.number.float({ min: -0.05, max: 0.05 }),
    lng: ps.lng + faker.number.float({ min: -0.05, max: 0.05 })
  });

  // Assign Accused, Victims, Witnesses
  const accused = randomChoice(Persons);
  const victim = randomChoice(Persons);
  EntityRelationships.push({ source: accused.id, target: fir_id, type: 'ACCUSED_IN' });
  EntityRelationships.push({ source: victim.id, target: fir_id, type: 'VICTIM_OF' });
  
  if (randomInt(1, 10) > 8 && Weapons.length > 0) {
    EntityRelationships.push({ source: fir_id, target: randomChoice(Weapons).id, type: 'INVOLVED_WEAPON' });
  }

  // Group FIRs into Cases randomly (approx 80 cases)
  if (caseCounter < 80) {
    const case_id = nextId('CASE');
    Cases.push({
      id: case_id,
      case_no: `CR-${randomInt(1000, 9999)}`,
      status: 'Active',
      firs: [fir_id],
      summary_en: faker.lorem.paragraph()
    });
    caseCounter++;
  } else {
    // Append to existing case
    const existingCase = randomChoice(Cases);
    existingCase.firs.push(fir_id);
  }
}

// 5. EMBED SPECIFIC STORIES

function getPersonByName(enName) {
  return Persons.find(p => p.name_en === enName) || Persons[0];
}

// Story 1: Vehicle Theft Ring (Rajesh Kumar & Suresh Babu)
const rajesh = getPersonByName('Rajesh Kumar');
const suresh = getPersonByName('Suresh Babu');
const vTheftFir1 = nextId('FIR');
const vTheftFir2 = nextId('FIR');
const ringVehicle = Vehicles[0];

FIRs.push({ id: vTheftFir1, fir_no: 'FIR/101/2024', crime_type_id: 'CRIME_1', crime_type_en: 'Vehicle Theft', crime_type_kn: 'ವಾಹನ ಕಳವು', police_station_id: PoliceStations[0].id, date: new Date().toISOString(), status_en: 'Under Investigation', description: 'Vehicle stolen at night.', lat: PoliceStations[0].lat, lng: PoliceStations[0].lng });
FIRs.push({ id: vTheftFir2, fir_no: 'FIR/102/2024', crime_type_id: 'CRIME_1', crime_type_en: 'Vehicle Theft', crime_type_kn: 'ವಾಹನ ಕಳವು', police_station_id: PoliceStations[0].id, date: new Date().toISOString(), status_en: 'Under Investigation', description: 'Another vehicle stolen using similar MO.', lat: PoliceStations[0].lat, lng: PoliceStations[0].lng });

EntityRelationships.push({ source: rajesh.id, target: vTheftFir1, type: 'ACCUSED_IN' });
EntityRelationships.push({ source: suresh.id, target: vTheftFir2, type: 'ACCUSED_IN' });
EntityRelationships.push({ source: rajesh.id, target: suresh.id, type: 'KNOWN_ASSOCIATE' });
EntityRelationships.push({ source: rajesh.id, target: ringVehicle.id, type: 'USES' });
EntityRelationships.push({ source: suresh.id, target: ringVehicle.id, type: 'USES' });


// Story 2: Cybercrime Chain (Anitha Reddy money mule)
const anitha = getPersonByName('Anitha Reddy');
const bankA = BankAccounts[0];
const bankB = BankAccounts[1];
const cyberFir = nextId('FIR');

FIRs.push({ id: cyberFir, fir_no: 'FIR/CYB/2024', crime_type_id: 'CRIME_3', crime_type_en: 'Cyber Fraud', crime_type_kn: 'ಸೈಬರ್ ವಂಚನೆ', police_station_id: PoliceStations[1].id, date: new Date().toISOString(), status_en: 'Under Investigation', description: 'Phishing scam leading to money transfer.', lat: PoliceStations[1].lat, lng: PoliceStations[1].lng });
EntityRelationships.push({ source: anitha.id, target: cyberFir, type: 'ACCUSED_IN' });
EntityRelationships.push({ source: anitha.id, target: bankA.id, type: 'HAS_ACCOUNT' });
EntityRelationships.push({ source: bankA.id, target: bankB.id, type: 'TRANSFERRED_TO', properties: { amount: 50000, date: new Date().toISOString() } });


// Story 3: Unrelated murders connected by a vehicle
const murderFir1 = nextId('FIR');
const murderFir2 = nextId('FIR');
const sharedVehicle = Vehicles[1];

FIRs.push({ id: murderFir1, fir_no: 'FIR/M1/2024', crime_type_id: 'CRIME_4', crime_type_en: 'Murder', crime_type_kn: 'ಕೊಲೆ', police_station_id: PoliceStations[2].id, date: new Date().toISOString(), status_en: 'Under Investigation', description: 'Murder 1', lat: PoliceStations[2].lat, lng: PoliceStations[2].lng });
FIRs.push({ id: murderFir2, fir_no: 'FIR/M2/2024', crime_type_id: 'CRIME_4', crime_type_en: 'Murder', crime_type_kn: 'ಕೊಲೆ', police_station_id: PoliceStations[3].id, date: new Date().toISOString(), status_en: 'Under Investigation', description: 'Murder 2', lat: PoliceStations[3].lat, lng: PoliceStations[3].lng });

EntityRelationships.push({ source: sharedVehicle.id, target: murderFir1, type: 'SPOTTED_AT' });
EntityRelationships.push({ source: sharedVehicle.id, target: murderFir2, type: 'SPOTTED_AT' });


// 6. Socio-Economic Data (Phase 14 prep)
KANNADA_DISTRICTS.forEach(dist => {
  SocioEconomicData.push({
    district_id: dist.id,
    unemployment_rate: faker.number.float({ min: 3.0, max: 12.0, fractionDigits: 1 }),
    literacy_rate: faker.number.float({ min: 60.0, max: 95.0, fractionDigits: 1 }),
    population_density: randomInt(300, 5000),
  });
});

// Output
fs.writeFileSync(path.join(outDir, 'Persons.json'), JSON.stringify(Persons, null, 2));
fs.writeFileSync(path.join(outDir, 'PoliceStations.json'), JSON.stringify(PoliceStations, null, 2));
fs.writeFileSync(path.join(outDir, 'FIRs.json'), JSON.stringify(FIRs, null, 2));
fs.writeFileSync(path.join(outDir, 'Cases.json'), JSON.stringify(Cases, null, 2));
fs.writeFileSync(path.join(outDir, 'Vehicles.json'), JSON.stringify(Vehicles, null, 2));
fs.writeFileSync(path.join(outDir, 'PhoneRecords.json'), JSON.stringify(PhoneRecords, null, 2));
fs.writeFileSync(path.join(outDir, 'BankAccounts.json'), JSON.stringify(BankAccounts, null, 2));
fs.writeFileSync(path.join(outDir, 'Weapons.json'), JSON.stringify(Weapons, null, 2));
fs.writeFileSync(path.join(outDir, 'EntityRelationships.json'), JSON.stringify(EntityRelationships, null, 2));
fs.writeFileSync(path.join(outDir, 'SocioEconomicData.json'), JSON.stringify(SocioEconomicData, null, 2));

console.log('Phase 3 Seed Data Generation Complete! Output to: ' + outDir);
