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

// Synthetic Time-Series Data with Anomalies
const anomalyData = [
  { date: '2023-01', incidents: 120 },
  { date: '2023-02', incidents: 125 },
  { date: '2023-03', incidents: 118 },
  { date: '2023-04', incidents: 132 },
  { date: '2023-05', incidents: 128 },
  { date: '2023-06', incidents: 195, isAnomaly: true }, // Spike
  { date: '2023-07', incidents: 135 },
  { date: '2023-08', incidents: 140 },
  { date: '2023-09', incidents: 138 },
  { date: '2023-10', incidents: 210, isAnomaly: true }, // Spike
  { date: '2023-11', incidents: 145 },
  { date: '2023-12', incidents: 150 },
];

export function AnomalyDetector() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Time-Series Anomaly Detection</CardTitle>
          <CardDescription>Monthly incident volume with automated spike detection (Z-Score &gt; 2.5)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={anomalyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                
                {/* Highlight Anomalies */}
                <ReferenceArea x1="2023-05" x2="2023-07" fill="hsl(var(--destructive))" fillOpacity={0.15} />
                <ReferenceArea x1="2023-09" x2="2023-11" fill="hsl(var(--destructive))" fillOpacity={0.15} />

                <Line 
                  type="monotone" 
                  dataKey="incidents" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isAnomaly) {
                      return <circle cx={cx} cy={cy} r={6} fill="hsl(var(--destructive))" stroke="white" strokeWidth={2} />;
                    }
                    return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" stroke="none" />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
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
                  mechanism: "CUSUM Change-Point Detection and Z-Score thresholding over 12-month rolling window.",
                  dataSources: ["Live FIR Database", "Historical Crime Records"],
                }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-card rounded-md shadow-sm border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">October 2023</span>
                <span className="text-xs font-bold text-destructive">+48% Dev</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Statistically significant spike in property crimes detected. The anomaly correlates with the festival season (Dasara), matching historical patterns but exceeding expected thresholds.
              </p>
            </div>
            
            <div className="p-3 bg-card rounded-md shadow-sm border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">June 2023</span>
                <span className="text-xs font-bold text-destructive">+32% Dev</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unseasonal spike in cyber fraud incidents. Analysis attributes this to a localized phishing campaign targeting educational institutions during admission season.
              </p>
            </div>
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
              Offender behavioral shift detected: <strong className="text-foreground">Gang Alpha</strong> historically operated between 01:00-04:00. Recent associated FIRs in Oct 2023 show operations shifting to 14:00-16:00.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
