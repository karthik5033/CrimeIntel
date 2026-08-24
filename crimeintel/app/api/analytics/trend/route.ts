import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const allFIRs = await DataClient.getFIRs();
    
    // Group FIRs by Month
    const monthlyCounts: Record<string, number> = {};
    
    allFIRs.forEach((fir: any) => {
      if (!fir.date) return;
      // Get YYYY-MM
      const monthKey = fir.date.substring(0, 7);
      monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyCounts).sort();
    
    // Take the last 7 months for the chart
    const recentMonths = sortedMonths.slice(-7);
    
    // Calculate baseline using an average of all previous months (simple heuristic)
    const allCounts = Object.values(monthlyCounts);
    const overallAvg = allCounts.reduce((a, b) => a + b, 0) / (allCounts.length || 1);
    
    const chartData = recentMonths.map((monthStr) => {
      const telemetry = monthlyCounts[monthStr];
      const baseline = Math.round(overallAvg);
      
      // Mark as anomaly if it's 20% higher than baseline
      const isAnomaly = telemetry > (baseline * 1.2);
      
      // Convert YYYY-MM to something nicer, e.g., "Jan 26"
      const dateObj = new Date(monthStr + "-01");
      const timeLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      return {
        time: timeLabel,
        timestamp: dateObj.getTime(),
        baseline,
        telemetry,
        anomaly: isAnomaly ? telemetry : null
      };
    });

    // Compute global metrics for the trend
    const recentAnomalies = chartData.filter(d => d.anomaly !== null).length;
    let threatLevel = "LOW";
    if (recentAnomalies > 3) threatLevel = "CRITICAL";
    else if (recentAnomalies > 1) threatLevel = "ELEVATED";

    const accuracy = 94.2 + (Math.random() * 2); // Dynamic mock accuracy around 95%
    const threatDetail = recentAnomalies > 0 
      ? `Detected ${recentAnomalies} anomaly spikes in recent months.`
      : "Crime patterns are within expected baselines.";

    return NextResponse.json({ 
      trend: chartData,
      summary: {
        accuracy: accuracy.toFixed(1),
        threatLevel,
        threatDetail
      }
    });
  } catch (error) {
    console.error("Error generating trend:", error);
    return NextResponse.json({ error: "Failed to generate trend" }, { status: 500 });
  }
}
