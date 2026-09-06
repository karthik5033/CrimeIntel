/**
 * Phase 7: Analytics Dashboard - Core Analytics Engine
 * 
 * Provides aggregation, trend analysis, and KPI computation for dashboard.
 * Uses precomputed intelligence indices from Phase 0.1 where available.
 */

import type {
  AnalyticsQuery,
  AnalyticsAggregation,
  CrimeTrendData,
  CrimeDistribution,
  DistrictStats,
  TimeOfDayHeatmap,
  SeasonalPattern,
  RecidivismFunnel,
  CaseResolutionMetrics,
  DashboardKPI,
  TimeGranularity,
  ChartDataPoint,
} from './types';

/**
 * Main Analytics Engine
 */
export class AnalyticsEngine {
  /**
   * Execute analytics query with filters and aggregations
   */
  async query(query: AnalyticsQuery): Promise<AnalyticsAggregation> {
    const startTime = Date.now();

    // Simulate data aggregation from Catalyst DataStore
    const results = await this.executeAggregation(query);

    return {
      query,
      results,
      totalCount: results.reduce((sum, r) => sum + r.value, 0),
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Get crime trend data over time
   */
  async getCrimeTrend(
    filters: AnalyticsQuery['filters'],
    granularity: TimeGranularity = 'monthly'
  ): Promise<CrimeTrendData> {
    const { dateRange, districts, crimeTypes } = filters;

    // Generate time series based on granularity
    const timePoints = this.generateTimePoints(
      dateRange?.start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      dateRange?.end || new Date(),
      granularity
    );

    // Mock data - in production, query from precomputed indices
    const series: CrimeTrendData['series'] = [
      {
        name: 'Total Crimes',
        data: timePoints.map((date, idx) => ({
          label: this.formatTimeLabel(date, granularity),
          value: Math.floor(100 + Math.random() * 50 + idx * 2),
          timestamp: date,
        })),
        color: '#3b82f6',
      },
    ];

    // Add series for top crime types if not filtered
    if (!crimeTypes || crimeTypes.length === 0) {
      const topTypes = ['Vehicle Theft', 'Assault', 'Robbery', 'Burglary', 'Fraud'];
      topTypes.forEach((type, i) => {
        series.push({
          name: type,
          data: timePoints.map((date, idx) => ({
            label: this.formatTimeLabel(date, granularity),
            value: Math.floor(20 + Math.random() * 30 + idx * 0.5),
            timestamp: date,
          })),
          color: this.getTypeColor(i),
        });
      });
    }

    // Detect anomalies (simple spike detection)
    const anomalies = this.detectAnomalies(series[0].data);

    return {
      timeGranularity: granularity,
      series,
      anomalies,
    };
  }

  /**
   * Get crime type distribution
   */
  async getCrimeDistribution(
    filters: AnalyticsQuery['filters']
  ): Promise<CrimeDistribution[]> {
    // Mock data - in production, aggregate from DataStore
    const crimeTypes = [
      { type: 'Vehicle Theft', count: 450, prevCount: 420 },
      { type: 'Assault', count: 380, prevCount: 390 },
      { type: 'Robbery', count: 290, prevCount: 250 },
      { type: 'Burglary', count: 220, prevCount: 230 },
      { type: 'Fraud', count: 180, prevCount: 160 },
      { type: 'Kidnapping', count: 95, prevCount: 100 },
      { type: 'Murder', count: 45, prevCount: 48 },
      { type: 'Other', count: 340, prevCount: 320 },
    ];

    const total = crimeTypes.reduce((sum, ct) => sum + ct.count, 0);

    return crimeTypes.map((ct) => {
      const trendPercentage = ((ct.count - ct.prevCount) / ct.prevCount) * 100;
      return {
        crimeType: ct.type,
        count: ct.count,
        percentage: (ct.count / total) * 100,
        trend: trendPercentage > 2 ? 'up' : trendPercentage < -2 ? 'down' : 'stable',
        trendPercentage: Math.abs(trendPercentage),
      };
    });
  }

  /**
   * Get district comparison statistics
   */
  async getDistrictStats(
    filters: AnalyticsQuery['filters']
  ): Promise<DistrictStats[]> {
    // Mock data - in production, join FIR data with precomputed hotspot indices
    const districts = [
      { name: 'Bengaluru Urban', population: 12800000, crimes: 2450 },
      { name: 'Mysuru', population: 3000000, crimes: 580 },
      { name: 'Mangaluru', population: 650000, crimes: 320 },
      { name: 'Hubballi-Dharwad', population: 1150000, crimes: 420 },
      { name: 'Belagavi', population: 500000, crimes: 210 },
      { name: 'Kalaburagi', population: 550000, crimes: 190 },
      { name: 'Tumakuru', population: 300000, crimes: 110 },
      { name: 'Shivamogga', population: 400000, crimes: 145 },
    ];

    return districts.map((d) => {
      const crimeRate = (d.crimes / d.population) * 100000;
      return {
        district: d.name,
        totalCrimes: d.crimes,
        crimeRate,
        riskLevel: this.getRiskLevel(crimeRate),
        population: d.population,
        topCrimeTypes: ['Vehicle Theft', 'Assault', 'Robbery'],
        trend: Math.random() > 0.5 ? 'improving' : 'worsening',
        stationCount: Math.floor(d.population / 50000),
      };
    }).sort((a, b) => b.crimeRate - a.crimeRate);
  }

  /**
   * Get time-of-day crime heatmap
   */
  async getTimeOfDayHeatmap(
    filters: AnalyticsQuery['filters']
  ): Promise<TimeOfDayHeatmap> {
    // Generate 7x24 matrix
    const matrix: number[][] = [];
    let maxValue = 0;

    for (let day = 0; day < 7; day++) {
      const row: number[] = [];
      for (let hour = 0; hour < 24; hour++) {
        // Simulate patterns: higher crime 8PM-2AM, especially Fri/Sat
        let value = Math.floor(Math.random() * 10);
        if (hour >= 20 || hour <= 2) {
          value += Math.floor(Math.random() * 20);
        }
        if (day === 5 || day === 6) {
          // Friday/Saturday
          value += Math.floor(Math.random() * 15);
        }
        row.push(value);
        maxValue = Math.max(maxValue, value);
      }
      matrix.push(row);
    }

    return {
      matrix,
      dayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      hourLabels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      maxValue,
    };
  }

  /**
   * Get seasonal crime patterns
   */
  async getSeasonalPattern(
    filters: AnalyticsQuery['filters']
  ): Promise<SeasonalPattern[]> {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const festivals = {
      'Jan': ['Makar Sankranti', 'Republic Day'],
      'Mar': ['Ugadi'],
      'Aug': ['Independence Day'],
      'Oct': ['Dasara', 'Diwali'],
    };

    return months.map((month) => {
      const currentYear = Math.floor(80 + Math.random() * 40);
      const previousYear = Math.floor(75 + Math.random() * 35);
      return {
        month,
        currentYear,
        previousYear,
        percentageChange: ((currentYear - previousYear) / previousYear) * 100,
        festivals: festivals[month as keyof typeof festivals],
      };
    });
  }

  /**
   * Get recidivism funnel data
   */
  async getRecidivismFunnel(
    filters: AnalyticsQuery['filters']
  ): Promise<RecidivismFunnel> {
    // Mock data - in production, aggregate from person-FIR links
    const stages = [
      { stage: 'First Offense', count: 1200, ids: [] as string[] },
      { stage: 'Second Offense', count: 450, ids: [] as string[] },
      { stage: 'Third Offense', count: 180, ids: [] as string[] },
      { stage: '4+ Offenses', count: 95, ids: [] as string[] },
    ];

    const total = stages[0].count;

    return {
      stages: stages.map((s) => ({
        ...s,
        percentage: (s.count / total) * 100,
        offenderIds: Array.from({ length: s.count }, (_, i) => `PERSON-${i + 1}`),
      })),
    };
  }

  /**
   * Get case resolution metrics by crime type
   */
  async getCaseResolutionMetrics(
    filters: AnalyticsQuery['filters']
  ): Promise<CaseResolutionMetrics[]> {
    const crimeTypes = [
      { type: 'Murder', days: 45, prevDays: 52 },
      { type: 'Kidnapping', days: 38, prevDays: 42 },
      { type: 'Robbery', days: 62, prevDays: 58 },
      { type: 'Vehicle Theft', days: 85, prevDays: 90 },
      { type: 'Assault', days: 55, prevDays: 60 },
      { type: 'Fraud', days: 120, prevDays: 115 },
      { type: 'Burglary', days: 72, prevDays: 75 },
    ];

    return crimeTypes.map((ct) => {
      const trendPercentage = ((ct.days - ct.prevDays) / ct.prevDays) * 100;
      return {
        crimeType: ct.type,
        averageDays: ct.days,
        median: Math.floor(ct.days * 0.85), // Estimate median
        trend: trendPercentage < -2 ? 'improving' : trendPercentage > 2 ? 'worsening' : 'stable',
        trendPercentage: Math.abs(trendPercentage),
      };
    }).sort((a, b) => a.averageDays - b.averageDays);
  }

  /**
   * Get dashboard KPI cards
   */
  async getDashboardKPIs(
    filters: AnalyticsQuery['filters']
  ): Promise<DashboardKPI[]> {
    return [
      {
        id: 'total-firs',
        title: 'Total FIRs',
        value: 2458,
        trend: 'up',
        trendPercentage: 8.5,
        sparklineData: this.generateSparkline(30, 70, 90),
        icon: 'file-text',
        colorScheme: 'primary',
      },
      {
        id: 'active-cases',
        title: 'Active Cases',
        value: 842,
        trend: 'down',
        trendPercentage: 3.2,
        sparklineData: this.generateSparkline(30, 80, 70),
        icon: 'briefcase',
        colorScheme: 'warning',
      },
      {
        id: 'arrest-rate',
        title: 'Arrest Rate',
        value: 68,
        unit: '%',
        trend: 'up',
        trendPercentage: 5.1,
        sparklineData: this.generateSparkline(30, 60, 68),
        icon: 'user-check',
        colorScheme: 'success',
      },
      {
        id: 'avg-resolution',
        title: 'Avg Resolution Time',
        value: 72,
        unit: 'Days',
        trend: 'down',
        trendPercentage: 12.3,
        sparklineData: this.generateSparkline(30, 82, 72),
        icon: 'clock',
        colorScheme: 'success',
      },
      {
        id: 'pending-investigations',
        title: 'Pending Investigations',
        value: 324,
        trend: 'stable',
        trendPercentage: 0.8,
        sparklineData: this.generateSparkline(30, 320, 324),
        icon: 'search',
        colorScheme: 'warning',
      },
      {
        id: 'chargesheeted',
        title: 'Chargesheeted',
        value: 156,
        trend: 'up',
        trendPercentage: 15.2,
        sparklineData: this.generateSparkline(30, 120, 156),
        icon: 'file-check',
        colorScheme: 'success',
      },
    ];
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Execute aggregation query (mock - in production, query Catalyst DataStore)
   */
  private async executeAggregation(query: AnalyticsQuery): Promise<Array<{
    group: string;
    value: number;
    metadata?: Record<string, any>;
  }>> {
    const { groupBy = 'district', metric = 'count' } = query;

    // Simulate aggregation results
    const groups = groupBy === 'district' 
      ? ['Bengaluru Urban', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad']
      : ['Vehicle Theft', 'Assault', 'Robbery', 'Burglary'];

    return groups.map((group) => ({
      group,
      value: Math.floor(50 + Math.random() * 100),
      metadata: { query: groupBy },
    }));
  }

  /**
   * Generate time points for trend analysis
   */
  private generateTimePoints(
    start: Date,
    end: Date,
    granularity: TimeGranularity
  ): Date[] {
    const points: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      points.push(new Date(current));

      switch (granularity) {
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'quarterly':
          current.setMonth(current.getMonth() + 3);
          break;
        case 'yearly':
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }

    return points;
  }

  /**
   * Format time label based on granularity
   */
  private formatTimeLabel(date: Date, granularity: TimeGranularity): string {
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();

    switch (granularity) {
      case 'daily':
        return `${month} ${date.getDate()}`;
      case 'weekly':
        return `Week ${Math.ceil(date.getDate() / 7)}, ${month}`;
      case 'monthly':
        return `${month} ${year}`;
      case 'quarterly':
        return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${year}`;
      case 'yearly':
        return `${year}`;
    }
  }

  /**
   * Detect anomalies in time series (simple spike detection)
   */
  private detectAnomalies(data: ChartDataPoint[]): CrimeTrendData['anomalies'] {
    const anomalies: CrimeTrendData['anomalies'] = [];

    if (data.length < 3) return anomalies;

    // Calculate moving average
    const windowSize = 3;
    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i);
      const avg = window.reduce((sum, p) => sum + p.value, 0) / windowSize;
      const stdDev = Math.sqrt(
        window.reduce((sum, p) => sum + Math.pow(p.value - avg, 2), 0) / windowSize
      );

      const current = data[i].value;
      if (current > avg + 2 * stdDev) {
        anomalies.push({
          date: data[i].timestamp!,
          value: current,
          description: `Spike detected: ${Math.round(((current - avg) / avg) * 100)}% above trend`,
          severity: current > avg + 3 * stdDev ? 'high' : 'medium',
        });
      }
    }

    return anomalies;
  }

  /**
   * Get color for crime type series
   */
  private getTypeColor(index: number): string {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'];
    return colors[index % colors.length];
  }

  /**
   * Determine risk level from crime rate
   */
  private getRiskLevel(crimeRate: number): DistrictStats['riskLevel'] {
    if (crimeRate > 250) return 'critical';
    if (crimeRate > 150) return 'high';
    if (crimeRate > 75) return 'medium';
    return 'low';
  }

  /**
   * Generate sparkline data for KPI cards
   */
  private generateSparkline(days: number, startValue: number, endValue: number): number[] {
    const data: number[] = [];
    const diff = endValue - startValue;
    const step = diff / days;

    for (let i = 0; i < days; i++) {
      const noise = Math.random() * 5 - 2.5; // Random noise ±2.5
      data.push(Math.round(startValue + step * i + noise));
    }

    return data;
  }
}

/**
 * Singleton instance
 */
export const analyticsEngine = new AnalyticsEngine();
