/**
 * Risk Scoring Engine
 * 
 * Computes offender risk scores based on historical data.
 * Score is out of 100.
 */

export function computeOffenderRiskScore(
  personId: string,
  firs: any[],
  associatesCount: number,
  vehiclesCount: number
): number {
  if (!firs || firs.length === 0) return 0;

  let score = 0;

  // 1. Base Score from FIR frequency
  // 15 points per FIR, max 60
  score += Math.min(firs.length * 15, 60);

  // 2. Severity Escalation & Crime Type Modifier
  let severityScore = 0;
  let hasSevereCrime = false;
  firs.forEach((fir: any) => {
    const type = (fir.crime_type_en || fir.crime_type || "").toLowerCase();
    if (/murder|homicide|kidnapping|robbery|dacoity/i.test(type)) {
      severityScore += 20;
      hasSevereCrime = true;
    } else if (/assault|burglary|extortion/i.test(type)) {
      severityScore += 10;
    } else {
      severityScore += 5;
    }
  });
  score += Math.min(severityScore, 25); // max 25 from severity

  // 3. Recency Factor
  let recencyScore = 0;
  const now = new Date();
  firs.forEach((fir: any) => {
    if (!fir.date) return;
    const firDate = new Date(fir.date);
    const monthsAgo = (now.getTime() - firDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo <= 3) recencyScore += 10;
    else if (monthsAgo <= 12) recencyScore += 5;
  });
  score += Math.min(recencyScore, 10); // max 10 from recency

  // 4. Network Centrality Proxy (Associates & Assets)
  const networkScore = (associatesCount * 2) + (vehiclesCount * 2);
  score += Math.min(networkScore, 5); // max 5 from network

  // Normalize
  return Math.min(Math.round(score), 99);
}

/**
 * Computes district-level hotspot risk
 */
export function computeDistrictRiskScore(firs: any[]): number {
  if (!firs || firs.length === 0) return 10;
  
  // Basic volume-based scoring
  const volume = firs.length;
  let score = 20 + (volume * 5);

  // Check recent spike
  const now = new Date();
  let recentCount = 0;
  firs.forEach((fir: any) => {
    if (!fir.date) return;
    const daysAgo = (now.getTime() - new Date(fir.date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo <= 7) recentCount++;
  });

  if (recentCount > volume * 0.3) {
    score += 20; // 30% of crimes happened in last 7 days = spike
  }

  return Math.min(Math.round(score), 95);
}
