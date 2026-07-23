"use client";

import React, { useState, useEffect } from "react";
import { AuditLogger, AuditLogEntry } from "@/lib/api/auditLogger";
import { ShieldCheck, Search, Filter, Download, FileText, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";

export default function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    // Initial load
    setLogs(AuditLogger.getLogs());

    // Poll for updates (since localStorage might be updated by other tabs/components)
    const interval = setInterval(() => {
      setLogs(AuditLogger.getLogs());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => 
    log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateReport = () => {
    AuditLogger.logEvent({
      event_type: "EXPORT",
      user_id: "ADMIN",
      user_role: "ADMIN",
      details: { export_type: "SYSTEM_GOVERNANCE_REPORT", format: "PDF" }
    });
    alert("System Governance Report (PDF) generation initiated. In a real system, this would trigger SmartBrowz.");
  };

  const getEventBadgeColor = (type: string) => {
    switch(type) {
      case "AUTH": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "QUERY": return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "DATA_ACCESS": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "REASONING": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "UNMASK_DATA": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-muted/20">
      {/* Left Panel: Log List */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border/50">
        <div className="p-6 border-b border-border/50 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                System Governance & Audit Trail
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Immutable record of all system queries, data access, and AI operations.
              </p>
            </div>
            <Button onClick={handleGenerateReport} className="gap-2">
              <FileText className="w-4 h-4" />
              Generate Compliance Report
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search logs by user, event, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => AuditLogger.clearLogs()}>
              Clear (Dev Only)
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-card">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>User / Role</TableHead>
                <TableHead>IP / Session</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                    No audit logs found. Interact with the system to generate logs.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map(log => (
                  <TableRow 
                    key={log.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedLog?.id === log.id ? 'bg-primary/5' : ''}`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {format(new Date(log.timestamp), "MMM dd, HH:mm:ss.SSS")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getEventBadgeColor(log.event_type)}>
                        {log.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{log.user_id}</div>
                      <div className="text-xs text-muted-foreground">{log.user_role}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ip_address}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Panel: Detail View */}
      {selectedLog ? (
        <div className="w-[400px] flex-shrink-0 bg-card overflow-y-auto border-l border-border/50 animate-in slide-in-from-right-8 duration-300">
          <div className="p-6 border-b border-border/50 sticky top-0 bg-card z-10 flex items-center justify-between">
            <h2 className="font-semibold text-lg">Log Details</h2>
            <Badge variant="outline" className="font-mono text-xs">{selectedLog.id}</Badge>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Event Type</div>
                <Badge variant="outline" className={getEventBadgeColor(selectedLog.event_type)}>
                  {selectedLog.event_type}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Timestamp</div>
                <div className="text-sm font-mono">{format(new Date(selectedLog.timestamp), "yyyy-MM-dd HH:mm:ss")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">User ID</div>
                <div className="text-sm font-mono">{selectedLog.user_id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Role</div>
                <div className="text-sm">{selectedLog.user_role}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">IP Address</div>
                <div className="text-sm font-mono">{selectedLog.ip_address}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Session</div>
                <div className="text-sm font-mono text-muted-foreground">{selectedLog.session_id}</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-2">Event Payload (JSON)</div>
              <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800">
                <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
            
            {selectedLog.event_type === "REASONING" && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h3 className="text-purple-600 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">🧠</span> AI Explainability Trace
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  This log contains a full deterministic trace of the model's reasoning chain, compatible with external auditing tools for bias and accuracy evaluation.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-[400px] flex-shrink-0 bg-muted/30 flex items-center justify-center border-l border-border/50">
          <div className="text-center p-8 text-muted-foreground">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Select an audit log entry to view full cryptographic details and reasoning traces.</p>
          </div>
        </div>
      )}
    </div>
  );
}
