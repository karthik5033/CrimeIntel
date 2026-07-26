"use client";

import React, { useEffect, useState, useMemo } from "react";
import { SankeyDiagram } from "./SankeyDiagram";
import { TransactionTimeline } from "./TransactionTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/LanguageContext";
import { AlertCircle, ArrowUpRight, TrendingUp, RefreshCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function FinancialDashboard() {
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [circularCycles, setCircularCycles] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [flaggedRes, circularRes] = await Promise.all([
        fetch("/api/financial/flagged"),
        fetch("/api/financial/circular")
      ]);

      if (flaggedRes.ok) {
        const flaggedData = await flaggedRes.json();
        setTransactions(flaggedData.flaggedTransactions || []);
        setStats(flaggedData.stats);
      }
      
      if (circularRes.ok) {
        const circularData = await circularRes.json();
        setCircularCycles(circularData.circular_patterns || []);
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

  // Process data for Sankey (top 50 transactions to keep it legible)
  const sankeyData = useMemo(() => {
    const nodesMap = new Map();
    const links = transactions.slice(0, 50).map(tx => {
      // Create/update nodes
      const sId = tx.from_account_id;
      const tId = tx.to_account_id;
      
      if (!nodesMap.has(sId)) nodesMap.set(sId, { id: sId, value: 0 });
      if (!nodesMap.has(tId)) nodesMap.set(tId, { id: tId, value: 0 });
      
      nodesMap.get(sId).value += tx.amount;
      nodesMap.get(tId).value += tx.amount;

      return {
        source: sId,
        target: tId,
        value: tx.amount,
        flagged: tx.flagged || tx.pattern === "SUSPICIOUS"
      };
    });

    return {
      nodes: Array.from(nodesMap.values()),
      links
    };
  }, [transactions]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">{t('financial.title')}</h2>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCcw className="w-4 h-4 mr-2" /> {t('financial.refresh')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase">{t('financial.flaggedAmount')}</p>
              <h3 className="text-3xl font-bold text-destructive mt-2">
                ₹{stats?.total_flagged_amount?.toLocaleString() || 0}
              </h3>
            </div>
            <div className="p-3 bg-destructive/20 rounded-full">
              <TrendingUp className="w-6 h-6 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase">{t('financial.suspiciousTxns')}</p>
              <h3 className="text-3xl font-bold text-warning mt-2">
                {stats?.total_flagged_count || 0}
              </h3>
            </div>
            <div className="p-3 bg-warning/20 rounded-full">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase">{t('financial.circularFlows')}</p>
              <h3 className="text-3xl font-bold text-primary mt-2">
                {circularCycles.length}
              </h3>
            </div>
            <div className="p-3 bg-primary/20 rounded-full">
              <ArrowUpRight className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sankey Flow */}
      <SankeyDiagram nodes={sankeyData.nodes} links={sankeyData.links} />

      {/* Timeline & Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TransactionTimeline transactions={transactions.slice(0, 20)} />
        
        {/* Circular Cycles List */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Suspected Circular / Mule Networks</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {circularCycles.map((cycle, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg border">
                  <div className="text-sm font-semibold text-warning mb-2">{cycle.pattern}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {cycle.accounts.map((acc: string, i: number) => (
                      <React.Fragment key={`${acc}-${i}`}>
                        <Badge variant="outline" className="font-mono">{acc}</Badge>
                        {i < cycle.accounts.length - 1 && <ArrowUpRight className="w-3 h-3 text-muted-foreground" />}
                      </React.Fragment>
                    ))}
                    <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                    <Badge variant="outline" className="font-mono">{cycle.accounts[0]}</Badge>
                  </div>
                </div>
              ))}
              {circularCycles.length === 0 && (
                <div className="text-sm text-muted-foreground">No circular flows detected.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
