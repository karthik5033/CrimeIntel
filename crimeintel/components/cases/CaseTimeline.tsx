"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CaseTimelineProps {
  firs: any[];
}

export function CaseTimeline({ firs }: CaseTimelineProps) {
  // Sort FIRs by date for timeline
  const sortedFirs = [...firs].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-secondary" />
          Investigation Timeline
        </CardTitle>
        <CardDescription>Chronological sequence of FIRs and events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 pl-4 border-l-2 border-muted ml-2">
          {sortedFirs.map((fir: any, idx: number) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[21px] mt-1.5 w-3 h-3 rounded-full bg-secondary ring-4 ring-card" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{fir.date}</span>
                  <Badge variant="outline" className="text-xs">{fir.status || "Filed"}</Badge>
                </div>
                <div className="bg-muted/30 p-4 rounded-md mt-2 border">
                  <Link href={`/firs/${fir.id}`} className="font-semibold text-primary hover:underline flex items-center gap-1 mb-1">
                    {fir.fir_no || fir.id} <ArrowRight className="w-3 h-3" />
                  </Link>
                  <p className="text-sm font-medium text-foreground">{fir.crime_type_en || fir.crime_type}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{fir.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> {fir.station_id || fir.police_station_id}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {sortedFirs.length === 0 && (
            <div className="text-sm text-muted-foreground">No timeline events found.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
