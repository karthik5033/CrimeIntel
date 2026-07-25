import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const allCases = await DataClient.getCases();
    const currentCase = allCases.find((c: any) => c.id === id);

    if (!currentCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Get FIRs for current case to establish baseline features
    const currentFirs = (await Promise.all((currentCase.firs || []).map((firId: string) => DataClient.getFIRById(firId)))).filter(Boolean);
    const primaryCrimeType = currentFirs.length > 0 ? currentFirs[0].crime_type_en : null;
    const districtId = currentFirs.length > 0 ? currentFirs[0].district_id : null;

    // Find similar cases
    const similar = [];
    for (const c of allCases) {
      if (c.id === id) continue;
      
      const otherFirs = (await Promise.all((c.firs || []).map((firId: string) => DataClient.getFIRById(firId)))).filter(Boolean);
      const otherCrimeType = otherFirs.length > 0 ? otherFirs[0].crime_type_en : null;
      const otherDistrict = otherFirs.length > 0 ? otherFirs[0].district_id : null;

      let score = 0;
      const matchReasons = [];

      if (primaryCrimeType && otherCrimeType && primaryCrimeType === otherCrimeType) {
        score += 0.6;
        matchReasons.push("Same crime type");
      }
      
      if (districtId && otherDistrict && districtId === otherDistrict) {
        score += 0.3;
        matchReasons.push("Same district");
      }

      if (score > 0) {
        similar.push({
          id: c.id,
          case_no: c.case_no,
          score,
          matchReason: matchReasons.join(", ")
        });
      }
    }

    // Sort by score descending
    similar.sort((a, b) => b.score - a.score);

    return NextResponse.json({ similar: similar.slice(0, 3) });
  } catch (error) {
    console.error("Error finding similar cases:", error);
    return NextResponse.json({ error: "Failed to find similar cases" }, { status: 500 });
  }
}
