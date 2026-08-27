
import { ReasoningOutput, ConfidenceLevel, Mechanism, Evidence, AlternativeHypothesis, ConfidenceScore } from './types';
import { CatalystNoSQL } from '@/lib/catalyst/nosql';
import { getSharedAccessToken } from '@/lib/catalyst/auth';

/**
 * ReasoningEngine - Transforms raw queries into structured theory-driven investigative reasoning.
 * Outputs are automatically persisted to Catalyst NoSQL for audit compliance.
 */
export class ReasoningEngine {
  
  static async processQuery(query: string, contextData: any = {}): Promise<ReasoningOutput> {
    const endpointKey = process.env.QUICKML_ENDPOINT_KEY;
    
    // If we don't have the key, fallback to a basic response
    if (!endpointKey) {
      console.warn('⚠️ QUICKML_ENDPOINT_KEY is not configured for ReasoningEngine.');
      return this.fallbackReasoning(query);
    }

    try {
      
      // Use shared OAuth token for API authentication
      const token = await getSharedAccessToken();
      const orgId = process.env.CATALYST_ORG_ID || '60078981781';

      const systemPrompt = `You are a Criminological Reasoning Engine. Your task is to analyze the user's query against the provided Context and evaluate it using one of three theories:
1. Routine Activity Theory
2. Crime Pattern Theory
3. Rational Choice Theory
4. Social Disorganization Theory

You MUST output ONLY a valid JSON object matching this TypeScript interface precisely (do NOT wrap in markdown \`\`\`json blocks):
{
  "id": "string",
  "query": "string",
  "claim": "string (A one-sentence summary of your finding)",
  "mechanisms": [
    {
      "name": "string",
      "description": "string",
      "theory": "Routine Activity Theory" | "Crime Pattern Theory" | "Rational Choice Theory" | "Social Disorganization Theory" | "Custom",
      "factors": ["string"]
    }
  ],
  "evidence": [
    {
      "id": "string",
      "type": "FIR" | "Person" | "Case" | "Graph" | "Statistic",
      "description": "string"
    }
  ],
  "alternatives": [
    {
      "hypothesis": "string",
      "status": "Supported" | "Partially Supported" | "Rejected",
      "reasoning": "string"
    }
  ],
  "confidence": {
    "level": "Low" | "Moderate" | "Moderate-High" | "High",
    "score": number (0-100),
    "factors": ["string"]
  },
  "timestamp": "string (ISO date)"
}`;

      const userMessage = `Query: ${query}\n\nContext: ${JSON.stringify(contextData)}`;

      const fetchResponse = await fetch(endpointKey, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'CATALYST-ORG': orgId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "crm-di-glm47b_30b_it",
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 2000,
          temperature: 0.2,
          stream: false
        })
      });

      if (!fetchResponse.ok) {
        throw new Error(`LLM Serving API Error: ${fetchResponse.status}`);
      }

      const jsonResponse = await fetchResponse.json();
      let textContent = jsonResponse.choices?.[0]?.message?.content || jsonResponse.response || jsonResponse.text || "{}";
      
      // Robustly parse JSON - handle markdown code blocks if present
      try {
        // Strip markdown code blocks
        textContent = textContent.trim();
        if (textContent.includes('```json')) {
          const match = textContent.match(/```json\s*([\s\S]*?)\s*```/);
          if (match) {
            textContent = match[1];
          }
        } else if (textContent.includes('```')) {
          // Generic code block without json marker
          textContent = textContent.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
        }

        const output: ReasoningOutput = JSON.parse(textContent);
        
        // Validate required fields
        if (!output.claim || !output.confidence) {
          console.error('Reasoning output missing required fields:', output);
          return this.fallbackReasoning(query);
        }

        // Automatically persist to Catalyst NoSQL
        if (output.id) {
          CatalystNoSQL.saveReasoningOutput(output.id, output).catch(console.error);
        }

        return output;
      } catch (parseError) {
        console.error('Failed to parse reasoning response:', parseError);
        console.error('Raw response:', textContent);
        return this.fallbackReasoning(query);
      }
    } catch (error) {
      console.error("Reasoning Engine Error:", error);
      return this.fallbackReasoning(query);
    }
  }

  private static fallbackReasoning(query: string): ReasoningOutput {
    const lowerQuery = query.toLowerCase();
    
    // Default to Routine Activity Theory
    let theory: "Routine Activity Theory" | "Crime Pattern Theory" | "Rational Choice Theory" | "Social Disorganization Theory" | "Custom" = "Routine Activity Theory";
    let claim = "Analysis of the entities suggests a convergence of motivated offenders and suitable targets in time and space.";
    let mechanisms = [
      {
        name: "Convergence in Space and Time",
        description: "The incidents occur in areas lacking capable guardianship during vulnerable hours.",
        theory: "Routine Activity Theory" as const,
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
          status: "Rejected",
          reasoning: "The frequency and spatial clustering of events strongly suggest coordinated or systematic behavior rather than random chance."
        }
      ],
      confidence: {
        level: 'Medium',
        score: 65,
        factors: ["Heuristic analysis applied", "LLM reasoning unavailable", `Matched query intent to ${theory}`]
      },
      timestamp: new Date().toISOString()
    };
  }
}
