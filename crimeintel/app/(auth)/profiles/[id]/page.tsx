import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";
import { notFound } from "next/navigation";
import { ClientProfileHeader } from "@/components/profiles/ClientProfileHeader";
import { CriminalTimeline } from "@/components/profiles/CriminalTimeline";
import { BehavioralProfile } from "@/components/profiles/BehavioralProfile";
import { LinkedEntities } from "@/components/profiles/LinkedEntities";
import { RiskGauge } from "@/components/profiles/RiskGauge";
import { Card, CardContent } from "@/components/ui/card";
import { computeOffenderRiskScore } from "@/lib/analytics/riskScoring";

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await DataClient.getPersonById(id);
  
  if (!person) {
    notFound();
  }

  // Get all direct connections
  const edges = await DataClient.getGraphForEntity(id);
  
  // Extract specific connected entities
  const firEdges = edges.filter((e: any) => e.target.startsWith('FIR_') || e.source.startsWith('FIR_'));
  const firs = (await Promise.all(firEdges.map(async (e: any) => {
    const firId = e.source === id ? e.target : e.source;
    const firData = await DataClient.getFIRById(firId);
    return { ...firData, relationship: e.type };
  }))).filter((f: any) => f && f.id);

  // Group other entities by type
  const vehicles = edges.filter((e: any) => e.target.startsWith('VEHICLE_') || e.source.startsWith('VEHICLE_'));
  const phones = edges.filter((e: any) => e.target.startsWith('PHONE_') || e.source.startsWith('PHONE_'));
  const bankAccounts = edges.filter((e: any) => e.target.startsWith('BANK_') || e.source.startsWith('BANK_'));
  const associates = edges.filter((e: any) => e.target.startsWith('PERSON_') || e.source.startsWith('PERSON_'))
  const correctAssociates = edges.filter((e: any) => e.target.startsWith('PERSON_') || e.source.startsWith('PERSON_'))
    .filter((e: any) => (e.source === id && e.target !== id) || (e.target === id && e.source !== id));

  const role = firEdges.some((e: any) => e.type === "ACCUSED_IN") ? "ACCUSED" : 
               firEdges.some((e: any) => e.type === "VICTIM_OF") ? "VICTIM" : "WITNESS";

  // Compute real risk score using the logic engine
  const computedRiskScore = computeOffenderRiskScore(id, firs, correctAssociates.length, vehicles.length);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <ClientProfileHeader person={{...person, risk_score: computedRiskScore}} roleType={role} />

      {/* Overview Cards (New Addition) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
        <Card className="md:col-span-1 border-primary/20 bg-primary/5 flex items-center justify-center">
          <RiskGauge score={computedRiskScore} />
        </Card>
        <Card className="md:col-span-3">
           <CardContent className="p-6 h-full flex flex-col justify-center">
             <h3 className="text-lg font-semibold mb-2">Intelligence Summary</h3>
             <p className="text-muted-foreground">
               {person.name_en} is linked to {firs.length} total incidents, primarily acting as {role}.
               {correctAssociates.length > 0 ? ` Known to associate with ${correctAssociates.length} other individuals.` : ""}
               {firs.length > 2 ? " High frequency of encounters suggests organized activity." : ""}
             </p>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        
        {/* Left Column: Timeline & Behavior */}
        <div className="md:col-span-2 space-y-6">
          <CriminalTimeline firs={firs} />
          {role === "ACCUSED" && (
            <BehavioralProfile person={person} firs={firs} />
          )}
        </div>

        {/* Right Column: Entities */}
        <div className="space-y-6">
          <LinkedEntities 
            personId={id} 
            associates={correctAssociates} 
            vehicles={vehicles} 
            phones={phones} 
            bankAccounts={bankAccounts}
          />
        </div>
      </div>
    </div>
  );
}
