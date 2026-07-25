import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, MapPin, Building2, ShieldAlert, Sparkles, User, Link as LinkIcon, Network } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientMaskedName } from "@/components/shared/ClientMaskedName";

export default async function FIRDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [firData, edges, allCases] = await Promise.all([
    DataClient.getFIRById(id),
    DataClient.getGraphForEntity(id),
    DataClient.getCases()
  ]);
  
  if (!firData) {
    notFound();
  }
  
  const persons = edges.filter((e: any) => e.target.startsWith('PERSON_') || e.source.startsWith('PERSON_'));
  const vehicles = edges.filter((e: any) => e.target.startsWith('VEHICLE_') || e.source.startsWith('VEHICLE_'));
  const weapons = edges.filter((e: any) => e.target.startsWith('WEAPON_') || e.source.startsWith('WEAPON_'));
  
  // Pre-fetch person data for display
  const personsDetails = await Promise.all(persons.map(async (person: any) => {
    const personId = person.source.startsWith('PERSON_') ? person.source : person.target;
    const personData = await DataClient.getPersonById(personId);
    return { ...person, personId, personData };
  }));
  
  // Find case
  const linkedCase = allCases.find((c: any) => c.firs.includes(id));

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">{firData.id}</h1>
            <Badge variant={firData.status_en === "Pending" ? "secondary" : "outline"} className="text-sm uppercase tracking-wider">
              {firData.status_en || "Registered"}
            </Badge>
          </div>
          <p className="text-2xl text-primary font-medium">{firData.crime_type_en}</p>
          
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {firData.date}
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {firData.police_station_id}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {firData.lat}, {firData.lng}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild>
            <Link href={`/chat?context=${firData.id}`}>
              <Sparkles className="w-4 h-4 mr-2" />
              Ask AI About FIR
            </Link>
          </Button>
          {linkedCase && (
            <Button variant="outline" asChild>
              <Link href={`/cases/${linkedCase.id}`}>
                <LinkIcon className="w-4 h-4 mr-2" />
                View Linked Case
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/network?focus=${firData.id}`}>
              <Network className="w-4 h-4 mr-2" />
              View on Graph
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        
        {/* Left Column: Narrative & Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                FIR Narrative
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {firData.description}
              </p>
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
                }) : <div className="text-sm text-muted-foreground">No persons linked.</div>}
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
