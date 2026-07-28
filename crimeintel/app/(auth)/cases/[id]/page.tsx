import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, MapPin, ShieldAlert, Clock, ArrowRight, User, Network, FileSearch, Sparkles, Activity, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientMaskedName } from "@/components/shared/ClientMaskedName";
import { PrintButton } from "@/components/reports/PrintButton";
import { PrintHeader } from "@/components/reports/PrintHeader";
import { PrintFooter } from "@/components/reports/PrintFooter";
import { CaseSummary } from "@/components/cases/CaseSummary";
import { CaseTimeline } from "@/components/cases/CaseTimeline";
import { SimilarCases } from "@/components/cases/SimilarCases";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const allCases = await DataClient.getCases();
  const caseData = allCases.find((c: any) => c.id === id);
  
  if (!caseData) {
    notFound();
  }

  // Resolve FIRs
  const firsData = (await Promise.all((caseData.firs || []).map((firId: string) => DataClient.getFIRById(firId)))).filter(Boolean);
  
  // Sort FIRs by date for timeline
  firsData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Aggregate entities from all FIRs in this case
  const allEdges = await DataClient.getEntityRelationships();
  
  // Find all edges connecting to any of the FIRs in this case
  const caseEdges = allEdges.filter((e: any) => 
    caseData.firs.includes(e.source) || caseData.firs.includes(e.target)
  );

  // Group entities by type based on edges
  const persons = caseEdges.filter((e: any) => e.target?.startsWith('PERSON_') || e.source?.startsWith('PERSON_') || e.target_entity_id?.startsWith('PERSON_') || e.source_entity_id?.startsWith('PERSON_'));
  const vehicles = caseEdges.filter((e: any) => e.target?.startsWith('VEHICLE_') || e.source?.startsWith('VEHICLE_') || e.target_entity_id?.startsWith('VEHICLE_') || e.source_entity_id?.startsWith('VEHICLE_'));
  const weapons = caseEdges.filter((e: any) => e.target?.startsWith('WEAPON_') || e.source?.startsWith('WEAPON_') || e.target_entity_id?.startsWith('WEAPON_') || e.source_entity_id?.startsWith('WEAPON_'));

  const personsDetails = await Promise.all(persons.map(async (person: any) => {
    const sourceStr = person.source || person.source_entity_id || '';
    const targetStr = person.target || person.target_entity_id || '';
    const personId = sourceStr.startsWith('PERSON_') ? sourceStr : targetStr;
    const personData = await DataClient.getPersonById(personId);
    return { ...person, personId, personData };
  }));

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "CLOSED": return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "ACTIVE": return <Activity className="w-5 h-5 text-warning" />;
      case "PENDING": return <Clock className="w-5 h-5 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500 bg-background print:max-w-full print:p-0">
      
      <PrintHeader 
        title={`Case Report: ${caseData.case_no || caseData.id}`} 
        subtitle={`Primary Offense: ${firsData.length > 0 ? firsData[0]?.crime_type_en : "Multiple Offenses"}`}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between no-print">
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
          <PrintButton label="Generate Report" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 hover:text-primary" />
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
      <CaseSummary caseId={id} initialSummary={caseData.summary_en} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        
        {/* Left Column: Timeline */}
        <div className="md:col-span-2 space-y-6">
          <CaseTimeline firs={firsData} />
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
                {personsDetails.length > 0 ? personsDetails.map((pDetail: any, idx: number) => {
                  const { personId, personData, type } = pDetail;
                  const displayName = personData ? personData.name_en : personId;

                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <Link href={`/profiles/${personId}`} className="font-medium hover:underline flex items-center gap-2 text-foreground">
                        <User className="w-3 h-3" />
                        <ClientMaskedName name={displayName} />
                      </Link>
                      <Badge variant={type === "ACCUSED_IN" ? "destructive" : type === "VICTIM_OF" ? "default" : "outline"} className="text-[10px]">
                        {type.replace('_IN', '').replace('_OF', '').replace('_TO', '')}
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
                        const sourceStr = veh.source || veh.source_entity_id || '';
                        const targetStr = veh.target || veh.target_entity_id || '';
                        const vehId = sourceStr.startsWith('VEHICLE_') ? sourceStr : targetStr;
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
                        const sourceStr = w.source || w.source_entity_id || '';
                        const targetStr = w.target || w.target_entity_id || '';
                        const wId = sourceStr.startsWith('WEAPON_') ? sourceStr : targetStr;
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
          
          <SimilarCases caseId={id} />

        </div>
      </div>
      
      <PrintFooter />
    </div>
  );
}
