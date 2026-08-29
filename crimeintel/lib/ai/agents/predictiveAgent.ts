import { ParsedQuery } from '../chat/intentClassifier';
import { getCatalystApp } from '@/lib/catalyst';

export class PredictiveAgent {
  static async retrieve(parsedQuery: ParsedQuery): Promise<any> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    if (!zcql) {
      return { trend: "unavailable", reason: "ZCQL not initialized" };
    }

    try {
      let conditions = [];
      if (parsedQuery.entities.district) {
        let d = parsedQuery.entities.district.toLowerCase();
        const cityToDistrictMap: Record<string, string> = {
          'mangalore': 'dakshina kannada',
          'mangaluru': 'dakshina kannada',
          'bangalore': 'bengaluru urban',
          'bengaluru': 'bengaluru urban',
          'mysore': 'mysuru',
          'hubli': 'dharwad',
          'dharwad': 'dharwad',
          'belgaum': 'belagavi'
        };

        if (cityToDistrictMap[d]) {
          d = cityToDistrictMap[d];
        }

        // We fetch district mapping dynamically in a real app, but for regression we can use LIKE
        d = d.replace(/'/g, "''");
        const districtQuery = `SELECT * FROM Districts WHERE name LIKE '%${d}%' OR name_kn LIKE '%${d}%'`;
        const distResults = await zcql.executeZCQLQuery(districtQuery);
        let mappedDistrict = d;
        if (distResults.length > 0) {
          const row = distResults[0].Districts || distResults[0];
          mappedDistrict = row.id;
        }
        conditions.push(`district_id = '${mappedDistrict}'`);
      }
      
      if (parsedQuery.entities.crime_types && parsedQuery.entities.crime_types.length > 0) {
        const ct = parsedQuery.entities.crime_types[0].replace(/'/g, "''");
        conditions.push(`crime_type_en = '${ct}'`);
      }

      const whereClause = conditions.length > 0 ? ` WHERE ` + conditions.join(' AND ') : '';
      
      // Fetch all relevant FIRs to build a time-series
      const query = `SELECT date FROM FIRs${whereClause}`;
      console.log("[PredictiveAgent] Executing ZCQL:", query);
      const results = await zcql.executeZCQLQuery(query);
      
      const firs = results.map((row: any) => row.FIRs || row);
      
      if (firs.length === 0) {
        return [{
          type: 'PredictiveResult',
          status: 'Insufficient Data',
          message: 'Not enough historical data to generate a forecast.'
        }];
      }

      // Aggregate counts by Year-Month
      const timeSeries: Record<string, number> = {};
      firs.forEach((fir: any) => {
        if (fir.date) {
          // extract YYYY-MM
          const ym = fir.date.substring(0, 7);
          timeSeries[ym] = (timeSeries[ym] || 0) + 1;
        }
      });

      // Sort chronological
      const sortedKeys = Object.keys(timeSeries).sort();
      
      if (sortedKeys.length < 2) {
        return [{
          type: 'PredictiveResult',
          status: 'Insufficient Variance',
          message: 'Data is concentrated in a single time period. Cannot perform trend regression.',
          data: timeSeries
        }];
      }

      // Map to (x, y) coordinates where x is month index (0, 1, 2...)
      // First let's find the start date to act as index 0
      const startYM = sortedKeys[0];
      const startYear = parseInt(startYM.substring(0, 4), 10);
      const startMonth = parseInt(startYM.substring(5, 7), 10);

      const dataPoints = sortedKeys.map(key => {
        const year = parseInt(key.substring(0, 4), 10);
        const month = parseInt(key.substring(5, 7), 10);
        
        // Calculate months elapsed since start
        const x = (year - startYear) * 12 + (month - startMonth);
        const y = timeSeries[key];
        return { x, y, label: key };
      });

      // Linear Regression: y = mx + b
      const n = dataPoints.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      
      dataPoints.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += (p.x * p.y);
        sumXX += (p.x * p.x);
      });

      const denominator = (n * sumXX) - (sumX * sumX);
      
      let m = 0;
      let b = sumY / n; // flat line fallback if denominator is 0 (all points at same x, shouldn't happen)
      
      if (denominator !== 0) {
        m = ((n * sumXY) - (sumX * sumY)) / denominator;
        b = (sumY - (m * sumX)) / n;
      }

      // Calculate R-squared
      const meanY = sumY / n;
      let ssTot = 0, ssRes = 0;
      dataPoints.forEach(p => {
        const predictedY = (m * p.x) + b;
        ssTot += Math.pow(p.y - meanY, 2);
        ssRes += Math.pow(p.y - predictedY, 2);
      });
      
      const rSquared = ssTot === 0 ? 1 : (1 - (ssRes / ssTot));

      // Generate Forecast for next 3 periods
      const lastPoint = dataPoints[dataPoints.length - 1];
      const lastX = lastPoint.x;
      const forecasts = [];
      
      for (let i = 1; i <= 3; i++) {
        const futureX = lastX + i;
        const predictedY = Math.max(0, Math.round((m * futureX) + b)); // Can't have negative crimes
        
        // Reverse calculate Year-Month
        let futureMonth = startMonth + futureX;
        let futureYear = startYear;
        while (futureMonth > 12) {
          futureMonth -= 12;
          futureYear += 1;
        }
        const label = `${futureYear}-${futureMonth.toString().padStart(2, '0')} (Forecast)`;
        
        forecasts.push({ label, value: predictedY });
      }

      return [{
        type: 'PredictiveResult',
        status: 'Success',
        metric: 'Trend Forecast',
        historical_data: dataPoints.map(p => ({ period: p.label, count: p.y })),
        regression: {
          slope: m.toFixed(4),
          intercept: b.toFixed(4),
          r_squared: rSquared.toFixed(4),
          trend: m > 0.1 ? 'Increasing' : m < -0.1 ? 'Decreasing' : 'Stable'
        },
        forecast: forecasts
      }];

    } catch (error) {
      console.error("PredictiveAgent Error:", error);
      return { trend: "error", message: String(error) };
    }
  }
}
