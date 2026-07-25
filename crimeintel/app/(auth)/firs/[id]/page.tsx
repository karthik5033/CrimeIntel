import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";
import { notFound } from "next/navigation";
import { FIRDetailView } from "@/components/firs/FIRDetailView";

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
    <FIRDetailView 
      firData={firData} 
      personsDetails={personsDetails} 
      linkedCase={linkedCase} 
      vehicles={vehicles} 
      weapons={weapons} 
    />
  );
}
