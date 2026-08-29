"use client";

import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  Line,
  Area,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Activity, Target, AlertCircle, Radio } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

// Sci-Fi Complex Data Telemetry (Fallback)
const fallbackData = [
  { time: "00:00", timestamp: Date.now(), baseline: 800, telemetry: 820, anomaly: null }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  const { t } = useLanguage();

  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-md flex flex-col gap-2 min-w-[180px]">
        <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
          <span className="text-primary text-[10px] font-bold uppercase tracking-widest">{t('chart.time')}: {label}</span>
          <Radio className="h-3 w-3 text-primary animate-pulse" />
        </div>
        
        {payload.map((entry: any, index: number) => {
          if (entry.dataKey === 'anomaly' && !entry.value) return null;
          
          const displayName = entry.name;
          let color = entry.color;
          if (entry.dataKey === 'anomaly') {
            color = "var(--destructive)";
          }

          return (
            <div key={index} className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground uppercase">{displayName}</span>
              <span className="font-bold" style={{ color }}>
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export function CrimeTrendChart() {
  const { t } = useLanguage();
  const [trendData, setTrendData] = useState<any[]>(fallbackData);
  const [summary, setSummary] = useState<any>(null);
  
  useEffect(() => {
    async function loadTrend() {
      try {
        const res = await fetch("/api/analytics/trend");
        if (res.ok) {
          const data = await res.json();
          if (data.trend && data.trend.length > 0) {
            setTrendData(data.trend);
          }
          if (data.summary) {
            setSummary(data.summary);
          }
        }
      } catch (e) {
      }
    }
    loadTrend();
  }, []);

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full h-full mt-2">
      {/* Main Chart Area */}
      <div className="flex-1 h-[320px] relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground text-sm flex items-center gap-2 font-semibold">
            <Activity className="h-4 w-4 text-primary" />
            {t('chart.livePatternTelemetry')}
          </h3>
          <div className="text-[10px] text-muted-foreground uppercase flex gap-4 font-semibold">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-muted-foreground/30" /> {t('chart.baseline')}</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> {t('chart.actual')}</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive" /> {t('chart.anomaly')}</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart
            data={trendData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            
            <XAxis 
              dataKey="timestamp" 
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
              tickFormatter={(val) => {
                const d = new Date(val);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              dy={10}
              minTickGap={30}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
              dx={-10}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--muted)', strokeWidth: 1, strokeDasharray: '4 4', fill: 'var(--muted)', opacity: 0.1 }} />
            
            {/* Baseline Area */}
            <Area 
              type="monotone" 
              dataKey="baseline" 
              name="Historic Baseline"
              stroke="var(--muted-foreground)"
              strokeOpacity={0.3}
              strokeWidth={1.5}
              fill="url(#areaFill)" 
            />

            {/* Actual Track */}
            <Line 
              type="monotone" 
              dataKey="telemetry" 
              name="Live Data"
              stroke="var(--primary)" 
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--background)", stroke: "var(--primary)", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
            />

            {/* Anomaly Detection */}
            <Scatter 
              dataKey="anomaly" 
              name="Critical Deviation"
              fill="var(--destructive)" 
            />
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sci-Fi Stats Panel (In-Theme) */}
      <div className="w-full xl:w-56 flex flex-col gap-3 z-10">
        <div className="bg-muted/30 border border-border rounded-lg p-3 relative overflow-hidden transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{t('chart.accuracy')}</span>
          </div>
          <div className="text-2xl font-bold text-foreground tracking-tight">{summary?.accuracy || "94.2"}<span className="text-sm text-muted-foreground font-medium">%</span></div>
          <div className="w-full bg-muted h-1.5 mt-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${summary?.accuracy || 94.2}%` }} />
          </div>
        </div>

        <div className={`border rounded-lg p-3 relative overflow-hidden transition-all ${
          summary?.threatLevel === 'CRITICAL' ? 'bg-destructive/5 border-destructive/20' : 
          summary?.threatLevel === 'ELEVATED' ? 'bg-warning/5 border-warning/20' : 'bg-success/5 border-success/20'
        }`}>
          <div className={`absolute top-0 left-0 w-1 h-full ${
            summary?.threatLevel === 'CRITICAL' ? 'bg-destructive' : 
            summary?.threatLevel === 'ELEVATED' ? 'bg-warning' : 'bg-success'
          }`} />
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className={`h-3.5 w-3.5 animate-pulse ${
              summary?.threatLevel === 'CRITICAL' ? 'text-destructive' : 
              summary?.threatLevel === 'ELEVATED' ? 'text-warning' : 'text-success'
            }`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              summary?.threatLevel === 'CRITICAL' ? 'text-destructive' : 
              summary?.threatLevel === 'ELEVATED' ? 'text-warning' : 'text-success'
            }`}>{t('chart.threatIndex')}</span>
          </div>
          <div className={`text-lg font-bold tracking-wide ${
            summary?.threatLevel === 'CRITICAL' ? 'text-destructive' : 
            summary?.threatLevel === 'ELEVATED' ? 'text-warning' : 'text-success'
          }`}>{summary?.threatLevel || t('dashboard.critical')}</div>
          <div className={`text-[10px] mt-1 font-medium ${
            summary?.threatLevel === 'CRITICAL' ? 'text-destructive/80' : 
            summary?.threatLevel === 'ELEVATED' ? 'text-warning/80' : 'text-success/80'
          }`}>
            {summary?.threatDetail || t('chart.sectorAnomaly')}
          </div>
        </div>

        <div className="bg-muted/30 border border-border rounded-lg p-3 relative overflow-hidden flex-1 transition-all">
           <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
           <div className="flex items-center gap-2 mb-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{t('chart.nodeStatus')}</span>
          </div>
          <div className="space-y-2 mt-1">
            {[
              { id: "SYS-CORE", status: t('chart.online'), color: "text-primary" },
              { id: "PREDICTIVE", status: t('chart.syncing'), color: "text-amber-500" },
              { id: "CCTV-LINK", status: t('chart.online'), color: "text-primary" }
            ].map((node) => (
              <div key={node.id} className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-muted-foreground">{node.id}</span>
                <span className={node.color}>{node.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
