import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const allFIRs = await DataClient.getFIRs();
    
    // Simple anomaly detection: sudden spike in a specific crime type
    const crimeCounts = new Map();
    const recentCrimeCounts = new Map(); // last 30 days
    
    const now = new Date();
    
    allFIRs.forEach((fir: any) => {
      const type = fir.crime_type_en || fir.crime_type || "Unknown";
      
      if (!crimeCounts.has(type)) crimeCounts.set(type, 0);
      crimeCounts.set(type, crimeCounts.get(type) + 1);
      
      if (fir.date) {
        const daysAgo = (now.getTime() - new Date(fir.date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysAgo <= 30) {
          if (!recentCrimeCounts.has(type)) recentCrimeCounts.set(type, 0);
          recentCrimeCounts.set(type, recentCrimeCounts.get(type) + 1);
        }
      }
    });

    const anomalies = [];
    
    for (const [type, total] of crimeCounts.entries()) {
      const recent = recentCrimeCounts.get(type) || 0;
      // If a significant portion of all-time crimes of this type happened recently
      if (total >= 3 && recent >= total * 0.2) {
        anomalies.push({
          id: `ANOMALY-${type.replace(/\s+/g, '-').toUpperCase()}`,
          title: `Spike in ${type}`,
          severity: recent >= total * 0.5 ? "critical" : "warning",
          description: `Unusual concentration of ${type} cases detected recently in the database.`,
          metrics: {
            total_cases: total,
            recent_cases: recent,
            percentage_increase: Math.round((recent / Math.max(total - recent, 1)) * 100) + "%"
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Connect to Catalyst Transactions to detect financial anomalies dynamically
    try {
      const allTransactions = await DataClient.getTransactions();
      const flaggedTx = allTransactions.filter((tx: any) => tx.flagged);
      if (flaggedTx.length > 10) {
        const recentFlagged = flaggedTx.filter((tx: any) => {
          if (!tx.timestamp) return false;
          const daysAgo = (now.getTime() - new Date(tx.timestamp).getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo <= 30;
        });

        if (recentFlagged.length > 0) {
          anomalies.push({
            id: "ANOMALY-FINANCIAL-FRAUD",
            title: "Suspicious Financial Network Activity",
            severity: recentFlagged.length > 20 ? "critical" : "warning",
            description: "High volume of flagged transactions detected, suggesting potential money laundering or structured transfers.",
            metrics: {
              total_cases: flaggedTx.length,
              recent_cases: recentFlagged.length,
              percentage_increase: Math.round((recentFlagged.length / Math.max(flaggedTx.length - recentFlagged.length, 1)) * 100) + "%"
            },
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn("Could not fetch transactions for anomaly detection", e);
    }

    return NextResponse.json({ anomalies });
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    return NextResponse.json({ error: "Failed to detect anomalies" }, { status: 500 });
  }
}
