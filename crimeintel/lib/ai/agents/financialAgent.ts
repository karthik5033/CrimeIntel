import { ParsedQuery } from '../chat/intentClassifier';
import { generateBankAccounts, generateFinancialTransactions } from '@/data/seed/financial-transactions';
import {
  buildMoneyTrailGraph,
  traceForwardFlow,
  traceReverseFlow,
  detectCircularFlows,
  detectMuleAccounts,
  detectVelocitySpikes,
  generateFinancialIntelligence,
} from '@/lib/financial/money-trail-engine';
import type { BankAccount, Transaction } from '@/types';

/**
 * FinancialAgent - Specialist agent for financial crime analysis
 * Handles money trail queries, transaction analysis, and financial pattern detection
 */
export class FinancialAgent {
  /**
   * Detect if query is financial-related
   */
  static isFinancialQuery(query: string): boolean {
    const financialKeywords = [
      'transaction', 'money', 'payment', 'bank', 'account', 'upi',
      'transfer', 'financial', 'trail', 'flow', 'laundering', 'mule',
      'circular', 'structuring', 'velocity', 'throughput', 'balance',
      'deposit', 'withdrawal', 'rupee', '₹', 'cash', 'fund'
    ];
    
    const lowerQuery = query.toLowerCase();
    return financialKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  /**
   * Retrieve financial evidence based on parsed query
   */
  static async retrieve(parsedQuery: ParsedQuery): Promise<any[]> {
    try {
      console.log('[FinancialAgent] Processing financial query:', parsedQuery.resolvedQuery);

      // Check if this is a financial query
      if (!this.isFinancialQuery(parsedQuery.resolvedQuery) && 
          !parsedQuery.entities.account_numbers &&
          !parsedQuery.entities.transaction_ids) {
        return [];
      }

      // Generate financial data (in production, fetch from database)
      // TODO: Replace with actual database queries
      const mockPersons = Array.from({ length: 60 }, (_, i) => ({
        id: `person_${i}`,
        name: `Person ${i}`,
        dob: '1990-01-01',
        age: 30 + i,
        gender: (i % 2 === 0 ? 'Male' : 'Female') as 'Male' | 'Female',
        role: 'Accused' as const,
      }));

      const accounts = generateBankAccounts(mockPersons);
      const transactions = generateFinancialTransactions(accounts);

      // Build analysis based on query type
      const analysisResults: any[] = [];

      // Detect query intent
      const query = parsedQuery.resolvedQuery.toLowerCase();

      if (query.includes('circular') || query.includes('cycle') || query.includes('round-trip')) {
        // Circular flow detection
        const circularFlows = detectCircularFlows(transactions);
        analysisResults.push({
          type: 'circular_flows',
          title: 'Circular Money Flow Detection',
          count: circularFlows.length,
          flows: circularFlows.slice(0, 5).map(flow => ({
            cycle: flow.cycle.map(accId => {
              const acc = accounts.find(a => a.id === accId);
              return acc?.accountNumber.slice(-8) || accId;
            }),
            totalAmount: flow.totalAmount,
            transactionCount: flow.transactions.length,
            summary: `Detected circular flow of ₹${(flow.totalAmount / 100000).toFixed(2)}L through ${flow.cycle.length} accounts`
          }))
        });
      }

      if (query.includes('mule') || query.includes('conduit') || query.includes('intermediary')) {
        // Mule account detection
        const muleAccounts = detectMuleAccounts(accounts, transactions);
        analysisResults.push({
          type: 'mule_accounts',
          title: 'Suspected Mule Accounts',
          count: muleAccounts.length,
          accounts: muleAccounts.slice(0, 5).map(mule => ({
            accountNumber: mule.account.accountNumber,
            throughput: mule.throughput,
            balance: mule.account.balance,
            forwardingRate: mule.forwardingRate,
            averageHoldTime: mule.averageHoldTime,
            summary: `Account ${mule.account.accountNumber.slice(-4)} exhibits mule behavior: ${mule.forwardingRate.toFixed(1)}% forwarding rate, ${mule.averageHoldTime.toFixed(1)}h hold time`
          }))
        });
      }

      if (query.includes('velocity') || query.includes('burst') || query.includes('spike') || query.includes('rapid')) {
        // Velocity spike detection
        const velocitySpikes = detectVelocitySpikes(transactions);
        analysisResults.push({
          type: 'velocity_spikes',
          title: 'Transaction Velocity Spikes',
          count: velocitySpikes.length,
          spikes: velocitySpikes.slice(0, 5).map(spike => ({
            accountId: spike.accountId,
            accountNumber: accounts.find(a => a.id === spike.accountId)?.accountNumber,
            transactionCount: spike.transactions.length,
            totalAmount: spike.totalAmount,
            timeWindow: `${spike.timeWindow}h`,
            summary: `${spike.transactions.length} transactions totaling ₹${(spike.totalAmount / 100000).toFixed(2)}L in ${spike.timeWindow}h`
          }))
        });
      }

      if (query.includes('trail') || query.includes('track') || query.includes('follow') || query.includes('trace')) {
        // Money trail analysis
        const { nodes, edges } = buildMoneyTrailGraph(accounts, transactions);
        
        // Find accounts mentioned in query or use flagged accounts
        const targetAccounts = nodes.filter(n => n.flagged || n.isMule).slice(0, 3);
        
        const trails = targetAccounts.map(node => {
          const forwardFlow = traceForwardFlow(node.accountId, transactions, 3);
          const reverseFlow = traceReverseFlow(node.accountId, transactions, 3);
          
          return {
            accountNumber: node.accountNumber,
            forwardHops: forwardFlow.length,
            reverseHops: reverseFlow.length,
            forwardAmount: forwardFlow.reduce((sum, txn) => sum + txn.amount, 0),
            reverseAmount: reverseFlow.reduce((sum, txn) => sum + txn.amount, 0),
            summary: `Money trail: ${reverseFlow.length} incoming flows, ${forwardFlow.length} outgoing flows`
          };
        });

        analysisResults.push({
          type: 'money_trails',
          title: 'Money Trail Analysis',
          trails
        });
      }

      // If no specific pattern requested, provide general financial intelligence
      if (analysisResults.length === 0) {
        const intelligence = generateFinancialIntelligence(accounts, transactions);
        const { nodes, edges } = buildMoneyTrailGraph(accounts, transactions);
        
        analysisResults.push({
          type: 'financial_summary',
          title: 'Financial Intelligence Overview',
          summary: intelligence.summary,
          recommendations: intelligence.recommendations,
          statistics: {
            totalAccounts: accounts.length,
            flaggedAccounts: intelligence.flaggedAccounts,
            muleAccounts: intelligence.muleAccounts,
            circularFlows: intelligence.circularFlows,
            totalTransactions: transactions.length,
            flaggedTransactions: transactions.filter(t => t.flagged).length,
            totalVolume: transactions.reduce((sum, t) => sum + t.amount, 0),
            flaggedVolume: transactions.filter(t => t.flagged).reduce((sum, t) => sum + t.amount, 0),
            networkNodes: nodes.length,
            networkEdges: edges.length
          }
        });
      }

      return analysisResults;
    } catch (error) {
      console.error('[FinancialAgent] Error:', error);
      return [];
    }
  }

  /**
   * Format financial data for natural language response
   */
  static formatEvidence(evidence: any[]): string {
    if (evidence.length === 0) {
      return 'No financial intelligence found for this query.';
    }

    let formatted = '**Financial Crime Analysis:**\n\n';

    evidence.forEach(item => {
      formatted += `### ${item.title}\n\n`;

      switch (item.type) {
        case 'circular_flows':
          formatted += `Found ${item.count} circular money flows:\n\n`;
          item.flows.forEach((flow: any, idx: number) => {
            formatted += `${idx + 1}. ${flow.summary}\n`;
            formatted += `   Path: ${flow.cycle.join(' → ')} → ${flow.cycle[0]}\n\n`;
          });
          break;

        case 'mule_accounts':
          formatted += `Identified ${item.count} suspected mule accounts:\n\n`;
          item.accounts.forEach((acc: any, idx: number) => {
            formatted += `${idx + 1}. **${acc.accountNumber}**\n`;
            formatted += `   - Throughput: ₹${(acc.throughput / 100000).toFixed(2)}L\n`;
            formatted += `   - Forwarding Rate: ${acc.forwardingRate.toFixed(1)}%\n`;
            formatted += `   - Hold Time: ${acc.averageHoldTime.toFixed(1)} hours\n\n`;
          });
          break;

        case 'velocity_spikes':
          formatted += `Detected ${item.count} velocity anomalies:\n\n`;
          item.spikes.forEach((spike: any, idx: number) => {
            formatted += `${idx + 1}. ${spike.summary}\n`;
            formatted += `   Account: ${spike.accountNumber}\n\n`;
          });
          break;

        case 'money_trails':
          formatted += 'Money trail analysis:\n\n';
          item.trails.forEach((trail: any, idx: number) => {
            formatted += `${idx + 1}. **${trail.accountNumber}**\n`;
            formatted += `   - Incoming: ${trail.reverseHops} flows (₹${(trail.reverseAmount / 100000).toFixed(2)}L)\n`;
            formatted += `   - Outgoing: ${trail.forwardHops} flows (₹${(trail.forwardAmount / 100000).toFixed(2)}L)\n\n`;
          });
          break;

        case 'financial_summary':
          formatted += `${item.summary}\n\n`;
          formatted += '**Key Statistics:**\n';
          formatted += `- Total Accounts: ${item.statistics.totalAccounts}\n`;
          formatted += `- Flagged Accounts: ${item.statistics.flaggedAccounts}\n`;
          formatted += `- Mule Accounts: ${item.statistics.muleAccounts}\n`;
          formatted += `- Circular Flows: ${item.statistics.circularFlows}\n`;
          formatted += `- Total Transactions: ${item.statistics.totalTransactions}\n`;
          formatted += `- Flagged Transactions: ${item.statistics.flaggedTransactions}\n\n`;
          formatted += '**Recommendations:**\n';
          item.recommendations.forEach((rec: string, idx: number) => {
            formatted += `${idx + 1}. ${rec}\n`;
          });
          break;
      }

      formatted += '\n';
    });

    return formatted;
  }
}
