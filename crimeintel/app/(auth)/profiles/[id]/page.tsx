import { MockDataClient } from "@/lib/api/mockDataClient";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, MapPin, Activity, History, Users, Phone, Car, Link as LinkIcon, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const person = MockDataClient.getPersonById(params.id);
  
  if (!person) {
    notFound();
  }

  // Get all direct connections
  const edges = MockDataClient.getGraphForEntity(params.id);
  
  // Extract specific connected entities
  const firEdges = edges.filter((e: any) => e.target.startsWith('FIR_') || e.source.startsWith('FIR_'));
  const firs = firEdges.map((e: any) => {
    const firId = e.source === params.id ? e.target : e.source;
    const firData = MockDataClient.getFIRById(firId);
    return { ...firData, relationship: e.type };
  }).filter((f: any) => f && f.id);

  // Group other entities by type
  const vehicles = edges.filter((e: any) => e.target.startsWith('VEHICLE_') || e.source.startsWith('VEHICLE_'));
  const phones = edges.filter((e: any) => e.target.startsWith('PHONE_') || e.source.startsWith('PHONE_'));
  const associates = edges.filter((e: any) => e.target.startsWith('PERSON_') || e.source.startsWith('PERSON_'))
                          .filter((e: any) => e.source !== params.id || e.target !== params.id); // Exclude self if somehow linked

  const role = firEdges.some((e: any) => e.type === "ACCUSED_IN") ? "ACCUSED" : 
               firEdges.some((e: any) => e.type === "VICTIM_OF") ? "VICTIM" : "WITNESS";

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-card shadow-sm">
            <User className="w-16 h-16 text-muted-foreground/50" />
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">{person.name_en}</h1>
            <Badge variant={role === "ACCUSED" ? "destructive" : role === "VICTIM" ? "default" : "secondary"} className="text-sm">
              {role}
            </Badge>
          </div>
          <p className="text-xl text-muted-foreground">{person.name_kn}</p>
          
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground">Age:</span> {person.age}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground">Gender:</span> {person.gender}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {person.address_en} ({person.district_id})
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-card border rounded-lg p-6 min-w-[150px] shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-2">Risk Score</div>
          <div className="flex items-center gap-2">
            {person.risk_score >= 80 && <ShieldAlert className="w-6 h-6 text-destructive" />}
            <span className={`text-4xl font-bold ${person.risk_score >= 80 ? "text-destructive" : person.risk_score >= 50 ? "text-warning" : "text-success"}`}>
              {person.risk_score || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        
        {/* Left Column: Timeline & Behavior */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Criminal History Timeline
              </CardTitle>
              <CardDescription>Linked First Information Reports ({firs.length})</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 pl-4 border-l-2 border-muted ml-2">
                {firs.map((fir: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] mt-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-card" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/firs/${fir.id}`} className="font-semibold text-primary hover:underline">
                          {fir.id}
                        </Link>
                        <span className="text-sm text-muted-foreground">{fir.date || "Unknown Date"}</span>
                        <Badge variant="outline" className="text-xs">{fir.relationship}</Badge>
                      </div>
                      <p className="text-foreground font-medium">{fir.crime_type}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{fir.description}</p>
                    </div>
                  </div>
                ))}
                {firs.length === 0 && (
                  <div className="text-sm text-muted-foreground">No linked FIRs found.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Behavioral Profile - Simulated */}
          {role === "ACCUSED" && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Behavioral Profile (RCT)
                </CardTitle>
                <CardDescription>AI-generated Rational Choice Theory analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-card p-4 rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Preferred Time Window</div>
                    <div className="font-semibold">10:00 PM - 02:00 AM</div>
                  </div>
                  <div className="bg-card p-4 rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Target Profile</div>
                    <div className="font-semibold">Unattended Vehicles</div>
                  </div>
                  <div className="bg-card p-4 rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Geographic Range</div>
                    <div className="font-semibold">5km radius from home</div>
                  </div>
                  <div className="bg-card p-4 rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Escalation Trend</div>
                    <div className="font-semibold text-warning">Consistent MO (No escalation)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Entities */}
        <div className="space-y-6">
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-secondary" />
                Known Associates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {associates.length > 0 ? associates.map((assoc: any, idx: number) => {
                  const assocId = assoc.source === params.id ? assoc.target : assoc.source;
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <Link href={`/profiles/${assocId}`} className="font-medium hover:underline flex items-center gap-2">
                        <User className="w-3 h-3" /> {assocId}
                      </Link>
                      <Badge variant="outline" className="text-xs">{assoc.type}</Badge>
                    </div>
                  );
                }) : <div className="text-sm text-muted-foreground">No direct associates mapped.</div>}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/network?focus=${params.id}`}>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    View Full Network
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="w-5 h-5 text-secondary" />
                Linked Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vehicles.length > 0 ? vehicles.map((veh: any, idx: number) => {
                  const vehId = veh.source === params.id ? veh.target : veh.source;
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                      <span className="font-mono">{vehId}</span>
                      <span className="text-xs text-muted-foreground">{veh.type}</span>
                    </div>
                  );
                }) : <div className="text-sm text-muted-foreground">No vehicles linked.</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="w-5 h-5 text-secondary" />
                Linked Phones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {phones.length > 0 ? phones.map((phone: any, idx: number) => {
                  const phoneId = phone.source === params.id ? phone.target : phone.source;
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                      <span className="font-mono">{phoneId}</span>
                      <span className="text-xs text-muted-foreground">{phone.type}</span>
                    </div>
                  );
                }) : <div className="text-sm text-muted-foreground">No phones linked.</div>}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
