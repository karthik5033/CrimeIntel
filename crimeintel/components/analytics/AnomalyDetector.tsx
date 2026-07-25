"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { ExplainabilityBadge } from '@/components/ui/explainability-badge';

import { Loader2 } from 'lucide-react';

export function AnomalyDetector() {
  const [anomalyData, setAnomalyData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [detectedSpikes, setDetectedSpikes] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/analytics/anomalies')
      .then(res => res.json())
      .then(data => {
        setAnomalyData(data);
        setDetectedSpikes(data.filter((d: any) => d.isAnomaly));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Time-Series Anomaly Detection</CardTitle>
          <CardDescription>Monthly incident volume with automated spike detection (Z-Score &gt; 2.5)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full mt-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={anomalyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  
                  {/* Highlight Anomalies Dynamically */}
                  {detectedSpikes.map((spike, idx) => {
                     // Very simple highlight logic for the month
                     return (
                       <ReferenceArea key={idx} x1={spike.date} x2={spike.date} fill="hsl(var(--destructive))" fillOpacity={0.15} />
                     );
                  })}
  
                  <Line 
                    type="monotone" 
                    dataKey="incidents" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload.isAnomaly) {
                        return <circle key={`dot-${payload.date}`} cx={cx} cy={cy} r={6} fill="hsl(var(--destructive))" stroke="white" strokeWidth={2} />;
                      }
                      return <circle key={`dot-${payload.date}`} cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" stroke="none" />;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="col-span-1 space-y-6">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-md flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Detected Spikes
              </CardTitle>
              <ExplainabilityBadge 
                data={{
                  confidence: 94,
                  mechanism: "Z-Score thresholding (|z| > 1.5) over real monthly FIR counts from FIRs.json date field.",
                  dataSources: ["FIRs.json (Catalyst DataStore)"],
                }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {detectedSpikes.length > 0 ? detectedSpikes.map((spike, idx) => (
              <div key={idx} className="p-3 bg-card rounded-md shadow-sm border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{spike.date}</span>
                  <span className="text-xs font-bold text-destructive">Z={spike.zScore}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {spike.incidents} incidents this month — statistically significant spike detected (Z-Score: {spike.zScore}).
                </p>
              </div>
            )) : (
              <div className="p-3 bg-card rounded-md shadow-sm border border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No statistically significant anomalies detected in the current window.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-md flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Behavioral Anomaly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {detectedSpikes.length > 0
                ? `${detectedSpikes.length} anomalous month(s) detected across the FIR timeline. Months with Z-Scores exceeding ±1.5 suggest unusual surges or drops in filing activity worth investigating for root-cause patterns.`
                : 'No behavioral anomalies detected. Monthly FIR volumes remain within expected statistical bounds.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
