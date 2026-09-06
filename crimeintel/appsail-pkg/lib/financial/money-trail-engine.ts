// Money Trail Graph Engine
// Implements financial flow analysis: traversal, circular detection, mule detection, velocity analysis

import type { 
  BankAccount, 
  Transaction, 
  MoneyTrailNode, 
  MoneyTrailEdge,
  FinancialFlow 
} from '@/types';

/**
 * Build money trail graph from transactions
 */
export function buildMoneyTrailGraph(
  accounts: BankAccount[],
  transactions: Transaction[]
): { nodes: MoneyTrailNode[]; edges: MoneyTrailEdge[] } {
  const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
  
  // Calculate transaction statistics per account
  const accountStats = new Map<string, {
    totalIn: number;
    totalOut: number;
    transactionCount: number;
    inboundTxns: Transaction[];
    outboundTxns: Transaction[];
  }>();
  
  // Initialize stats
  accounts.forEach(acc => {
    accountStats.set(acc.id, {
      totalIn: 0,
      totalOut: 0,
      transactionCount: 0,
      inboundTxns: [],
      outboundTxns: [],
    });
  });
  
  // Aggregate transaction data
  transactions.forEach(txn => {
    const fromStats = accountStats.get(txn.fromAccountId);
    const toStats = accountStats.get(txn.toAccountId);
    
    if (fromStats) {
      fromStats.totalOut += txn.amount;
      fromStats.transactionCount++;
      fromStats.outboundTxns.push(txn);
    }
    
    if (toStats) {
      toStats.totalIn += txn.amount;
      toStats.transactionCount++;
      toStats.inboundTxns.push(txn);
    }
  });
  
  // Build nodes
  const nodes: MoneyTrailNode[] = accounts.map(acc => {
    const stats = accountStats.get(acc.id)!;
    const balance = acc.balance || 0;
    
    // Mule detection heuristic:
    // High throughput (>5 transactions), low balance relative to throughput
    const throughput = stats.totalIn + stats.totalOut;
    const isMule = stats.transactionCount > 5 && balance < throughput * 0.05;
    
    return {
      accountId: acc.id,
      accountNumber: acc.accountNumber,
      holderName: `Account Holder ${acc.holderPersonId || 'Unknown'}`,
      totalIn: stats.totalIn,
      totalOut: stats.totalOut,
      balance,
      transactionCount: stats.transactionCount,
      flagged: acc.flagged || false,
      isMule,
    };
  });
  
  // Build edges (aggregate transactions between account pairs)
  const edgeMap = new Map<string, Transaction[]>();
  
  transactions.forEach(txn => {
    const key = `${txn.fromAccountId}->${txn.toAccountId}`;
    if (!edgeMap.has(key)) {
      edgeMap.set(key, []);
    }
    edgeMap.get(key)!.push(txn);
  });
  
  const edges: MoneyTrailEdge[] = Array.from(edgeMap.entries()).map(([key, txns]) => {
    const totalAmount = txns.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = totalAmount / txns.length;
    const flagged = txns.some(t => t.flagged);
    
    const [from, to] = key.split('->');
    
    return {
      from,
      to,
      transactions: txns,
      totalAmount,
      avgAmount,
      flagged,
    };
  });
  
  return { nodes, edges };
}

/**
 * Trace forward flow: Given a source account, find all downstream accounts
 */
export function traceForwardFlow(
  sourceAccountId: string,
  transactions: Transaction[],
  maxDepth: number = 5
): {
  path: string[];
  totalAmount: number;
  hops: number;
} {
  const visited = new Set<string>();
  const paths: Array<{ path: string[]; amount: number }> = [];
  
  function dfs(currentId: string, path: string[], amount: number, depth: number) {
    if (depth > maxDepth || visited.has(currentId)) {
      return;
    }
    
    visited.add(currentId);
    path.push(currentId);
    
    // Find all outbound transactions from current account
    const outbound = transactions.filter(t => t.fromAccountId === currentId);
    
    if (outbound.length === 0) {
      // Terminal node
      paths.push({ path: [...path], amount });
    } else {
      outbound.forEach(txn => {
        dfs(txn.toAccountId, [...path], amount + txn.amount, depth + 1);
      });
    }
  }
  
  dfs(sourceAccountId, [], 0, 0);
  
  // Find longest path (most hops)
  const longestPath = paths.reduce((max, p) => 
    p.path.length > max.path.length ? p : max
  , { path: [], amount: 0 });
  
  return {
    path: longestPath.path,
    totalAmount: longestPath.amount,
    hops: longestPath.path.length - 1,
  };
}

/**
 * Trace reverse flow: Given a destination account, find all source accounts
 */
export function traceReverseFlow(
  destinationAccountId: string,
  transactions: Transaction[],
  maxDepth: number = 5
): {
  sources: string[];
  totalAmount: number;
} {
  const visited = new Set<string>();
  const sources = new Set<string>();
  let totalAmount = 0;
  
  function dfs(currentId: string, depth: number) {
    if (depth > maxDepth || visited.has(currentId)) {
      return;
    }
    
    visited.add(currentId);
    
    // Find all inbound transactions to current account
    const inbound = transactions.filter(t => t.toAccountId === currentId);
    
    if (inbound.length === 0) {
      // Source node
      sources.add(currentId);
    } else {
      inbound.forEach(txn => {
        totalAmount += txn.amount;
        dfs(txn.fromAccountId, depth + 1);
      });
    }
  }
  
  dfs(destinationAccountId, 0);
  
  return {
    sources: Array.from(sources),
    totalAmount,
  };
}

/**
 * Detect circular flows: Find cycles in transaction graph
 */
export function detectCircularFlows(
  transactions: Transaction[]
): Array<{
  cycle: string[];
  totalAmount: number;
  transactions: Transaction[];
}> {
  // Build adjacency list
  const graph = new Map<string, string[]>();
  const edgeTransactions = new Map<string, Transaction[]>();
  
  transactions.forEach(txn => {
    if (!graph.has(txn.fromAccountId)) {
      graph.set(txn.fromAccountId, []);
    }
    graph.get(txn.fromAccountId)!.push(txn.toAccountId);
    
    const edgeKey = `${txn.fromAccountId}->${txn.toAccountId}`;
    if (!edgeTransactions.has(edgeKey)) {
      edgeTransactions.set(edgeKey, []);
    }
    edgeTransactions.get(edgeKey)!.push(txn);
  });
  
  const cycles: Array<{ cycle: string[]; totalAmount: number; transactions: Transaction[] }> = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    const neighbors = graph.get(node) || [];
    
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        // Cycle detected
        const cycleStartIndex = path.indexOf(neighbor);
        const cycle = path.slice(cycleStartIndex);
        
        // Calculate total amount and collect transactions
        let totalAmount = 0;
        const cycleTxns: Transaction[] = [];
        
        for (let i = 0; i < cycle.length; i++) {
          const from = cycle[i];
          const to = cycle[(i + 1) % cycle.length];
          const edgeKey = `${from}->${to}`;
          const txns = edgeTransactions.get(edgeKey) || [];
          cycleTxns.push(...txns);
          totalAmount += txns.reduce((sum, t) => sum + t.amount, 0);
        }
        
        cycles.push({ cycle, totalAmount, transactions: cycleTxns });
      }
    }
    
    recursionStack.delete(node);
  }
  
  // Run DFS from all unvisited nodes
  Array.from(graph.keys()).forEach(node => {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  });
  
  return cycles;
}

/**
 * Detect mule accounts: High throughput, low balance, rapid forwarding
 */
export function detectMuleAccounts(
  accounts: BankAccount[],
  transactions: Transaction[]
): Array<{
  account: BankAccount;
  throughput: number;
  averageHoldTime: number; // hours
  forwardingRate: number; // percentage
}> {
  const muleAccounts: Array<{
    account: BankAccount;
    throughput: number;
    averageHoldTime: number;
    forwardingRate: number;
  }> = [];
  
  accounts.forEach(acc => {
    const inbound = transactions.filter(t => t.toAccountId === acc.id);
    const outbound = transactions.filter(t => t.fromAccountId === acc.id);
    
    if (inbound.length === 0 || outbound.length === 0) return;
    
    const totalIn = inbound.reduce((sum, t) => sum + t.amount, 0);
    const totalOut = outbound.reduce((sum, t) => sum + t.amount, 0);
    const throughput = totalIn + totalOut;
    
    // Calculate average time between receiving and forwarding
    const holdTimes: number[] = [];
    inbound.forEach(inTxn => {
      const matchingOut = outbound.find(outTxn => 
        new Date(outTxn.timestamp).getTime() > new Date(inTxn.timestamp).getTime()
      );
      if (matchingOut) {
        const holdTimeMs = new Date(matchingOut.timestamp).getTime() - new Date(inTxn.timestamp).getTime();
        holdTimes.push(holdTimeMs / (1000 * 60 * 60)); // Convert to hours
      }
    });
    
    const averageHoldTime = holdTimes.length > 0 
      ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length 
      : 0;
    
    const forwardingRate = (totalOut / totalIn) * 100;
    const balance = acc.balance || 0;
    
    // Mule heuristics:
    // 1. High throughput relative to balance
    // 2. Short hold time (< 24 hours average)
    // 3. High forwarding rate (> 90%)
    if (
      throughput > balance * 10 &&
      averageHoldTime < 24 &&
      forwardingRate > 90
    ) {
      muleAccounts.push({
        account: acc,
        throughput,
        averageHoldTime,
        forwardingRate,
      });
    }
  });
  
  return muleAccounts;
}

/**
 * Detect velocity spikes: Sudden burst of transactions
 */
export function detectVelocitySpikes(
  accountId: string,
  transactions: Transaction[],
  windowHours: number = 24
): {
  detected: boolean;
  transactionCount: number;
  totalAmount: number;
  windowStart: string;
  windowEnd: string;
} {
  const accountTxns = transactions.filter(
    t => t.fromAccountId === accountId || t.toAccountId === accountId
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  if (accountTxns.length === 0) {
    return {
      detected: false,
      transactionCount: 0,
      totalAmount: 0,
      windowStart: '',
      windowEnd: '',
    };
  }
  
  const windowMs = windowHours * 60 * 60 * 1000;
  let maxCount = 0;
  let maxAmount = 0;
  let maxWindowStart = '';
  let maxWindowEnd = '';
  
  // Sliding window to find maximum transaction density
  for (let i = 0; i < accountTxns.length; i++) {
    const windowStart = new Date(accountTxns[i].timestamp);
    const windowEnd = new Date(windowStart.getTime() + windowMs);
    
    const windowTxns = accountTxns.filter(t => {
      const txnTime = new Date(t.timestamp);
      return txnTime >= windowStart && txnTime <= windowEnd;
    });
    
    const windowAmount = windowTxns.reduce((sum, t) => sum + t.amount, 0);
    
    if (windowTxns.length > maxCount) {
      maxCount = windowTxns.length;
      maxAmount = windowAmount;
      maxWindowStart = windowStart.toISOString();
      maxWindowEnd = windowEnd.toISOString();
    }
  }
  
  // Spike detected if >5 transactions in the window (configurable threshold)
  const detected = maxCount > 5;
  
  return {
    detected,
    transactionCount: maxCount,
    totalAmount: maxAmount,
    windowStart: maxWindowStart,
    windowEnd: maxWindowEnd,
  };
}

/**
 * Analyze transaction clustering by account pairs
 */
export function analyzeTransactionClusters(
  transactions: Transaction[]
): Array<{
  fromAccountId: string;
  toAccountId: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
  timespan: number; // days
  pattern: 'normal' | 'suspicious';
}> {
  const pairMap = new Map<string, Transaction[]>();
  
  transactions.forEach(txn => {
    const key = `${txn.fromAccountId}->${txn.toAccountId}`;
    if (!pairMap.has(key)) {
      pairMap.set(key, []);
    }
    pairMap.get(key)!.push(txn);
  });
  
  return Array.from(pairMap.entries()).map(([key, txns]) => {
    const [from, to] = key.split('->');
    const totalAmount = txns.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = totalAmount / txns.length;
    
    // Calculate timespan
    const timestamps = txns.map(t => new Date(t.timestamp).getTime());
    const timespan = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24);
    
    // Pattern detection: Suspicious if many transactions in short time
    const pattern = (txns.length > 10 && timespan < 7) ? 'suspicious' : 'normal';
    
    return {
      fromAccountId: from,
      toAccountId: to,
      count: txns.length,
      totalAmount,
      avgAmount,
      timespan,
      pattern,
    };
  }).sort((a, b) => b.count - a.count);
}

/**
 * Generate financial intelligence summary
 */
export function generateFinancialIntelligence(
  accounts: BankAccount[],
  transactions: Transaction[]
): {
  summary: string;
  flaggedAccounts: number;
  muleAccounts: number;
  circularFlows: number;
  structuringCases: number;
  totalFlaggedAmount: number;
  recommendations: string[];
} {
  const flaggedAccounts = accounts.filter(a => a.flagged).length;
  const muleAccounts = detectMuleAccounts(accounts, transactions).length;
  const circularFlows = detectCircularFlows(transactions).length;
  
  const flaggedTxns = transactions.filter(t => t.flagged);
  const totalFlaggedAmount = flaggedTxns.reduce((sum, t) => sum + t.amount, 0);
  
  const structuringCases = flaggedTxns.filter(t => 
    t.flagReason?.includes('Structuring')
  ).length;
  
  const recommendations: string[] = [];
  
  if (muleAccounts > 0) {
    recommendations.push(`Investigate ${muleAccounts} suspected mule accounts for money laundering`);
  }
  
  if (circularFlows > 0) {
    recommendations.push(`Analyze ${circularFlows} circular transaction flows for layering patterns`);
  }
  
  if (structuringCases > 0) {
    recommendations.push(`Review ${structuringCases} potential structuring cases (amounts just below reporting threshold)`);
  }
  
  const summary = `Financial Intelligence Summary: ${flaggedAccounts} flagged accounts, ₹${(totalFlaggedAmount / 100000).toFixed(2)}L in suspicious transactions. Detected patterns: ${muleAccounts} mule accounts, ${circularFlows} circular flows, ${structuringCases} structuring attempts.`;
  
  return {
    summary,
    flaggedAccounts,
    muleAccounts,
    circularFlows,
    structuringCases,
    totalFlaggedAmount,
    recommendations,
  };
}
