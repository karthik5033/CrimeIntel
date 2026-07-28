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
  
  const persons = edges.filter((e: any) => (e.target?.startsWith('PERSON_') || e.source?.startsWith('PERSON_') || e.target_entity_id?.startsWith('PERSON_') || e.source_entity_id?.startsWith('PERSON_')));
  const vehicles = edges.filter((e: any) => (e.target?.startsWith('VEHICLE_') || e.source?.startsWith('VEHICLE_') || e.target_entity_id?.startsWith('VEHICLE_') || e.source_entity_id?.startsWith('VEHICLE_')));
  const weapons = edges.filter((e: any) => (e.target?.startsWith('WEAPON_') || e.source?.startsWith('WEAPON_') || e.target_entity_id?.startsWith('WEAPON_') || e.source_entity_id?.startsWith('WEAPON_')));
  
  // Pre-fetch person data for display
  const personsDetailsRaw = await Promise.all(persons.map(async (person: any) => {
    const sourceStr = person.source || person.source_entity_id || '';
    const targetStr = person.target || person.target_entity_id || '';
    const personId = sourceStr === id ? targetStr : (targetStr === id ? sourceStr : (sourceStr.startsWith('PERSON_') ? sourceStr : targetStr));
    const personData = await DataClient.getPersonById(personId);
    return { ...person, personId, personData };
  }));

  // Deduplicate persons by personId
  const uniquePersonIds = new Set();
  const personsDetails = personsDetailsRaw.filter((p: any) => {
    if (uniquePersonIds.has(p.personId)) return false;
    uniquePersonIds.add(p.personId);
    return true;
  });
  
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
