import { MockDataClient } from '@/lib/api/mockDataClient';
import { ReasoningOutput, ConfidenceLevel, Mechanism, Evidence, AlternativeHypothesis, ConfidenceScore } from './types';
import { CatalystNoSQL } from '@/lib/catalyst/nosql';

/**
 * ReasoningEngine - Transforms raw queries into structured theory-driven investigative reasoning.
 * Outputs are automatically persisted to Catalyst NoSQL for audit compliance.
 */
export class ReasoningEngine {
  
  static async processQuery(query: string): Promise<ReasoningOutput> {
    const lowerQuery = query.toLowerCase();
    
    let claim = "Analysis complete based on provided context.";
    let mechanisms: Mechanism[] = [];
    let evidence: Evidence[] = [];
    let alternatives: AlternativeHypothesis[] = [];
    let confidence: ConfidenceScore = {
      level: 'Low',
      score: 30,
      factors: ["Insufficient data to form a strong hypothesis"]
    };

    // Module A: Routine Activity Theory
    if (lowerQuery.includes('risk') || lowerQuery.includes('theft') || lowerQuery.includes('festival')) {
      claim = "High risk of vehicle theft in the identified district over the next 2 weeks.";
      mechanisms.push({
        name: "Routine Activity Theory",
        description: "Convergence of motivated offenders, suitable targets, and lack of capable guardianship in time and space.",
        theory: "Routine Activity Theory",
        factors: [
          "Motivated Offender: 2 repeat offenders (vehicle theft MO) recently released in this jurisdiction.",
          "Suitable Target: Upcoming festival season increases foot traffic and unattended vehicles by 3x.",
          "Absent Guardian: Night patrol coverage reduced by 22% compared to last month."
        ]
      });
      evidence.push({
        id: "FIR-4521",
        type: "FIR",
        description: "Two-wheeler theft near festival grounds (recent).",
      });
      evidence.push({
        id: "FIR-4589",
        type: "FIR",
        description: "Similar MO observed during the same festival period last year.",
      });
      alternatives.push({
        hypothesis: "Organized gang activity",
        status: "Rejected",
        reasoning: "No shared network links found between recent suspects and known gang entities."
      });
      alternatives.push({
        hypothesis: "Random noise",
        status: "Rejected",
        reasoning: "Chi-square test of historical festival crime rates shows significant deviation from baseline."
      });
      confidence = {
        level: 'Moderate-High',
        score: 75,
        factors: ["Strong historical precedent", "Multiple mechanisms align", "Data completeness is high for this district"]
      };
    }
    // Module B: Crime Pattern Theory
    else if (lowerQuery.includes('overlap') || lowerQuery.includes('scene') || lowerQuery.includes('location')) {
      claim = "Suspect's routine activity nodes strongly overlap with the recent string of chain snatching incidents.";
      mechanisms.push({
        name: "Crime Pattern Theory",
        description: "Crimes are most likely to occur where the activity space of offenders overlaps with the locations of suitable targets.",
        theory: "Crime Pattern Theory",
        factors: [
          "Nodes: Suspect lives 800m from the primary cluster of incidents.",
          "Pathways: Suspect's daily commute to work passes through 3 of the 5 crime scenes.",
          "Friction of Distance: All incidents fall within a 2km 'comfort zone' radius of the suspect's home node."
        ]
      });
      evidence.push({
        id: "Node-Overlap-Graph",
        type: "Graph",
        description: "Activity nodes map showing residential and commute overlaps within a 2km radius."
      });
      evidence.push({
        id: "FIR-5102",
        type: "FIR",
        description: "Chain snatching incident occurring along the suspect's known commute route at 19:00 hrs."
      });
      alternatives.push({
        hypothesis: "Coincidental location clustering",
        status: "Partially Supported",
        reasoning: "The area is a high-traffic commercial zone, meaning many individuals' activity spaces overlap here. However, specific MO match increases suspicion."
      });
      confidence = {
        level: 'Moderate',
        score: 65,
        factors: ["Geospatial alignment is strong", "MO matches perfectly", "Alternative explanation (high traffic area) reduces certainty"]
      };
    }
    // Module C: Rational Choice Theory
    else if (lowerQuery.includes('profile') || lowerQuery.includes('behavior') || lowerQuery.includes('pattern')) {
      claim = "The offender displays highly consistent, low-escalation behavioral patterns indicating calculated risk-reward decision making.";
      mechanisms.push({
        name: "Rational Choice Theory",
        description: "Offenders weigh the potential benefits and consequences before committing a crime, leading to predictable patterns of behavior that minimize risk.",
        theory: "Rational Choice Theory",
        factors: [
          "Target Selection: Consistently targets ground-floor properties without visible security systems.",
          "Time Selection: 78% of incidents occur between 10 PM and 2 AM, maximizing darkness and resident inactivity.",
          "Method: Uses non-destructive entry (lock-picking) and avoids confrontation (zero violence escalation across 6 cases)."
        ]
      });
      evidence.push({
        id: "Profile-Rajesh",
        type: "Person",
        description: "Historical analysis of 6 FIRs linked to this offender."
      });
      alternatives.push({
        hypothesis: "Desperation/Substance-driven offending",
        status: "Rejected",
        reasoning: "The high level of planning, specialized tools (lock-picks), and consistent avoidance of confrontation do not align with typical erratic substance-driven offending."
      });
      confidence = {
        level: 'High',
        score: 90,
        factors: ["Extensive historical data (6 cases)", "Variance in behavior is extremely low", "Clear logical consistency in offender's choices"]
      };
    }
    // Module D: Social Disorganization Theory
    else {
      claim = "The recent 3.2x increase in property crime in District X correlates strongly with rapid changes in local socio-economic indicators.";
      mechanisms.push({
        name: "Social Disorganization Theory",
        description: "A person's residential location is a substantial factor shaping the likelihood that person will become involved in illegal activities. High turnover weakens informal social controls.",
        theory: "Social Disorganization Theory",
        factors: [
          "Transiency: Recent rapid migration influx (+12% population in 6 months) leading to low community cohesion.",
          "Economic Stress: Localized unemployment rate spiked to 18% (state avg 8%) following factory closure.",
          "Weakened Guardianship: Strain on local resources has decreased effective community policing initiatives."
        ]
      });
      evidence.push({
        id: "Stat-Demographics",
        type: "Statistic",
        description: "Census and municipal data showing demographic shifts in the last 2 quarters."
      });
      evidence.push({
        id: "Stat-CrimeRate",
        type: "Statistic",
        description: "Property crime trend line for District X vs State Average."
      });
      alternatives.push({
        hypothesis: "Seasonal agricultural labor patterns",
        status: "Partially Supported",
        reasoning: "Seasonal migration accounts for some of the population influx, but does not fully explain the disproportionate rise in property crime."
      });
      alternatives.push({
        hypothesis: "Changes in reporting practices",
        status: "Rejected",
        reasoning: "Audit of local police stations shows no significant change in FIR registration protocols."
      });
      confidence = {
        level: 'Moderate',
        score: 60,
        factors: ["Strong statistical correlation", "Macro-level analysis limits individual predictive power", "Explicitly framed as correlation, not causation"]
      };
    }

    const output: ReasoningOutput = {
      id: `res-${Date.now()}`,
      query,
      claim,
      mechanisms,
      evidence,
      alternatives,
      confidence,
      timestamp: new Date().toISOString()
    };

    // Automatically persist to Catalyst NoSQL
    CatalystNoSQL.saveReasoningOutput(output.id, output);

    return output;
  }
}
