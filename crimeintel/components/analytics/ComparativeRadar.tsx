"use client";

import React, { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExplainabilityBadge } from '@/components/ui/explainability-badge';

// Synthetic Data for Radar Chart
const radarData = [
  { subject: 'Property Crime', districtA: 120, districtB: 80, fullMark: 150 },
  { subject: 'Violent Crime', districtA: 98, districtB: 130, fullMark: 150 },
  { subject: 'Cyber Fraud', districtA: 140, districtB: 50, fullMark: 150 },
  { subject: 'Narcotics', districtA: 65, districtB: 85, fullMark: 150 },
  { subject: 'Economic Offenses', districtA: 110, districtB: 60, fullMark: 150 },
  { subject: 'Traffic Violations', districtA: 135, districtB: 115, fullMark: 150 },
];

export function ComparativeRadar() {
  const [districtA] = useState("Bengaluru Central");
  const [districtB] = useState("Mysuru");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Comparative District Analytics</CardTitle>
          <CardDescription>Crime profile comparison: {districtA} vs {districtB}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: 'var(--muted-foreground)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Radar name={districtA} dataKey="districtA" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                <Radar name={districtB} dataKey="districtB" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Comparative Insights</CardTitle>
            <ExplainabilityBadge 
              data={{
                confidence: 91,
                mechanism: "Multivariate Radar analysis across 6 standard crime taxonomy categories.",
                dataSources: ["District Crime Records (YTD 2023)"],
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/80">
          <div>
            <h5 className="font-semibold text-primary mb-1">Key Divergences</h5>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Cyber Fraud:</strong> {districtA} shows a <span className="text-destructive font-semibold">180% higher incidence</span> compared to {districtB}. This aligns with {districtA}'s higher digital penetration and concentration of IT hubs.
              </li>
              <li>
                <strong>Violent Crime:</strong> {districtB} experiences slightly higher violent crime (+32%). The AI engine correlates this with recent demographic shifts and urban expansion pressures outside the primary metropolitan zone.
              </li>
            </ul>
          </div>
          
          <div className="p-3 bg-card border border-border rounded-md mt-4 shadow-sm">
            <h5 className="font-semibold text-xs uppercase tracking-wider mb-2">Resource Allocation Recommendation</h5>
            <p className="text-xs text-muted-foreground">
              Consider shifting cyber-forensic resources from {districtB} to {districtA}, while reinforcing physical patrol units in {districtB}'s expanding perimeter zones.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
