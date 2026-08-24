
import { ReasoningOutput, ConfidenceLevel, Mechanism, Evidence, AlternativeHypothesis, ConfidenceScore } from './types';
import { CatalystNoSQL } from '@/lib/catalyst/nosql';

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
      const app = require('zcatalyst-sdk-node').initialize();
      let token = "";
      if (app.credential && typeof app.credential.getToken === 'function') {
        const tokenResponse = await app.credential.getToken();
        token = tokenResponse.access_token || tokenResponse.accessToken;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'CATALYST-ORG': process.env.CATALYST_ORG_ID || '60078981781'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

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
        headers,
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
      
      // Attempt to clean markdown if present
      textContent = textContent.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();

      const output: ReasoningOutput = JSON.parse(textContent);

      // Automatically persist to Catalyst NoSQL
      if (output.id) {
        CatalystNoSQL.saveReasoningOutput(output.id, output).catch(console.error);
      }

      return output;
    } catch (error) {
      console.error("Reasoning Engine Error:", error);
      return this.fallbackReasoning(query);
    }
  }

  private static fallbackReasoning(query: string): ReasoningOutput {
    return {
      id: `res-${Date.now()}`,
      query,
      claim: "Analysis complete based on provided context.",
      mechanisms: [],
      evidence: [],
      alternatives: [],
      confidence: {
        level: 'Low',
        score: 30,
        factors: ["Insufficient data to form a strong hypothesis or LLM unavailable"]
      },
      timestamp: new Date().toISOString()
    };
  }
}
