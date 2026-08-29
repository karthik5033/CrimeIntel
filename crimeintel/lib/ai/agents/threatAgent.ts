import { ParsedQuery } from '../chat/intentClassifier';
import { SQLAgent } from './sqlAgent';

export class ThreatAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any[]> {
    try {
      const firs = await SQLAgent.retrieve(parsedQuery);
      
      if (firs.length === 0) {
        return [{
          type: 'ThreatAssessment',
          status: 'Insufficient Data',
          score: 0,
          level: 'Unknown'
        }];
      }

      let violentCount = 0;
      let unsolvedCount = 0;
      
      const VIOLENT_CRIMES = ['Murder', 'Attempt to Murder', 'Assault', 'Rape', 'Robbery'];
      const UNSOLVED_STATUSES = ['Under Investigation', 'Closed (Undetected)'];

      firs.forEach((f: any) => {
        if (f.crime_type_en && VIOLENT_CRIMES.includes(f.crime_type_en)) {
          violentCount++;
        }
        if (f.status_en && UNSOLVED_STATUSES.includes(f.status_en)) {
          unsolvedCount++;
        }
      });

      const total = firs.length;
      
      // Calculate basic threat vectors
      // 1. Violence Ratio (Max 50 points)
      const violentRatio = violentCount / total;
      const violenceScore = violentRatio * 50;
      
      // 2. Unsolved Ratio (Max 30 points)
      const unsolvedRatio = unsolvedCount / total;
      const unsolvedScore = unsolvedRatio * 30;
      
      // 3. Volume Factor (Max 20 points)
      const volumeScore = Math.min(20, total * 0.5); // Caps at 40 incidents
      
      const rawScore = violenceScore + unsolvedScore + volumeScore;
      const finalScore = Math.min(100, Math.round(rawScore));
      
      let level = 'Low';
      if (finalScore > 20) level = 'Guarded';
      if (finalScore > 40) level = 'Elevated';
      if (finalScore > 65) level = 'High';
      if (finalScore > 85) level = 'Severe';

      return [{
        type: 'ThreatAssessment',
        metric: 'Overall Threat Score',
        score: finalScore,
        level: level,
        factors: {
          violent_crimes: violentCount,
          unsolved_cases: unsolvedCount,
          total_incidents: total
        },
        analysis: `Calculated a threat score of ${finalScore}/100 (${level}). This is driven by a ${(violentRatio * 100).toFixed(1)}% violent crime rate and a ${(unsolvedRatio * 100).toFixed(1)}% unsolved case rate within the queried dataset.`
      }];
      
    } catch (error) {
      console.error("ThreatAgent Error:", error);
      return [];
    }
  }
}
