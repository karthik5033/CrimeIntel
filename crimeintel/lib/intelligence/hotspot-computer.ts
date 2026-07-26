/**
 * Hotspot Index Computer
 * Phase 0.1 - Computes spatiotemporal crime hotspot grid
 */

import { HotspotIndex, IndexComputationResult } from './types';

export interface CrimeRecord {
  fir_id: string;
  lat: number;
  lng: number;
  district_id: string;
  district_name: string;
  station_id?: string;
  station_name?: string;
  crime_type: string;
  date: Date;
}

export class HotspotComputer {
  private readonly GRID_SIZE_KM = 5; // 5km grid cells
  private readonly LOOKBACK_DAYS = 30;
  private readonly HIGH_RISK_THRESHOLD = 70;
  private readonly MEDIUM_RISK_THRESHOLD = 40;

  /**
   * Compute hotspot index from crime records
   */
  async compute(crimes: CrimeRecord[]): Promise<IndexComputationResult> {
    const startTime = Date.now();
    const snapshot_version = this.generateSnapshotVersion();

    try {
      // Filter to recent crimes
      const recentCrimes = this.filterRecentCrimes(crimes);

      // Group by district and station
      const grouped = this.groupByLocation(recentCrimes);

      // Calculate risk scores
      const hotspots: HotspotIndex[] = [];

      for (const [locationKey, locationCrimes] of grouped) {
        const [district_id, station_id] = locationKey.split('|');
        const sample = locationCrimes[0];

        const hotspot: HotspotIndex = {
          district_id,
          district_name: sample.district_name,
          station_id: station_id !== 'null' ? station_id : undefined,
          station_name: sample.station_name,
          lat: this.calculateCenterLat(locationCrimes),
          lng: this.calculateCenterLng(locationCrimes),
          risk_score: this.calculateRiskScore(locationCrimes),
          crime_density: locationCrimes.length / this.LOOKBACK_DAYS,
          recent_crimes: locationCrimes.length,
          trend: this.calculateTrend(locationCrimes),
          primary_crime_types: this.getPrimaryCrimeTypes(locationCrimes),
          computed_at: new Date(),
        };

        hotspots.push(hotspot);
      }

      return {
        success: true,
        index_type: 'hotspot',
        records_computed: hotspots.length,
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
      };
    } catch (error) {
      return {
        success: false,
        index_type: 'hotspot',
        records_computed: 0,
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private filterRecentCrimes(crimes: CrimeRecord[]): CrimeRecord[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.LOOKBACK_DAYS);

    return crimes.filter((crime) => crime.date >= cutoffDate);
  }

  private groupByLocation(
    crimes: CrimeRecord[]
  ): Map<string, CrimeRecord[]> {
    const grouped = new Map<string, CrimeRecord[]>();

    for (const crime of crimes) {
      const key = `${crime.district_id}|${crime.station_id || 'null'}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(crime);
    }

    return grouped;
  }

  private calculateCenterLat(crimes: CrimeRecord[]): number {
    const sum = crimes.reduce((acc, crime) => acc + crime.lat, 0);
    return sum / crimes.length;
  }

  private calculateCenterLng(crimes: CrimeRecord[]): number {
    const sum = crimes.reduce((acc, crime) => acc + crime.lng, 0);
    return sum / crimes.length;
  }

  private calculateRiskScore(crimes: CrimeRecord[]): number {
    // Risk score based on:
    // 1. Crime frequency (50% weight)
    // 2. Crime severity (30% weight)
    // 3. Recent trend (20% weight)

    const frequency = crimes.length;
    const maxFrequency = 50; // crimes per month
    const frequencyScore = Math.min(frequency / maxFrequency, 1) * 50;

    // Severity based on crime types (simplified - in production, load from config)
    const severityWeights: Record<string, number> = {
      murder: 100,
      kidnapping: 90,
      robbery: 70,
      'vehicle theft': 50,
      burglary: 60,
      assault: 65,
      'chain snatching': 55,
      cybercrime: 40,
    };

    const avgSeverity =
      crimes.reduce((acc, crime) => {
        const severity = severityWeights[crime.crime_type.toLowerCase()] || 50;
        return acc + severity;
      }, 0) / crimes.length;

    const severityScore = (avgSeverity / 100) * 30;

    // Trend: compare first half vs second half
    const midpoint = Math.floor(crimes.length / 2);
    const sortedCrimes = [...crimes].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    const firstHalf = sortedCrimes.slice(0, midpoint).length;
    const secondHalf = sortedCrimes.slice(midpoint).length;
    const trendScore =
      secondHalf > firstHalf ? 20 : secondHalf < firstHalf ? 10 : 15;

    return Math.min(Math.round(frequencyScore + severityScore + trendScore), 100);
  }

  private calculateTrend(
    crimes: CrimeRecord[]
  ): 'increasing' | 'stable' | 'decreasing' {
    if (crimes.length < 4) return 'stable';

    const sortedCrimes = [...crimes].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    const midpoint = Math.floor(crimes.length / 2);
    const firstHalf = sortedCrimes.slice(0, midpoint).length;
    const secondHalf = sortedCrimes.slice(midpoint).length;

    const ratio = secondHalf / firstHalf;
    if (ratio > 1.2) return 'increasing';
    if (ratio < 0.8) return 'decreasing';
    return 'stable';
  }

  private getPrimaryCrimeTypes(crimes: CrimeRecord[]): string[] {
    const typeCounts = new Map<string, number>();

    for (const crime of crimes) {
      const count = typeCounts.get(crime.crime_type) || 0;
      typeCounts.set(crime.crime_type, count + 1);
    }

    // Sort by count, take top 3
    return Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  }

  private generateSnapshotVersion(): string {
    return `v${Date.now()}`;
  }
}
