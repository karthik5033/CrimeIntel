export type ConfidenceLevel = 'Low' | 'Moderate' | 'Moderate-High' | 'High';

export interface Evidence {
  id: string; // e.g. "FIR-4521", "Node-123"
  type: 'FIR' | 'Person' | 'Case' | 'Graph' | 'Statistic';
  description: string;
  sourceId?: string; // Optional actual DB id for linking
}

export interface Mechanism {
  name: string;
  description: string;
  theory: 'Routine Activity Theory' | 'Crime Pattern Theory' | 'Rational Choice Theory' | 'Social Disorganization Theory' | 'Custom';
  factors: string[]; // specific factors like "Motivated Offender: 2 repeat offenders released"
}

export interface AlternativeHypothesis {
  hypothesis: string;
  status: 'Supported' | 'Partially Supported' | 'Rejected';
  reasoning: string;
}

export interface ConfidenceScore {
  level: ConfidenceLevel;
  score: number; // 0-100
  factors: string[]; // Why this confidence level
}

export interface ReasoningOutput {
  id: string; // unique ID for audit
  query: string;
  claim: string;
  mechanisms: Mechanism[];
  evidence: Evidence[];
  alternatives: AlternativeHypothesis[];
  confidence: ConfidenceScore;
  timestamp: string;
}
