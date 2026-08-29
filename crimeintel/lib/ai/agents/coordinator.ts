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

      case 'DIRECT_RETRIEVAL': {
        const [sqlData, vecData] = await Promise.all([
          SQLAgent.retrieve(parsedQuery),
          VectorAgent.retrieve(parsedQuery)
        ]);
        if (sqlData.length > 0) evidence.push({ source: 'SQLAgent', data: sqlData });
        if (vecData.length > 0) evidence.push({ source: 'VectorAgent', data: vecData });
        break;
      }

      case 'AGGREGATE_ANALYTICAL': {
        const [analyticsData, aggSqlData] = await Promise.all([
          AnalyticsAgent.retrieve(parsedQuery),
          SQLAgent.retrieve(parsedQuery)
        ]);
        evidence.push({ source: 'AnalyticsAgent', data: analyticsData });
        if (aggSqlData.length > 0) evidence.push({ source: 'SQLAgent', data: aggSqlData });
        break;
      }

      case 'RELATIONSHIP_QUERY':
        const graphData = await GraphAgent.retrieve(parsedQuery);
        if (graphData.length > 0) evidence.push({ source: 'GraphAgent', data: graphData });
        break;

      case 'REASONING_QUERY':
      case 'FOLLOW_UP': {
        const fetchGraph = (parsedQuery.entities.person_names && parsedQuery.entities.person_names.length > 0);
        
        const [rSqlData, rVecData, rGraphData] = await Promise.all([
          SQLAgent.retrieve(parsedQuery),
          VectorAgent.retrieve(parsedQuery),
          fetchGraph ? GraphAgent.retrieve(parsedQuery) : Promise.resolve([])
        ]);
        
        if (rSqlData.length > 0) evidence.push({ source: 'SQLAgent', data: rSqlData });
        if (rVecData.length > 0) evidence.push({ source: 'VectorAgent', data: rVecData });
        if (rGraphData.length > 0) evidence.push({ source: 'GraphAgent', data: rGraphData });
        
        break;
      }
    }

    return evidence;
  }
}
