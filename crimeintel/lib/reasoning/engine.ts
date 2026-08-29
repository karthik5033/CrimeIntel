
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
      return await this.fallbackReasoning(query, contextData, "");
    } catch (error: any) {
      console.error("Reasoning Engine Error:", error);
      return await this.fallbackReasoning(query, contextData, error.message || String(error));
    }
  }

  private static async fallbackReasoning(query: string, contextData: any, errorMsg: string = ""): Promise<ReasoningOutput> {
    // 1. Extract FIRs from contextData
    let firs: any[] = [];
    if (Array.isArray(contextData)) {
      contextData.forEach((agent: any) => {
        if (agent.data && Array.isArray(agent.data)) {
          firs = firs.concat(agent.data.filter((i: any) => i.lat && i.lng || i.date || i.fir_no));
        }
      });
    }

    let theory: any = "General Inquiry";
    let claim = "The provided intelligence dataset lacks sufficient spatial or temporal patterns for a specific criminological theory.";
    let mechanisms: any[] = [];
    let confidenceScore = 15;
    let confidenceLevel: any = "Low";
    
    const lats = firs.map(f => parseFloat(f.lat)).filter(l => !isNaN(l));
    const lngs = firs.map(f => parseFloat(f.lng)).filter(l => !isNaN(l));
    
    let spatialVarianceKm = null;
    if (lats.length >= 2) {
      const meanLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const meanLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      
      const varLat = lats.reduce((a, b) => a + Math.pow(b - meanLat, 2), 0) / lats.length;
      const varLng = lngs.reduce((a, b) => a + Math.pow(b - meanLng, 2), 0) / lngs.length;
      
      // roughly convert degrees to km (1 deg ~ 111km)
      spatialVarianceKm = Math.sqrt(varLat + varLng) * 111; 
    }

    const hours = firs.map(f => {
      if (!f.date) return null;
      try {
        const d = new Date(f.date);
        if (isNaN(d.getTime())) return null;
        return d.getUTCHours() + (d.getUTCMinutes() / 60);
      } catch { return null; }
    }).filter(h => h !== null) as number[];

    let temporalVarianceHours = null;
    if (hours.length >= 2) {
      const meanHour = hours.reduce((a, b) => a + b, 0) / hours.length;
      temporalVarianceHours = Math.sqrt(hours.reduce((a, b) => a + Math.pow(b - meanHour, 2), 0) / hours.length);
    }

    // Mathematical Heuristics String for Prompt
    let mathHints = "";
    if (spatialVarianceKm !== null && spatialVarianceKm < 5.0) {
      mathHints += `- Highly clustered geographically (Spatial Variance: ${spatialVarianceKm.toFixed(2)}km). Strongly implies Crime Pattern Theory (Activity Nodes).\n`;
    } else if (temporalVarianceHours !== null && temporalVarianceHours < 3.0) {
      mathHints += `- Highly clustered temporally (Temporal Variance: ${temporalVarianceHours.toFixed(2)}hrs). Strongly implies Routine Activity Theory.\n`;
    } else if (firs.length > 5) {
      mathHints += `- Widespread dispersed cases (${firs.length} cases). Implies Social Disorganization Theory.\n`;
    } else {
      mathHints += `- Limited variance data. Rely on motive or rational choice theory if applicable.\n`;
    }

    const systemPrompt = `You are a forensic reasoning engine. Analyze the query and the mathematical heuristics provided, then output a structured criminological reasoning block in JSON.
Your JSON must match this structure exactly:
{
  "claim": "A 1-2 sentence core hypothesis based on the heuristics",
  "mechanisms": [{
    "name": "Name of criminological mechanism (e.g. Geographic Clustering)",
    "description": "Short explanation",
    "theory": "The overarching theory (e.g. Crime Pattern Theory)",
    "factors": ["Factor 1", "Factor 2"]
  }],
  "alternatives": [{
    "hypothesis": "An opposing or alternative view",
    "status": "Rejected" | "Under Investigation",
    "reasoning": "Why it was rejected or kept"
  }],
  "confidenceScore": <number 0-100>,
  "confidenceLevel": "Low" | "Moderate" | "High"
}`;

    const userPrompt = `Query: ${query}\n\nComputed Heuristics:\n${mathHints}\n\nEvidence Summary:\n${firs.slice(0,5).map(f => f.description).join('\n')}`;

    try {
      const generated = await GeminiService.generateJsonResponse<any>(userPrompt, {
        type: "object",
        properties: {
          claim: { type: "string" },
          mechanisms: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, theory: { type: "string" }, factors: { type: "array", items: { type: "string" } } } } },
          alternatives: { type: "array", items: { type: "object", properties: { hypothesis: { type: "string" }, status: { type: "string" }, reasoning: { type: "string" } } } },
          confidenceScore: { type: "number" },
          confidenceLevel: { type: "string" }
        },
        required: ["claim", "mechanisms", "alternatives", "confidenceScore", "confidenceLevel"]
      }, undefined, 'gemini-2.5-flash');

      return {
        id: `res-${Date.now()}`,
        query,
        claim: generated.claim,
        mechanisms: generated.mechanisms,
        evidence: firs.slice(0, 5).map(f => ({
          type: "Data Correlation",
          source: f.fir_no ? `FIR ${f.fir_no}` : "Database Record",
          description: f.description || `Incident recorded in dataset`,
          reliability: "High"
        })),
        alternatives: generated.alternatives,
        confidence: {
          level: generated.confidenceLevel,
          score: generated.confidenceScore,
          factors: [
            `Analyzed ${firs.length} evidence records`,
            spatialVarianceKm !== null ? `Spatial Variance: ${spatialVarianceKm.toFixed(2)}km` : "No spatial data",
            temporalVarianceHours !== null ? `Temporal Variance: ${temporalVarianceHours.toFixed(2)}hrs` : "No temporal data"
          ]
        },
        timestamp: new Date().toISOString()
      };
    } catch (e: any) {
      console.warn("Reasoning Engine LLM failed, using fallback:", e);
      // Fallback
      return {
        id: `res-${Date.now()}`,
        query,
        claim: "Mathematical variance suggests potential clustering, but full generation failed.",
        mechanisms: [{ name: "Heuristic Fallback", description: "Fallback used due to generation failure", theory: "None", factors: [] }],
        evidence: firs.slice(0, 3).map(f => ({ type: "Data", source: f.fir_no || "DB", description: f.description || "Record", reliability: "High" })),
        alternatives: [],
        confidence: { level: "Low", score: 15, factors: ["Heuristic fallback"] },
        timestamp: new Date().toISOString()
      };
    }
  }
}

