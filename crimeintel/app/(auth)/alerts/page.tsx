"use client";

import React, { useState } from 'react';
import { PredictionEngine, Alert, DistrictRisk } from "@/lib/api/predictionEngine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BellRing, ShieldAlert, AlertTriangle, Info, MapPin, TrendingUp, TrendingDown, Minus, BrainCircuit, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { PrintButton } from "@/components/reports/PrintButton";
import { PrintHeader } from "@/components/reports/PrintHeader";
import { PrintFooter } from "@/components/reports/PrintFooter";

export default function AlertsDashboard() {
  const alerts = PredictionEngine.getAlerts();
  const districtRisks = PredictionEngine.getDistrictRiskScores();
  
  const [activeTab, setActiveTab] = useState<"ALERTS" | "DISTRICTS">("ALERTS");

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return <ShieldAlert className="w-5 h-5 text-destructive" />;
      case "WARNING": return <AlertTriangle className="w-5 h-5 text-warning" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "UP": return <TrendingUp className="w-4 h-4 text-destructive" />;
      case "DOWN": return <TrendingDown className="w-4 h-4 text-success" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500 print:max-w-full print:p-0">
      
      <PrintHeader title="Early Warning & Alert History Report" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Early Warning System</h1>
          <p className="text-muted-foreground mt-1">Predictive analytics and anomaly detection.</p>
        </div>
        <div className="flex items-center gap-3">
          <PrintButton label="Export Alert History" variant="outline" />
          <div className="flex bg-muted p-1 rounded-lg">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "ALERTS" ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab("ALERTS")}
          >
            Active Alerts
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "DISTRICTS" ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab("DISTRICTS")}
          >
          </button>
          </div>
        </div>
      </div>

      {activeTab === "ALERTS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.severity === "CRITICAL" ? "border-l-destructive" : 
                alert.severity === "WARNING" ? "border-l-warning" : "border-l-primary"
              }`}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div className="flex gap-3">
                    <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                    <div>
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                      <CardDescription className="mt-1">{alert.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg mt-2 border">
                    <div className="flex items-center gap-2 mb-2">
                      <BrainCircuit className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">AI Reasoning Engine</span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                      "{alert.reasoning}"
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  {alert.action_link && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={alert.action_link}>
                        {alert.action_label || "Investigate"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
            
            {alerts.length === 0 && (
              <div className="text-center p-12 border rounded-lg bg-card text-muted-foreground">
                <BellRing className="w-8 h-8 mx-auto mb-3 opacity-50" />
                No active alerts at this time.
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive font-medium">
                    <ShieldAlert className="w-4 h-4" /> Critical
                  </div>
                  <span className="text-xl font-bold text-destructive">{alerts.filter(a => a.severity === "CRITICAL").length}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2 text-warning font-medium">
                    <AlertTriangle className="w-4 h-4" /> Warning
                  </div>
                  <span className="text-xl font-bold text-warning">{alerts.filter(a => a.severity === "WARNING").length}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Info className="w-4 h-4" /> Info
                  </div>
                  <span className="text-xl font-bold text-primary">{alerts.filter(a => a.severity === "INFO").length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "DISTRICTS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {districtRisks.map((d) => (
            <Card key={d.district_id} className={`overflow-hidden ${d.risk_score >= 80 ? 'border-destructive/50 shadow-sm shadow-destructive/10' : ''}`}>
              <div className={`h-1.5 w-full ${d.risk_score >= 80 ? 'bg-destructive' : d.risk_score >= 50 ? 'bg-warning' : 'bg-success'}`} />
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {d.district_id}
                  </div>
                  <div className="flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded">
                    {getTrendIcon(d.trend)}
                    <span className="font-medium text-muted-foreground">{d.trend}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 my-2">
                  <span className={`text-4xl font-bold ${d.risk_score >= 80 ? 'text-destructive' : d.risk_score >= 50 ? 'text-warning' : 'text-success'}`}>
                    {d.risk_score}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">/100 Risk Score</span>
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-md border text-sm">
                  <span className="font-semibold text-foreground">Primary Driver: </span>
                  <span className="text-muted-foreground">{d.primary_factor}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PrintFooter />
    </div>
  );
}
