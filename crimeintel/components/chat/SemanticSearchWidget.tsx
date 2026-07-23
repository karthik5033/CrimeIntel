import React from 'react';
import { Database, Zap, BookOpen } from 'lucide-react';

interface RAGContextProps {
  context: Array<{
    id: string;
    type: string;
    title: string;
    snippet: string;
    similarity: number;
  }>;
}

export function SemanticSearchWidget({ context }: RAGContextProps) {
  if (!context || context.length === 0) return null;
  
  return (
    <div className="mt-4 p-4 border border-indigo-500/20 rounded-lg bg-indigo-500/5 shadow-sm animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-indigo-500" />
        <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase">RAG Context Retrieved</h4>
        <div className="ml-auto flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
          <Zap className="w-3 h-3" /> Semantic Similarity
        </div>
      </div>
      
      <div className="space-y-2">
        {context.map((item, idx) => (
          <div key={idx} className="p-3 bg-card rounded border border-border flex items-start gap-3 transition-colors hover:bg-muted/50">
            <div className="mt-0.5">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{item.title}</span>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {(item.similarity * 100).toFixed(1)}% Match
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.snippet}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
