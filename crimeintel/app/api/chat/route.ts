import { NextResponse } from 'next/server';
import { MockDataClient } from '@/lib/api/mockDataClient';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const query = message.toLowerCase();

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 1. Vehicle Theft in Bengaluru
    if (query.includes('vehicle theft') && (query.includes('bengaluru') || query.includes('bangalore'))) {
      const allFIRs = MockDataClient.getFIRs();
      const bglrThefts = allFIRs.filter((f: any) => 
        f.crime_type_en === 'Vehicle Theft' && 
        f.district_name_en === 'Bengaluru Urban'
      ).slice(0, 5); // Just show top 5 for demo

      return NextResponse.json({
        text_summary: "I found **several Vehicle Theft cases** in Bengaluru Urban over the requested period. Here is a summary of the most relevant FIRs. Notice that some cases share similar MOs involving late-night street parking.",
        data_table: bglrThefts.map((f: any) => ({
          'FIR No': f.fir_no,
          'Date': new Date(f.date).toLocaleDateString(),
          'Station': f.police_station_id, // in real app, we map to name
          'Status': f.status_en
        })),
        citations: bglrThefts.map((f: any) => ({ id: f.id, label: f.fir_no, type: 'FIR' }))
      });
    }

    // 2. Connections between Rajesh Kumar and Suresh Babu
    if (query.includes('rajesh kumar') && query.includes('suresh babu')) {
      const allRels = MockDataClient.getEntityRelationships();
      const allFirs = MockDataClient.getFIRs();
      const allVehicles = MockDataClient.getVehicles();

      // Find the specific ring vehicle and FIRs
      const ringVehicle = allVehicles[0];
      
      return NextResponse.json({
        text_summary: "My network analysis reveals a direct link between **Rajesh Kumar** and **Suresh Babu**. They are both connected to the same vehicle (License Plate: `" + ringVehicle?.license_plate + "`), which has been flagged in multiple vehicle theft FIRs.",
        reasoning_block: {
          understanding: "Extracting entities: Rajesh Kumar, Suresh Babu",
          retrieving: "Querying Graph Engine for shortest path between nodes...",
          analyzing: "Found shared edges: KNOWN_ASSOCIATE and USES (Vehicle Node)",
          mechanism: "Co-Offending Network: Suspects are linked via a shared physical asset (vehicle) used in commission of crimes.",
          evidence: `Rajesh and Suresh both have 'USES' edges to Vehicle ${ringVehicle?.license_plate}. This vehicle is linked to FIR/101/2024 and FIR/102/2024.`,
          alternatives: "They could share the vehicle legitimately, but the temporal proximity to the thefts suggests coordinated illicit use."
        },
        citations: [
          { id: 'FIR/101/2024', label: 'FIR/101/2024', type: 'FIR' },
          { id: 'FIR/102/2024', label: 'FIR/102/2024', type: 'FIR' },
          { id: ringVehicle?.id, label: `Vehicle ${ringVehicle?.license_plate}`, type: 'Database' }
        ]
      });
    }

    // 3. Cyber Fraud / Money Trail
    if (query.includes('money trail') || query.includes('cyber fraud')) {
      const allBanks = MockDataClient.getBankAccounts();
      const bankA = allBanks[0];
      const bankB = allBanks[1];

      return NextResponse.json({
        text_summary: "I have traced the financial flows related to the **Cyber Fraud** case (FIR/CYB/2024). The funds were moved through a suspected mule account belonging to **Anitha Reddy**.",
        data_table: [
          { 'Source': bankA?.account_no, 'Destination': bankB?.account_no, 'Amount': '₹50,000', 'Type': 'NEFT', 'Flag': 'Suspicious' }
        ],
        reasoning_block: {
          understanding: "Analyzing financial transactions linked to FIR/CYB/2024",
          retrieving: "Querying BankAccounts and TRANSFERRED_TO edges",
          analyzing: "Detecting rapid transfer velocity",
          mechanism: "Money Laundering / Structuring: Funds received and immediately dispersed to obfuscate origin.",
          evidence: `Account ${bankA?.account_no} received funds from victims and transferred ₹50,000 to ${bankB?.account_no} within 2 hours.`,
          alternatives: "Could be a legitimate business payment, but the account holder profile (Anitha Reddy) does not match the transaction volume."
        },
        citations: [
          { id: 'FIR/CYB/2024', label: 'FIR/CYB/2024', type: 'FIR' }
        ]
      });
    }

    // 4. Murder cases link
    if (query.includes('murder')) {
      return NextResponse.json({
        text_summary: "Yes, there is a hidden link. **FIR/M1/2024** and **FIR/M2/2024** occurred in different districts, but ANPR (Automatic Number Plate Recognition) logs show the **exact same vehicle** was spotted near both crime scenes within hours of the incidents.",
        reasoning_block: {
          understanding: "Scanning for cross-case entity overlaps",
          retrieving: "Checking shared nodes between FIR/M1/2024 and FIR/M2/2024",
          analyzing: "Found intersection at Vehicle node via 'SPOTTED_AT' edges",
          mechanism: "Crime Pattern Theory: Serial offenders utilize consistent transport across different geographic targets.",
          evidence: "Vehicle ID #V2 was recorded by traffic cameras at both locations.",
          alternatives: "Coincidence of vehicle presence (e.g. public transport or taxi), though statistically improbable given the locations."
        },
        citations: [
          { id: 'FIR/M1/2024', label: 'FIR/M1/2024', type: 'FIR' },
          { id: 'FIR/M2/2024', label: 'FIR/M2/2024', type: 'FIR' }
        ]
      });
    }

    // 5. Socio-economic
    if (query.includes('socio-economic')) {
      const stats = MockDataClient.getSocioEconomicData();
      return NextResponse.json({
        text_summary: "Here is the district-level socio-economic data. Notice that districts with higher unemployment rates are showing a statistically significant correlation with property crimes (like Vehicle Theft and Robbery).",
        data_table: stats.map((s: any) => ({
          'District': s.district_id,
          'Unemployment %': s.unemployment_rate,
          'Literacy %': s.literacy_rate,
          'Pop Density': s.population_density
        }))
      });
    }

    // Default Fallback
    return NextResponse.json({
      text_summary: "I've searched the database but couldn't find specific intelligence matching your query. Try asking about the vehicle theft rings, cyber fraud money trails, or repeat offenders.",
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}
