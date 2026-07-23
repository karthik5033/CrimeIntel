"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ArrowUpDown, FileText, CheckCircle2, Clock, AlertCircle, FolderSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";

export type CaseOverview = {
  id: string;
  case_no: string;
  status: string;
  fir_count: number;
  firs: string[];
  summary: string;
  primary_crime_type?: string;
  primary_district?: string;
  latest_date?: string;
};

export function ClientCasesList({ initialCases }: { initialCases: CaseOverview[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState<keyof CaseOverview>("latest_date");
  const [sortDesc, setSortDesc] = useState(true);
  const router = useRouter();

  const handleSort = (field: keyof CaseOverview) => {
    if (sortField === field) setSortDesc(!sortDesc);
    else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const filteredAndSorted = initialCases
    .filter((c) => {
      const matchSearch = c.case_no.toLowerCase().includes(search.toLowerCase()) || 
                          c.summary.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || c.status.toUpperCase() === statusFilter.toUpperCase();
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDesc ? valB - valA : valA - valB;
      }
      return 0;
    });

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "CLOSED": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "ACTIVE": return <Activity className="w-4 h-4 text-warning" />;
      case "PENDING": return <Clock className="w-4 h-4 text-muted-foreground" />;
      default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };
  
  // Need to import Activity
  const Activity = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Case Management</h1>
          <p className="text-muted-foreground mt-1">Track active investigations and historical cases.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by case number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[250px] bg-card"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
            <SelectTrigger className="w-[150px] bg-card">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead onClick={() => handleSort("case_no")} className="cursor-pointer hover:bg-muted/80">
                <div className="flex items-center gap-2">Case No <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead onClick={() => handleSort("latest_date")} className="cursor-pointer hover:bg-muted/80 w-32">
                <div className="flex items-center gap-2">Date <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead>Primary Type</TableHead>
              <TableHead>District</TableHead>
              <TableHead onClick={() => handleSort("fir_count")} className="cursor-pointer hover:bg-muted/80 text-center">
                <div className="flex items-center justify-center gap-2">FIRs <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead onClick={() => handleSort("status")} className="cursor-pointer hover:bg-muted/80 text-right">
                <div className="flex items-center justify-end gap-2">Status <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.slice(0, 50).map((c) => (
              <TableRow 
                key={c.id} 
                className="cursor-pointer hover:bg-accent/10 transition-colors"
                onClick={() => router.push(`/cases/${c.id}`)}
              >
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {c.case_no}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.latest_date || "N/A"}</TableCell>
                <TableCell className="text-muted-foreground truncate max-w-[200px]" title={c.primary_crime_type}>{c.primary_crime_type || "Multiple"}</TableCell>
                <TableCell className="text-muted-foreground">{c.primary_district || "Unknown"}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center bg-muted text-muted-foreground font-mono text-xs rounded-full h-6 w-6">
                    {c.fir_count}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {getStatusIcon(c.status)}
                    <span className={`text-sm font-medium ${
                      c.status.toUpperCase() === "ACTIVE" ? "text-warning" :
                      c.status.toUpperCase() === "CLOSED" ? "text-success" : "text-muted-foreground"
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredAndSorted.length > 50 && (
          <div className="p-4 text-center border-t border-border text-sm text-muted-foreground bg-muted/20">
            Showing top 50 of {filteredAndSorted.length} matching cases
          </div>
        )}
        {filteredAndSorted.length === 0 && (
          <EmptyState 
            icon={FolderSearch}
            title="No cases found"
            description="We couldn't find any cases matching your current search or status filters. Try adjusting your search query."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearch("");
              setStatusFilter("ALL");
            }}
          />
        )}
      </div>
    </div>
  );
}
