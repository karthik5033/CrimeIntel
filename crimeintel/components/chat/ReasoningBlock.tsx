"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, BrainCircuit, Search, Network, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReasoningBlock as NewReasoningBlock } from "@/components/reasoning/ReasoningBlock";

interface ReasoningBlockProps {
  isThinking?: boolean;
  data?: {
    understanding: string;
    retrieving: string;
    analyzing: string;
    mechanism: string;
    evidence: string;
    alternatives: string;
  };
}

export function ReasoningBlock({ isThinking, data }: ReasoningBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);

  // Simulate thinking steps animation
  useEffect(() => {
    if (isThinking) {
      const interval = setInterval(() => {
        setThinkingStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isThinking]);

  if (isThinking) {
    const steps = [
      { icon: Search, text: "Understanding your query..." },
      { icon: CheckCircle2, text: "Retrieving relevant records..." },
      { icon: Network, text: "Analyzing relationships..." },
      { icon: BrainCircuit, text: "Applying investigative reasoning..." },
      { icon: ShieldAlert, text: "Composing response..." }
    ];

    return (
      <div className="flex flex-col gap-2 p-3 bg-secondary/30 rounded-md border border-border w-fit min-w-[250px]">
        {steps.map((step, index) => {
          const isActive = index === thinkingStep;
          const isDone = index < thinkingStep;
          const StepIcon = step.icon;

          if (index > thinkingStep) return null;

          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <StepIcon className={cn("h-4 w-4", isActive ? "text-primary animate-pulse" : "text-muted-foreground")} />
              <span className={cn(isActive ? "text-foreground font-medium" : "text-muted-foreground")}>
                {step.text}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (!data) return null;

  // Check if it's the new ReasoningOutput format (has claim)
  if ('claim' in data) {
    return <NewReasoningBlock output={data as any} />;
  }

  return (
    <div className="my-2 border border-border rounded-lg overflow-hidden bg-card">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm font-medium"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-primary" />
          <span>AI Reasoning Trace</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">Crime Pattern Theory</span>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4 text-sm bg-card border-t border-border">
          <div>
            <h4 className="font-semibold text-foreground mb-1 text-xs uppercase tracking-wider text-muted-foreground">Mechanism</h4>
            <p className="text-foreground/90">{data.mechanism}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1 text-xs uppercase tracking-wider text-muted-foreground">Evidence</h4>
            <p className="text-foreground/90">{data.evidence}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1 text-xs uppercase tracking-wider text-muted-foreground">Alternative Hypotheses Rejected</h4>
            <p className="text-foreground/90 italic">{data.alternatives}</p>
          </div>
        </div>
      )}
    </div>
  );
}
