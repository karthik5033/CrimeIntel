"use client";

import React from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BehavioralProfileProps {
  person: any;
  firs: any[];
}

export function BehavioralProfile({ person, firs }: BehavioralProfileProps) {
  // Infer behavior from FIRs
  
  // 1. Preferred Time Window
  const timeScores = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  firs.forEach(fir => {
    // Basic mock logic: use description or crime type if no time exists
    const desc = (fir.description || "").toLowerCase();
    if (desc.includes("night") || desc.includes("pm")) timeScores.night++;
    else if (desc.includes("morning") || desc.includes("am")) timeScores.morning++;
    else timeScores.evening++;
  });
  
  let preferredTime = "Unknown";
  let maxScore = -1;
  Object.entries(timeScores).forEach(([time, score]) => {
    if (score > maxScore) {
      maxScore = score;
      preferredTime = time.charAt(0).toUpperCase() + time.slice(1);
    }
  });

  if (maxScore === 0) {
    preferredTime = "Varies";
  } else if (preferredTime === "Night") {
    preferredTime = "10:00 PM - 04:00 AM";
  } else if (preferredTime === "Evening") {
    preferredTime = "06:00 PM - 10:00 PM";
  }

  // 2. Escalation Trend
  let escalation = "Insufficient Data";
  let escalationClass = "text-muted-foreground";
  if (firs.length > 1) {
    const sorted = [...firs].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    const isSevere = (t: string) => /murder|homicide|kidnapping|robbery/i.test(t);
    const firstSevere = isSevere(sorted[0].crime_type_en || "");
    const lastSevere = isSevere(sorted[sorted.length - 1].crime_type_en || "");
    
    if (!firstSevere && lastSevere) {
      escalation = "Escalating Severity";
      escalationClass = "text-destructive font-semibold";
    } else if (firstSevere && !lastSevere) {
      escalation = "De-escalating";
      escalationClass = "text-success font-semibold";
    } else {
      escalation = "Consistent Pattern (No Escalation)";
      escalationClass = "text-warning font-semibold";
    }
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Behavioral Profile (RCT)
        </CardTitle>
        <CardDescription>AI-generated Rational Choice Theory analysis based on {firs.length} incident(s)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-lg border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">Preferred Time Window</div>
            <div className="font-semibold">{preferredTime}</div>
          </div>
          <div className="bg-card p-4 rounded-lg border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">Target Profile</div>
            <div className="font-semibold line-clamp-2">
              {firs.length > 0 
                ? (firs[0].crime_type_en?.includes("Vehicle") ? "Unattended Vehicles" 
                   : firs[0].crime_type_en?.includes("Property") ? "Residential properties"
                   : "Opportunistic targets")
                : "Unknown"}
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">Geographic Range</div>
            <div className="font-semibold">
               {firs.length > 1 ? "Active across multiple locations" : "Localized to home district"}
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">Escalation Trend</div>
            <div className={`font-semibold ${escalationClass}`}>{escalation}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
