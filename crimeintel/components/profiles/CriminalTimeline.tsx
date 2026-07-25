"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CriminalTimelineProps {
  firs: any[];
}

export function CriminalTimeline({ firs }: CriminalTimelineProps) {
  // Simple severity logic based on crime type
  const getSeverityColor = (crimeType: string) => {
    const lowerType = (crimeType || "").toLowerCase();
    if (lowerType.includes("murder") || lowerType.includes("homicide") || lowerType.includes("kidnapping")) {
      return "bg-destructive ring-destructive/20";
    }
    if (lowerType.includes("robbery") || lowerType.includes("assault") || lowerType.includes("burglary")) {
      return "bg-warning ring-warning/20";
    }
    return "bg-primary ring-primary/20";
  };

  // Sort FIRs chronologically (descending)
  const sortedFirs = [...firs].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return dateB - dateA;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Criminal History Timeline
        </CardTitle>
        <CardDescription>Linked First Information Reports ({firs.length})</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 pl-4 border-l-2 border-muted ml-2">
          {sortedFirs.map((fir: any, idx: number) => {
            const severityClass = getSeverityColor(fir.crime_type_en || fir.crime_type);
            return (
              <div key={idx} className="relative">
                <div className={`absolute -left-[21px] mt-1.5 w-3 h-3 rounded-full ${severityClass} ring-4`} />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/firs/${fir.id}`} className="font-semibold text-primary hover:underline">
                      {fir.fir_no || fir.id}
                    </Link>
                    <span className="text-sm text-muted-foreground">{fir.date || "Unknown Date"}</span>
                    <Badge variant="outline" className="text-xs">{fir.relationship}</Badge>
                    {fir.status_en && (
                      <Badge variant="secondary" className="text-[10px] uppercase">{fir.status_en}</Badge>
                    )}
                  </div>
                  <p className="text-foreground font-medium">{fir.crime_type_en || fir.crime_type}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{fir.description}</p>
                </div>
              </div>
            );
          })}
          {sortedFirs.length === 0 && (
            <div className="text-sm text-muted-foreground">No linked FIRs found.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
