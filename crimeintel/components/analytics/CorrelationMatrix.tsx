"use client";

import React, { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExplainabilityBadge } from '@/components/ui/explainability-badge';
import { useLanguage } from '@/lib/LanguageContext';

const correlationData = {
  unemployment: [
    { district: "Bengaluru Central", value: 6.2, crimeRate: 450, population: 2000000 },
    { district: "Mysuru", value: 5.1, crimeRate: 310, population: 1200000 },
    { district: "Hubballi-Dharwad", value: 7.4, crimeRate: 380, population: 950000 },
    { district: "Mangaluru", value: 4.8, crimeRate: 290, population: 700000 },
    { district: "Belagavi", value: 8.1, crimeRate: 410, population: 650000 },
    { district: "Kalaburagi", value: 9.5, crimeRate: 520, population: 550000 },
    { district: "Davangere", value: 6.8, crimeRate: 340, population: 450000 },
    { district: "Ballari", value: 7.9, crimeRate: 460, population: 410000 },
  ],
  literacy: [
    { district: "Bengaluru Central", value: 87.6, crimeRate: 450, population: 2000000 },
    { district: "Mysuru", value: 82.8, crimeRate: 310, population: 1200000 },
    { district: "Hubballi-Dharwad", value: 86.7, crimeRate: 380, population: 950000 },
    { district: "Mangaluru", value: 94.0, crimeRate: 290, population: 700000 },
    { district: "Belagavi", value: 73.4, crimeRate: 410, population: 650000 },
    { district: "Kalaburagi", value: 64.8, crimeRate: 520, population: 550000 },
    { district: "Davangere", value: 75.7, crimeRate: 340, population: 450000 },
    { district: "Ballari", value: 67.4, crimeRate: 460, population: 410000 },
  ]
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border p-3 rounded-md shadow-lg text-sm">
        <p className="font-bold mb-1">{data.district}</p>
        <p><span className="text-muted-foreground">Factor Value:</span> <span className="font-medium">{data.value}%</span></p>
        <p><span className="text-muted-foreground">Crime Rate:</span> <span className="font-medium">{data.crimeRate} / 100k</span></p>
      </div>
    );
  }
  return null;
};

export function CorrelationMatrix() {
  const [factor, setFactor] = useState<'unemployment' | 'literacy'>('unemployment');
  const data = correlationData[factor];
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>{t('analytics.correlationTitle')}</CardTitle>
            <CardDescription>{t('analytics.correlationDesc')} {factor === 'unemployment' ? t('analytics.unemploymentRate') : t('analytics.literacyRate')}</CardDescription>
          </div>
          <Select value={factor} onValueChange={(val: any) => setFactor(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('analytics.selectFactor')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unemployment">{t('analytics.unemploymentRate')}</SelectItem>
              <SelectItem value="literacy">{t('analytics.literacyRate')}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number" 
                  dataKey="value" 
                  name={factor} 
                  unit="%" 
                  domain={['auto', 'auto']}
                  className="text-xs"
                />
                <YAxis 
                  type="number" 
                  dataKey="crimeRate" 
                  name="Crime Rate" 
                  domain={['auto', 'auto']}
                  className="text-xs"
                  label={{ value: t('analytics.yAxis'), angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: '12px', fill: 'currentColor' } }}
                />
                <ZAxis type="number" dataKey="population" range={[50, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter name="Districts" data={data} fill="hsl(var(--primary))" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('analytics.aiInsight')}</CardTitle>
            <ExplainabilityBadge 
              data={{
                confidence: 88,
                mechanism: "Linear Regression Analysis across 30 districts over the past 5 years.",
                dataSources: ["National Crime Records Bureau (NCRB)", "Census 2011", "State Economic Survey 2024"],
                alternatives: ["Correlation may be skewed by reporting biases in highly educated districts (where literacy correlates with higher reporting rates, not necessarily higher actual crime)."]
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/80">
          {factor === 'unemployment' ? (
            <>
              <p>
                <strong className="text-foreground">{t('analytics.statCorr')}</strong> {t('analytics.unemploymentCorr')}
              </p>
              <div className="p-3 bg-card border border-border rounded-md mt-4 shadow-sm">
                <p className="font-semibold text-primary mb-2 text-xs uppercase tracking-wider">{t('analytics.theory1Title')}</p>
                <p>{t('analytics.theory1Desc')}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                {t('analytics.note1')}
              </p>
            </>
          ) : (
            <>
              <p>
                <strong className="text-foreground">{t('analytics.statCorr')}</strong> {t('analytics.literacyCorr')}
              </p>
              <div className="p-3 bg-card border border-border rounded-md mt-4 shadow-sm">
                <p className="font-semibold text-primary mb-2 text-xs uppercase tracking-wider">{t('analytics.theory2Title')}</p>
                <p>{t('analytics.theory2Desc')}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                {t('analytics.note2')}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
