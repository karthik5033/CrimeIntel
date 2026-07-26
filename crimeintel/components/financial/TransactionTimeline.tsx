'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, AlertCircle } from 'lucide-react';
import type { Transaction } from '@/types';

interface TransactionTimelineProps {
  accountId: string;
  transactions: Transaction[];
  initialBalance?: number;
}

export function TransactionTimeline({
  accountId,
  transactions,
  initialBalance = 0,
}: TransactionTimelineProps) {
  // Sort transactions chronologically
  const sortedTransactions = useMemo(() => {
    return [...transactions]
      .filter(t => t.fromAccountId === accountId || t.toAccountId === accountId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [transactions, accountId]);
  
  // Calculate running balance
  const timelineData = useMemo(() => {
    let balance = initialBalance;
    
    return sortedTransactions.map(txn => {
      const isOutbound = txn.fromAccountId === accountId;
      const amount = isOutbound ? -txn.amount : txn.amount;
      balance += amount;
      
      return {
        transaction: txn,
        isOutbound,
        amount,
        balance,
      };
    });
  }, [sortedTransactions, accountId, initialBalance]);
  
  // Format currency
  const formatAmount = (amount: number) => {
    const abs = Math.abs(amount);
    if (abs >= 10000000) return `₹${(abs / 10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `₹${(abs / 100000).toFixed(2)}L`;
    if (abs >= 1000) return `₹${(abs / 1000).toFixed(2)}K`;
    return `₹${abs.toFixed(0)}`;
  };
  
  // Format date/time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  };
  
  if (timelineData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          No transactions found for this account
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transaction Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Initial balance */}
          <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
            <span className="text-slate-600">Opening Balance</span>
            <span className="font-semibold">{formatAmount(initialBalance)}</span>
          </div>
          
          {/* Transactions */}
          {timelineData.map((item, idx) => {
            const { date, time } = formatTimestamp(item.transaction.timestamp);
            
            return (
              <div
                key={item.transaction.id}
                className={`relative pl-8 py-3 border-l-2 ${
                  item.transaction.flagged ? 'border-amber-500' : 'border-slate-200'
                }`}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 ${
                    item.transaction.flagged
                      ? 'bg-amber-500 border-amber-600'
                      : item.isOutbound
                      ? 'bg-red-100 border-red-400'
                      : 'bg-green-100 border-green-400'
                  }`}
                >
                  {item.transaction.flagged && (
                    <AlertCircle className="w-3 h-3 text-white absolute inset-0 m-auto" />
                  )}
                </div>
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={item.isOutbound ? 'destructive' : 'success'}
                        className="text-xs"
                      >
                        {item.isOutbound ? (
                          <>
                            <ArrowUp className="w-3 h-3 mr-1" />
                            Sent
                          </>
                        ) : (
                          <>
                            <ArrowDown className="w-3 h-3 mr-1" />
                            Received
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.transaction.type}
                      </Badge>
                      {item.transaction.flagged && (
                        <Badge variant="warning" className="text-xs">
                          Flagged
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-700 mb-1">
                      {item.transaction.description || 'Transaction'}
                    </p>
                    
                    {item.transaction.flagReason && (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded mt-1">
                        ⚠ {item.transaction.flagReason}
                      </p>
                    )}
                    
                    <p className="text-xs text-slate-500 mt-1">
                      {date} at {time}
                    </p>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-base font-semibold mb-1 ${
                        item.isOutbound ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {item.isOutbound ? '-' : '+'}{formatAmount(item.amount)}
                    </div>
                    <div className="text-xs text-slate-600">
                      Balance: <span className="font-medium">{formatAmount(item.balance)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Final balance */}
          <div className="flex items-center justify-between py-3 px-3 bg-slate-100 rounded-lg text-sm font-semibold mt-2">
            <span>Closing Balance</span>
            <span className={timelineData[timelineData.length - 1].balance < 0 ? 'text-red-600' : ''}>
              {formatAmount(timelineData[timelineData.length - 1].balance)}
            </span>
          </div>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600">Total Transactions:</span>
            <span className="ml-2 font-semibold">{timelineData.length}</span>
          </div>
          <div>
            <span className="text-slate-600">Flagged:</span>
            <span className="ml-2 font-semibold text-amber-600">
              {timelineData.filter(t => t.transaction.flagged).length}
            </span>
          </div>
          <div>
            <span className="text-slate-600">Total Received:</span>
            <span className="ml-2 font-semibold text-green-600">
              {formatAmount(
                timelineData
                  .filter(t => !t.isOutbound)
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </span>
          </div>
          <div>
            <span className="text-slate-600">Total Sent:</span>
            <span className="ml-2 font-semibold text-red-600">
              {formatAmount(
                Math.abs(
                  timelineData
                    .filter(t => t.isOutbound)
                    .reduce((sum, t) => sum + t.amount, 0)
                )
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
