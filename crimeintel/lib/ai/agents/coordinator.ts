import { ParsedQuery } from '../chat/intentClassifier';
import { SQLAgent } from './sqlAgent';
import { GraphAgent } from './graphAgent';
import { VectorAgent } from './vectorAgent';
import { AnalyticsAgent } from './analyticsAgent';
import { FinancialAgent } from './financialAgent';

export interface RetrievedEvidence {
  source: string;
  data: any;
}

export class Coordinator {
  /**
   * Routes the parsed intent to the correct specialist agents and gathers evidence.
   */
  static async gatherEvidence(parsedQuery: ParsedQuery): Promise<RetrievedEvidence[]> {
    const evidence: RetrievedEvidence[] = [];
    console.log(`[Coordinator] Dispatching intent: ${parsedQuery.intent}`);

    // Check for financial queries first (cross-cutting concern)
    if (FinancialAgent.isFinancialQuery(parsedQuery.resolvedQuery)) {
      const financialData = await FinancialAgent.retrieve(parsedQuery);
      if (financialData.length > 0) evidence.push({ source: 'FinancialAgent', data: financialData });
    }

    switch (parsedQuery.intent) {
      case 'CONVERSATIONAL':
        // No evidence gathering needed for general chat
        break;

      case 'DIRECT_RETRIEVAL':
        // Fetch structured data from SQL
        const sqlData = await SQLAgent.retrieve(parsedQuery);
        if (sqlData.length > 0) evidence.push({ source: 'SQLAgent', data: sqlData });
        
        // Also fetch unstructured narratives from Vector DB
        const vecData = await VectorAgent.retrieve(parsedQuery);
        if (vecData.length > 0) evidence.push({ source: 'VectorAgent', data: vecData });
        break;

      case 'AGGREGATE_ANALYTICAL':
        const analyticsData = await AnalyticsAgent.retrieve(parsedQuery);
        evidence.push({ source: 'AnalyticsAgent', data: analyticsData });
        break;

      case 'RELATIONSHIP_QUERY':
        const graphData = await GraphAgent.retrieve(parsedQuery);
        if (graphData.length > 0) evidence.push({ source: 'GraphAgent', data: graphData });
        break;

      case 'REASONING_QUERY':
      case 'FOLLOW_UP':
        // For complex reasoning or follow-ups, hit multiple agents
        const rSqlData = await SQLAgent.retrieve(parsedQuery);
        if (rSqlData.length > 0) evidence.push({ source: 'SQLAgent', data: rSqlData });
        
        const rVecData = await VectorAgent.retrieve(parsedQuery);
        if (rVecData.length > 0) evidence.push({ source: 'VectorAgent', data: rVecData });
        
        // If entities involve people, fetch graph
        if (parsedQuery.entities.person_names && parsedQuery.entities.person_names.length > 0) {
          const rGraphData = await GraphAgent.retrieve(parsedQuery);
          if (rGraphData.length > 0) evidence.push({ source: 'GraphAgent', data: rGraphData });
        }
        break;
    }

    return evidence;
  }
}
