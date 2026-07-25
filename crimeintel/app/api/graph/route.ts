import { NextRequest, NextResponse } from 'next/server';
import { getCatalystApp } from '@/lib/catalyst';
import { EntityExtractor } from '@/lib/services/entityExtractor';
import { EntityStorage } from '@/lib/services/entityStorage';
import { RelationshipBuilder } from '@/lib/services/relationshipBuilder';
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";

/**
 * Phase 1 Step 8: Knowledge Graph Builder API
 * 
 * POST /api/graph - Build/rebuild knowledge graph for a FIR
 * GET /api/graph - Retrieve graph visualization data
 * GET /api/graph?firId=... - Get graph for specific FIR
 */

/**
 * POST: Build complete knowledge graph for a FIR
 * 
 * This orchestrates the entire pipeline:
 * 1. Extract entities from OCR text
 * 2. Store entities in respective tables
 * 3. Build relationships between entities
 * 4. Return graph structure
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firId, rebuildGraph = false } = body;

    if (!firId) {
      return NextResponse.json(
        { error: 'FIR ID required' },
        { status: 400 }
      );
    }

    console.log(`🕸️  Building knowledge graph for FIR: ${firId}`);

    // Get FIR with OCR text
    const app = getCatalystApp();
    const zcql = app.zcql();
    
    const firQuery = await zcql.executeZCQLQuery(
      `SELECT * FROM FIRs WHERE fir_no = '${firId}' LIMIT 1`
    );
    
    if (!firQuery || firQuery.length === 0) {
      return NextResponse.json(
        { error: 'FIR not found' },
        { status: 404 }
      );
    }

    const fir = firQuery[0].FIRs || firQuery[0];

    if (!fir.ocr_text) {
      return NextResponse.json(
        { error: 'FIR has no OCR text. Run OCR first.' },
        { status: 400 }
      );
    }

    // If rebuilding, delete existing entities and relationships
    if (rebuildGraph) {
      console.log('🗑️  Cleaning up existing graph data...');
      await Promise.all([
        EntityStorage.deleteEntitiesForFIR(firId),
        RelationshipBuilder.deleteRelationshipsForFIR(firId),
      ]);
    }

    // Step 1: Extract entities
    console.log('🔍 Step 1: Extracting entities...');
    const extractionResult = await EntityExtractor.extract(fir.ocr_text, firId);

    // Step 2: Store entities
    console.log('💾 Step 2: Storing entities...');
    const storageResult = await EntityStorage.storeEntities(
      extractionResult,
      firId,
      fir.case_no
    );

    // Step 3: Build relationships
    console.log('🕸️  Step 3: Building relationships...');
    const relationshipResult = await RelationshipBuilder.buildRelationships(
      extractionResult,
      firId,
      fir.case_no
    );

    // Step 4: Get graph structure
    console.log('📊 Step 4: Generating graph structure...');
    const graphData = await RelationshipBuilder.getGraphForFIR(firId);

    console.log('✅ Knowledge graph built successfully');

    return NextResponse.json({
      success: true,
      message: 'Knowledge graph built successfully',
      firId: firId,
      stats: {
        extraction: {
          persons: extractionResult.persons.length,
          vehicles: extractionResult.vehicles.length,
          phones: extractionResult.phones.length,
          locations: extractionResult.locations.length,
          weapons: extractionResult.weapons.length,
          bankAccounts: extractionResult.bankAccounts.length,
          method: extractionResult.method,
          confidence: extractionResult.confidence,
        },
        storage: {
          personsStored: storageResult.personsStored,
          vehiclesStored: storageResult.vehiclesStored,
          phonesStored: storageResult.phonesStored,
          weaponsStored: storageResult.weaponsStored,
          bankAccountsStored: storageResult.bankAccountsStored,
        },
        relationships: {
          created: relationshipResult.relationshipsCreated,
          types: relationshipResult.relationshipTypes,
        },
        graph: {
          nodes: graphData.nodes.length,
          edges: graphData.edges.length,
        },
      },
      graph: graphData,
    });

  } catch (error) {
    console.error('❌ Graph builder error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to build knowledge graph',
      details: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * GET: Retrieve graph data for visualization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firId = searchParams.get('firId');

    // If firId provided, return graph for that specific FIR
    if (firId) {
      const graphData = await RelationshipBuilder.getGraphForFIR(firId);
      
      return NextResponse.json({
        success: true,
        firId: firId,
        nodes: graphData.nodes,
        edges: graphData.edges,
      });
    }

    // Otherwise, return global graph (existing implementation)
    // Otherwise, return global graph (existing implementation)
    const [
      relationships, allPersons, allFirs, allVehicles, allBanks, 
      allPhones, allWeapons, allCases, allPoliceStations
    ] = await Promise.all([
      DataClient.getEntityRelationships(),
      DataClient.getPersons(),
      DataClient.getFIRs(),
      DataClient.getVehicles(),
      DataClient.getBankAccounts(),
      DataClient.getPhoneRecords(),
      DataClient.getWeapons(),
      DataClient.getCases(),
      DataClient.getPoliceStations()
    ]);

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
        description: 'Multiple accused persons share connections via vehicles and phones.',
        confidence: 'High',
        nodes: [] // In real app, IDs of the relevant nodes
      },
      {
        id: 'lead-2',
        title: 'Money Laundering Suspected',
        description: 'Unusual pattern of bank transactions across linked accounts.',
        confidence: 'Medium',
        nodes: []
      },
      {
        id: 'lead-3',
        title: 'Cross-District MO Overlap',
        description: 'Same vehicle registration appears in multiple FIRs across districts.',
        confidence: 'High',
        nodes: []
      }
    ];

    return NextResponse.json({ 
      success: true,
      nodes, 
      edges, 
      leads,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        totalRelationships: relationships.length,
      }
    });

  } catch (error) {
    console.error("Graph API Error:", error);
    return NextResponse.json({ error: "Failed to load graph data" }, { status: 500 });
  }
}
