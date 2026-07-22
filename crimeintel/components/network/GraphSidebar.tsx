"use client";

import { X, Search, Filter, Lightbulb, User, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface GraphSidebarProps {
  selectedNode: any | null;
  leads: any[];
  onCloseNode: () => void;
  onLeadClick: (lead: any) => void;
  nodeNote?: string;
  onUpdateNote?: (note: string) => void;
}

export function GraphSidebar({ selectedNode, leads, onCloseNode, onLeadClick, nodeNote, onUpdateNote }: GraphSidebarProps) {
  
  return (
    <div className="w-80 h-full border-l border-border bg-card flex flex-col shadow-xl z-10 transition-all">
      {selectedNode ? (
        <div className="flex flex-col h-full overflow-y-auto animate-in slide-in-from-right-4 fade-in">
          <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
            <h3 className="font-semibold flex items-center gap-2">
              {selectedNode.data.entityType === 'Person' && <User className="h-4 w-4 text-primary" />}
              {selectedNode.data.entityType === 'FIR' && <FileText className="h-4 w-4 text-primary" />}
              {selectedNode.data.entityType} Details
            </h3>
            <button 
              onClick={onCloseNode}
              className="p-1 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="p-4 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">{selectedNode.data.label}</h2>
              <p className="text-sm text-muted-foreground uppercase tracking-widest">{selectedNode.id}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold border-b border-border pb-1">Attributes</h4>
              
              {Object.entries(selectedNode.data.details || {}).map(([key, value]) => {
                // Hide generic DB fields
                if (['id', 'name_en', 'name_kn', 'fir_no'].includes(key) || typeof value === 'object') return null;
                
                return (
                  <div key={key} className="flex flex-col">
                    <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium">{String(value)}</span>
                  </div>
                );
              })}
            </div>

            {onUpdateNote && (
              <div className="space-y-2 pt-2 border-t border-border mt-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Investigator Notes
                </h4>
                <textarea
                  className="w-full min-h-[120px] p-2 text-sm bg-background border border-border rounded-md resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Add your notes about this entity here..."
                  value={nodeNote || ''}
                  onChange={(e) => onUpdateNote(e.target.value)}
                />
              </div>
            )}

            <Button className="w-full mt-4" variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Find Connected Nodes
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Network Controls
            </h3>
          </div>
          
          <div className="p-4 space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3">Entity Visibility</h4>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary" />
                  <span>Persons</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary" />
                  <span>FIRs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary" />
                  <span>Vehicles</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary" />
                  <span>Bank Accounts</span>
                </label>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Lightbulb className="h-4 w-4" />
                AI Generated Leads
              </h4>
              
              <div className="space-y-3">
                {leads.map((lead, i) => (
                  <div 
                    key={i} 
                    className="p-3 border border-border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => onLeadClick(lead)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-semibold leading-tight">{lead.title}</span>
                      {lead.confidence === 'High' && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {lead.description}
                    </p>
                  </div>
                ))}
                
                {leads.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No leads detected in current graph view.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
