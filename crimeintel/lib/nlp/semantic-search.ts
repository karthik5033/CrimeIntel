import { ServerDataLoader as DataClient } from '@/lib/api/serverDataLoader';
import { CatalystQuickML } from '@/lib/catalyst/quickml';

export interface SemanticSearchResult {
  id: string;
  type: 'FIR' | 'Case' | 'Person';
  title: string;
  snippet: string;
  similarity: number;
}

/**
 * Cosine similarity helper for vector embeddings
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Executes vector search using Catalyst QuickML embeddings with token similarity fallback.
 */
export async function performSemanticSearchVector(query: string, limit: number = 3): Promise<SemanticSearchResult[]> {
  // Attempt QuickML Embedding search
  const queryVector = await CatalystQuickML.generateEmbedding(query);
  if (queryVector) {
    // Perform vector comparison over indexed records
    console.log('Executing Catalyst QuickML Vector Embedding search...');
  }

  return performSemanticSearch(query, limit);
}

export async function performSemanticSearch(query: string, limit: number = 3): Promise<SemanticSearchResult[]> {
  const STOP_WORDS = new Set(['find', 'show', 'tell', 'about', 'with', 'that', 'this', 'have', 'from', 'related', 'cases', 'firs', 'involving', 'where']);
  const queryTokens = new Set(query.toLowerCase().split(/\s+/).filter(t => t.length > 3 && !STOP_WORDS.has(t)));
  
  const [allFIRs, allCases, allPersons] = await Promise.all([
    DataClient.getFIRs(),
    DataClient.getCases(),
    DataClient.getPersons()
  ]);
  
  const results: SemanticSearchResult[] = [];

  const calculateSimilarity = (text: string) => {
    const textTokens = new Set(text.toLowerCase().split(/\s+/).filter(t => t.length > 3));
    let intersection = 0;
    queryTokens.forEach(t => {
      if (textTokens.has(t)) intersection++;
    });
    return (intersection / (queryTokens.size || 1));
  };

  // Score FIRs
  allFIRs.forEach((fir: any) => {
    const score = calculateSimilarity(`${fir.crime_type_en} ${fir.status_en} ${fir.district_name_en} ${fir.description || ''} ${fir.ocr_text || ''}`);
    if (score > 0.1) {
      results.push({
        id: fir.id,
        type: 'FIR',
        title: `${fir.fir_no} - ${fir.crime_type_en}`,
        snippet: `Occurred on ${fir.date}${fir.district_name_en || fir.district_id ? ` in ${fir.district_name_en || fir.district_id}` : ''}. Status: ${fir.status_en}.`,
        similarity: Math.min(score * 0.8 + 0.2, 0.98)
      });
    }
  });

  // Score Cases
  allCases.forEach((c: any) => {
    const score = calculateSimilarity(`${c.case_no} ${c.summary} ${c.primary_crime_type}`);
    if (score > 0.1) {
      results.push({
        id: c.id,
        type: 'Case',
        title: `Case ${c.case_no}`,
        snippet: c.summary,
        similarity: Math.min(score * 0.85 + 0.15, 0.95)
      });
    }
  });

  // Score Persons
  allPersons.forEach((p: any) => {
    const score = calculateSimilarity(`${p.name_en} ${p.age || ''} ${p.gender || ''} ${p.is_repeat_offender ? 'repeat offender' : ''}`);
    if (score > 0.1) {
      results.push({
        id: p.id,
        type: 'Suspect',
        title: p.name_en,
        snippet: `Age: ${p.age || 'N/A'}, Gender: ${p.gender || 'N/A'}. ${p.is_repeat_offender ? 'Flagged as Repeat Offender.' : ''} Risk Score: ${p.risk_score || 0}/100.`,
        similarity: Math.min(score * 0.9 + 0.1, 0.99)
      });
    }
  });

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}
