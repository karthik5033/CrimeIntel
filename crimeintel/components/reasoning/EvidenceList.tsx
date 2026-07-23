import React from 'react';
import { Evidence } from '@/lib/reasoning/types';
import { FileText, User, Folder, Network, BarChart3, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EvidenceListProps {
  evidence: Evidence[];
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  
  const getIcon = (type: Evidence['type']) => {
    switch (type) {
      case 'FIR': return <FileText className="w-4 h-4 text-amber-500" />;
      case 'Person': return <User className="w-4 h-4 text-blue-500" />;
      case 'Case': return <Folder className="w-4 h-4 text-slate-500" />;
      case 'Graph': return <Network className="w-4 h-4 text-indigo-500" />;
      case 'Statistic': return <BarChart3 className="w-4 h-4 text-emerald-500" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-2 mt-2">
      {evidence.map((item, idx) => (
        <div key={idx} className="flex items-start space-x-3 p-3 bg-card border border-border rounded-md hover:border-primary/50 transition-colors group cursor-pointer">
          <div className="mt-0.5">
            {getIcon(item.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs font-mono bg-muted">{item.id}</Badge>
              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-foreground mt-1">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
