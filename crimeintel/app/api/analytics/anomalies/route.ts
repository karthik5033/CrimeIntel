import { NextResponse } from 'next/server';
import { ServerDataLoader } from '@/lib/api/serverDataLoader';

async function fetchFromCatalyst(tableName: string) {
  if (tableName === 'FIRs') return ServerDataLoader.getFIRs();
  return [];
}

export async function GET() {
  try {
    const firs = await fetchFromCatalyst('FIRs');

    // Group FIRs by YYYY-MM using their real `date` field
    const monthlyCounts: Record<string, number> = {};

    firs.forEach((fir: any) => {
      if (!fir.date) return;
      // date is in "YYYY-MM-DD" format
      const monthKey = fir.date.substring(0, 7); // "2024-09"
      monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyCounts).sort();

    if (sortedMonths.length === 0) {
      return NextResponse.json([]);
    }

    // Calculate mean and std dev for Z-Score
    const counts = sortedMonths.map(m => monthlyCounts[m]);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    // Build anomaly data
    const anomalyData = sortedMonths.map(date => {
      const incidents = monthlyCounts[date];
      const zScore = stdDev > 0 ? (incidents - mean) / stdDev : 0;
      return {
        date,
        incidents,
        zScore: Math.round(zScore * 100) / 100,
        isAnomaly: Math.abs(zScore) > 1.5, // flag months > 1.5 standard deviations
      };
    });

    return NextResponse.json(anomalyData);
  } catch (error: any) {
    console.error('Error fetching analytics anomalies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
