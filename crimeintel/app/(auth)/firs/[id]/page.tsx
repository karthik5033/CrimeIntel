import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";
import { FIRDetailView } from "@/components/firs/FIRDetailView";
import Link from "next/link";

export default async function FIRDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Decode URL-encoded FIR IDs (e.g., spaces encoded as %20 or +)
  const decodedId = decodeURIComponent(id);

  const [firData, edges, allCases] = await Promise.all([
    DataClient.getFIRById(decodedId),
    DataClient.getGraphForEntity(decodedId),
    DataClient.getCases()
  ]);
  
  if (!firData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">FIR Not Found</h1>
        <p className="text-muted-foreground mb-2">
          No FIR record found for: <code className="bg-muted px-2 py-1 rounded text-sm">{decodedId}</code>
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          This FIR may have been processed in mock mode. The data is available in memory but cannot be looked up by this ID after a page navigation.
        </p>
        <Link href="/data-ingestion" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          ← Back to Data Ingestion
        </Link>
      </div>
    );
  }
  
  const persons = edges.filter((e: any) => (e.target?.startsWith('PERSON_') || e.source?.startsWith('PERSON_') || e.target_entity_id?.startsWith('PERSON_') || e.source_entity_id?.startsWith('PERSON_')));
  const vehicles = edges.filter((e: any) => (e.target?.startsWith('VEHICLE_') || e.source?.startsWith('VEHICLE_') || e.target_entity_id?.startsWith('VEHICLE_') || e.source_entity_id?.startsWith('VEHICLE_')));
  const weapons = edges.filter((e: any) => (e.target?.startsWith('WEAPON_') || e.source?.startsWith('WEAPON_') || e.target_entity_id?.startsWith('WEAPON_') || e.source_entity_id?.startsWith('WEAPON_')));
  
  // Pre-fetch person data for display
  const personsDetailsRaw = await Promise.all(persons.map(async (person: any) => {
    const sourceStr = person.source || person.source_entity_id || '';
    const targetStr = person.target || person.target_entity_id || '';
    const personId = sourceStr === decodedId ? targetStr : (targetStr === decodedId ? sourceStr : (sourceStr.startsWith('PERSON_') ? sourceStr : targetStr));
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
  const linkedCase = allCases.find((c: any) => c.firs.includes(decodedId));

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
