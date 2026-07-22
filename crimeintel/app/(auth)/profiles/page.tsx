import { MockDataClient } from "@/lib/api/mockDataClient";
import { ClientProfilesList, PersonProfile } from "./ClientProfilesList";

export const metadata = {
  title: "Offender Profiles | CrimeIntel",
  description: "View and manage criminal records and suspect profiles.",
};

export default function ProfilesPage() {
  const allPersons = MockDataClient.getPersons();
  const allRelationships = MockDataClient.getEntityRelationships();

  // Process raw data into PersonProfile
  const initialProfiles: PersonProfile[] = allPersons.map((person: any) => {
    // Find all edges for this person
    const personEdges = allRelationships.filter(
      (edge: any) => edge.source === person.id || edge.target === person.id
    );
    
    // Count FIRs (any edge connecting to an FIR)
    const firEdges = personEdges.filter((edge: any) => 
      edge.target.startsWith('FIR_') || edge.source.startsWith('FIR_')
    );
    
    // Determine primary role based on relationships to FIRs
    let role = "UNKNOWN";
    if (personEdges.some((e: any) => e.type === "ACCUSED_IN")) {
      role = "ACCUSED";
    } else if (personEdges.some((e: any) => e.type === "VICTIM_OF")) {
      role = "VICTIM";
    } else if (personEdges.some((e: any) => e.type === "WITNESS_TO")) {
      role = "WITNESS";
    }

    return {
      id: person.id,
      name: person.name_en, // Using English name for main display
      age: person.age,
      gender: person.gender,
      district: person.district_id,
      risk_score: person.risk_score || 0,
      fir_count: firEdges.length,
      role: role
    };
  });

  return <ClientProfilesList initialProfiles={initialProfiles} />;
}
