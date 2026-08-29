"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import { ExplainabilityBadge } from "@/components/ui/explainability-badge";
import { MapPin, AlertCircle, Shield, TrendingUp, TrendingDown, Users, Activity, Loader2, Layers, Map as MapIcon, Hexagon, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

const LiveMapClient = dynamic(() => import("./LiveMapClient"), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  )
});



export function LiveMap() {
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [firPoints, setFirPoints] = useState<any[]>([]);
  const [recentSpikes, setRecentSpikes] = useState<any[]>([]);
  const [policeStations, setPoliceStations] = useState<any[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  // Layer Controls State
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showBoundaries, setShowBoundaries] = useState(false);
  const [showWards, setShowWards] = useState(false);
  const [showPredictive, setShowPredictive] = useState(false);
  const [showPoliceStations, setShowPoliceStations] = useState(true);
  const [mapStyle, setMapStyle] = useState<'light' | 'dark' | 'satellite'>('light');

  const { t } = useLanguage();

  // Fetch real data
  useEffect(() => {
    async function fetchMapData() {
      try {
        const res = await fetch("/api/analytics/map");
        if (res.ok) {
          const data = await res.json();
          if (data.hotspots && data.hotspots.length > 0) {
            setHotspots(data.hotspots);
            setSelectedSpotId(data.hotspots[0].id);
            setFirPoints(data.firPoints || []);
            setRecentSpikes(data.recentSpikes || []);
            setPoliceStations(data.policeStations || []);
          }
        }
      } catch (err) {
      }
    }
    fetchMapData();
  }, []);

  const selectedSpot = hotspots.find(s => s.id === selectedSpotId) || hotspots[0];

  if (hotspots.length === 0 || !selectedSpot) {
    return (
      <Card className="col-span-full xl:col-span-3 overflow-hidden h-[500px] flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </Card>
    );
  }

  return (
    <Card className="col-span-full xl:col-span-3 overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {t('map.title')}
            </CardTitle>
            <CardDescription>{t('map.subtitle')}</CardDescription>
          </div>
          
          {/* Top Layer Controls */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setMapStyle('light')}
              className={cn("px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors", mapStyle === 'light' ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700")}
            >
              <MapIcon className="h-3 w-3" /> {t('map.2dVector')}
            </button>
            <button 
              onClick={() => setMapStyle('satellite')}
              className={cn("px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors", mapStyle === 'satellite' ? "bg-slate-800 shadow-sm text-white" : "text-slate-500 hover:text-slate-700")}
            >
              <Mountain className="h-3 w-3" /> {t('map.3dTerrain')}
            </button>
            <button 
              onClick={() => setMapStyle('dark')}
              className={cn("px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors", mapStyle === 'dark' ? "bg-slate-900 shadow-sm text-white" : "text-slate-500 hover:text-slate-700")}
            >
              <Layers className="h-3 w-3" /> {t('map.darkOps')}
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 border-t border-slate-100">
        <div className="flex flex-col md:flex-row h-[500px]">
          {/* Map Area */}
          <div className="flex-1 relative bg-slate-50 overflow-hidden group">
            
            <LiveMapClient 
              hotspots={hotspots} 
              firPoints={firPoints}
              recentSpikes={recentSpikes}
              policeStations={policeStations}
              selectedSpot={selectedSpot} 
              onSelect={(spot: any) => setSelectedSpotId(spot.id)} 
              showHeatmap={showHeatmap}
              showBoundaries={showBoundaries}
              showWards={showWards}
              showPredictive={showPredictive}
              showPoliceStations={showPoliceStations}
              mapStyle={mapStyle}
            />
            
            {/* Floating Layer Toggles Over Map */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200/50 flex flex-col gap-1 w-48">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2 px-2">
                  <Layers className="w-3.5 h-3.5" />
                  {t('map.dataLayers')}
                </div>
                
                <button 
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={cn("px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors", showHeatmap ? "bg-blue-50 text-blue-700" : "hover:bg-slate-100 text-slate-600")}
                >
                  <span className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> {t('map.heatmap')}</span>
                  <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", showHeatmap ? "bg-blue-500" : "bg-slate-300")}>
                    <div className={cn("absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform", showHeatmap ? "translate-x-2.5" : "translate-x-0")} />
                  </div>
                </button>
                
                <button 
                  onClick={() => setShowBoundaries(!showBoundaries)}
                  className={cn("px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors", showBoundaries ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-100 text-slate-600")}
                >
                  <span className="flex items-center gap-1.5"><MapIcon className="h-3 w-3" /> {t('map.district')}</span>
                  <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", showBoundaries ? "bg-emerald-500" : "bg-slate-300")}>
                    <div className={cn("absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform", showBoundaries ? "translate-x-2.5" : "translate-x-0")} />
                  </div>
                </button>

                <button 
                  onClick={() => setShowWards(!showWards)}
                  className={cn("px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors", showWards ? "bg-purple-50 text-purple-700" : "hover:bg-slate-100 text-slate-600")}
                >
                  <span className="flex items-center gap-1.5"><Hexagon className="h-3 w-3" /> {t('map.wardsGrid')}</span>
                  <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", showWards ? "bg-purple-500" : "bg-slate-300")}>
                    <div className={cn("absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform", showWards ? "translate-x-2.5" : "translate-x-0")} />
                  </div>
                </button>

                <button 
                  onClick={() => setShowPoliceStations(!showPoliceStations)}
                  className={cn("px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors", showPoliceStations ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-100 text-slate-600")}
                >
                  <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Police Stations</span>
                  <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", showPoliceStations ? "bg-indigo-500" : "bg-slate-300")}>
                    <div className={cn("absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform", showPoliceStations ? "translate-x-2.5" : "translate-x-0")} />
                  </div>
                </button>

                <div className="my-1 border-t border-slate-200/50" />
                
                <button 
                  onClick={() => setShowPredictive(!showPredictive)}
                  className={cn("px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors", showPredictive ? "bg-destructive/10 text-destructive" : "hover:bg-slate-100 text-slate-600")}
                >
                  <span className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> 7-Day Forecast</span>
                  <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", showPredictive ? "bg-destructive" : "bg-slate-300")}>
                    <div className={cn("absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform", showPredictive ? "translate-x-2.5" : "translate-x-0")} />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Stats Panel */}
          <div className="w-full md:w-80 flex flex-col bg-white border-l border-slate-100 relative z-[1001] shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)]">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-primary/20 animate-ping opacity-20" />
                  <MapPin className="h-6 w-6 text-primary relative z-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight tracking-tight">{selectedSpot.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono font-bold tracking-wider opacity-70">NODE-{selectedSpot.id.toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 shadow-sm transition-colors duration-500">
                  <div className="flex items-center gap-2">
                    <AlertCircle className={cn("h-4 w-4 transition-colors duration-500", selectedSpot.threat === "Critical" ? "text-destructive" : "text-amber-500")} />
                    <span className="text-sm font-bold text-slate-600 tracking-tight">{t('dashboard.threatLevel')}</span>
                  </div>
                  <span className={cn("text-sm font-black uppercase tracking-wider transition-colors duration-500", selectedSpot.threat === "Critical" ? "text-destructive" : "text-amber-600")}>
                    {selectedSpot.threat === 'Critical' ? t('dashboard.critical') : selectedSpot.threat}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
                      <Activity className="h-3 w-3 text-slate-500" /> {t('dashboard.active')}
                    </span>
                    <span className="text-3xl font-black text-slate-800 transition-all duration-300 tracking-tighter">{selectedSpot.activeCases}</span>
                    <span className={cn("text-[11px] font-bold flex items-center gap-0.5", selectedSpot.trend === 'up' ? 'text-destructive' : 'text-emerald-500')}>
                      {selectedSpot.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {selectedSpot.trendValue}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1 p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
                      <Users className="h-3 w-3 text-slate-500" /> {t('dashboard.deployed')}
                    </span>
                    <span className="text-3xl font-black text-slate-800 transition-all duration-300 tracking-tighter">{selectedSpot.officers}</span>
                    <span className="text-[11px] font-bold text-slate-500">{t('dashboard.personnel')}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      {t('dashboard.liveIntelligence')}
                    </span>
                    <ExplainabilityBadge 
                      data={selectedSpot.explainability}
                      contextId={`map-alert-${selectedSpot.id}`}
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    {selectedSpot.recentAlert}
                  </p>
                </div>
                
                <div className="mt-auto pt-6">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-semibold tracking-wide text-xs h-12 rounded-xl transition-all">
                    <Shield className="mr-2 h-4 w-4 text-slate-400" />
                    {t('dashboard.viewNodeDetails')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
