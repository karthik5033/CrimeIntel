import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";
import { computeOffenderRiskScore } from "@/lib/analytics/riskScoring";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing offender id" }, { status: 400 });
  }

  try {
    const person = await DataClient.getPersonById(id);
    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const edges = await DataClient.getGraphForEntity(id);
    
    const firEdges = edges.filter((e: any) => e.target?.startsWith('FIR_') || e.source?.startsWith('FIR_') || e.target_entity_id?.startsWith('FIR_') || e.source_entity_id?.startsWith('FIR_'));
    const firs = (await Promise.all(firEdges.map(async (e: any) => {
      const sourceStr = e.source || e.source_entity_id || '';
      const targetStr = e.target || e.target_entity_id || '';
      const firId = sourceStr === id ? targetStr : sourceStr;
      return await DataClient.getFIRById(firId);
    }))).filter((f: any) => f && f.id);

    const vehicles = edges.filter((e: any) => e.target?.startsWith('VEHICLE_') || e.source?.startsWith('VEHICLE_') || e.target_entity_id?.startsWith('VEHICLE_') || e.source_entity_id?.startsWith('VEHICLE_'));
    const associates = edges.filter((e: any) => e.target?.startsWith('PERSON_') || e.source?.startsWith('PERSON_') || e.target_entity_id?.startsWith('PERSON_') || e.source_entity_id?.startsWith('PERSON_'))
                            .filter((e: any) => (e.source === id && e.target !== id) || (e.target === id && e.source !== id));

    const riskScore = computeOffenderRiskScore(id, firs, associates.length, vehicles.length);

    // Provide reasoning
    const reasoning = [
      `Base score derived from involvement in ${firs.length} incident(s).`,
      firs.some((f: any) => /murder|homicide|robbery/i.test(f.crime_type_en || "")) ? "Escalated severity indicated by presence of violent crime." : "No severe violent crimes reported.",
      associates.length > 0 ? `Network connections (${associates.length} known associates) increase risk profile.` : "Isolated activity profile."
    ];

    return NextResponse.json({
      id: person.id,
      name_en: person.name_en,
      risk_score: riskScore,
      firs_count: firs.length,
      associates_count: associates.length,
      vehicles_count: vehicles.length,
      reasoning
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to compute risk score" }, { status: 500 });
  }
}
