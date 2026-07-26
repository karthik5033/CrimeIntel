"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRightLeft, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  timestamp: string;
  type: string;
  flagged?: boolean;
}

interface TransactionTimelineProps {
  transactions: Transaction[];
}

export function TransactionTimeline({ transactions }: TransactionTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-secondary" />
          Recent Suspicious Transactions
        </CardTitle>
        <CardDescription>Chronological list of flagged activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {transactions.map((tx, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${tx.flagged ? 'bg-destructive/5 border-destructive/20' : 'bg-card'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</span>
                {tx.flagged && <Badge variant="destructive" className="text-[10px]">Flagged</Badge>}
              </div>
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div className="font-mono text-sm bg-muted px-2 py-1 rounded">{tx.from_account_id}</div>
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                  <div className="font-mono text-sm bg-muted px-2 py-1 rounded">{tx.to_account_id}</div>
                </div>
                <div className="font-bold text-lg text-foreground">
                  ₹{tx.amount.toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground uppercase tracking-wider">
                Type: {tx.type}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">No transactions to display.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
