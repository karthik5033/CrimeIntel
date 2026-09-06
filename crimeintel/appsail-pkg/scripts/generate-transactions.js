const fs = require('fs');
const path = require('path');

const NUM_NORMAL = 500;
const transactions = [];
let idCounter = 1;

// Base timestamp - 3 months ago
const now = Date.now();
const threeMonths = 90 * 24 * 60 * 60 * 1000;

function getRandomTimestamp() {
  return new Date(now - Math.random() * threeMonths).toISOString();
}

// Normal transactions
for (let i = 0; i < NUM_NORMAL; i++) {
  transactions.push({
    id: `TX_${idCounter++}`,
    from_account_id: `BANK_${Math.floor(Math.random() * 50) + 1}`,
    to_account_id: `BANK_${Math.floor(Math.random() * 50) + 1}`,
    amount: Math.floor(Math.random() * 50000) + 100,
    timestamp: getRandomTimestamp(),
    type: Math.random() > 0.5 ? 'UPI' : 'NEFT',
    description: 'Transfer',
    flagged: false,
    pattern: 'NORMAL'
  });
}

// Suspicious patterns (e.g. structuring)
for (let i = 0; i < 10; i++) {
  const fromAcc = `BANK_${Math.floor(Math.random() * 50) + 1}`;
  const toAcc = `BANK_${Math.floor(Math.random() * 50) + 1}`;
  const baseTime = now - Math.random() * threeMonths;
  for (let j = 0; j < 5; j++) {
    transactions.push({
      id: `TX_${idCounter++}`,
      from_account_id: fromAcc,
      to_account_id: toAcc,
      amount: 49000 + Math.floor(Math.random() * 500),
      timestamp: new Date(baseTime + j * 60000).toISOString(), // 1 min apart
      type: 'NEFT',
      description: 'Transfer',
      flagged: true,
      pattern: 'SUSPICIOUS'
    });
  }
}

// Circular patterns (A -> B -> C -> A)
for (let i = 0; i < 5; i++) {
  const accA = `BANK_${Math.floor(Math.random() * 50) + 1}`;
  const accB = `BANK_${Math.floor(Math.random() * 50) + 1}`;
  const accC = `BANK_${Math.floor(Math.random() * 50) + 1}`;
  const baseTime = now - Math.random() * threeMonths;
  const amount = Math.floor(Math.random() * 100000) + 50000;
  
  transactions.push({
    id: `TX_${idCounter++}`,
    from_account_id: accA,
    to_account_id: accB,
    amount: amount,
    timestamp: new Date(baseTime).toISOString(),
    type: 'RTGS',
    description: 'Payment',
    flagged: true,
    pattern: 'CIRCULAR'
  });
  transactions.push({
    id: `TX_${idCounter++}`,
    from_account_id: accB,
    to_account_id: accC,
    amount: amount - 100,
    timestamp: new Date(baseTime + 3600000).toISOString(), // 1 hour later
    type: 'RTGS',
    description: 'Payment',
    flagged: true,
    pattern: 'CIRCULAR'
  });
  transactions.push({
    id: `TX_${idCounter++}`,
    from_account_id: accC,
    to_account_id: accA,
    amount: amount - 200,
    timestamp: new Date(baseTime + 7200000).toISOString(),
    type: 'RTGS',
    description: 'Payment',
    flagged: true,
    pattern: 'CIRCULAR'
  });
}

// Mule patterns
for (let i = 0; i < 5; i++) {
  const muleAcc = `BANK_${Math.floor(Math.random() * 50) + 1}`;
  const sourceAcc = `BANK_${Math.floor(Math.random() * 50) + 1}`;
  const dest1 = `BANK_${Math.floor(Math.random() * 50) + 1}`;
  const dest2 = `BANK_${Math.floor(Math.random() * 50) + 1}`;
  
  const baseTime = now - Math.random() * threeMonths;
  const amount = 500000;
  
  transactions.push({
    id: `TX_${idCounter++}`,
    from_account_id: sourceAcc,
    to_account_id: muleAcc,
    amount: amount,
    timestamp: new Date(baseTime).toISOString(),
    type: 'NEFT',
    description: 'Transfer',
    flagged: true,
    pattern: 'MULE'
  });
  
  transactions.push({
    id: `TX_${idCounter++}`,
    from_account_id: muleAcc,
    to_account_id: dest1,
    amount: 250000,
    timestamp: new Date(baseTime + 60000).toISOString(), // 1 min later
    type: 'UPI',
    description: 'Transfer',
    flagged: true,
    pattern: 'MULE'
  });
  
  transactions.push({
    id: `TX_${idCounter++}`,
    from_account_id: muleAcc,
    to_account_id: dest2,
    amount: 249000,
    timestamp: new Date(baseTime + 120000).toISOString(),
    type: 'UPI',
    description: 'Transfer',
    flagged: true,
    pattern: 'MULE'
  });
}

// Sort by timestamp
transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

const outputPath = path.join(__dirname, '..', 'data', 'seed', 'Transactions.json');
fs.writeFileSync(outputPath, JSON.stringify(transactions, null, 2));

console.log(`Generated ${transactions.length} transactions, including ${transactions.filter(t => t.flagged).length} flagged transactions.`);
console.log(`Saved to ${outputPath}`);
