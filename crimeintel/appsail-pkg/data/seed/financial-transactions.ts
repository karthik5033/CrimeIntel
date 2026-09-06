// Financial Transaction Seed Data Generator
// Generates 500+ realistic transactions including suspicious patterns

import type { BankAccount, Transaction, Person } from '@/types';

// Indian bank names
const BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Karnataka Bank',
];

// Transaction types with realistic distributions
const TRANSACTION_TYPES: Array<Transaction['type']> = ['UPI', 'UPI', 'UPI', 'NEFT', 'IMPS', 'RTGS'];

// Generate realistic account numbers
function generateAccountNumber(bank: string, index: number): string {
  const bankCode = bank.substring(0, 4).toUpperCase().replace(/\s/g, '');
  return `${bankCode}${String(index).padStart(10, '0')}`;
}

// Generate UPI ID
function generateUPIId(name: string, index: number): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  return `${cleanName}${index}@upi`;
}

/**
 * Generate bank accounts for persons
 */
export function generateBankAccounts(persons: Person[]): BankAccount[] {
  const accounts: BankAccount[] = [];
  
  persons.forEach((person, idx) => {
    const bank = BANKS[idx % BANKS.length];
    const accountType: BankAccount['accountType'] = 
      Math.random() > 0.7 ? 'current' : 'savings';
    
    accounts.push({
      id: `acc_${person.id}`,
      accountNumber: generateAccountNumber(bank, idx + 1),
      holderPersonId: person.id,
      accountType,
      bank,
      balance: Math.floor(Math.random() * 500000) + 10000, // ₹10k-₹510k
      flagged: false,
    });
  });
  
  return accounts;
}

/**
 * Generate normal (legitimate) transactions
 */
function generateNormalTransactions(
  accounts: BankAccount[],
  startDate: Date,
  count: number
): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const fromAcc = accounts[Math.floor(Math.random() * accounts.length)];
    let toAcc = accounts[Math.floor(Math.random() * accounts.length)];
    
    // Avoid self-transfer
    while (toAcc.id === fromAcc.id) {
      toAcc = accounts[Math.floor(Math.random() * accounts.length)];
    }
    
    const amount = Math.floor(Math.random() * 50000) + 100; // ₹100-₹50k
    const type = TRANSACTION_TYPES[Math.floor(Math.random() * TRANSACTION_TYPES.length)];
    
    // Random timestamp in the last 6 months
    const daysAgo = Math.floor(Math.random() * 180);
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    transactions.push({
      id: `txn_normal_${i}`,
      fromAccountId: fromAcc.id,
      toAccountId: toAcc.id,
      amount,
      timestamp: timestamp.toISOString(),
      type,
      description: generateTransactionDescription(type, amount),
      flagged: false,
    });
  }
  
  return transactions;
}

/**
 * Story 1: Structuring (Smurfing) - Breaking large amounts into small transactions
 * Pattern: Multiple small transactions just below reporting threshold
 */
function generateStructuringPattern(
  fromAccount: BankAccount,
  toAccount: BankAccount,
  baseId: number
): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  
  // 15 transactions of ₹45k-₹48k (just below ₹50k reporting threshold)
  for (let i = 0; i < 15; i++) {
    const amount = 45000 + Math.floor(Math.random() * 3000);
    const hoursAgo = i * 6; // Every 6 hours
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    
    transactions.push({
      id: `txn_struct_${baseId}_${i}`,
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      amount,
      timestamp: timestamp.toISOString(),
      type: 'UPI',
      description: 'Business payment',
      flagged: true,
      flagReason: 'Structuring pattern detected: Multiple transactions just below reporting threshold',
    });
  }
  
  return transactions;
}

/**
 * Story 2: Circular Money Flow (Layering)
 * Pattern: Money moves A → B → C → D → A
 */
function generateCircularFlow(
  accounts: BankAccount[],
  baseId: number
): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  
  // Select 4 accounts for circular flow
  const circleAccounts = accounts.slice(0, 4);
  const amounts = [250000, 245000, 240000, 235000]; // Decreasing slightly (fees)
  
  for (let i = 0; i < circleAccounts.length; i++) {
    const fromAcc = circleAccounts[i];
    const toAcc = circleAccounts[(i + 1) % circleAccounts.length];
    const amount = amounts[i];
    
    const daysAgo = i * 2; // Every 2 days
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    transactions.push({
      id: `txn_circular_${baseId}_${i}`,
      fromAccountId: fromAcc.id,
      toAccountId: toAcc.id,
      amount,
      timestamp: timestamp.toISOString(),
      type: 'NEFT',
      description: 'Fund transfer',
      flagged: true,
      flagReason: 'Circular flow detected: Money returns to original source',
    });
  }
  
  return transactions;
}

/**
 * Story 3: Mule Account Chain
 * Pattern: Mastermind → Mule1 → Mule2 → Mule3 → Final destination
 * Mule accounts: Receive funds, immediately forward (low balance, high throughput)
 */
function generateMuleChain(
  mastermindAcc: BankAccount,
  muleAccounts: BankAccount[],
  finalAcc: BankAccount,
  baseId: number
): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  const baseAmount = 500000; // ₹5 lakhs
  
  // Mastermind → Mule1
  transactions.push({
    id: `txn_mule_${baseId}_0`,
    fromAccountId: mastermindAcc.id,
    toAccountId: muleAccounts[0].id,
    amount: baseAmount,
    timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'RTGS',
    description: 'Contract payment',
    flagged: true,
    flagReason: 'Source of suspicious fund trail',
  });
  
  // Mule1 → Mule2 → Mule3 (rapid forwarding)
  for (let i = 0; i < muleAccounts.length - 1; i++) {
    const amount = baseAmount - (i + 1) * 5000; // Slight deduction per hop
    const hoursAgo = (5 - i) * 24 - (i + 1) * 2; // Within hours of receipt
    
    transactions.push({
      id: `txn_mule_${baseId}_${i + 1}`,
      fromAccountId: muleAccounts[i].id,
      toAccountId: muleAccounts[i + 1].id,
      amount,
      timestamp: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString(),
      type: 'IMPS',
      description: 'Immediate payment',
      flagged: true,
      flagReason: 'Mule account behavior: Rapid forward of received funds',
    });
  }
  
  // Final mule → Destination
  transactions.push({
    id: `txn_mule_${baseId}_final`,
    fromAccountId: muleAccounts[muleAccounts.length - 1].id,
    toAccountId: finalAcc.id,
    amount: baseAmount - muleAccounts.length * 5000,
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'NEFT',
    description: 'Settlement',
    flagged: true,
    flagReason: 'End of suspicious transaction chain',
  });
  
  return transactions;
}

/**
 * Story 4: Velocity Spike (Sudden high-volume activity)
 * Pattern: Account normally dormant, sudden burst of high-value transactions
 */
function generateVelocitySpike(
  account: BankAccount,
  destinationAccounts: BankAccount[],
  baseId: number
): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  
  // 8 rapid transactions within 4 hours
  for (let i = 0; i < 8; i++) {
    const toAcc = destinationAccounts[i % destinationAccounts.length];
    const amount = 80000 + Math.floor(Math.random() * 20000);
    const minutesAgo = i * 30; // Every 30 minutes
    
    transactions.push({
      id: `txn_velocity_${baseId}_${i}`,
      fromAccountId: account.id,
      toAccountId: toAcc.id,
      amount,
      timestamp: new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString(),
      type: 'UPI',
      description: 'Urgent transfer',
      flagged: true,
      flagReason: 'Velocity anomaly: Unusual burst of high-value transactions',
    });
  }
  
  return transactions;
}

/**
 * Main generator function
 */
export function generateFinancialTransactions(
  accounts: BankAccount[]
): Transaction[] {
  const allTransactions: Transaction[] = [];
  
  // 1. Generate 350 normal transactions (baseline noise)
  allTransactions.push(...generateNormalTransactions(accounts, new Date(), 350));
  
  // 2. Story 1: Structuring pattern (2 instances)
  allTransactions.push(...generateStructuringPattern(accounts[0], accounts[10], 1));
  allTransactions.push(...generateStructuringPattern(accounts[5], accounts[15], 2));
  
  // 3. Story 2: Circular flow (1 instance)
  allTransactions.push(...generateCircularFlow(accounts.slice(20, 24), 3));
  
  // 4. Story 3: Mule chain (2 instances)
  const muleChain1 = accounts.slice(30, 33); // 3 mules
  allTransactions.push(...generateMuleChain(accounts[2], muleChain1, accounts[40], 4));
  
  const muleChain2 = accounts.slice(35, 38);
  allTransactions.push(...generateMuleChain(accounts[8], muleChain2, accounts[45], 5));
  
  // 5. Story 4: Velocity spike (1 instance)
  allTransactions.push(...generateVelocitySpike(accounts[50], accounts.slice(60, 65), 6));
  
  // Flag mule accounts
  [30, 31, 32, 35, 36, 37].forEach(idx => {
    if (accounts[idx]) {
      accounts[idx].flagged = true;
      accounts[idx].flagReason = 'Mule account: High throughput, rapid forwarding behavior';
    }
  });
  
  // Flag source accounts
  [0, 2, 5, 8].forEach(idx => {
    if (accounts[idx]) {
      accounts[idx].flagged = true;
      accounts[idx].flagReason = 'Source of suspicious transaction patterns';
    }
  });
  
  return allTransactions;
}

/**
 * Helper: Generate realistic transaction descriptions
 */
function generateTransactionDescription(type: Transaction['type'], amount: number): string {
  const descriptions = {
    UPI: [
      'Payment for services',
      'Online purchase',
      'Bill payment',
      'Food delivery',
      'Mobile recharge',
      'Utility payment',
    ],
    NEFT: [
      'Rent payment',
      'Loan EMI',
      'Business transfer',
      'Fund transfer',
      'Investment',
    ],
    RTGS: [
      'Property payment',
      'High value transfer',
      'Business settlement',
      'Contract payment',
    ],
    IMPS: [
      'Immediate payment',
      'Urgent transfer',
      'Emergency fund',
    ],
    CASH: [
      'Cash deposit',
      'Cash withdrawal',
    ],
  };
  
  const typeDescriptions = descriptions[type];
  return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
}

/**
 * Generate summary statistics for financial data
 */
export function generateFinancialSummary(
  transactions: Transaction[]
): {
  totalTransactions: number;
  totalVolume: number;
  flaggedTransactions: number;
  flaggedVolume: number;
  suspiciousPatterns: string[];
} {
  const flagged = transactions.filter(t => t.flagged);
  const patterns = new Set<string>();
  
  flagged.forEach(t => {
    if (t.flagReason?.includes('Structuring')) patterns.add('structuring');
    if (t.flagReason?.includes('Circular')) patterns.add('circular_flow');
    if (t.flagReason?.includes('Mule')) patterns.add('mule_account');
    if (t.flagReason?.includes('Velocity')) patterns.add('velocity_spike');
  });
  
  return {
    totalTransactions: transactions.length,
    totalVolume: transactions.reduce((sum, t) => sum + t.amount, 0),
    flaggedTransactions: flagged.length,
    flaggedVolume: flagged.reduce((sum, t) => sum + t.amount, 0),
    suspiciousPatterns: Array.from(patterns),
  };
}
