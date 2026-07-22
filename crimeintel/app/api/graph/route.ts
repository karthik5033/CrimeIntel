import { NextResponse } from 'next/server';
import { MockDataClient } from '@/lib/api/mockDataClient';

export async function GET(request: Request) {
  try {
    const relationships = MockDataClient.getEntityRelationships();
    
    // In a real app, this endpoint would accept query params for the seed node and depth.
    // For this mock demo, we'll return a rich sub-graph containing our specific story entities + some random noise.
    
    // We want to ensure we get the nodes related to our 3 main stories:
    // 1. Rajesh Kumar & Suresh Babu (connected to a vehicle)
    // 2. Anitha Reddy (Cyber fraud bank transfers)
    // 3. Murders connected to a vehicle
    
    const allPersons = MockDataClient.getPersons();
    const allFirs = MockDataClient.getFIRs();
    const allVehicles = MockDataClient.getVehicles();
    const allBanks = MockDataClient.getBankAccounts();
    const allPhones = MockDataClient.getPhoneRecords();
    const allWeapons = MockDataClient.getWeapons();
    const allCases = MockDataClient.getCases();
    const allPoliceStations = MockDataClient.getPoliceStations();

    // To prevent graph overload in browser, we limit the total nodes.
    // We'll use BFS to extract a connected subgraph of 150 edges starting from the first few relationships
    const activeEdges: any[] = [];
    const maxEdges = 150;
    
    const adj = new Map<string, any[]>();
    relationships.forEach((rel: any) => {
      if (!adj.has(rel.source)) adj.set(rel.source, []);
      if (!adj.has(rel.target)) adj.set(rel.target, []);
      adj.get(rel.source)!.push(rel);
      adj.get(rel.target)!.push(rel);
    });

    const queue: string[] = [];
    // Seed with a few varied nodes to ensure a rich graph if one component is small
    if (relationships.length > 0) queue.push(relationships[0].source);
    if (relationships.length > 500) queue.push(relationships[500].source);
    if (relationships.length > 1000) queue.push(relationships[1000].source);

    const visitedEdges = new Set<string>();
    const visitedNodesBFS = new Set<string>();
    
    while (queue.length > 0 && activeEdges.length < maxEdges) {
      const current = queue.shift()!;
      if (visitedNodesBFS.has(current)) continue;
      visitedNodesBFS.add(current);
      
      const edges = adj.get(current) || [];
      let branchCount = 0;
      
      for (const edge of edges) {
        if (branchCount >= 5) break; // Limit branching to force deeper hierarchies and prevent massive horizontal spreading
        
        // Create unique edge key
        const edgeKey = `${edge.source}-${edge.target}-${edge.type}`;
        if (!visitedEdges.has(edgeKey)) {
          visitedEdges.add(edgeKey);
          activeEdges.push(edge);
          branchCount++;
          if (activeEdges.length >= maxEdges) break;
          queue.push(edge.source === current ? edge.target : edge.source);
        }
      }
    }
    
    const nodeIds = new Set<string>();
    activeEdges.forEach((e: any) => {
      nodeIds.add(e.source);
      nodeIds.add(e.target);
    });

    const nodes: any[] = [];
    
    // Helper to add node if it's in the active set
    const processNodes = (sourceArray: any[], type: string, labelFormatter: (item: any) => string) => {
      sourceArray.forEach(item => {
        if (nodeIds.has(item.id)) {
          nodes.push({
            id: item.id,
            type: 'customNode', // We will use a single CustomNode component that switches on data.entityType
            data: {
              label: labelFormatter(item),
              entityType: type,
              details: item
            },
            position: { x: 0, y: 0 } // Dagre will compute actual positions later
          });
        }
      });
    };

    processNodes(allPersons, 'Person', (p) => p.name_en);
    processNodes(allFirs, 'FIR', (f) => f.fir_no);
    processNodes(allVehicles, 'Vehicle', (v) => v.license_plate);
    processNodes(allBanks, 'Bank', (b) => b.account_no);
    processNodes(allPhones, 'Phone', (p) => p.phone_number);
    processNodes(allWeapons, 'Weapon', (w) => w.type);
    processNodes(allCases, 'Case', (c) => c.case_number || c.id);
    processNodes(allPoliceStations, 'PoliceStation', (s) => s.name_en);

    const edges = activeEdges.map((rel: any, index: number) => ({
      id: `edge-${index}`,
      source: rel.source,
      target: rel.target,
      label: (rel.type || '').replace(/_/g, ' '),
      type: 'default',
      animated: rel.type === 'TRANSFERRED_TO' || rel.type === 'CALLED',
      style: { stroke: 'var(--primary)', strokeWidth: rel.weight || 1 }
    }));

    // Auto-generate some leads based on this subgraph
    const leads = [
      {
        id: 'lead-1',
        title: 'Co-Offending Network Detected',
        description: 'Rajesh Kumar and Suresh Babu are linked via a shared vehicle used in multiple thefts.',
        confidence: 'High',
        nodes: [] // In real app, IDs of the relevant nodes
      },
      {
        id: 'lead-2',
        title: 'Money Laundering Suspected',
        description: 'Anitha Reddy transferred large sums rapidly across accounts tied to cyber fraud.',
        confidence: 'Medium',
        nodes: []
      },
      {
        id: 'lead-3',
        title: 'Cross-District MO Overlap',
        description: 'Vehicle V2 spotted at two distinct murder scenes across district lines.',
        confidence: 'High',
        nodes: []
      }
    ];

    return NextResponse.json({ nodes, edges, leads });

  } catch (error) {
    console.error("Graph API Error:", error);
    return NextResponse.json({ error: "Failed to load graph data" }, { status: 500 });
  }
}
