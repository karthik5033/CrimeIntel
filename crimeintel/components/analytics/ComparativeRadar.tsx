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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExplainabilityBadge } from '@/components/ui/explainability-badge';
import { Loader2 } from 'lucide-react';

interface District {
  id: string;
  name: string;
}

export function ComparativeRadar() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtA, setDistrictA] = useState('DIST_1');
  const [districtB, setDistrictB] = useState('DIST_2');
  const [districtAName, setDistrictAName] = useState('');
  const [districtBName, setDistrictBName] = useState('');
  const [radarData, setRadarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>(null);

  // Fetch the real district list on mount
  React.useEffect(() => {
    fetch('/api/analytics/districts')
      .then(res => res.json())
      .then((data: District[]) => {
        setDistricts(data);
        // Set defaults to first two districts
        if (data.length >= 2) {
          setDistrictA(data[0].id);
          setDistrictB(data[1].id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch comparative data whenever districts change
  React.useEffect(() => {
    if (!districtA || !districtB) return;
    setLoading(true);
    fetch(`/api/analytics/comparative?districtA=${encodeURIComponent(districtA)}&districtB=${encodeURIComponent(districtB)}`)
      .then(res => res.json())
      .then(result => {
        setRadarData(result.data || []);
        setDistrictAName(result.districtAName || districtA);
        setDistrictBName(result.districtBName || districtB);
        setMeta(result.meta || null);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [districtA, districtB]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Comparative District Analytics</CardTitle>
            <CardDescription>
              {districtAName && districtBName
                ? `Crime profile: ${districtAName} vs ${districtBName}`
                : 'Select two districts to compare'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={districtA} onValueChange={(val) => setDistrictA(val || "")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="District A" />
              </SelectTrigger>
              <SelectContent>
                {districts.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={districtB} onValueChange={(val) => setDistrictB(val || "")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="District B" />
              </SelectTrigger>
              <SelectContent>
                {districts.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[450px] w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : radarData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No FIR data found for the selected districts.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 5']} tick={{ fill: 'var(--muted-foreground)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Radar name={districtAName} dataKey="districtA" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  <Radar name={districtBName} dataKey="districtB" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            )}
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
                mechanism: "Radar analysis across real crime_type_en categories from FIRs.json, grouped by district_id.",
                dataSources: ["FIRs.json (Catalyst DataStore)", "PoliceStations.json"],
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/80">
          <div>
            <h5 className="font-semibold text-primary mb-1">Key Divergences</h5>
            {meta && (
              <div className="space-y-2 text-xs">
                <p><strong className="text-foreground">{districtAName}:</strong> {meta.totalCrimeTypesA} total FIRs across all crime types</p>
                <p><strong className="text-foreground">{districtBName}:</strong> {meta.totalCrimeTypesB} total FIRs across all crime types</p>
              </div>
            )}
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                The radar overlay reveals which crime categories each district disproportionately handles. Larger peaks indicate higher concentration of that crime type relative to the other district.
              </li>
            </ul>
          </div>
          
          <div className="p-3 bg-card border border-border rounded-md mt-4 shadow-sm">
            <h5 className="font-semibold text-xs uppercase tracking-wider mb-2">Resource Allocation Recommendation</h5>
            <p className="text-xs text-muted-foreground">
              Compare the top crime categories between {districtAName} and {districtBName} to identify where specialized units (cyber, narcotics, traffic) should be rebalanced.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
