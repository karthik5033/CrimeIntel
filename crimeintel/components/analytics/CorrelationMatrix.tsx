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

import { Loader2 } from 'lucide-react';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border p-3 rounded-md shadow-lg text-sm">
        <p className="font-bold mb-1">{data.district}</p>
        <p><span className="text-muted-foreground">Factor Value:</span> <span className="font-medium">{data.value}%</span></p>
        <p><span className="text-muted-foreground">FIR Count:</span> <span className="font-medium">{data.crimeRate}</span></p>
      </div>
    );
  }
  return null;
};

export function CorrelationMatrix() {
  const [factor, setFactor] = useState<'unemployment' | 'literacy'>('unemployment');
  const [correlationData, setCorrelationData] = useState<any>({ unemployment: [], literacy: [] });
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  React.useEffect(() => {
    fetch('/api/analytics/correlations')
      .then(res => res.json())
      .then(data => {
        setCorrelationData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const data = correlationData[factor] || [];

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
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
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
                    name="FIR Count" 
                    domain={['auto', 'auto']}
                    className="text-xs"
                    label={{ value: 'FIR Count', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: '12px', fill: 'currentColor' } }}
                  />
                  <ZAxis type="number" dataKey="population" range={[50, 400]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                  <Scatter name="Districts" data={data} fill="hsl(var(--primary))" opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
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
                mechanism: "Scatter analysis across Karnataka districts using real FIR counts joined with SocioEconomicData seed.",
                dataSources: ["FIRs.json (Catalyst DataStore)", "SocioEconomicData.json", "PoliceStations.json"],
                alternatives: ["Only 5 districts have socio-economic data in the current seed. Correlation accuracy improves as more district-level metrics are added."]
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
