/**
 * Graph Expander - Expand seed nodes via graph relationships
 * Phase 0.4
 * 
 * Reads from Phase 0.1's graph-index to expand neighborhoods
 */

import { SeedNode, ExpandedNode } from './types';

export class GraphExpander {
  private maxHops: number;
  private maxNodesPerHop: number;
  private relationshipTypeFilter?: string[];

  constructor(
    maxHops: number = 2,
    maxNodesPerHop: number = 50,
    relationshipTypeFilter?: string[]
  ) {
    this.maxHops = maxHops;
    this.maxNodesPerHop = maxNodesPerHop;
    this.relationshipTypeFilter = relationshipTypeFilter;
  }

  /**
   * Expand seed nodes to find connected entities
   */
  async expand(seedNodes: SeedNode[]): Promise<ExpandedNode[]> {
    console.log(`[Graph Expander] Expanding ${seedNodes.length} seed nodes (max ${this.maxHops} hops)...`);

    const expandedNodes: ExpandedNode[] = [];
    const visited = new Set<string>(seedNodes.map(n => n.id));

    // Track nodes to expand at each hop level
    let currentLevel = seedNodes.map(seed => ({
      id: seed.id,
      type: seed.type,
      path: [seed.id],
      relationshipTypes: [] as string[],
    }));

    for (let hop = 1; hop <= this.maxHops; hop++) {
      console.log(`[Graph Expander]   Hop ${hop}: Expanding ${currentLevel.length} nodes...`);

      const nextLevel: typeof currentLevel = [];

      for (const node of currentLevel) {
        // Get neighbors from Phase 0.1's graph-index
        const neighbors = await this.getNeighbors(node.id, node.type);

        // Limit expansion per node
        const limitedNeighbors = neighbors.slice(0, this.maxNodesPerHop);

        for (const neighbor of limitedNeighbors) {
          // Skip if already visited
          if (visited.has(neighbor.id)) continue;

          // Apply relationship type filter
          if (this.relationshipTypeFilter && 
              !this.relationshipTypeFilter.includes(neighbor.relationshipType)) {
            continue;
          }

          visited.add(neighbor.id);

          const expandedNode: ExpandedNode = {
            id: neighbor.id,
            type: neighbor.type,
            data: neighbor.data,
            hopDistance: hop,
            relationshipPath: [...node.path, neighbor.id],
            relationshipTypes: [...node.relationshipTypes, neighbor.relationshipType],
            graphProximityScore: this.calculateGraphProximityScore(hop, neighbor.relationshipType),
          };

          expandedNodes.push(expandedNode);

          // Add to next level for further expansion (if not at max hops)
          if (hop < this.maxHops) {
            nextLevel.push({
              id: neighbor.id,
              type: neighbor.type,
              path: expandedNode.relationshipPath,
              relationshipTypes: expandedNode.relationshipTypes,
            });
          }
        }
      }

      currentLevel = nextLevel;

      if (currentLevel.length === 0) {
        console.log(`[Graph Expander]   No more nodes to expand at hop ${hop + 1}`);
        break;
      }
    }

    console.log(`[Graph Expander] Expanded to ${expandedNodes.length} total nodes`);

    return expandedNodes;
  }

  /**
   * Get neighbors of a node from Phase 0.1's graph-index
   * In production: reads precomputed adjacency from Catalyst Cache
   */
  private async getNeighbors(
    nodeId: string,
    nodeType: string
  ): Promise<Array<{ id: string; type: string; relationshipType: string; data: any }>> {
    // Simulate reading from Phase 0.1's graph-index
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));

    // Mock neighbors based on node type
    if (nodeType === 'person') {
      return [
        {
          id: 'fir-related-1',
          type: 'fir',
          relationshipType: 'accused_in',
          data: { crime_type: 'Vehicle Theft', date: new Date('2024-01-15') },
        },
        {
          id: 'person-associate-1',
          type: 'person',
          relationshipType: 'knows',
          data: { name: 'Associate Person' },
        },
        {
          id: 'vehicle-owned-1',
          type: 'vehicle',
          relationshipType: 'owns',
          data: { registration: 'KA01AB1234' },
        },
      ];
    } else if (nodeType === 'fir') {
      return [
        {
          id: 'person-accused-1',
          type: 'person',
          relationshipType: 'accused',
          data: { name: 'Accused Person', age: 32 },
        },
        {
          id: 'person-victim-1',
          type: 'person',
          relationshipType: 'victim',
          data: { name: 'Victim Person', age: 45 },
        },
        {
          id: 'case-linked-1',
          type: 'case',
          relationshipType: 'part_of',
          data: { case_number: 'CASE-2024-001', status: 'Under Investigation' },
        },
      ];
    } else {
      return [];
    }
  }

  /**
   * Calculate graph proximity score based on hop distance and relationship type
   */
  private calculateGraphProximityScore(hopDistance: number, relationshipType: string): number {
    // Base score decreases with distance
    let score = 1.0 / hopDistance;

    // Boost certain relationship types
    const relationshipBoosts: Record<string, number> = {
      'accused_in': 1.2,
      'victim_of': 1.1,
      'knows': 1.0,
      'same_address': 1.15,
      'same_phone': 1.2,
      'same_vehicle': 1.2,
      'part_of': 1.0,
      'owns': 0.9,
    };

    const boost = relationshipBoosts[relationshipType] || 1.0;
    score *= boost;

    // Clamp to [0, 1]
    return Math.min(1.0, score);
  }

  /**
   * Build a summary of the expanded subgraph
   */
  buildSubgraphSummary(
    seedNodes: SeedNode[],
    expandedNodes: ExpandedNode[]
  ): {
    subgraphSummary: string;
    keyRelationships: string[];
  } {
    const totalNodes = seedNodes.length + expandedNodes.length;
    
    // Count relationship types
    const relationshipCounts = new Map<string, number>();
    for (const node of expandedNodes) {
      for (const relType of node.relationshipTypes) {
        relationshipCounts.set(relType, (relationshipCounts.get(relType) || 0) + 1);
      }
    }

    const topRelationships = Array.from(relationshipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => `${type} (${count})`)
      .join(', ');

    const subgraphSummary = 
      `Subgraph: ${totalNodes} nodes (${seedNodes.length} seed, ${expandedNodes.length} expanded). ` +
      `Top relationships: ${topRelationships}`;

    const keyRelationships = Array.from(relationshipCounts.keys())
      .slice(0, 5);

    return { subgraphSummary, keyRelationships };
  }
}
