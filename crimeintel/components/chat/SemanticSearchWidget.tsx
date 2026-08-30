import React from 'react';
import { Database, Zap, BookOpen, Search, Activity, Network } from 'lucide-react';

interface RAGContextProps {
  context: Array<{
    source: 'SQLAgent' | 'GraphAgent' | 'VectorAgent' | 'AnalyticsAgent';
    data: any[];
  }>;
}

export function SemanticSearchWidget({ context }: RAGContextProps) {
  if (!context || context.length === 0) return null;
  
  return (
    <div className="mt-4 p-4 border border-indigo-500/20 rounded-lg bg-indigo-500/5 shadow-sm animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-indigo-500" />
        <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase">Multi-Agent Intelligence context</h4>
        <div className="ml-auto flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
          <Zap className="w-3 h-3" /> ZCQL Engine
        </div>
      </div>
      
      <div className="space-y-3">
        {context.map((agentEvidence, idx) => {
          if (!agentEvidence.data) return null;
          
          const dataArray = Array.isArray(agentEvidence.data) ? agentEvidence.data : [agentEvidence.data];
          if (dataArray.length === 0) return null;
          
          let Icon = Database;
          let label = "Database Records";
          
          if (agentEvidence.source === 'SQLAgent') {
            Icon = Search;
            label = "Structured Search";
          } else if (agentEvidence.source === 'VectorAgent') {
            Icon = BookOpen;
            label = "Semantic Matches";
          } else if (agentEvidence.source === 'GraphAgent') {
            Icon = Network;
            label = "Network Connections";
          } else if (agentEvidence.source === 'AnalyticsAgent') {
            Icon = Activity;
            label = "Aggregated Analytics";
          }

          return (
            <div key={idx} className="p-3 bg-card rounded border border-border flex flex-col gap-2 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase border-b border-border pb-1">
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </div>
              
              <div className="space-y-2">
                {agentEvidence.source === 'VectorAgent' ? (
                  // Vector format
                  dataArray.map((item: any, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-foreground">{item.title || item.fir_no || 'Document'}</span>
                        {item.similarity && (
                          <span className="text-[10px] bg-muted px-1 rounded text-muted-foreground">
                            {(item.similarity * 100).toFixed(0)}% Match
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-2">{item.snippet || item.description}</span>
                    </div>
                  ))
                ) : (
                  // Default format (FIRs/Cases)
                  dataArray.slice(0, 3).map((item: any, i) => (
                    <div key={i} className="text-xs flex items-center gap-2">
                      <span className="font-medium text-foreground">{item.fir_no || item.case_no || 'Record'}</span>
                      <span className="text-muted-foreground line-clamp-1">{item.crime_type_en || item.description || JSON.stringify(item)}</span>
                    </div>
                  ))
                )}
                
                {dataArray.length > 3 && agentEvidence.source !== 'VectorAgent' && (
                  <div className="text-xs text-indigo-500 font-medium italic">
                    + {dataArray.length - 3} more records processed in background...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
