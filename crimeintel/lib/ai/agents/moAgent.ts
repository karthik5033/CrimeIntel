import { ParsedQuery } from '../chat/intentClassifier';
import { SQLAgent } from './sqlAgent';
import { GeminiService } from '@/lib/ai/gemini';

export class MOAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any[]> {
    try {
      const firs = await SQLAgent.retrieve(parsedQuery);
      
      if (firs.length < 2) {
        return [{
          type: 'ModusOperandiCluster',
          status: 'Insufficient Data',
          message: 'At least two incidents are required to identify an operational signature.'
        }];
      }

      // Limit to max 20 FIRs for token efficiency
      const descriptions = firs.slice(0, 20).map((f: any) => ({
        id: f.fir_no,
        desc: f.description
      }));

      const systemPrompt = `You are a forensic behavior analyst.
Analyze the provided crime descriptions and cluster them based on their Modus Operandi (MO).
Look for specific signatures: time of day, entry methods, relationship to victim, weapons used, or specific items targeted.

Return a JSON array where each object represents an MO Cluster. Structure:
[
  {
    "signature": "Nighttime lock-breaking targeting cash",
    "description": "The offender targets premises during nighttime hours by breaking locks to steal valuables.",
    "linked_firs": ["FIR_NO_1", "FIR_NO_2"]
  }
]
`;

      const userPrompt = `Crime Descriptions: ${JSON.stringify(descriptions)}`;
      
      const schema = {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            signature: { type: 'STRING' },
            description: { type: 'STRING' },
            linked_firs: { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['signature', 'description', 'linked_firs']
        }
      };

      const clusters = await GeminiService.generateJsonResponse<any[]>(userPrompt, schema, systemPrompt, 'gemini-2.5-flash');

      if (!clusters || clusters.length === 0) {
        return [];
      }

      return [{
        type: 'ModusOperandiCluster',
        metric: 'Behavioral Signatures Identified',
        clusters: clusters,
        analysis: `Identified ${clusters.length} distinct Modus Operandi clusters across the analyzed dataset.`
      }];
      
    } catch (error) {
      console.error("MOAgent Error:", error);
      return [];
    }
  }
}
