"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FinancialGraphEngine } from "@/lib/graph/financial";
import { FinancialFlow } from "@/components/network/FinancialFlow";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, TrendingUp, IndianRupee, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClientFinancial({ transactions }: { transactions: any[] }) {
  const engine = new FinancialGraphEngine(transactions);
  const suspiciousAccounts = engine.getSuspiciousAccounts();
  const flaggedTxs = engine.getFlaggedTransactions();
  
  const totalFlaggedAmount = flaggedTxs.reduce((sum, tx) => sum + tx.amount, 0);

  const [focusAccountId, setFocusAccountId] = useState<string | null>(null);

  // If a focus account is selected, show its forward/backward flow, otherwise show a sample of flagged transactions
  const displayTransactions = focusAccountId 
    ? [...engine.getForwardFlow(focusAccountId, 2).edges, ...engine.getBackwardFlow(focusAccountId, 2).edges]
    : flaggedTxs.slice(0, 100); // Show max 100 on overview

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financial Crime & Money Trails</h1>
        <p className="text-muted-foreground mt-1">Track illicit fund flows, mule networks, and suspicious transaction patterns.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Accounts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{suspiciousAccounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Accounts involved in suspicious activity</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Transactions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{flaggedTxs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Structuring, Circular & Mule patterns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Illicit Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalFlaggedAmount / 100000).toFixed(2)}L</div>
            <p className="text-xs text-muted-foreground mt-1">Total volume of flagged transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laundering Cycles</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Detected circular flow clusters</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Left Column: Accounts List */}
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-lg">High-Risk Accounts</CardTitle>
            <CardDescription>Accounts flagged for suspicious velocity or structuring.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead>Account ID</TableHead>
                  <TableHead className="text-right">Flagged Txs</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspiciousAccounts.slice(0, 50).map((acc) => (
                  <TableRow 
                    key={acc.id}
                    className={`cursor-pointer transition-colors ${focusAccountId === acc.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                    onClick={() => setFocusAccountId(acc.id === focusAccountId ? null : acc.id)}
                  >
                    <TableCell className="font-mono font-medium">{acc.id}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive" className="h-5">{acc.flaggedTxs}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground">
                      ₹{(acc.totalFlow / 1000).toFixed(0)}k
                    </TableCell>
                    <TableCell>
                      <ArrowRight className={`w-4 h-4 text-primary transition-transform ${focusAccountId === acc.id ? 'translate-x-1' : ''}`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right Column: Flow Visualization */}
        <Card className="lg:col-span-2 flex flex-col h-full overflow-hidden border-2 border-primary/20">
          <CardHeader className="pb-3 shrink-0 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Money Trail Graph
                </CardTitle>
                <CardDescription>
                  {focusAccountId ? `Tracing forward and backward flows for ${focusAccountId}` : 'Overview of all flagged transaction flows'}
                </CardDescription>
              </div>
              {focusAccountId && (
                <Button variant="outline" size="sm" onClick={() => setFocusAccountId(null)}>
                  Reset View
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative">
            <FinancialFlow 
              transactions={displayTransactions} 
              accountIds={focusAccountId ? [focusAccountId] : []} 
            />
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
