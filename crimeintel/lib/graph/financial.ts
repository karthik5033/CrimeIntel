import { MockDataClient } from "../api/mockDataClient";

export type Transaction = {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  timestamp: string;
  type: string;
  description: string;
  flagged: boolean;
  pattern: string;
};

export class FinancialGraphEngine {
  private transactions: Transaction[];
  
  constructor() {
    this.transactions = MockDataClient.getTransactions() || [];
  }

  // Trace forward flows (Where did the money go?)
  getForwardFlow(sourceAccountId: string, maxDepth: number = 3) {
    const nodes = new Set<string>();
    const edges = new Set<Transaction>();
    const queue = [{ id: sourceAccountId, depth: 0 }];
    
    nodes.add(sourceAccountId);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;

      const outgoing = this.transactions.filter(t => t.from_account_id === id);
      
      for (const tx of outgoing) {
        edges.add(tx);
        if (!nodes.has(tx.to_account_id)) {
          nodes.add(tx.to_account_id);
          queue.push({ id: tx.to_account_id, depth: depth + 1 });
        }
      }
    }

    return { nodes: Array.from(nodes), edges: Array.from(edges) };
  }

  // Trace backward flows (Where did the money come from?)
  getBackwardFlow(targetAccountId: string, maxDepth: number = 3) {
    const nodes = new Set<string>();
    const edges = new Set<Transaction>();
    const queue = [{ id: targetAccountId, depth: 0 }];
    
    nodes.add(targetAccountId);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;

      const incoming = this.transactions.filter(t => t.to_account_id === id);
      
      for (const tx of incoming) {
        edges.add(tx);
        if (!nodes.has(tx.from_account_id)) {
          nodes.add(tx.from_account_id);
          queue.push({ id: tx.from_account_id, depth: depth + 1 });
        }
      }
    }

    return { nodes: Array.from(nodes), edges: Array.from(edges) };
  }
  
  // Get all flagged transactions
  getFlaggedTransactions() {
    return this.transactions.filter(t => t.flagged);
  }
  
  // Get accounts involved in flagged transactions
  getSuspiciousAccounts() {
    const flagged = this.getFlaggedTransactions();
    const accountTotals = new Map<string, { totalFlow: number, flaggedTxs: number }>();
    
    for (const tx of flagged) {
      if (!accountTotals.has(tx.from_account_id)) accountTotals.set(tx.from_account_id, { totalFlow: 0, flaggedTxs: 0 });
      if (!accountTotals.has(tx.to_account_id)) accountTotals.set(tx.to_account_id, { totalFlow: 0, flaggedTxs: 0 });
      
      accountTotals.get(tx.from_account_id)!.totalFlow += tx.amount;
      accountTotals.get(tx.from_account_id)!.flaggedTxs += 1;
      
      accountTotals.get(tx.to_account_id)!.totalFlow += tx.amount;
      accountTotals.get(tx.to_account_id)!.flaggedTxs += 1;
    }
    
    return Array.from(accountTotals.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalFlow - a.totalFlow);
  }
}
