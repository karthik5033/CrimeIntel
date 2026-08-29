import { ParsedQuery } from '../chat/intentClassifier';
import { SQLAgent } from './sqlAgent';

export class SpatialAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any[]> {
    try {
      // Re-use SQLAgent to fetch the relevant FIRs
      const firs = await SQLAgent.retrieve(parsedQuery);
      
      const geoFirs = firs.filter((f: any) => f.lat && f.lng);
      
      if (geoFirs.length === 0) {
        return [{
          type: 'SpatialProfile',
          status: 'Insufficient Data',
          message: 'No geographical coordinates available for the matching records.'
        }];
      }

      // Calculate Centroid (Average Lat/Lng)
      let sumLat = 0;
      let sumLng = 0;
      geoFirs.forEach((f: any) => {
        sumLat += parseFloat(f.lat);
        sumLng += parseFloat(f.lng);
      });
      
      const centroidLat = sumLat / geoFirs.length;
      const centroidLng = sumLng / geoFirs.length;

      // Calculate Standard Distance (Radius of operations)
      let sumSquaredDist = 0;
      geoFirs.forEach((f: any) => {
        const dLat = parseFloat(f.lat) - centroidLat;
        const dLng = parseFloat(f.lng) - centroidLng;
        sumSquaredDist += (dLat * dLat) + (dLng * dLng);
      });

      // 1 degree is approximately 111 km
      const stdDistanceDeg = Math.sqrt(sumSquaredDist / geoFirs.length);
      const radiusKm = stdDistanceDeg * 111;

      return [{
        type: 'SpatialProfile',
        metric: 'Geographic Anchor Prediction',
        centroid: { lat: centroidLat.toFixed(6), lng: centroidLng.toFixed(6) },
        operational_radius_km: radiusKm.toFixed(2),
        data_points: geoFirs.length,
        analysis: `Calculated a spatial centroid at [${centroidLat.toFixed(4)}, ${centroidLng.toFixed(4)}] with an operational radius of ${radiusKm.toFixed(2)} km. This represents the likely geographic anchor or base of operations for this crime series.`
      }];
      
    } catch (error) {
      console.error("SpatialAgent Error:", error);
      return [];
    }
  }
}
