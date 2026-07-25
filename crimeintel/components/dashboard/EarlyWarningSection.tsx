"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, ShieldAlert, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";

export function EarlyWarningSection() {
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [hotspotRes, anomalyRes] = await Promise.all([
          fetch("/api/predictions/hotspot"),
          fetch("/api/predictions/anomaly")
        ]);

        if (hotspotRes.ok) {
          const hData = await hotspotRes.json();
          setHotspots(hData.predictions?.filter((h: any) => h.trend === "escalating").slice(0, 2) || []);
        }
        
        if (anomalyRes.ok) {
          const aData = await anomalyRes.json();
          setAnomalies(aData.anomalies?.slice(0, 2) || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (hotspots.length === 0 && anomalies.length === 0) {
    return null; // Don't show section if everything is normal
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-5 h-5" />
            {t('dashboard.earlyWarnings')}
          </CardTitle>
          <CardDescription className="text-destructive/80">{t('dashboard.predictiveAlerts')}</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild className="border-destructive/30 text-destructive hover:bg-destructive/10">
          <Link href="/alerts">
            View All <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {anomalies.map((anomaly, idx) => (
          <div key={`anom-${idx}`} className="flex items-start gap-3 p-3 rounded-lg bg-card border shadow-sm">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">{anomaly.title}</h4>
                <Badge variant="destructive" className="text-[10px]">{t('dashboard.critical')}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{anomaly.description}</p>
            </div>
          </div>
        ))}

        {hotspots.map((hotspot, idx) => (
          <div key={`hot-${idx}`} className="flex items-start gap-3 p-3 rounded-lg bg-card border shadow-sm">
            <TrendingUp className="w-5 h-5 text-warning mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">Hotspot Escalation: {hotspot.district}</h4>
                <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">MONITOR</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{hotspot.reasoning}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-muted-foreground font-semibold">Risk</div>
              <div className="font-bold text-warning">{hotspot.risk_score}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
