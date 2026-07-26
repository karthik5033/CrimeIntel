/**
 * Phase 7: Analytics Dashboard & Geospatial Intelligence - Type Definitions
 */

/**
 * Time granularity for trend analysis
 */
export type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * Chart data point
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * Crime trend data
 */
export interface CrimeTrendData {
  timeGranularity: TimeGranularity;
  series: Array<{
    name: string; // "Total Crimes", "Vehicle Theft", etc.
    data: ChartDataPoint[];
    color?: string;
  }>;
  anomalies?: Array<{
    date: Date;
    value: number;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Crime type distribution
 */
export interface CrimeDistribution {
  crimeType: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable'; // Compared to previous period
  trendPercentage: number;
}

/**
 * District statistics
 */
export interface DistrictStats {
  district: string;
  totalCrimes: number;
  crimeRate: number; // Per 100k population
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  population: number;
  topCrimeTypes: string[];
  trend: 'improving' | 'worsening' | 'stable';
  stationCount: number;
}

/**
 * Geospatial coordinates
 */
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Crime hotspot
 */
export interface CrimeHotspot {
  id: string;
  center: GeoCoordinates;
  radius: number; // meters
  crimeCount: number;
  intensity: number; // 0-1
  dominantCrimeType: string;
  district: string;
  status: 'emerging' | 'active' | 'declining';
}

/**
 * Map marker for FIR
 */
export interface FIRMarker {
  id: string;
  firNumber: string;
  crimeType: string;
  location: GeoCoordinates;
  date: Date;
  status: string;
  accusedName?: string;
  description: string;
}

/**
 * District polygon for map
 */
export interface DistrictPolygon {
  district: string;
  coordinates: GeoCoordinates[]; // Polygon boundary points
  riskScore: number; // 0-100
  crimeCount: number;
  fillColor: string;
}

/**
 * Police station marker
 */
export interface PoliceStationMarker {
  id: string;
  name: string;
  location: GeoCoordinates;
  district: string;
  jurisdiction: GeoCoordinates[]; // Boundary polygon
  crimeCount: number;
  status: 'operational' | 'undermanned' | 'closed';
}

/**
 * Time-of-day heatmap data
 */
export interface TimeOfDayHeatmap {
  matrix: number[][]; // 7 days x 24 hours
  dayLabels: string[];
  hourLabels: string[];
  maxValue: number;
}

/**
 * Seasonal pattern data
 */
export interface SeasonalPattern {
  month: string;
  currentYear: number;
  previousYear: number;
  percentageChange: number;
  festivals?: string[];
}

/**
 * Offender recidivism funnel
 */
export interface RecidivismFunnel {
  stages: Array<{
    stage: string; // "First Offense", "Second Offense", etc.
    count: number;
    percentage: number; // Of total
    offenderIds: string[];
  }>;
}

/**
 * Case resolution metrics
 */
export interface CaseResolutionMetrics {
  crimeType: string;
  averageDays: number;
  median: number;
  trend: 'improving' | 'worsening' | 'stable';
  trendPercentage: number;
}

/**
 * Dashboard KPI card
 */
export interface DashboardKPI {
  id: string;
  title: string;
  value: number;
  unit?: string; // "FIRs", "Days", "%", etc.
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  sparklineData?: number[]; // Last 30 days
  icon?: string;
  colorScheme: 'primary' | 'success' | 'warning' | 'danger';
}

/**
 * Dashboard filters
 */
export interface DashboardFilters {
  districts: string[];
  stations: string[];
  crimeTypes: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  status: string[];
}

/**
 * Real-time statistics update
 */
export interface RealtimeStatUpdate {
  id: string;
  type: 'new_fir' | 'status_change' | 'alert' | 'milestone';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  relatedEntities?: {
    type: 'fir' | 'case' | 'person' | 'district';
    id: string;
    name: string;
  }[];
}

/**
 * Map layer configuration
 */
export interface MapLayerConfig {
  heatmap: boolean;
  markers: boolean;
  districtBoundaries: boolean;
  policeStations: boolean;
  hotspots: boolean;
}

/**
 * Map time slider state
 */
export interface MapTimeSlider {
  currentDate: Date;
  minDate: Date;
  maxDate: Date;
  isPlaying: boolean;
  playbackSpeed: 1 | 2 | 5 | 10; // Days per second
}

/**
 * Analytics query parameters
 */
export interface AnalyticsQuery {
  filters: Partial<DashboardFilters>;
  timeGranularity?: TimeGranularity;
  metric?: 'count' | 'rate' | 'average' | 'median';
  groupBy?: 'district' | 'crimeType' | 'station' | 'time';
}

/**
 * Analytics aggregation result
 */
export interface AnalyticsAggregation {
  query: AnalyticsQuery;
  results: Array<{
    group: string;
    value: number;
    metadata?: Record<string, any>;
  }>;
  totalCount: number;
  executionTime: number; // milliseconds
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  layout: 'grid' | 'list' | 'custom';
  refreshInterval: number; // milliseconds
  defaultFilters: Partial<DashboardFilters>;
  enabledCharts: string[];
  mapDefaultZoom: number;
  mapDefaultCenter: GeoCoordinates;
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  layout: 'grid',
  refreshInterval: 30000, // 30 seconds
  defaultFilters: {
    districts: [],
    crimeTypes: [],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date(),
    },
  },
  enabledCharts: [
    'crime-trend',
    'crime-distribution',
    'district-comparison',
    'time-of-day',
    'seasonal-pattern',
    'recidivism-funnel',
    'resolution-timeline',
  ],
  mapDefaultZoom: 7,
  mapDefaultCenter: {
    latitude: 15.3173, // Karnataka center
    longitude: 75.7139,
  },
};

/**
 * Chart interaction event
 */
export interface ChartInteractionEvent {
  chartType: string;
  action: 'click' | 'hover' | 'select';
  data: {
    label: string;
    value: number;
    filters?: Partial<DashboardFilters>;
  };
}
