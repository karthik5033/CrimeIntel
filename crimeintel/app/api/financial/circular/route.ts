import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";

export async function GET(request: Request) {
  try {
    const transactions = await DataClient.getTransactions();
    
    // Simplistic circular detection: Find A -> B -> A or A -> B -> C -> A
    // In a real system, this would use a graph database or a recursive CTE
    
    // 1. Build adjacency list
    const adj = new Map();
    transactions.forEach((t: any) => {
      if (!adj.has(t.from_account_id)) adj.set(t.from_account_id, []);
      adj.get(t.from_account_id).push(t);
    });

    const circularFlows: any[] = [];
    const foundCycles = new Set(); // to avoid duplicates
    
    // Very basic 2-hop or 3-hop cycle detection
    for (const [startNode, startEdges] of adj.entries()) {
      for (const e1 of startEdges) {
        const node2 = e1.to_account_id;
        if (node2 === startNode) continue; // self-loop
        
        const edges2 = adj.get(node2) || [];
        for (const e2 of edges2) {
          const node3 = e2.to_account_id;
          
          // 2-hop cycle (A -> B -> A)
          if (node3 === startNode && new Date(e2.timestamp) > new Date(e1.timestamp)) {
            const cycleId = [startNode, node2].sort().join("-");
            if (!foundCycles.has(cycleId)) {
              foundCycles.add(cycleId);
              circularFlows.push({
                pattern: "2-HOP CYCLE",
                accounts: [startNode, node2],
                transactions: [e1, e2]
              });
            }
          } else {
            // Check for 3-hop cycle (A -> B -> C -> A)
            const edges3 = adj.get(node3) || [];
            for (const e3 of edges3) {
              if (e3.to_account_id === startNode && new Date(e3.timestamp) > new Date(e2.timestamp)) {
                const cycleId = [startNode, node2, node3].sort().join("-");
                if (!foundCycles.has(cycleId)) {
                  foundCycles.add(cycleId);
                  circularFlows.push({
                    pattern: "3-HOP CYCLE",
                    accounts: [startNode, node2, node3],
                    transactions: [e1, e2, e3]
                  });
                }
              }
            }
          }
        }
      }
    }

    // Include natively tagged "CIRCULAR" transactions from seed data if any
    const taggedCircular = transactions.filter((t: any) => t.pattern === "CIRCULAR");

    return NextResponse.json({ 
      circular_patterns: circularFlows,
      tagged_transactions: taggedCircular,
      stats: {
        detected_cycles: circularFlows.length
      }
    });
  } catch (error) {
    console.error("Error detecting circular transactions:", error);
    return NextResponse.json({ error: "Failed to detect circular flows" }, { status: 500 });
  }
}
