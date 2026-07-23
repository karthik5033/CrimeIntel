"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ShieldAlert, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { maskName } from "@/lib/utils/dataMasking";

export type PersonProfile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  district: string;
  risk_score: number;
  fir_count: number;
  role: string;
};

export function ClientProfilesList({ initialProfiles }: { initialProfiles: PersonProfile[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortField, setSortField] = useState<keyof PersonProfile>("risk_score");
  const [sortDesc, setSortDesc] = useState(true);
  const router = useRouter();
  const { t } = useLanguage();
  const { role } = useAuth();

  const handleSort = (field: keyof PersonProfile) => {
    if (sortField === field) setSortDesc(!sortDesc);
    else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const filteredAndSorted = initialProfiles
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "ALL" || p.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDesc ? valB - valA : valA - valB;
      }
      return 0;
    });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Offender Profiles</h1>
          <p className="text-muted-foreground mt-1">Search and manage criminal records and suspect profiles.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[250px] bg-card"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || "ALL")}>
            <SelectTrigger className="w-[150px] bg-card">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="ACCUSED">Accused</SelectItem>
              <SelectItem value="VICTIM">Victim</SelectItem>
              <SelectItem value="WITNESS">Witness</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:bg-muted/80">
                <div className="flex items-center gap-2">Name <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead onClick={() => handleSort("age")} className="cursor-pointer hover:bg-muted/80 w-24">
                <div className="flex items-center gap-2">Age <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Role</TableHead>
              <TableHead onClick={() => handleSort("fir_count")} className="cursor-pointer hover:bg-muted/80">
                <div className="flex items-center gap-2">FIRs Linked <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead onClick={() => handleSort("risk_score")} className="cursor-pointer hover:bg-muted/80 text-right">
                <div className="flex items-center justify-end gap-2">Risk Score <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.slice(0, 50).map((person) => (
              <TableRow 
                key={person.id} 
                className="cursor-pointer hover:bg-accent/10 transition-colors"
                onClick={() => router.push(`/profiles/${person.id}`)}
              >
                <TableCell className="font-medium text-foreground">{maskName(person.name, role)}</TableCell>
                <TableCell className="text-muted-foreground">{person.age}</TableCell>
                <TableCell className="text-muted-foreground">{person.gender}</TableCell>
                <TableCell>
                  <Badge variant={person.role === "ACCUSED" ? "destructive" : person.role === "VICTIM" ? "default" : "secondary"}>
                    {person.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center justify-center bg-muted text-muted-foreground font-mono text-xs rounded-full h-6 w-6">
                    {person.fir_count}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {person.risk_score >= 80 && <ShieldAlert className="h-4 w-4 text-destructive" />}
                    <span className={`font-semibold ${
                      person.risk_score >= 80 ? "text-destructive" :
                      person.risk_score >= 50 ? "text-warning" : "text-success"
                    }`}>
                      {person.risk_score}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredAndSorted.length > 50 && (
          <div className="p-4 text-center border-t border-border text-sm text-muted-foreground bg-muted/20">
            Showing top 50 of {filteredAndSorted.length} matching profiles
          </div>
        )}
        {filteredAndSorted.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No profiles found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
