"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
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
import { PredictionEngine } from "@/lib/api/predictionEngine";
import Link from "next/link";

export default function DashboardPage() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('dashboard.title')}</h2>
          <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">{t('dashboard.downloadCsv')}</Button>
          <Button className="bg-primary hover:bg-primary/90 shadow-sm">{t('dashboard.generateReport')}</Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('dashboard.activeInvestigations')}</CardTitle>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              <FileText className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">1,248</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <span className="text-success font-medium mr-1">+12%</span> {t('dashboard.fromLastMonth')}
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
            <div className="text-2xl font-bold text-slate-900 dark:text-white">3,192</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <span className="text-success font-medium mr-1">+4%</span> {t('dashboard.fromLastMonth')}
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
            <div className="text-2xl font-bold text-slate-900 dark:text-white">14</div>
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
            <div className="text-2xl font-bold text-slate-900 dark:text-white">68.5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-success font-medium">+2.1%</span> {t('dashboard.sinceLastQuarter')}
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

        {/* Side Panel (Recent Alerts) */}
        <Card className="col-span-2 shadow-sm border-border/50 bg-card/50 flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                {t('dashboard.earlyWarnings')}
              </CardTitle>
              <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-transparent">
                {PredictionEngine.getAlerts().length} {t('dashboard.new')}
              </Badge>
            </div>
            <CardDescription>
              {t('dashboard.predictiveAlerts')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <div className="divide-y divide-border/50">
              {PredictionEngine.getAlerts().slice(0, 4).map((alert, i) => (
                <Link href="/alerts" key={i} className="block p-4 hover:bg-muted/50 transition-colors group cursor-pointer">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-destructive' : alert.severity === 'WARNING' ? 'bg-warning' : 'bg-primary'}`} />
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{alert.title}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{alert.description}</p>
                </Link>
              ))}
            </div>
          </CardContent>
          <div className="p-4 border-t border-border/50 bg-muted/20">
            <Button variant="outline" className="w-full text-sm" asChild>
              <Link href="/alerts">
                View All Alerts
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      <LiveMap />

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
                <TableHead className="text-right font-semibold">{t('table.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: "FIR-4521", type: t('table.vehicleTheft'), loc: t('table.loc1'), date: t('table.date1'), status: t('table.statusInvestigation') },
                { id: "FIR-4520", type: t('table.armedRobbery'), loc: t('table.loc2'), date: t('table.date2'), status: t('table.statusInvestigation') },
                { id: "FIR-4519", type: t('table.cyberFraud'), loc: t('table.loc3'), date: t('table.date3'), status: t('table.statusSuspect') },
                { id: "FIR-4518", type: t('table.burglary'), loc: t('table.loc4'), date: t('table.date4'), status: t('table.statusEvidence') },
                { id: "FIR-4517", type: t('table.assault'), loc: t('table.loc5'), date: t('table.date5'), status: t('table.statusCharge') },
              ].map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{row.id}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-1.5 h-3 w-3" />
                      {row.loc}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.date}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-normal">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">{t('table.investigate')}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
