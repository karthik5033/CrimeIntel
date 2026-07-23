import { MockDataClient } from "@/lib/api/mockDataClient";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, MapPin, ShieldAlert, Clock, ArrowRight, User, Network, FileSearch, Sparkles, Activity, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientMaskedName } from "@/components/shared/ClientMaskedName";

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const caseData = MockDataClient.getCases().find((c: any) => c.id === params.id);
  
  if (!caseData) {
    notFound();
  }

  // Resolve FIRs
  const firsData = (caseData.firs || []).map((firId: string) => MockDataClient.getFIRById(firId)).filter(Boolean);
  
  // Sort FIRs by date for timeline
  firsData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Aggregate entities from all FIRs in this case
  const allEdges = MockDataClient.getEntityRelationships();
  
  // Find all edges connecting to any of the FIRs in this case
  const caseEdges = allEdges.filter((e: any) => 
    caseData.firs.includes(e.source) || caseData.firs.includes(e.target)
  );

  // Group entities by type based on edges
  const persons = caseEdges.filter((e: any) => e.target.startsWith('PERSON_') || e.source.startsWith('PERSON_'));
  const vehicles = caseEdges.filter((e: any) => e.target.startsWith('VEHICLE_') || e.source.startsWith('VEHICLE_'));
  const weapons = caseEdges.filter((e: any) => e.target.startsWith('WEAPON_') || e.source.startsWith('WEAPON_'));

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "CLOSED": return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "ACTIVE": return <Activity className="w-5 h-5 text-warning" />;
      case "PENDING": return <Clock className="w-5 h-5 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">{caseData.case_no || caseData.id}</h1>
            <Badge variant="outline" className="text-sm uppercase tracking-wider">
              {caseData.status}
            </Badge>
          </div>
          <p className="text-xl text-muted-foreground">
            {firsData.length > 0 ? firsData[0]?.crime_type_en : "Multiple Offenses"}
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Started: {firsData.length > 0 ? firsData[0]?.date : "Unknown"}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" asChild>
            <Link href={`/network?focus=${caseData.id}`}>
              <Network className="w-4 h-4 mr-2" />
              View Case Graph
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/chat?context=${caseData.id}`}>
              <Sparkles className="w-4 h-4 mr-2" />
              Ask AI About Case
            </Link>
          </Button>
        </div>
      </div>

      {/* AI Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Generated Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">
            {caseData.summary_en || "No narrative summary available for this case. The investigation is still ongoing and evidence is being processed."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        
        {/* Left Column: Timeline */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary" />
                Investigation Timeline
              </CardTitle>
              <CardDescription>Chronological sequence of FIRs and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 pl-4 border-l-2 border-muted ml-2">
                {firsData.map((fir: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] mt-1.5 w-3 h-3 rounded-full bg-secondary ring-4 ring-card" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{fir.date}</span>
                        <Badge variant="outline" className="text-xs">{fir.status || "Filed"}</Badge>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-md mt-2 border">
                        <Link href={`/firs/${fir.id}`} className="font-semibold text-primary hover:underline flex items-center gap-1 mb-1">
                          {fir.id} <ArrowRight className="w-3 h-3" />
                        </Link>
                        <p className="text-sm font-medium text-foreground">{fir.crime_type}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{fir.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> {fir.station_id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {firsData.length === 0 && (
                  <div className="text-sm text-muted-foreground">No timeline events found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Entities */}
        <div className="space-y-6">
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                Involved Persons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {persons.length > 0 ? persons.map((person: any, idx: number) => {
                  const personId = person.source.startsWith('PERSON_') ? person.source : person.target;
                  const personData = MockDataClient.getPersonById(personId);
                  const displayName = personData ? personData.name_en : personId;

                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <Link href={`/profiles/${personId}`} className="font-medium hover:underline flex items-center gap-2 text-foreground">
                        <User className="w-3 h-3" />
                        <ClientMaskedName name={displayName} />
                      </Link>
                      <Badge variant={person.type === "ACCUSED_IN" ? "destructive" : person.type === "VICTIM_OF" ? "default" : "outline"} className="text-[10px]">
                        {person.type.replace('_IN', '').replace('_OF', '').replace('_TO', '')}
                      </Badge>
                    </div>
                  );
                }) : <div className="text-sm text-muted-foreground">No persons linked to these FIRs.</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-secondary" />
                Physical Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                
                {vehicles.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vehicles</h4>
                    <div className="space-y-2">
                      {vehicles.map((veh: any, idx: number) => {
                        const vehId = veh.source.startsWith('VEHICLE_') ? veh.source : veh.target;
                        return (
                          <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded border">
                            <span className="font-mono text-foreground">{vehId}</span>
                            <span className="text-xs text-muted-foreground">{veh.type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {weapons.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Weapons</h4>
                    <div className="space-y-2">
                      {weapons.map((w: any, idx: number) => {
                        const wId = w.source.startsWith('WEAPON_') ? w.source : w.target;
                        return (
                          <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded border">
                            <span className="font-mono text-foreground">{wId}</span>
                            <span className="text-xs text-muted-foreground">{w.type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {vehicles.length === 0 && weapons.length === 0 && (
                  <div className="text-sm text-muted-foreground">No physical evidence cataloged.</div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
