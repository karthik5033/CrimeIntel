import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const allFIRs = await DataClient.getFIRs();
    
    // Find the max date in the dataset to act as "today"
    const maxDateStr = allFIRs.reduce((max: string, fir: any) => {
      return (fir.date && fir.date > max) ? fir.date : max;
    }, "2000-01-01");
    
    // We will generate a continuous 30-day timeline up to the max date
    const maxDate = new Date(maxDateStr);
    const DAYS_TO_SHOW = 30;
    const ROLLING_WINDOW = 14;
    const BASELINE_WINDOW = 90;

    // Pre-compute daily counts for O(1) lookup
    const dailyCounts: Record<string, number> = {};
    allFIRs.forEach((fir: any) => {
      if (fir.date) {
        dailyCounts[fir.date] = (dailyCounts[fir.date] || 0) + 1;
      }
    });

    const chartData = [];
    let recentAnomalies = 0;

    for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
      const targetDate = new Date(maxDate);
      targetDate.setDate(targetDate.getDate() - i);
      const targetTime = targetDate.getTime();
      const dateStr = targetDate.toISOString().split('T')[0];
      
      // Actual daily count
      const dailyCount = dailyCounts[dateStr] || 0;
      
      // Calculate a long-term baseline moving average (e.g., 30-day average)
      let baselineSum = 0;
      for (let j = 0; j < BASELINE_WINDOW; j++) {
        const d = new Date(targetDate);
        d.setDate(d.getDate() - j);
        const dStr = d.toISOString().split('T')[0];
        baselineSum += (dailyCounts[dStr] || 0);
      }
      
      const baseline = Math.round(baselineSum / BASELINE_WINDOW);
      
      // Identify significant spikes (e.g. above baseline by some margin)
      const isAnomaly = dailyCount > (baseline * 1.5) && dailyCount >= 3;
      if (isAnomaly) {
        recentAnomalies++;
      }
      
      chartData.push({
        time: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: targetTime,
        baseline,
        telemetry: dailyCount,
        anomaly: isAnomaly ? dailyCount : null
      });
    }

    // Compute global metrics for the trend
    let threatLevel = "LOW";
    if (recentAnomalies > 5) threatLevel = "CRITICAL";
    else if (recentAnomalies > 2) threatLevel = "ELEVATED";

    const accuracy = 94.2 + (Math.random() * 2); // Dynamic mock accuracy around 95%
    const threatDetail = recentAnomalies > 0 
      ? `Detected ${recentAnomalies} anomaly spikes in recent days.`
      : "Active case volumes are within expected baselines.";

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
