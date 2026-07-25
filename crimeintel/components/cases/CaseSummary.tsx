"use client";

import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CaseSummaryProps {
  caseId: string;
  initialSummary?: string;
}

export function CaseSummary({ caseId, initialSummary }: CaseSummaryProps) {
  const [summary, setSummary] = useState(initialSummary || "");
  const [loading, setLoading] = useState(!initialSummary);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialSummary) return;

    async function fetchSummary() {
      try {
        const res = await fetch(`/api/cases/${caseId}/summary`);
        if (!res.ok) throw new Error("Failed to generate summary");
        const data = await res.json();
        setSummary(data.summary);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [caseId, initialSummary]);

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Generated Case Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">Error: {error}</p>
        ) : (
          <div className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
            {summary || "No narrative summary could be generated."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
