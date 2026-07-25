"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileSearch, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SimilarCasesProps {
  caseId: string;
}

export function SimilarCases({ caseId }: SimilarCasesProps) {
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const res = await fetch(`/api/cases/${caseId}/similar`);
        if (res.ok) {
          const data = await res.json();
          setSimilar(data.similar || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSimilar();
  }, [caseId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSearch className="w-5 h-5 text-secondary" />
          Similar Cases
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))
          ) : similar.length > 0 ? (
            similar.map((simCase, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div>
                  <Link href={`/cases/${simCase.id}`} className="font-semibold text-primary hover:underline flex items-center gap-1">
                    {simCase.case_no || simCase.id}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    Match: {simCase.matchReason}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {(simCase.score * 100).toFixed(0)}% Match
                  </Badge>
                  <Link href={`/cases/${simCase.id}`} className="text-muted-foreground hover:text-foreground">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No highly similar cases found.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
