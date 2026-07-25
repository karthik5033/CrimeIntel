import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";
import { computeDistrictRiskScore } from "@/lib/analytics/riskScoring";

export async function GET(request: Request) {
  try {
    const allFIRs = await DataClient.getFIRs();
    
    // Group FIRs by district
    const districtFirs = new Map();
    allFIRs.forEach((fir: any) => {
      const dId = fir.district_name_en || fir.district_id || "Unknown";
      if (!districtFirs.has(dId)) districtFirs.set(dId, []);
      districtFirs.get(dId).push(fir);
    });

    const predictions = [];

    for (const [district, firs] of districtFirs.entries()) {
      const score = computeDistrictRiskScore(firs);
      
      let trend = "stable";
      let reasoning = `Routine crime levels.`;
      
      if (score >= 80) {
        trend = "escalating";
        reasoning = `High volume of recent FIRs suggests localized hotspot formation.`;
      } else if (score >= 50) {
        trend = "monitor";
        reasoning = `Elevated activity requires monitoring.`;
      }

      predictions.push({
        district,
        risk_score: score,
        trend,
        reasoning,
        total_firs: firs.length,
        recent_firs: firs.filter((f: any) => {
          if (!f.date) return false;
          const daysAgo = (new Date().getTime() - new Date(f.date).getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo <= 7;
        }).length
      });
    }

    // Sort by highest risk
    predictions.sort((a, b) => b.risk_score - a.risk_score);

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error("Error computing hotspot predictions:", error);
    return NextResponse.json({ error: "Failed to compute predictions" }, { status: 500 });
  }
}
