import { DataClient } from "@/lib/api/dataClient";
import { ClientCasesList, CaseOverview } from "./ClientCasesList";

export const metadata = {
  title: "Case Management | CrimeIntel",
  description: "Track active investigations and historical cases.",
};

export default async function CasesPage() {
  const allCases = await DataClient.getCases();

  // Process raw data into CaseOverview
  const initialCases: CaseOverview[] = await Promise.all(allCases.map(async (c: any) => {
    // Resolve FIRs to get more info
    const firsData = (await Promise.all((c.firs || []).map((firId: string) => DataClient.getFIRById(firId)))).filter(Boolean);
    
    let primaryCrimeType = "";
    let primaryDistrict = "";
    let latestDate = "";
    
    if (firsData.length > 0) {
      // Find latest date, common crime type, common district
      // Simplification for mock data: just take from the first FIR
      primaryCrimeType = firsData[0].crime_type;
      primaryDistrict = firsData[0].district_id;
      
      // Find latest date among FIRs
      latestDate = firsData.reduce((latest: string, fir: any) => {
        if (!latest) return fir.date;
        return (new Date(fir.date) > new Date(latest)) ? fir.date : latest;
      }, "");
    }

    return {
      id: c.id,
      case_no: c.case_no || c.id,
      status: c.status || "Unknown",
      fir_count: (c.firs || []).length,
      firs: c.firs || [],
      summary: c.summary_en || "No summary available.",
      primary_crime_type: primaryCrimeType,
      primary_district: primaryDistrict,
      latest_date: latestDate
    };
  }));

  return <ClientCasesList initialCases={initialCases} />;
}
