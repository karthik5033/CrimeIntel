export const DEMO_MODE = true;

// Pre-computed responses for specific demo queries to ensure zero latency and perfect reliability
export const DEMO_RESPONSES: Record<string, any> = {
  "show vehicle theft cases in bengaluru south, last 6 months": {
    type: "table",
    text: "I found 145 vehicle theft cases in Bengaluru South over the last 6 months. Here is a summary of the most recent cases.",
    data: [
      { fir_no: "FIR-2026-001", date: "2026-06-12", station: "Jayanagar", status: "Under Investigation" },
      { fir_no: "FIR-2026-015", date: "2026-06-08", station: "JP Nagar", status: "Resolved" },
      { fir_no: "FIR-2026-042", date: "2026-05-22", station: "Koramangala", status: "Under Investigation" }
    ],
    visualization: "trend-line"
  },
  "show only repeat offenders": {
    type: "table",
    text: "Filtering for repeat offenders. I found 12 individuals linked to multiple vehicle thefts in this district.",
    data: [
      { name: "Rajesh Kumar", offenses: 4, last_active: "2026-06-12", status: "Released" },
      { name: "Suresh Babu", offenses: 3, last_active: "2026-05-22", status: "In Custody" }
    ],
    visualization: "bar-chart"
  },
  "what connects suspect rajesh kumar and suresh babu?": {
    type: "graph",
    text: "Rajesh Kumar and Suresh Babu are connected through a shared phone number (ending in 8990) and were both spotted at the same mechanic shop in JP Nagar prior to their respective FIRs.",
    graphData: {
      nodes: [
        { id: "P1", label: "Rajesh Kumar", type: "person" },
        { id: "P2", label: "Suresh Babu", type: "person" },
        { id: "PH1", label: "+91 98*** **8990", type: "phone" }
      ],
      edges: [
        { source: "P1", target: "PH1", label: "Used By" },
        { source: "P2", target: "PH1", label: "Used By" }
      ]
    }
  },
  "why is whitefield flagged as high-risk this month?": {
    type: "reasoning",
    text: "Whitefield has been flagged as high-risk for property crime based on converging factors.",
    reasoning: {
      claim: "Whitefield is high-risk for property crime in the next 2 weeks.",
      mechanism: "Routine Activity Theory",
      factors: [
        "Motivated Offender: 3 repeat offenders released in last 30 days.",
        "Suitable Target: Upcoming local festival, +3x foot traffic expected.",
        "Absent Guardian: Night patrol coverage reduced by 15% due to VIP duty."
      ],
      evidence: ["FIR-2026-088", "FIR-2026-091"],
      alternatives: [
        { text: "Random noise", rejected: true, reason: "Statistical significance > 95%" }
      ],
      confidence: "High"
    }
  },
  "ಮೈಸೂರಿನಲ್ಲಿ ಕಳವು ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸಿ": {
    type: "text",
    text: "ಮೈಸೂರಿನಲ್ಲಿ ಕಳೆದ ತಿಂಗಳು ೪೫ ಕಳವು ಪ್ರಕರಣಗಳು ದಾಖಲಾಗಿವೆ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನೋಡಿ."
  }
};

export function getDemoResponse(query: string) {
  if (!DEMO_MODE) return null;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Exact match
  if (DEMO_RESPONSES[normalizedQuery]) {
    return DEMO_RESPONSES[normalizedQuery];
  }
  
  // Fuzzy match
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (normalizedQuery.includes(key.substring(0, 20))) {
      return response;
    }
  }
  
  return null;
}
