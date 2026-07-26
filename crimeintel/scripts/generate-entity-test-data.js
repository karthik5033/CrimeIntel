/**
 * Generate synthetic test data with intentionally fragmented person records
 * to test entity resolution precision (target: ≥90%)
 */

const fs = require('fs');
const path = require('path');

// Ground truth: 50 unique persons, each with 2-4 fragmented variants
const groundTruthPersons = [
  // Pattern 1: Name variations (full name, initials, nicknames)
  {
    canonical_id: 'P001',
    variants: [
      { name: 'Rajesh Kumar Sharma', phone: '9876543210', vehicle: 'KA01AB1234', address: 'Whitefield, Bengaluru' },
      { name: 'Rajesh K Sharma', phone: '9876543210', vehicle: 'KA01AB1234', address: 'Whitefield, Bangalore' },
      { name: 'R K Sharma', phone: null, vehicle: 'KA01AB1234', address: 'Whitefield' },
      { name: 'Rajesh Kumar', phone: '9876543210', vehicle: null, address: 'Whitefield, Bengaluru' },
    ]
  },
  {
    canonical_id: 'P002',
    variants: [
      { name: 'Suresh Babu Reddy', phone: '9988776655', vehicle: 'KA02CD5678', address: 'Indiranagar, Bengaluru' },
      { name: 'Suresh B Reddy', phone: '9988776655', vehicle: null, address: 'Indiranagar, Bangalore' },
      { name: 'S B Reddy', phone: null, vehicle: 'KA02CD5678', address: 'Indiranagar' },
    ]
  },
  // Pattern 2: Transliteration variants (Kannada <-> English)
  {
    canonical_id: 'P003',
    variants: [
      { name: 'Manjunath Gowda', phone: '9123456789', vehicle: 'KA03EF9012', address: 'Jayanagar, Mysuru' },
      { name: 'Manjunatha Gowda', phone: '9123456789', vehicle: null, address: 'Jayanagar, Mysore' },
      { name: 'Manjunat Gouda', phone: null, vehicle: 'KA03EF9012', address: 'Jayanagar, Mysuru' },
    ]
  },
  {
    canonical_id: 'P004',
    variants: [
      { name: 'Venkatesh Rao', phone: '9234567890', vehicle: 'KA04GH3456', address: 'Malleshwaram, Bengaluru' },
      { name: 'Venkatesha Rao', phone: '9234567890', vehicle: null, address: 'Malleshwaram, Bangalore' },
      { name: 'Venkatesh Rau', phone: null, vehicle: 'KA04GH3456', address: 'Malleshwaram' },
    ]
  },
  // Pattern 3: Phonetic variants
  {
    canonical_id: 'P005',
    variants: [
      { name: 'Prakash Shetty', phone: '9345678901', vehicle: 'KA05IJ7890', address: 'Koramangala, Bengaluru' },
      { name: 'Prakash Shetty', phone: '9345678901', vehicle: null, address: 'Koramangala, Bangalore' },
      { name: 'Prakaash Shetty', phone: null, vehicle: 'KA05IJ7890', address: 'Koramangala' },
    ]
  },
  // Pattern 4: Typos and OCR errors
  {
    canonical_id: 'P006',
    variants: [
      { name: 'Ramesh Naik', phone: '9456789012', vehicle: 'KA06KL1234', address: 'BTM Layout, Bengaluru' },
      { name: 'Ramesh Naik', phone: '9456789012', vehicle: null, address: 'BTM Layout, Bangalore' },
      { name: 'Ramesh Naick', phone: null, vehicle: 'KA06KL1234', address: 'BTM Layout' },
      { name: 'Ramesh Nayak', phone: '9456789012', vehicle: null, address: 'BTM Layout, Bengaluru' },
    ]
  },
  // Pattern 5: Address variations
  {
    canonical_id: 'P007',
    variants: [
      { name: 'Dinesh Kumar', phone: '9567890123', vehicle: 'KA07MN5678', address: 'HSR Layout, Sector 1, Bengaluru' },
      { name: 'Dinesh Kumar', phone: '9567890123', vehicle: null, address: 'HSR Layout, Bengaluru' },
      { name: 'Dinesh Kumar', phone: null, vehicle: 'KA07MN5678', address: 'HSR, Bangalore' },
    ]
  },
  // Pattern 6: Shared phone (should NOT merge - different persons)
  {
    canonical_id: 'P008',
    variants: [
      { name: 'Anil Sharma', phone: '9678901234', vehicle: 'KA08OP9012', address: 'Yelahanka, Bengaluru' },
      { name: 'Anil Sharma', phone: '9678901234', vehicle: null, address: 'Yelahanka, Bangalore' },
    ]
  },
  {
    canonical_id: 'P009',
    variants: [
      { name: 'Sunil Sharma', phone: '9678901234', vehicle: 'KA09QR3456', address: 'Hebbal, Bengaluru' }, // Different person, shared phone
      { name: 'Sunil Sharma', phone: '9678901234', vehicle: null, address: 'Hebbal, Bangalore' },
    ]
  },
  // Pattern 7: Same name, different persons (should NOT merge)
  {
    canonical_id: 'P010',
    variants: [
      { name: 'Rajesh Kumar', phone: '9789012345', vehicle: 'KA10ST7890', address: 'Electronic City, Bengaluru' },
      { name: 'Rajesh Kumar', phone: '9789012345', vehicle: null, address: 'Electronic City, Bangalore' },
    ]
  },
  {
    canonical_id: 'P011',
    variants: [
      { name: 'Rajesh Kumar', phone: '9890123456', vehicle: 'KA11UV1234', address: 'Sarjapur Road, Bengaluru' }, // Different person
      { name: 'Rajesh Kumar', phone: '9890123456', vehicle: null, address: 'Sarjapur Road, Bangalore' },
    ]
  },
  // More test cases (expand to 50 unique persons with 150+ total records)
  {
    canonical_id: 'P012',
    variants: [
      { name: 'Mohan Lal', phone: '9901234567', vehicle: 'KA12WX5678', address: 'Kengeri, Bengaluru' },
      { name: 'Mohan Lal', phone: '9901234567', vehicle: null, address: 'Kengeri, Bangalore' },
      { name: 'Mohanlal', phone: null, vehicle: 'KA12WX5678', address: 'Kengeri' },
    ]
  },
  {
    canonical_id: 'P013',
    variants: [
      { name: 'Ganesh Bhat', phone: '9012345678', vehicle: 'KA13YZ9012', address: 'Vijayanagar, Bengaluru' },
      { name: 'Ganesha Bhat', phone: '9012345678', vehicle: null, address: 'Vijayanagar, Bangalore' },
    ]
  },
  {
    canonical_id: 'P014',
    variants: [
      { name: 'Kiran Patel', phone: '9123456780', vehicle: 'KA14AB3456', address: 'Nagarbhavi, Bengaluru' },
      { name: 'Kiran Patel', phone: '9123456780', vehicle: null, address: 'Nagarbhavi, Bangalore' },
      { name: 'Kiran B Patel', phone: null, vehicle: 'KA14AB3456', address: 'Nagarbhavi' },
    ]
  },
  {
    canonical_id: 'P015',
    variants: [
      { name: 'Ashok Reddy', phone: '9234567801', vehicle: 'KA15CD7890', address: 'Banashankari, Bengaluru' },
      { name: 'Ashok B Reddy', phone: '9234567801', vehicle: null, address: 'Banashankari, Bangalore' },
    ]
  },
  // Add 35 more persons...
  ...generateAdditionalPersons(35, 16)
];

function generateAdditionalPersons(count, startId) {
  const firstNames = ['Ravi', 'Sanjay', 'Vijay', 'Amit', 'Sunil', 'Arun', 'Manoj', 'Rakesh', 'Naveen', 'Pradeep',
    'Shivaji', 'Raghavan', 'Krishna', 'Murali', 'Balaji', 'Anand', 'Harish', 'Deepak', 'Vivek', 'Santosh',
    'Gopal', 'Shankar', 'Ramesh', 'Mahesh', 'Naresh', 'Yogesh', 'Girish', 'Suresh', 'Umesh', 'Rajendra',
    'Vishwas', 'Sachin', 'Nitin', 'Prashant', 'Karthik'];
  
  const lastNames = ['Kumar', 'Rao', 'Reddy', 'Gowda', 'Shetty', 'Nair', 'Iyer', 'Hegde', 'Bhat', 'Pai',
    'Naik', 'Yadav', 'Verma', 'Singh', 'Gupta', 'Joshi', 'Desai', 'Kulkarni', 'Jain', 'Agarwal'];
  
  const areas = ['Marathahalli', 'Bellandur', 'Bommanahalli', 'Kadugodi', 'Varthur', 'Hulimavu',
    'JP Nagar', 'RR Nagar', 'Peenya', 'Rajarajeshwari Nagar', 'Yeshwanthpur', 'Jalahalli',
    'Mathikere', 'Rajajinagar', 'Mahalakshmi Layout', 'Basaveshwara Nagar', 'Chamrajpet'];
  
  const persons = [];
  
  for (let i = 0; i < count; i++) {
    const id = `P${String(startId + i).padStart(3, '0')}`;
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / 2) % lastNames.length];
    const fullName = `${firstName} ${lastName}`;
    const phone = `9${String(100000000 + i * 12345).slice(0, 9)}`;
    const vehicle = `KA${String(16 + i).padStart(2, '0')}${['AB', 'CD', 'EF', 'GH', 'IJ'][i % 5]}${String(1000 + i * 123).slice(0, 4)}`;
    const area = areas[i % areas.length];
    
    const variants = [
      { name: fullName, phone, vehicle, address: `${area}, Bengaluru` },
      { name: fullName, phone, vehicle: null, address: `${area}, Bangalore` },
      { name: `${firstName} ${lastName[0]}`, phone: null, vehicle, address: area },
    ];
    
    persons.push({ canonical_id: id, variants });
  }
  
  return persons;
}

// Generate test records (flatten variants)
const testRecords = [];
let recordId = 1;

groundTruthPersons.forEach(person => {
  person.variants.forEach(variant => {
    testRecords.push({
      id: `TEST_${String(recordId).padStart(4, '0')}`,
      canonical_id: person.canonical_id, // Ground truth for evaluation
      ...variant,
      age: 25 + Math.floor(Math.random() * 30),
      gender: Math.random() > 0.1 ? 'M' : 'F',
    });
    recordId++;
  });
});

// Create ground truth mapping for evaluation
const groundTruthMap = {};
testRecords.forEach(record => {
  if (!groundTruthMap[record.canonical_id]) {
    groundTruthMap[record.canonical_id] = [];
  }
  groundTruthMap[record.canonical_id].push(record.id);
});

// Calculate expected clusters
const expectedClusters = Object.keys(groundTruthMap).length;
const totalRecords = testRecords.length;

console.log('=== Entity Resolution Test Data Generation ===');
console.log(`Generated ${totalRecords} test records`);
console.log(`Ground truth: ${expectedClusters} unique persons`);
console.log(`Average variants per person: ${(totalRecords / expectedClusters).toFixed(2)}`);

// Save to JSON
const outputDir = path.join(__dirname, '../data/test');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, 'entity-resolution-test-records.json'),
  JSON.stringify(testRecords, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'entity-resolution-ground-truth.json'),
  JSON.stringify(groundTruthMap, null, 2)
);

console.log(`\n✅ Test data saved to:`);
console.log(`   - ${path.join(outputDir, 'entity-resolution-test-records.json')}`);
console.log(`   - ${path.join(outputDir, 'entity-resolution-ground-truth.json')}`);

console.log('\n📊 Distribution:');
console.log(`   - Full name variants: ${testRecords.filter(r => r.name.split(' ').length >= 3).length}`);
console.log(`   - Initial variants: ${testRecords.filter(r => r.name.split(' ').length === 2 && r.name.includes(' ')).length}`);
console.log(`   - With phone: ${testRecords.filter(r => r.phone).length}`);
console.log(`   - With vehicle: ${testRecords.filter(r => r.vehicle).length}`);
console.log(`   - With address: ${testRecords.filter(r => r.address).length}`);
