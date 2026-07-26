/**
 * Phase 7: Geospatial Intelligence Module
 * 
 * Provides crime heatmap generation, hotspot clustering (DBSCAN-style),
 * district polygons, FIR markers, and time-based animation data.
 */

import type {
  GeoCoordinates,
  CrimeHotspot,
  FIRMarker,
  DistrictPolygon,
  PoliceStationMarker,
  MapLayerConfig,
  MapTimeSlider,
  AnalyticsQuery,
} from './types';

/**
 * Geospatial analyzer for crime mapping
 */
export class GeospatialAnalyzer {
  // Karnataka district boundaries (simplified - in production, use GeoJSON files)
  private readonly DISTRICT_BOUNDARIES: Record<string, GeoCoordinates[]> = {
    'Bengaluru Urban': [
      { latitude: 13.1, longitude: 77.5 },
      { latitude: 13.1, longitude: 77.8 },
      { latitude: 12.8, longitude: 77.8 },
      { latitude: 12.8, longitude: 77.5 },
    ],
    'Mysuru': [
      { latitude: 12.4, longitude: 76.5 },
      { latitude: 12.4, longitude: 76.8 },
      { latitude: 12.1, longitude: 76.8 },
      { latitude: 12.1, longitude: 76.5 },
    ],
    'Mangaluru': [
      { latitude: 13.0, longitude: 74.7 },
      { latitude: 13.0, longitude: 75.0 },
      { latitude: 12.7, longitude: 75.0 },
      { latitude: 12.7, longitude: 74.7 },
    ],
    'Hubballi-Dharwad': [
      { latitude: 15.5, longitude: 74.9 },
      { latitude: 15.5, longitude: 75.2 },
      { latitude: 15.2, longitude: 75.2 },
      { latitude: 15.2, longitude: 74.9 },
    ],
  };

  /**
   * Get crime heatmap data for map visualization
   */
  async getCrimeHeatmap(
    filters: AnalyticsQuery['filters']
  ): Promise<Array<{ location: GeoCoordinates; intensity: number }>> {
    // In production, query FIR locations from DataStore with filters
    // For now, generate mock hotspot data

    const points: Array<{ location: GeoCoordinates; intensity: number }> = [];

    // Bengaluru hotspots
    points.push(
      { location: { latitude: 12.9716, longitude: 77.5946 }, intensity: 0.9 }, // MG Road
      { location: { latitude: 12.9698, longitude: 77.7500 }, intensity: 0.85 }, // Whitefield
      { location: { latitude: 13.0358, longitude: 77.5970 }, intensity: 0.75 }, // Yelahanka
      { location: { latitude: 12.9141, longitude: 77.6411 }, intensity: 0.7 }, // Koramangala
    );

    // Mysuru hotspots
    points.push(
      { location: { latitude: 12.2958, longitude: 76.6394 }, intensity: 0.6 }, // Mysuru Center
      { location: { latitude: 12.3051, longitude: 76.6553 }, intensity: 0.5 },
    );

    // Mangaluru hotspots
    points.push(
      { location: { latitude: 12.9141, longitude: 74.8560 }, intensity: 0.65 },
      { location: { latitude: 12.8699, longitude: 74.8425 }, intensity: 0.55 },
    );

    return points;
  }

  /**
   * Detect crime hotspots using DBSCAN-style clustering
   */
  async detectHotspots(
    firLocations: GeoCoordinates[],
    radiusKm: number = 2,
    minPoints: number = 5
  ): Promise<CrimeHotspot[]> {
    const clusters: CrimeHotspot[] = [];
    const visited = new Set<number>();
    const clustered = new Set<number>();

    for (let i = 0; i < firLocations.length; i++) {
      if (visited.has(i)) continue;
      visited.add(i);

      // Find neighbors within radius
      const neighbors = this.findNeighbors(firLocations, i, radiusKm);

      if (neighbors.length >= minPoints) {
        // Create cluster
        const cluster = this.expandCluster(
          firLocations,
          i,
          neighbors,
          radiusKm,
          minPoints,
          visited,
          clustered
        );

        if (cluster.length >= minPoints) {
          const center = this.calculateCentroid(cluster.map(idx => firLocations[idx]));
          clusters.push({
            id: `hotspot-${clusters.length + 1}`,
            center,
            radius: radiusKm * 1000, // Convert to meters
            crimeCount: cluster.length,
            intensity: Math.min(cluster.length / 50, 1), // Normalize to 0-1
            dominantCrimeType: 'Vehicle Theft', // In production, aggregate crime types
            district: this.getDistrictForCoordinate(center),
            status: this.determineHotspotStatus(cluster.length),
          });
        }
      }
    }

    return clusters.sort((a, b) => b.intensity - a.intensity);
  }

  /**
   * Get FIR markers for map with clustering info
   */
  async getFIRMarkers(
    filters: AnalyticsQuery['filters'],
    zoomLevel: number
  ): Promise<FIRMarker[]> {
    // Mock FIR locations - in production, query from DataStore
    const markers: FIRMarker[] = [];

    // Sample FIRs in Bengaluru
    const bengaluruFIRs = [
      {
        id: 'FIR-001',
        firNumber: '2024/001/0015',
        crimeType: 'Vehicle Theft',
        location: { latitude: 12.9716, longitude: 77.5946 },
        date: new Date('2024-01-15'),
        status: 'Under Investigation',
        accusedName: 'Unknown',
        description: 'Motorcycle stolen from parking lot',
      },
      {
        id: 'FIR-002',
        firNumber: '2024/002/0023',
        crimeType: 'Assault',
        location: { latitude: 12.9698, longitude: 77.7500 },
        date: new Date('2024-01-18'),
        status: 'Chargesheeted',
        accusedName: 'Rajesh Kumar',
        description: 'Physical altercation at market',
      },
      {
        id: 'FIR-003',
        firNumber: '2024/003/0042',
        crimeType: 'Robbery',
        location: { latitude: 13.0358, longitude: 77.5970 },
        date: new Date('2024-02-05'),
        status: 'Under Investigation',
        accusedName: 'Gang of 3',
        description: 'Chain snatching near bus stop',
      },
    ];

    markers.push(...bengaluruFIRs);

    // Add more for other districts if not filtered
    if (!filters.districts || filters.districts.includes('Mysuru')) {
      markers.push({
        id: 'FIR-004',
        firNumber: '2024/004/0031',
        crimeType: 'Burglary',
        location: { latitude: 12.2958, longitude: 76.6394 },
        date: new Date('2024-02-12'),
        status: 'Resolved',
        accusedName: 'Prakash M',
        description: 'House break-in during night',
      });
    }

    return markers;
  }

  /**
   * Get district polygons with crime statistics
   */
  async getDistrictPolygons(
    filters: AnalyticsQuery['filters']
  ): Promise<DistrictPolygon[]> {
    const polygons: DistrictPolygon[] = [];

    for (const [district, coords] of Object.entries(this.DISTRICT_BOUNDARIES)) {
      // Skip if filtered out
      if (filters.districts && !filters.districts.includes(district)) {
        continue;
      }

      // Mock crime counts - in production, aggregate from DataStore
      const crimeCount = Math.floor(Math.random() * 500) + 100;
      const riskScore = Math.min((crimeCount / 10), 100);

      polygons.push({
        district,
        coordinates: coords,
        riskScore,
        crimeCount,
        fillColor: this.getRiskColor(riskScore),
      });
    }

    return polygons;
  }

  /**
   * Get police station markers with jurisdiction
   */
  async getPoliceStations(
    filters: AnalyticsQuery['filters']
  ): Promise<PoliceStationMarker[]> {
    // Mock police stations - in production, load from master data
    const stations: PoliceStationMarker[] = [
      {
        id: 'PS-001',
        name: 'Cubbon Park Police Station',
        location: { latitude: 12.9762, longitude: 77.5929 },
        district: 'Bengaluru Urban',
        jurisdiction: this.generateJurisdictionBoundary({ latitude: 12.9762, longitude: 77.5929 }),
        crimeCount: 145,
        status: 'operational',
      },
      {
        id: 'PS-002',
        name: 'Whitefield Police Station',
        location: { latitude: 12.9698, longitude: 77.7500 },
        district: 'Bengaluru Urban',
        jurisdiction: this.generateJurisdictionBoundary({ latitude: 12.9698, longitude: 77.7500 }),
        crimeCount: 198,
        status: 'operational',
      },
      {
        id: 'PS-003',
        name: 'Devaraja Police Station',
        location: { latitude: 12.3051, longitude: 76.6553 },
        district: 'Mysuru',
        jurisdiction: this.generateJurisdictionBoundary({ latitude: 12.3051, longitude: 76.6553 }),
        crimeCount: 82,
        status: 'operational',
      },
    ];

    // Filter by district
    return stations.filter(
      (s) => !filters.districts || filters.districts.includes(s.district)
    );
  }

  /**
   * Get time-slider data for animated heatmap
   */
  async getTimeSliderData(
    filters: AnalyticsQuery['filters'],
    granularity: 'day' | 'week' | 'month' = 'month'
  ): Promise<Array<{ date: Date; heatmapData: Array<{ location: GeoCoordinates; intensity: number }> }>> {
    const data: Array<{ date: Date; heatmapData: Array<{ location: GeoCoordinates; intensity: number }> }> = [];

    // Generate data for last 12 months
    const endDate = filters.dateRange?.end || new Date();
    const startDate = filters.dateRange?.start || new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // For each time point, generate heatmap snapshot
      const heatmapData = await this.getCrimeHeatmapAtDate(currentDate, filters);
      data.push({
        date: new Date(currentDate),
        heatmapData,
      });

      // Advance time
      if (granularity === 'day') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (granularity === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    return data;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(coord1: GeoCoordinates, coord2: GeoCoordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Find neighbors within radius
   */
  private findNeighbors(
    points: GeoCoordinates[],
    index: number,
    radiusKm: number
  ): number[] {
    const neighbors: number[] = [];
    const center = points[index];

    for (let i = 0; i < points.length; i++) {
      if (i === index) continue;
      const distance = this.calculateDistance(center, points[i]);
      if (distance <= radiusKm) {
        neighbors.push(i);
      }
    }

    return neighbors;
  }

  /**
   * Expand cluster (DBSCAN)
   */
  private expandCluster(
    points: GeoCoordinates[],
    index: number,
    neighbors: number[],
    radiusKm: number,
    minPoints: number,
    visited: Set<number>,
    clustered: Set<number>
  ): number[] {
    const cluster = [index];
    clustered.add(index);

    for (let i = 0; i < neighbors.length; i++) {
      const neighborIdx = neighbors[i];

      if (!visited.has(neighborIdx)) {
        visited.add(neighborIdx);
        const neighborNeighbors = this.findNeighbors(points, neighborIdx, radiusKm);

        if (neighborNeighbors.length >= minPoints) {
          neighbors.push(...neighborNeighbors);
        }
      }

      if (!clustered.has(neighborIdx)) {
        cluster.push(neighborIdx);
        clustered.add(neighborIdx);
      }
    }

    return cluster;
  }

  /**
   * Calculate centroid of coordinates
   */
  private calculateCentroid(coords: GeoCoordinates[]): GeoCoordinates {
    const sum = coords.reduce(
      (acc, coord) => ({
        latitude: acc.latitude + coord.latitude,
        longitude: acc.longitude + coord.longitude,
      }),
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: sum.latitude / coords.length,
      longitude: sum.longitude / coords.length,
    };
  }

  /**
   * Determine district for coordinate (simplified)
   */
  private getDistrictForCoordinate(coord: GeoCoordinates): string {
    // Simplified - in production, use polygon containment check
    if (coord.latitude > 12.8 && coord.latitude < 13.2 && coord.longitude > 77.4 && coord.longitude < 77.9) {
      return 'Bengaluru Urban';
    }
    if (coord.latitude > 12.0 && coord.latitude < 12.5 && coord.longitude > 76.4 && coord.longitude < 76.9) {
      return 'Mysuru';
    }
    return 'Other';
  }

  /**
   * Determine hotspot status based on crime count
   */
  private determineHotspotStatus(crimeCount: number): CrimeHotspot['status'] {
    if (crimeCount > 30) return 'active';
    if (crimeCount > 15) return 'emerging';
    return 'declining';
  }

  /**
   * Get risk color based on risk score
   */
  private getRiskColor(riskScore: number): string {
    if (riskScore > 75) return '#dc2626'; // Red
    if (riskScore > 50) return '#f97316'; // Orange
    if (riskScore > 25) return '#eab308'; // Yellow
    return '#22c55e'; // Green
  }

  /**
   * Generate jurisdiction boundary around station
   */
  private generateJurisdictionBoundary(center: GeoCoordinates): GeoCoordinates[] {
    const radius = 0.05; // ~5km
    return [
      { latitude: center.latitude + radius, longitude: center.longitude },
      { latitude: center.latitude, longitude: center.longitude + radius },
      { latitude: center.latitude - radius, longitude: center.longitude },
      { latitude: center.latitude, longitude: center.longitude - radius },
    ];
  }

  /**
   * Get heatmap at specific date
   */
  private async getCrimeHeatmapAtDate(
    date: Date,
    filters: AnalyticsQuery['filters']
  ): Promise<Array<{ location: GeoCoordinates; intensity: number }>> {
    // Mock - in production, query FIRs up to this date
    return this.getCrimeHeatmap(filters);
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

/**
 * Singleton instance
 */
export const geospatialAnalyzer = new GeospatialAnalyzer();
