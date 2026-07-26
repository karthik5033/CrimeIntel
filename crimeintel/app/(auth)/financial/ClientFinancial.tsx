'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  TrendingUp,
  Users,
  ArrowRightLeft,
  DollarSign,
  Shield,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { MoneyFlowSankey } from '@/components/financial/MoneyFlowSankey';
import { TransactionTimeline } from '@/components/financial/TransactionTimeline';
import type { BankAccount, Transaction, MoneyTrailNode } from '@/types';

// Mock data generator (replace with actual API call)
import { generateBankAccounts, generateFinancialTransactions, generateFinancialSummary } from '@/data/seed/financial-transactions';
import {
  buildMoneyTrailGraph,
  detectCircularFlows,
  detectMuleAccounts,
  detectVelocitySpikes,
  generateFinancialIntelligence,
  traceForwardFlow,
} from '@/lib/financial/money-trail-engine';

export function ClientFinancial() {
  // Mock data - replace with actual data fetch
  const mockPersons = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: `person_${i}`,
      name: `Person ${i}`,
      dob: '1990-01-01',
      age: 30 + i,
      gender: i % 2 === 0 ? 'Male' : 'Female' as 'Male' | 'Female',
      role: 'Accused' as const,
    }));
  }, []);
  
  const accounts = useMemo(() => generateBankAccounts(mockPersons), [mockPersons]);
  const transactions = useMemo(() => generateFinancialTransactions(accounts), [accounts]);
  const summary = useMemo(() => generateFinancialSummary(transactions), [transactions]);
  const intelligence = useMemo(
    () => generateFinancialIntelligence(accounts, transactions),
    [accounts, transactions]
  );
  
  const { nodes, edges } = useMemo(
    () => buildMoneyTrailGraph(accounts, transactions),
    [accounts, transactions]
  );
  
  const circularFlows = useMemo(() => detectCircularFlows(transactions), [transactions]);
  const muleAccounts = useMemo(() => detectMuleAccounts(accounts, transactions), [accounts, transactions]);
  
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Format currency
  const formatAmount = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`;
    return `₹${amount.toFixed(0)}`;
  };
  
  // KPI cards
  const kpiCards = [
    {
      title: 'Total Transactions',
      value: summary.totalTransactions.toLocaleString(),
      subtext: `${summary.flaggedTransactions} flagged`,
      icon: ArrowRightLeft,
      color: 'bg-blue-500',
      trend: null,
    },
    {
      title: 'Transaction Volume',
      value: formatAmount(summary.totalVolume),
      subtext: `${formatAmount(summary.flaggedVolume)} flagged`,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: '+12.3%',
    },
    {
      title: 'Flagged Accounts',
      value: intelligence.flaggedAccounts.toString(),
      subtext: `${intelligence.muleAccounts} mule accounts`,
      icon: AlertTriangle,
      color: 'bg-amber-500',
      trend: null,
    },
    {
      title: 'Circular Flows',
      value: intelligence.circularFlows.toString(),
      subtext: 'Potential laundering',
      icon: Shield,
      color: 'bg-red-500',
      trend: null,
    },
  ];
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <div className={`w-2 ${card.color}`} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-slate-600">{card.title}</span>
                    <card.icon className={`w-5 h-5 ${card.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">{card.subtext}</span>
                      {card.trend && (
                        <Badge variant="success" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {card.trend}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Intelligence Summary */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-5 h-5" />
            Financial Intelligence Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-900 mb-4">{intelligence.summary}</p>
          
          <div className="space-y-2">
            <p className="text-sm font-semibold text-amber-900">Recommended Actions:</p>
            <ul className="space-y-1">
              {intelligence.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Money Flow</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Accounts</TabsTrigger>
          <TabsTrigger value="patterns">Suspicious Patterns</TabsTrigger>
          <TabsTrigger value="timeline">
            {selectedAccount ? 'Transaction Timeline' : 'Select Account'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <MoneyFlowSankey
            nodes={nodes.slice(0, 30)} // Show subset for performance
            edges={edges.filter(e =>
              nodes.slice(0, 30).some(n => n.accountId === e.from) &&
              nodes.slice(0, 30).some(n => n.accountId === e.to)
            )}
            onNodeClick={(node) => {
              setSelectedAccount(node.accountId);
              setSelectedTab('timeline');
            }}
            height={500}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Transaction Network Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Total Accounts:</span>
                  <span className="ml-2 font-semibold">{accounts.length}</span>
                </div>
                <div>
                  <span className="text-slate-600">Active Accounts:</span>
                  <span className="ml-2 font-semibold">
                    {nodes.filter(n => n.transactionCount > 0).length}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Total Flows:</span>
                  <span className="ml-2 font-semibold">{edges.length}</span>
                </div>
                <div>
                  <span className="text-slate-600">Flagged Flows:</span>
                  <span className="ml-2 font-semibold text-amber-600">
                    {edges.filter(e => e.flagged).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="flagged" className="space-y-4">
          <div className="grid gap-4">
            {/* Flagged Accounts Table */}
            <Card>
              <CardHeader>
                <CardTitle>Flagged Accounts ({accounts.filter(a => a.flagged).length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {accounts
                    .filter(a => a.flagged)
                    .slice(0, 10)
                    .map((account) => {
                      const node = nodes.find(n => n.accountId === account.id);
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => {
                            setSelectedAccount(account.id);
                            setSelectedTab('timeline');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {node?.isMule && (
                              <Badge variant="destructive">Mule</Badge>
                            )}
                            <div>
                              <div className="font-mono text-sm">{account.accountNumber}</div>
                              <div className="text-xs text-slate-500">{account.bank}</div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {node ? formatAmount(node.balance) : formatAmount(account.balance || 0)}
                            </div>
                            <div className="text-xs text-amber-600">{account.flagReason}</div>
                          </div>
                          
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="patterns" className="space-y-4">
          {/* Circular Flows */}
          <Card>
            <CardHeader>
              <CardTitle>Circular Money Flows ({circularFlows.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {circularFlows.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No circular flows detected</p>
              ) : (
                <div className="space-y-3">
                  {circularFlows.slice(0, 5).map((flow, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-red-50 border-red-200">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="destructive">Circular Flow</Badge>
                        <span className="text-sm font-semibold text-red-700">
                          {formatAmount(flow.totalAmount)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700">
                        <span className="font-medium">Path:</span>{' '}
                        {flow.cycle.map((acc, i) => {
                          const account = accounts.find(a => a.id === acc);
                          return (
                            <span key={i}>
                              {account?.accountNumber.slice(-4) || acc.slice(-4)}
                              {i < flow.cycle.length - 1 && ' → '}
                            </span>
                          );
                        })}
                        {' '}→ {accounts.find(a => a.id === flow.cycle[0])?.accountNumber.slice(-4) || flow.cycle[0].slice(-4)}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {flow.transactions.length} transactions in cycle
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Mule Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Suspected Mule Accounts ({muleAccounts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {muleAccounts.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No mule accounts detected</p>
              ) : (
                <div className="space-y-3">
                  {muleAccounts.slice(0, 5).map((mule, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge variant="warning">Mule Account</Badge>
                          <div className="font-mono text-sm mt-1">{mule.account.accountNumber}</div>
                        </div>
                        <span className="text-sm font-semibold text-amber-700">
                          {formatAmount(mule.throughput)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mt-2">
                        <div>
                          <span className="font-medium">Avg Hold:</span> {mule.averageHoldTime.toFixed(1)}h
                        </div>
                        <div>
                          <span className="font-medium">Forward Rate:</span> {mule.forwardingRate.toFixed(1)}%
                        </div>
                        <div>
                          <span className="font-medium">Throughput:</span> {formatAmount(mule.throughput)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Suspicious Patterns Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Pattern Detection Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {summary.suspiciousPatterns.map((pattern) => (
                  <div key={pattern} className="flex items-center gap-2 p-3 border rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div>
                      <div className="font-medium capitalize">
                        {pattern.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-slate-500">Detected</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeline">
          {selectedAccount ? (
            <TransactionTimeline
              accountId={selectedAccount}
              transactions={transactions}
              initialBalance={accounts.find(a => a.id === selectedAccount)?.balance || 0}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-slate-500">
                Select an account from the Money Flow view to see its transaction timeline
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
