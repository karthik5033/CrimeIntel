import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";
import { CatalystQuickML } from "@/lib/catalyst/quickml";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const allCases = await DataClient.getCases();
    const caseData = allCases.find((c: any) => c.id === id);

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (caseData.summary_en) {
      return NextResponse.json({ summary: caseData.summary_en });
    }

    // Resolve FIRs
    const firsData = (await Promise.all((caseData.firs || []).map((firId: string) => DataClient.getFIRById(firId)))).filter(Boolean);
    
    let summaryText = "";
    if (firsData.length > 0) {
      const prompt = `Generate a concise narrative summary of this police case based on the following FIRs:\n\n${firsData.map(f => `- FIR ${f.fir_no} (${f.date}): ${f.crime_type_en}. ${f.description}`).join('\n')}\n\nThe summary should sound like a professional intelligence briefing.`;
      
      const quickMLResponse = await CatalystQuickML.generateResponse(prompt);
      if (quickMLResponse) {
        summaryText = quickMLResponse;
      } else {
        // Fallback
        summaryText = "Summary generation unavailable at this moment. The LLM endpoint might be offline.";
      }
    } else {
      summaryText = "No detailed narrative summary is available for this case, and no FIRs are currently linked.";
    }

    return NextResponse.json({ summary: summaryText });
  } catch (error) {
    console.error("Error generating case summary:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
