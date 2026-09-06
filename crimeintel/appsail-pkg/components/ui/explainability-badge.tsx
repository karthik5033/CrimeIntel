"use client";

import React, { useState } from "react";
import { BrainCircuit, Info, ShieldAlert, CheckCircle2, AlertTriangle, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuditLogger } from "@/lib/api/auditLogger";
import { useAuth } from "@/lib/AuthContext";

export interface ExplainabilityData {
  mechanism: string;
  confidence: number;
  dataSources: string[];
  alternatives?: string[];
}

interface ExplainabilityBadgeProps {
  data: ExplainabilityData;
  className?: string;
  contextId?: string;
}

export function ExplainabilityBadge({ data, className, contextId = "generic" }: ExplainabilityBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { userId, role } = useAuth();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      AuditLogger.logEvent({
        event_type: "REASONING",
        user_id: userId,
        user_role: role,
        details: { action: "VIEWED_EXPLAINABILITY", contextId, data }
      });
    }
  };

  const handleReport = () => {
    AuditLogger.logEvent({
      event_type: "ALERT",
      user_id: userId,
      user_role: role,
      details: { action: "REPORTED_AI_OUTPUT", contextId, data }
    });
    alert("This output has been flagged for human review.");
    setIsOpen(false);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-amber-500";
    return "text-red-500";
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 90) return <CheckCircle2 className={`w-4 h-4 ${getConfidenceColor(score)}`} />;
    if (score >= 70) return <Info className={`w-4 h-4 ${getConfidenceColor(score)}`} />;
    return <AlertTriangle className={`w-4 h-4 ${getConfidenceColor(score)}`} />;
  };

  return (
    <div className="relative inline-block">
      <Badge 
        variant="secondary" 
        className={`cursor-pointer hover:bg-secondary/80 gap-1.5 transition-colors ${className}`}
        onClick={() => handleOpenChange(!isOpen)}
      >
        <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />
        <span className="font-medium text-xs">AI Generated</span>
      </Badge>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => handleOpenChange(false)} />
          <div className="absolute left-0 mt-2 z-50 w-80 bg-card border border-border shadow-md rounded-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-500" />
                <h4 className="font-semibold text-sm text-foreground">AI Reasoning Trace</h4>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                {getConfidenceIcon(data.confidence)}
                <span className={getConfidenceColor(data.confidence)}>{data.confidence}%</span>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 tracking-wider">Mechanism</h5>
                <p className="text-sm leading-relaxed text-foreground">{data.mechanism}</p>
              </div>

              <div>
                <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Data Sources Used
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {data.dataSources.map((source, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-background text-foreground">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>

              {data.alternatives && data.alternatives.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 tracking-wider">Considered Alternatives</h5>
                  <ul className="text-sm list-disc pl-4 space-y-1 text-muted-foreground">
                    {data.alternatives.map((alt, idx) => (
                      <li key={idx}>{alt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-3 bg-muted/50 border-t border-border/50">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleReport}>
                <ShieldAlert className="w-4 h-4 mr-2" />
                Flag for Human Review
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
