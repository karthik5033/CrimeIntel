"use client";

import React, { useState } from "react";
import { CorrelationMatrix } from "@/components/analytics/CorrelationMatrix";
import { AnomalyDetector } from "@/components/analytics/AnomalyDetector";
import { ComparativeRadar } from "@/components/analytics/ComparativeRadar";
import { LineChart, BarChart2, TrendingUp, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("correlations");
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('analytics.title')}</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            {t('analytics.desc')}
          </p>
        </div>

        <div className="w-full">
          <div className="flex w-full max-w-2xl mb-6 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("correlations")}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'correlations' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <BarChart2 className="w-4 h-4" />
              {t('analytics.socioEconomic')}
            </button>
            <button
              onClick={() => setActiveTab("anomalies")}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'anomalies' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <AlertTriangle className="w-4 h-4" />
              {t('analytics.anomalyDetection')}
            </button>
            <button
              onClick={() => setActiveTab("comparative")}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'comparative' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LineChart className="w-4 h-4" />
              {t('analytics.comparativeProfiling')}
            </button>
          </div>
          
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'correlations' && <CorrelationMatrix />}
            {activeTab === 'anomalies' && <AnomalyDetector />}
            {activeTab === 'comparative' && <ComparativeRadar />}
          </div>
        </div>
      </main>
    </div>
  );
}
