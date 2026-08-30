import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ServerDataLoader } from '@/lib/api/serverDataLoader';

// Only confirmed-working keys (tested Aug 2026)
const GEMINI_API_KEYS = [
  process.env.GOOGLE_API_KEY_1,   // ✅ GOOD
  process.env.GOOGLE_API_KEY_2,   // ✅ GOOD
  process.env.GOOGLE_API_KEY_5,   // ✅ GOOD
  process.env.GOOGLE_API_KEY_11,  // ✅ GOOD
].filter(Boolean) as string[];

// Verified LIVE models from API (Aug 2026)
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
];

const deadKeys = new Set<string>();
interface Turn { role: 'user' | 'assistant'; content: string; }

// ── RAG: fetch relevant data from the FileStore based on the user's message ──
async function fetchRelevantContext(message: string): Promise<string> {
  const msg = message.toLowerCase();
  const sections: string[] = [];

  try {
    // Always fetch district summary of FIRs (small, always useful)
    const allFIRs = await ServerDataLoader.getFIRs();
    const firs = Array.isArray(allFIRs) ? allFIRs : [];

    if (firs.length > 0) {
      // District breakdown
      const districtCount: Record<string, number> = {};
      const crimeTypeCount: Record<string, number> = {};
      for (const fir of firs) {
        const d = fir.district_id || fir.district || 'Unknown';
        districtCount[d] = (districtCount[d] || 0) + 1;
        const c = fir.crime_type_en || fir.crime_type || 'Unknown';
        crimeTypeCount[c] = (crimeTypeCount[c] || 0) + 1;
      }

      const districtSummary = Object.entries(districtCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([d, n]) => `  ${d}: ${n} FIRs`)
        .join('\n');

      sections.push(`DATABASE SUMMARY (${firs.length} total FIRs in system):
FIRs by District:
${districtSummary}`);

      // If user asks about a specific district, fetch matching FIRs
      const districtNames = Object.keys(districtCount);
      const mentionedDistrict = districtNames.find(d =>
        msg.includes(d.toLowerCase()) || d.toLowerCase().includes(msg.split(' ').find(w => w.length > 4) || '')
      );

      if (mentionedDistrict) {
        const districtFIRs = firs
          .filter(f => (f.district_id || f.district || '') === mentionedDistrict)
          .slice(0, 20);

        const firDetails = districtFIRs.map(f =>
          `  FIR: ${f.fir_no || f.id} | Crime: ${f.crime_type_en || 'N/A'} | Status: ${f.status_en || 'N/A'} | Date: ${f.date || 'N/A'} | Description: ${(f.description || f.brief_fact_en || '').slice(0, 150)}`
        ).join('\n');

        sections.push(`FIRs in ${mentionedDistrict} District (${districtFIRs.length} shown of ${districtCount[mentionedDistrict]}):
${firDetails}`);
      }

      // If user asks about crime type
      const crimeKeywords: Record<string, string[]> = {
        'murder': ['murder', 'homicide', 'culpable homicide', 'kill'],
        'theft': ['theft', 'steal', 'robbery', 'burglary'],
        'rape': ['rape', 'sexual assault', 'pocso'],
        'drug': ['drug', 'narcotics', 'trafficking'],
        'fraud': ['fraud', 'cheating', 'scam', 'cyber'],
        'kidnapping': ['kidnapping', 'abduction'],
      };
      for (const [crimeKey, keywords] of Object.entries(crimeKeywords)) {
        if (keywords.some(k => msg.includes(k))) {
          const crimeFIRs = firs
            .filter(f => {
              const ct = (f.crime_type_en || f.crime_type || '').toLowerCase();
              return keywords.some(k => ct.includes(k));
            })
            .slice(0, 15);
          if (crimeFIRs.length > 0) {
            const details = crimeFIRs.map(f =>
              `  FIR: ${f.fir_no || f.id} | District: ${f.district_id || 'N/A'} | Status: ${f.status_en || 'N/A'} | Date: ${f.date || 'N/A'} | Desc: ${(f.description || '').slice(0, 120)}`
            ).join('\n');
            sections.push(`${crimeKey.toUpperCase()} cases (${crimeFIRs.length} found):\n${details}`);
          }
          break;
        }
      }

      // If user asks about cases/most serious
      if (msg.includes('serious') || msg.includes('worst') || msg.includes('major') || msg.includes('important')) {
        const seriousCrimes = ['Murder', 'Culpable Homicide', 'Rape', 'Kidnapping', 'Dacoity'];
        const seriousFIRs = firs
          .filter(f => seriousCrimes.some(s => (f.crime_type_en || '').toLowerCase().includes(s.toLowerCase())))
          .slice(0, 10);
        if (seriousFIRs.length > 0) {
          const details = seriousFIRs.map(f =>
            `  FIR: ${f.fir_no || f.id} | Crime: ${f.crime_type_en} | District: ${f.district_id} | Status: ${f.status_en} | Desc: ${(f.description || '').slice(0, 200)}`
          ).join('\n');
          sections.push(`SERIOUS CASES in database:\n${details}`);
        }
      }
    }

    // If asking about persons/suspects/offenders
    if (msg.includes('person') || msg.includes('suspect') || msg.includes('offender') || msg.includes('accused') || msg.includes('criminal') || msg.includes('name')) {
      const persons = await ServerDataLoader.getPersons();
      const pList = Array.isArray(persons) ? persons.slice(0, 20) : [];
      if (pList.length > 0) {
        const pDetails = pList.map(p =>
          `  ${p.name_en || p.name || 'Unknown'} | Age: ${p.age || 'N/A'} | Gender: ${p.gender || 'N/A'} | Role: ${p.role || 'N/A'} | District: ${p.district || 'N/A'}`
        ).join('\n');
        sections.push(`PERSONS IN DATABASE (${pList.length} of ${persons.length || 0} shown):\n${pDetails}`);
      }
    }

  } catch (err) {
    console.warn('RAG context fetch error:', err);
  }

  return sections.length > 0
    ? `\n\n--- LIVE DATA FROM KSP DATABASE ---\n${sections.join('\n\n')}\n--- END OF DATA ---`
    : '';
}

// ── Gemini call with RAG context ─────────────────────────────────────────────
async function callGemini(message: string, history: Turn[], dbContext: string): Promise<string> {
  const errors: string[] = [];

  const systemInstruction = `You are CrimeIntel, the AI assistant for Karnataka State Police (KSP) Intelligence Platform.
You have DIRECT ACCESS to the KSP crime database. When answering, use the LIVE DATA provided below in the prompt.
Always answer from the database data — do NOT say you don't have access.
Maintain conversation memory. Be accurate, concise, and analytical.
When ranking cases by seriousness, consider: murder > rape > kidnapping > robbery > theft.`;

  const userMessageWithContext = dbContext
    ? `${message}\n\n${dbContext}`
    : message;

  const contents = [
    ...history.slice(-8).map(t => ({
      role: t.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: t.content }],
    })),
    { role: 'user', parts: [{ text: userMessageWithContext }] },
  ];

  const validKeys = GEMINI_API_KEYS.filter(k => !deadKeys.has(k));
  if (validKeys.length === 0) throw new Error('All API keys exhausted');
  const keys = [...validKeys].sort(() => Math.random() - 0.5);

  for (const model of GEMINI_MODELS) {
    let modelDead = false;
    for (const apiKey of keys) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const result = await ai.models.generateContent({
          model, contents,
          config: { systemInstruction, temperature: 0.3, maxOutputTokens: 2048 },
        });
        if (result.text) {
          console.log(`✅ Chat RAG: model=${model}, contextLen=${dbContext.length}`);
          return result.text;
        }
      } catch (err: any) {
        const msg: string = err?.message ?? String(err);
        if (msg.includes('API_KEY_INVALID') || msg.includes('key not valid') || msg.includes('key was reported as leaked')) {
          deadKeys.add(apiKey); errors.push(`[KEY_DEAD]`); continue;
        }
        if (msg.includes('not found') || msg.includes('no longer available') || msg.includes('NOT_FOUND') || msg.includes('decommissioned')) {
          modelDead = true; errors.push(`[MODEL_DEAD:${model}]`); break;
        }
        errors.push(`[${model}] ${msg.slice(0, 100)}`);
      }
    }
    if (modelDead) continue;
  }
  throw new Error(`All models/keys failed: ${errors.slice(-3).join(' | ')}`);
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    if (!body.sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    const history: Turn[] = Array.isArray(body.history) ? body.history : [];

    // Try FastAPI backend first (3s timeout)
    try {
      const r = await fetch('http://127.0.0.1:8000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: body.message, language: body.language || 'en', sessionId: body.sessionId }),
        signal: AbortSignal.timeout(3000),
      });
      if (r.ok) return NextResponse.json(await r.json());
    } catch { /* Backend offline */ }

    if (GEMINI_API_KEYS.length === 0)
      return NextResponse.json({ error: 'No GOOGLE_API_KEY_* set in .env.local' }, { status: 500 });

    // Fetch real database context for this query
    const dbContext = await fetchRelevantContext(body.message);

    const text = await callGemini(body.message, history, dbContext);
    return NextResponse.json({ text_summary: text, source: 'gemini-rag' });

  } catch (error: any) {
    console.error('Chat API Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to process query' }, { status: 500 });
  }
}
