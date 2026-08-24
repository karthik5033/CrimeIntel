"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { DataClient } from "@/lib/api/dataClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  MapPin
} from "lucide-react";
import { CrimeTrendChart } from "@/components/charts/CrimeTrendChart";
import { LiveMap } from "@/components/dashboard/LiveMap";
import { LiveEventFeed } from "@/components/dashboard/LiveEventFeed";
import { PredictionEngine } from "@/lib/api/predictionEngine";
import { EarlyWarningSection } from "@/components/dashboard/EarlyWarningSection";
import { QuickMLBar } from "@/components/dashboard/QuickMLBar";
import Link from "next/link";
import { PrintButton } from "@/components/reports/PrintButton";
import { PrintHeader } from "@/components/reports/PrintHeader";
import { PrintFooter } from "@/components/reports/PrintFooter";
import { downloadDataAsCsv } from "@/lib/utils";
import { Download } from "lucide-react";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [recentFIRs, setRecentFIRs] = useState<any[]>([]);
  const [fullFIRData, setFullFIRData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeInvestigations: 0,
    personsOfInterest: 0,
    highRiskAlerts: 0,
    resolutionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch real data from Catalyst Data Store sequentially to avoid connection drops
        const allFIRs = await DataClient.getFIRs();
        const allPersons = await DataClient.getPersons();
        const allCases = await DataClient.getCases();
        
        // Calculate real stats
        const activeCount = allFIRs.filter((f: any) => 
          f.status_en === 'Under Investigation' || f.status_en === 'Pending Trial'
        ).length;
        
        const personsCount = allPersons.filter((p: any) => 
          p.risk_score >= 80 || p.is_repeat_offender === true
        ).length;
        
        const highRiskCount = allFIRs.filter((f: any) => 
          f.crime_type_en === 'Murder' || 
          f.crime_type_en === 'Culpable Homicide' ||
          f.crime_type_en === 'Kidnapping'
        ).length;
        
        const closedCases = allCases.filter((c: any) => c.status === 'Closed').length;
        const resolution = allCases.length > 0 ? (closedCases / allCases.length * 100) : 0;
        
        setStats({
          activeInvestigations: activeCount,
          personsOfInterest: personsCount,
          highRiskAlerts: highRiskCount,
          resolutionRate: resolution
        });
        
        // Get latest 5 FIRs (already sorted by date DESC in query)
        setRecentFIRs(allFIRs.slice(0, 5));
        setFullFIRData(allFIRs);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard data from Catalyst...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive text-5xl">⚠️</div>
          <h2 className="text-2xl font-bold">Catalyst Data Store Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            This likely means:
            <br />• Catalyst tables are empty (need to load seed data)
            <br />• Catalyst SDK not configured properly
            <br />• Network connection issues
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto w-full print:max-w-full print:p-0">
      <PrintHeader title="Command Center Dashboard" subtitle="Real-time operations overview" />

      <div className="print:hidden"><QuickMLBar /></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('dashboard.title')}</h2>
          <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => downloadDataAsCsv(fullFIRData.length > 0 ? fullFIRData : recentFIRs, `CrimeIntel_Dashboard_Report_${new Date().toISOString().split('T')[0]}`)}
          >
            <Download className="w-4 h-4 mr-2" />
            {t('dashboard.downloadCsv')}
          </Button>
          <PrintButton label={t('dashboard.generateReport') || 'Generate Report'} className="bg-primary hover:bg-primary/90 shadow-sm text-white" />
        </div>
      </div>

      <EarlyWarningSection />

      {/* KPI Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('dashboard.activeInvestigations')}</CardTitle>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              <FileText className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.activeInvestigations.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <span className="text-muted-foreground font-medium mr-1">Real-time from Catalyst</span>
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('dashboard.personsOfInterest')}</CardTitle>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              <Users className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.personsOfInterest.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <span className="text-muted-foreground font-medium mr-1">From Catalyst Data Store</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('dashboard.highRiskAlerts')}</CardTitle>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              <AlertTriangle className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.highRiskAlerts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-destructive font-medium">{t('dashboard.criticalAttention')}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('dashboard.resolutionRate')}</CardTitle>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              <ShieldCheck className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.resolutionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-muted-foreground font-medium">Calculated from live data</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-7">
        {/* Main Content Area (Chart) */}
        <Card className="col-span-2 xl:col-span-5 shadow-sm border-border/50 bg-card/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-semibold">{t('dashboard.incidentTrends')}</CardTitle>
            <CardDescription>
              {t('dashboard.incidentTrendsSub')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <CrimeTrendChart />
          </CardContent>
        </Card>

        {/* Side Panel (Live Event Feed) */}
        <div className="col-span-2 flex flex-col h-full print:hidden">
          <LiveEventFeed />
          
          <div className="mt-4 p-4 border border-border/50 bg-muted/20 rounded-lg shadow-sm">
            <Button variant="outline" className="w-full text-sm" asChild>
              <Link href="/alerts">
                {t('dashboard.viewAllAlerts')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="print:hidden"><LiveMap /></div>

      {/* Recent Cases Table */}
      <Card className="shadow-sm border-border/50 bg-card/50">
        <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{t('table.title')}</CardTitle>
            <CardDescription>{t('table.subtitle')}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">{t('table.viewAll')} <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px] font-semibold">{t('table.firNo')}</TableHead>
                <TableHead className="font-semibold">{t('table.crimeType')}</TableHead>
                <TableHead className="font-semibold">{t('table.location')}</TableHead>
                <TableHead className="font-semibold">{t('table.date')}</TableHead>
                <TableHead className="font-semibold">{t('table.status')}</TableHead>
                <TableHead className="text-right font-semibold print:hidden">{t('table.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentFIRs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No FIRs found in Catalyst Data Store. Load seed data to see results.
                  </TableCell>
                </TableRow>
              ) : (
                recentFIRs.map((fir) => (
                  <TableRow key={fir.fir_no || fir.id || Math.random()} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{fir.fir_no}</TableCell>
                    <TableCell>{fir.crime_type_en}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="mr-1.5 h-3 w-3" />
                        {fir.police_station_id}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(fir.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-normal print:border print:border-slate-300 print:text-slate-900">
                        {fir.status_en}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right print:hidden">
                      <Button variant="ghost" size="sm">{t('table.investigate')}</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PrintFooter />
    </div>
  );
}
