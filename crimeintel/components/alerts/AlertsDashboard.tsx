"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, TrendingUp, TrendingDown, Map, ShieldAlert, CheckCircle2, Activity } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function AlertsDashboard() {
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hotspotRes, anomalyRes] = await Promise.all([
        fetch("/api/predictions/hotspot"),
        fetch("/api/predictions/anomaly")
      ]);

      if (hotspotRes.ok) {
        const hData = await hotspotRes.json();
        setHotspots(hData.predictions || []);
      }
      
      if (anomalyRes.ok) {
        const aData = await anomalyRes.json();
        setAnomalies(aData.anomalies || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "border-destructive text-foreground";
      case "warning": return "border-warning text-foreground";
      default: return "border-primary text-foreground";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "warning": return <Badge variant="secondary" className="bg-warning text-warning-foreground">Warning</Badge>;
      default: return <Badge variant="outline">Info</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const escalatingHotspots = hotspots.filter(h => h.trend === "escalating");

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            {t('earlyWarning.title')}
          </h2>
          <p className="text-muted-foreground mt-1">{t('earlyWarning.subtitle')}</p>
        </div>
        <Button onClick={loadData} variant="outline">{t('earlyWarning.refreshData')}</Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('earlyWarning.activeAnomalies')}</p>
                <h3 className="text-3xl font-bold text-destructive mt-2">{anomalies.length}</h3>
              </div>
              <ShieldAlert className="w-8 h-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('earlyWarning.escalatingHotspots')}</p>
                <h3 className="text-3xl font-bold text-warning mt-2">{escalatingHotspots.length}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('earlyWarning.stableDistricts')}</p>
                <h3 className="text-3xl font-bold text-success mt-2">{hotspots.filter(h => h.trend === "stable").length}</h3>
              </div>
              <CheckCircle2 className="w-8 h-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Anomalies Feed */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              {t('earlyWarning.automatedAnomalies')}
            </CardTitle>
            <CardDescription>{t('earlyWarning.automatedAnomaliesDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{anomaly.title}</h4>
                  {getSeverityBadge(anomaly.severity)}
                </div>
                <p className="text-sm opacity-90 mb-3">{anomaly.description}</p>
                
                <div className="bg-background/50 p-2 rounded text-xs flex gap-4">
                  <div>
                    <span className="opacity-70 block mb-1">{t('earlyWarning.recentCases')}</span>
                    <span className="font-bold">{anomaly.metrics?.recent_cases || 0}</span>
                  </div>
                  <div>
                    <span className="opacity-70 block mb-1">{t('earlyWarning.increase')}</span>
                    <span className="font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {anomaly.metrics?.percentage_increase || "0%"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {anomalies.length === 0 && (
              <div className="text-center p-6 text-muted-foreground border rounded-lg border-dashed">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success opacity-50" />
                No anomalies detected at this time.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hotspots */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5 text-warning" />
              District Risk Forecast
            </CardTitle>
            <CardDescription>Predictive hotspot modeling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hotspots.slice(0, 10).map((h, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{h.district}</span>
                      {h.trend === "escalating" && <Badge variant="destructive" className="text-[10px] h-4">Escalating</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{h.reasoning}</p>
                  </div>
                  <div className="flex flex-col items-end pl-4 border-l ml-4 min-w-[80px]">
                    <span className="text-[10px] text-muted-foreground uppercase">Risk Score</span>
                    <span className={`font-bold text-lg ${h.risk_score >= 80 ? 'text-destructive' : h.risk_score >= 50 ? 'text-warning' : 'text-success'}`}>
                      {h.risk_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
