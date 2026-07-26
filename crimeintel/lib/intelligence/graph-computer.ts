/**
 * Graph Index Computer
 * Phase 0.1 - Precomputes graph adjacency, centrality scores, and communities
 */

import { GraphIndex, GraphNode, GraphEdge, Community, IndexComputationResult } from './types';

export interface RawGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CanonicalEntityMapping {
  [rawPersonId: string]: string; // raw person ID -> canonical entity ID
}

export interface EntityResolutionStats {
  total_raw_persons: number;
  canonical_entities: number;
  merge_ratio: number; // ratio of merged entities
}

export class GraphComputer {
  /**
   * Phase 0.3 Integration: Apply canonical entity resolution before computing graph
   */
  private applyEntityResolution(
    graphData: RawGraphData,
    canonicalMapping?: CanonicalEntityMapping
  ): { resolvedData: RawGraphData; stats: EntityResolutionStats } {
    if (!canonicalMapping || Object.keys(canonicalMapping).length === 0) {
      // No entity resolution applied
      return {
        resolvedData: graphData,
        stats: {
          total_raw_persons: graphData.nodes.length,
          canonical_entities: graphData.nodes.length,
          merge_ratio: 0,
        },
      };
    }

    const stats: EntityResolutionStats = {
      total_raw_persons: graphData.nodes.length,
      canonical_entities: 0,
      merge_ratio: 0,
    };

    // Group nodes by canonical ID
    const canonicalNodes = new Map<string, GraphNode[]>();
    
    for (const node of graphData.nodes) {
      const canonicalId = canonicalMapping[node.id] || node.id;
      
      if (!canonicalNodes.has(canonicalId)) {
        canonicalNodes.set(canonicalId, []);
      }
      canonicalNodes.get(canonicalId)!.push(node);
    }

    // Create merged canonical nodes
    const mergedNodes: GraphNode[] = Array.from(canonicalNodes.entries()).map(
      ([canonicalId, rawNodes]) => {
        // Use the most complete record as base
        const baseNode = rawNodes.reduce((best, current) => {
          const bestScore = this.getNodeCompletenessScore(best);
          const currentScore = this.getNodeCompletenessScore(current);
          return currentScore > bestScore ? current : best;
        }, rawNodes[0]);

        // Merge metadata from all raw nodes
        const mergedMetadata = {
          ...baseNode.metadata,
          merged_from: rawNodes.map(n => n.id),
          merge_count: rawNodes.length,
          fir_count: rawNodes.reduce((sum, n) => sum + (n.metadata?.fir_count || 0), 0),
        };

        return {
          ...baseNode,
          id: canonicalId,
          label: `${baseNode.label} (merged: ${rawNodes.length})`,
          metadata: mergedMetadata,
        };
      }
    );

    stats.canonical_entities = mergedNodes.length;
    stats.merge_ratio = stats.total_raw_persons > 0 
      ? (stats.total_raw_persons - stats.canonical_entities) / stats.total_raw_persons 
      : 0;

    // Update edges to use canonical IDs
    const resolvedEdges: GraphEdge[] = [];
    const seenEdges = new Set<string>();

    for (const edge of graphData.edges) {
      const canonicalSource = canonicalMapping[edge.source] || edge.source;
      const canonicalTarget = canonicalMapping[edge.target] || edge.target;

      // Skip self-loops that result from merging
      if (canonicalSource === canonicalTarget) continue;

      // Deduplicate edges (multiple raw edges might map to same canonical edge)
      const edgeKey = `${canonicalSource}-${canonicalTarget}-${edge.type}`;
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);

      resolvedEdges.push({
        ...edge,
        source: canonicalSource,
        target: canonicalTarget,
        // Increment weight if this canonical edge represents multiple raw edges
        weight: (edge.weight || 1),
      });
    }

    console.log(`[GraphComputer] Entity Resolution Applied:
  - Raw persons: ${stats.total_raw_persons}
  - Canonical entities: ${stats.canonical_entities}
  - Merge ratio: ${(stats.merge_ratio * 100).toFixed(1)}%
  - Edges before: ${graphData.edges.length}
  - Edges after: ${resolvedEdges.length}`);

    return {
      resolvedData: {
        nodes: mergedNodes,
        edges: resolvedEdges,
      },
      stats,
    };
  }

  /**
   * Score node completeness (for selecting best record during merge)
   */
  private getNodeCompletenessScore(node: GraphNode): number {
    let score = 0;
    if (node.metadata?.phone) score += 3;
    if (node.metadata?.vehicle) score += 3;
    if (node.metadata?.address) score += 2;
    if (node.metadata?.age) score += 1;
    if (node.metadata?.fir_count) score += node.metadata.fir_count;
    return score;
  }

  /**
   * Compute full graph index with adjacency, centrality, and communities
   * UPDATED for Phase 0.3: Accepts optional canonical entity mapping
   */
  async compute(
    graphData: RawGraphData,
    canonicalMapping?: CanonicalEntityMapping
  ): Promise<IndexComputationResult> {
  async compute(
    graphData: RawGraphData,
    canonicalMapping?: CanonicalEntityMapping
  ): Promise<IndexComputationResult> {
    const startTime = Date.now();
    const snapshot_version = this.generateSnapshotVersion();

    try {
      // Phase 0.3 Integration: Apply entity resolution BEFORE graph computation
      const { resolvedData, stats } = this.applyEntityResolution(
        graphData,
        canonicalMapping
      );

      console.log(`[GraphComputer] Working with ${resolvedData.nodes.length} canonical entities (was ${graphData.nodes.length} raw)`);

      // Build adjacency map (now using canonical entities)
      const adjacency = this.buildAdjacencyMap(resolvedData.edges);

      // Compute centrality scores (using resolved nodes)
      const centralityScores = this.computeCentrality(resolvedData.nodes, adjacency);

      // Detect communities (using resolved nodes)
      const communities = this.detectCommunities(resolvedData.nodes, adjacency);

      // Assign community IDs to nodes
      const nodesWithCommunities = this.assignCommunities(
        resolvedData.nodes,
        communities
      );

      // Assign centrality scores to nodes
      const finalNodes = nodesWithCommunities.map(node => ({
        ...node,
        centrality: centralityScores[node.id] || 0,
      }));

      const index: GraphIndex = {
        snapshot_id: snapshot_version,
        node_count: finalNodes.length,
        edge_count: resolvedData.edges.length,
        adjacency_data: {
          nodes: finalNodes,
          edges: resolvedData.edges,
        },
        centrality_scores: centralityScores,
        communities,
        computed_at: new Date(),
        // Include entity resolution stats
        metadata: {
          entity_resolution: stats,
        },
      };

      return {
        success: true,
        index_type: 'graph',
        records_computed: 1, // One graph index
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
      };
    } catch (error) {
      return {
        success: false,
        index_type: 'graph',
        records_computed: 0,
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildAdjacencyMap(edges: GraphEdge[]): Map<string, Set<string>> {
    const adjacency = new Map<string, Set<string>>();

    for (const edge of edges) {
      // Add both directions for undirected graph
      if (!adjacency.has(edge.source)) {
        adjacency.set(edge.source, new Set());
      }
      if (!adjacency.has(edge.target)) {
        adjacency.set(edge.target, new Set());
      }

      adjacency.get(edge.source)!.add(edge.target);
      adjacency.get(edge.target)!.add(edge.source);
    }

    return adjacency;
  }

  /**
   * Compute degree centrality for all nodes
   * In production, also compute betweenness and closeness centrality
   */
  private computeCentrality(
    nodes: GraphNode[],
    adjacency: Map<string, Set<string>>
  ): Record<string, number> {
    const centrality: Record<string, number> = {};
    const maxDegree = nodes.length - 1; // Max possible degree

    for (const node of nodes) {
      const degree = adjacency.get(node.id)?.size || 0;
      // Normalize to 0-1
      centrality[node.id] = maxDegree > 0 ? degree / maxDegree : 0;
    }

    return centrality;
  }

  /**
   * Detect communities using Louvain-style algorithm
   * Simplified version - groups nodes with high interconnectivity
   */
  private detectCommunities(
    nodes: GraphNode[],
    adjacency: Map<string, Set<string>>
  ): Community[] {
    const visited = new Set<string>();
    const communities: Community[] = [];
    let communityIndex = 0;

    for (const node of nodes) {
      if (visited.has(node.id)) continue;

      // BFS to find connected component
      const community = new Set<string>();
      const queue = [node.id];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        community.add(current);

        const neighbors = adjacency.get(current) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      if (community.size >= 2) {
        // Calculate cohesion score
        const memberIds = Array.from(community);
        const cohesion = this.calculateCohesion(memberIds, adjacency);

        // Calculate geographic center (if nodes have lat/lng)
        const geoCenter = this.calculateGeographicCenter(memberIds, nodes);

        communities.push({
          id: `community_${communityIndex++}`,
          member_ids: memberIds,
          cohesion_score: cohesion,
          geographic_center: geoCenter,
        });
      }
    }

    return communities;
  }

  private calculateCohesion(
    memberIds: string[],
    adjacency: Map<string, Set<string>>
  ): number {
    // Cohesion = actual edges / possible edges
    let actualEdges = 0;
    const possibleEdges = (memberIds.length * (memberIds.length - 1)) / 2;

    for (const member of memberIds) {
      const neighbors = adjacency.get(member) || new Set();
      for (const other of memberIds) {
        if (member !== other && neighbors.has(other)) {
          actualEdges++;
        }
      }
    }

    // Divide by 2 because we count each edge twice
    actualEdges = actualEdges / 2;

    return possibleEdges > 0 ? actualEdges / possibleEdges : 0;
  }

  private calculateGeographicCenter(
    memberIds: string[],
    nodes: GraphNode[]
  ): { lat: number; lng: number } | undefined {
    const nodesWithGeo = nodes.filter(
      n =>
        memberIds.includes(n.id) &&
        n.metadata?.lat !== undefined &&
        n.metadata?.lng !== undefined
    );

    if (nodesWithGeo.length === 0) return undefined;

    const sumLat = nodesWithGeo.reduce((sum, n) => sum + n.metadata.lat, 0);
    const sumLng = nodesWithGeo.reduce((sum, n) => sum + n.metadata.lng, 0);

    return {
      lat: sumLat / nodesWithGeo.length,
      lng: sumLng / nodesWithGeo.length,
    };
  }

  private assignCommunities(
    nodes: GraphNode[],
    communities: Community[]
  ): GraphNode[] {
    // Create map of node ID to community ID
    const nodeToCommunity = new Map<string, string>();

    for (const community of communities) {
      for (const memberId of community.member_ids) {
        nodeToCommunity.set(memberId, community.id);
      }
    }

    // Assign community_id to nodes
    return nodes.map(node => ({
      ...node,
      community_id: nodeToCommunity.get(node.id),
    }));
  }

  /**
   * Find shortest path between two nodes (Dijkstra)
   */
  static findShortestPath(
    startId: string,
    endId: string,
    adjacency: Map<string, Set<string>>
  ): string[] | null {
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[] }> = [
      { nodeId: startId, path: [startId] },
    ];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (nodeId === endId) {
        return path;
      }

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const neighbors = adjacency.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({
            nodeId: neighbor,
            path: [...path, neighbor],
          });
        }
      }
    }

    return null; // No path found
  }

  /**
   * Get N-hop neighborhood of a node
   */
  static getNHopNeighborhood(
    nodeId: string,
    hops: number,
    adjacency: Map<string, Set<string>>
  ): Set<string> {
    const neighborhood = new Set<string>([nodeId]);
    let currentLevel = new Set<string>([nodeId]);

    for (let i = 0; i < hops; i++) {
      const nextLevel = new Set<string>();

      for (const node of currentLevel) {
        const neighbors = adjacency.get(node) || new Set();
        for (const neighbor of neighbors) {
          if (!neighborhood.has(neighbor)) {
            neighborhood.add(neighbor);
            nextLevel.add(neighbor);
          }
        }
      }

      currentLevel = nextLevel;
      if (currentLevel.size === 0) break;
    }

    return neighborhood;
  }

  private generateSnapshotVersion(): string {
    return `v${Date.now()}`;
  }
}

/**
 * Advanced graph algorithms for production:
 * 
 * 1. Betweenness Centrality: Measures how often a node lies on shortest paths
 * 2. PageRank: Measures importance based on incoming edges
 * 3. Community Detection: Louvain, Label Propagation, or Infomap
 * 4. Temporal Graph: Track how graph evolves over time
 * 5. Weighted Edges: Consider edge weights in all algorithms
 * 
 * Libraries for production:
 * - NetworkX (Python)
 * - igraph (Python/R/C)
 * - graph-tool (Python)
 * - Neo4j (dedicated graph database)
 */
