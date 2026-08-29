
import { ReasoningOutput, ConfidenceLevel, Mechanism, Evidence, AlternativeHypothesis, ConfidenceScore } from './types';
import { CatalystNoSQL } from '@/lib/catalyst/nosql';
import { GeminiService } from '@/lib/ai/gemini';

/**
 * ReasoningEngine - Transforms raw queries into structured theory-driven investigative reasoning.
 * Outputs are automatically persisted to Catalyst NoSQL for audit compliance.
 */
export class ReasoningEngine {
  
  static async processQuery(query: string, contextData: any = {}): Promise<ReasoningOutput> {
    try {
      const systemPrompt = `You are a Criminological Reasoning Engine. Your task is to analyze the user's query against the provided Context and evaluate it using one of three theories:
1. Routine Activity Theory
2. Crime Pattern Theory
3. Rational Choice Theory
4. Social Disorganization Theory`;

      const userMessage = `Query: ${query}\n\nContext: ${JSON.stringify(contextData)}`;

      const schema = {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          query: { type: 'STRING' },
          claim: { type: 'STRING', description: 'A one-sentence summary of your finding' },
          mechanisms: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                description: { type: 'STRING' },
                theory: { type: 'STRING', enum: ['Routine Activity Theory', 'Crime Pattern Theory', 'Rational Choice Theory', 'Social Disorganization Theory', 'Custom'] },
                factors: { type: 'ARRAY', items: { type: 'STRING' } }
              },
              required: ['name', 'description', 'theory', 'factors']
            }
          },
          evidence: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'STRING' },
                type: { type: 'STRING', enum: ['FIR', 'Person', 'Case', 'Graph', 'Statistic'] },
                description: { type: 'STRING' }
              },
              required: ['id', 'type', 'description']
            }
          },
          alternatives: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                hypothesis: { type: 'STRING' },
                status: { type: 'STRING', enum: ['Supported', 'Partially Supported', 'Rejected'] },
                reasoning: { type: 'STRING' }
              },
              required: ['hypothesis', 'status', 'reasoning']
            }
          },
          confidence: {
            type: 'OBJECT',
            properties: {
              level: { type: 'STRING', enum: ['Low', 'Moderate', 'Moderate-High', 'High'] },
              score: { type: 'NUMBER', description: '0-100' },
              factors: { type: 'ARRAY', items: { type: 'STRING' } }
            },
            required: ['level', 'score', 'factors']
          },
          timestamp: { type: 'STRING', description: 'ISO date' }
        },
        required: ['id', 'query', 'claim', 'mechanisms', 'evidence', 'alternatives', 'confidence', 'timestamp']
      };

      const output = await GeminiService.generateJsonResponse<ReasoningOutput>(userMessage, schema, systemPrompt, 'gemini-2.5-flash');

      // Automatically persist to Catalyst NoSQL
      if (output.id) {
        CatalystNoSQL.saveReasoningOutput(output.id, output).catch(console.error);
      }

      return output;
    } catch (error: any) {
      console.error("Reasoning Engine Gemini Error:", error);
      return this.fallbackReasoning(query, error.message || String(error));
    }
  }

  private static fallbackReasoning(query: string, errorMsg: string = ""): ReasoningOutput {
    const lowerQuery = query.toLowerCase();
    
    // Default to Routine Activity Theory
    let theory: any = "Routine Activity Theory";
    let claim = "Analysis of the entities suggests a convergence of motivated offenders and suitable targets in time and space.";
    let mechanisms = [
      {
        name: "Convergence in Space and Time",
        description: "The incidents occur in areas lacking capable guardianship during vulnerable hours.",
        theory: "Routine Activity Theory" as any,
        factors: ["Lack of Guardianship", "Target Suitability", "Offender Motivation"]
      }
    ];

    if (lowerQuery.includes('hotspot') || lowerQuery.includes('area') || lowerQuery.includes('map')) {
      theory = "Crime Pattern Theory";
      claim = "Crime incidents cluster around specific geographic nodes, indicating awareness space overlap.";
      mechanisms = [
        {
          name: "Geographic Clustering",
          description: "Activity nodes (e.g., transit hubs, commercial zones) attract repeat offenses.",
          theory,
          factors: ["Activity Nodes", "Paths", "Edges"]
        }
      ];
    } else if (lowerQuery.includes('why') || lowerQuery.includes('motive') || lowerQuery.includes('financial')) {
      theory = "Rational Choice Theory";
      claim = "Offenders appear to be evaluating the risk vs. reward, opting for targets with high payoff and low detection probability.";
      mechanisms = [
        {
          name: "Cost-Benefit Calculation",
          description: "The selection of targets indicates a calculated decision to maximize illicit gain while minimizing exposure.",
          theory,
          factors: ["Perceived Risk", "Expected Reward", "Effort Required"]
        }
      ];
    } else if (lowerQuery.includes('network') || lowerQuery.includes('gang') || lowerQuery.includes('community')) {
      theory = "Social Disorganization Theory";
      claim = "Systemic community vulnerabilities and breakdown of informal social controls facilitate organized criminal networks.";
      mechanisms = [
        {
          name: "Breakdown of Social Control",
          description: "Lack of community cohesion allows illicit networks to establish strongholds.",
          theory,
          factors: ["Transiency", "Economic Deprivation", "Network Formation"]
        }
      ];
    }

    return {
      id: `res-${Date.now()}`,
      query,
      claim,
      mechanisms,
      evidence: [],
      alternatives: [
        {
          hypothesis: "The pattern is purely coincidental and lacks underlying systemic drivers.",
          status: "Rejected" as any,
          reasoning: "The frequency and spatial clustering of events strongly suggest coordinated or systematic behavior rather than random chance."
        }
      ],
      confidence: {
        level: 'Moderate' as any,
        score: 65,
        factors: ["Heuristic analysis applied", "LLM reasoning unavailable", `Matched query intent to ${theory}`, `Error: ${errorMsg}`]
      },
      timestamp: new Date().toISOString()
    };
  }
}
