import { FinancialAgent } from '@/lib/ai/agents/financialAgent';
import { ParsedQuery } from '@/lib/ai/chat/intentClassifier';

/**
 * Financial Evidence Integration for Reasoning Engine
 * Maps financial crime patterns to criminological theories
 */

export interface FinancialEvidenceCitation {
  type: 'financial';
  id: string;
  title: string;
  summary: string;
  relevance: number;
  url?: string;
  data: any;
}

export class FinancialEvidenceMapper {
  /**
   * Convert financial analysis results to evidence citations for reasoning engine
   */
  static async gatherFinancialEvidence(query: string): Promise<FinancialEvidenceCitation[]> {
    // Create a mock parsed query for the financial agent
    const parsedQuery: ParsedQuery = {
      intent: 'DIRECT_RETRIEVAL',
      resolvedQuery: query,
      entities: {},
    };

    const financialResults = await FinancialAgent.retrieve(parsedQuery);
    const citations: FinancialEvidenceCitation[] = [];

    financialResults.forEach((result, idx) => {
      switch (result.type) {
        case 'circular_flows':
          if (result.count > 0) {
            citations.push({
              type: 'financial',
              id: `FIN-CIRCULAR-${idx}`,
              title: `Circular Money Flow Pattern Detected`,
              summary: `${result.count} circular money flows identified, suggesting potential money laundering. Total volume: ₹${this.formatAmount(result.flows[0]?.totalAmount || 0)}`,
              relevance: 0.92,
              url: '/financial#patterns',
              data: result
            });
          }
          break;

        case 'mule_accounts':
          if (result.count > 0) {
            citations.push({
              type: 'financial',
              id: `FIN-MULE-${idx}`,
              title: `Mule Account Network Identified`,
              summary: `${result.count} suspected mule accounts detected with high forwarding rates (>${result.accounts[0]?.forwardingRate || 90}%) and low hold times`,
              relevance: 0.90,
              url: '/financial#flagged',
              data: result
            });
          }
          break;

        case 'velocity_spikes':
          if (result.count > 0) {
            citations.push({
              type: 'financial',
              id: `FIN-VELOCITY-${idx}`,
              title: `Abnormal Transaction Velocity`,
              summary: `${result.count} velocity spikes detected: ${result.spikes[0]?.transactionCount || 0} transactions in ${result.spikes[0]?.timeWindow || '24h'} window`,
              relevance: 0.85,
              url: '/financial#patterns',
              data: result
            });
          }
          break;

        case 'money_trails':
          citations.push({
            type: 'financial',
            id: `FIN-TRAIL-${idx}`,
            title: `Money Trail Analysis`,
            summary: `Traced ${result.trails.length} financial flows with ${result.trails[0]?.forwardHops || 0} downstream and ${result.trails[0]?.reverseHops || 0} upstream hops`,
            relevance: 0.88,
            url: '/financial#overview',
            data: result
          });
          break;

        case 'financial_summary':
          citations.push({
            type: 'financial',
            id: `FIN-SUMMARY-${idx}`,
            title: `Financial Intelligence Summary`,
            summary: result.summary,
            relevance: 0.80,
            url: '/financial',
            data: result
          });
          break;
      }
    });

    return citations;
  }

  /**
   * Map financial evidence to Rational Choice Theory (RCT)
   * Financial motive, cost-benefit analysis, opportunity
   */
  static analyzeRCT(evidence: FinancialEvidenceCitation[]): {
    mechanism: string;
    supporting: string[];
    confidence: number;
  } {
    const supporting: string[] = [];
    let confidence = 0;

    evidence.forEach(ev => {
      if (ev.data.type === 'circular_flows') {
        supporting.push('Circular money flows indicate rational planning to obscure fund origins');
        confidence += 0.25;
      }
      if (ev.data.type === 'mule_accounts') {
        supporting.push('Use of mule accounts shows calculated risk mitigation and layering strategy');
        confidence += 0.30;
      }
      if (ev.data.type === 'velocity_spikes') {
        supporting.push('Transaction bursts suggest time-sensitive opportunity exploitation');
        confidence += 0.20;
      }
      if (ev.data.type === 'money_trails' && ev.data.trails[0]?.forwardHops > 3) {
        supporting.push('Complex money trails demonstrate deliberate obfuscation planning');
        confidence += 0.25;
      }
    });

    return {
      mechanism: 'Offender exhibits rational financial crime planning with deliberate obfuscation techniques',
      supporting,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * Map financial evidence to Crime Pattern Theory (CPT)
   * Hot spots, temporal patterns, criminal networks
   */
  static analyzeCPT(evidence: FinancialEvidenceCitation[]): {
    mechanism: string;
    supporting: string[];
    confidence: number;
  } {
    const supporting: string[] = [];
    let confidence = 0;

    evidence.forEach(ev => {
      if (ev.data.type === 'circular_flows') {
        supporting.push('Recurring circular flow pattern indicates established criminal routine');
        confidence += 0.30;
      }
      if (ev.data.type === 'mule_accounts' && ev.data.count > 3) {
        supporting.push('Mule account network reveals organized crime infrastructure');
        confidence += 0.35;
      }
      if (ev.data.type === 'velocity_spikes') {
        supporting.push('Temporal transaction clustering suggests coordinated activity windows');
        confidence += 0.25;
      }
    });

    return {
      mechanism: 'Financial activity patterns reveal established criminal infrastructure and temporal coordination',
      supporting,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * Map financial evidence to Social Disorganization Theory (SDT)
   * Weak institutional controls, exploitation of vulnerabilities
   */
  static analyzeSDT(evidence: FinancialEvidenceCitation[]): {
    mechanism: string;
    supporting: string[];
    confidence: number;
  } {
    const supporting: string[] = [];
    let confidence = 0;

    evidence.forEach(ev => {
      if (ev.data.type === 'mule_accounts') {
        supporting.push('Mule account prevalence suggests exploitation of financially vulnerable individuals');
        confidence += 0.30;
      }
      if (ev.data.type === 'financial_summary' && ev.data.statistics?.flaggedVolume > 1000000) {
        supporting.push('High flagged transaction volume indicates weak financial monitoring controls');
        confidence += 0.25;
      }
      if (ev.data.type === 'circular_flows' && ev.data.count > 5) {
        supporting.push('Multiple circular flows suggest systemic banking oversight gaps');
        confidence += 0.30;
      }
    });

    return {
      mechanism: 'Financial crime exploits weak institutional controls and vulnerable account holders',
      supporting,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * Extract financial intelligence for investigation recommendations
   */
  static generateInvestigativeLeads(evidence: FinancialEvidenceCitation[]): string[] {
    const leads: string[] = [];

    evidence.forEach(ev => {
      switch (ev.data.type) {
        case 'circular_flows':
          leads.push('Freeze accounts involved in circular flows and request transaction records from all participating banks');
          leads.push('Interview account holders to determine if they are aware of money laundering activities');
          break;

        case 'mule_accounts':
          leads.push('Issue lookout notices for suspected mule account holders and track their movement');
          leads.push('Analyze employment records and financial backgrounds of mule account holders to identify recruiters');
          break;

        case 'velocity_spikes':
          leads.push('Correlate velocity spike timestamps with other criminal activities or external events');
          leads.push('Request CCTV footage from ATMs and branches during high-velocity transaction windows');
          break;

        case 'money_trails':
          leads.push('Map complete money trail from source to final destination across all financial institutions');
          leads.push('Identify and interview beneficial owners of accounts at trail endpoints');
          break;
      }
    });

    return [...new Set(leads)]; // Remove duplicates
  }

  /**
   * Format currency amount
   */
  private static formatAmount(amount: number): string {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`;
    return amount.toFixed(0);
  }
}
