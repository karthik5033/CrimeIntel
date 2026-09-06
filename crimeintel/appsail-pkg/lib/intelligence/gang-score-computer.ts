/**
 * Gang Score Index Computer
 * Phase 0.1 - Computes organized crime scores using graph community detection
 */

import { GangScoreIndex, IndexComputationResult } from './types';

export interface PersonConnection {
  person_id: string;
  connected_to: string[];
  shared_attributes: {
    shared_phones?: number;
    shared_vehicles?: number;
    shared_cases?: number;
    shared_locations?: number;
  };
}

export interface CommunityDetectionResult {
  community_id: string;
  member_ids: string[];
  cohesion_score: number;
}

export class GangScoreComputer {
  private readonly MIN_CLUSTER_SIZE = 3;
  private readonly COHESION_THRESHOLD = 0.5;

  /**
   * Compute gang/organized crime scores from network communities
   */
  async compute(
    connections: PersonConnection[],
    communities: CommunityDetectionResult[]
  ): Promise<IndexComputationResult> {
    const startTime = Date.now();
    const snapshot_version = this.generateSnapshotVersion();

    try {
      const gangScores: GangScoreIndex[] = [];

      for (const community of communities) {
        // Only consider communities of sufficient size
        if (community.member_ids.length < this.MIN_CLUSTER_SIZE) continue;

        // Calculate organized crime indicators
        const organizedScore = this.calculateOrganizedCrimeScore(
          community,
          connections
        );

        // Only flag if score is high enough
        if (organizedScore < 40) continue;

        const gangScore: GangScoreIndex = {
          cluster_id: community.community_id,
          cluster_name: this.generateClusterName(community),
          member_ids: community.member_ids,
          organized_crime_score: organizedScore,
          cohesion_score: Math.round(community.cohesion_score * 100),
          activity_level: this.calculateActivityLevel(organizedScore),
          primary_districts: [], // Would be populated from crime data
          recent_activity_count: 0, // Would be populated from recent crimes
          computed_at: new Date(),
        };

        gangScores.push(gangScore);
      }

      return {
        success: true,
        index_type: 'gang-score',
        records_computed: gangScores.length,
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
      };
    } catch (error) {
      return {
        success: false,
        index_type: 'gang-score',
        records_computed: 0,
        computation_time_ms: Date.now() - startTime,
        snapshot_version,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private calculateOrganizedCrimeScore(
    community: CommunityDetectionResult,
    connections: PersonConnection[]
  ): number {
    // Indicators of organized crime:
    // 1. Group size (larger = more organized)
    // 2. Cohesion (tighter connections = more organized)
    // 3. Shared resources (phones, vehicles, locations)
    // 4. Cross-case involvement

    const sizeScore = this.calculateSizeScore(community.member_ids.length);
    const cohesionScore = community.cohesion_score * 100;
    const resourceSharingScore = this.calculateResourceSharingScore(
      community.member_ids,
      connections
    );

    // Weighted composite
    const compositeScore =
      sizeScore * 0.3 + cohesionScore * 0.4 + resourceSharingScore * 0.3;

    return Math.min(Math.round(compositeScore), 100);
  }

  private calculateSizeScore(memberCount: number): number {
    // Larger groups are more likely to be organized
    if (memberCount >= 10) return 100;
    if (memberCount >= 7) return 80;
    if (memberCount >= 5) return 60;
    if (memberCount >= 3) return 40;
    return 20;
  }

  private calculateResourceSharingScore(
    memberIds: string[],
    connections: PersonConnection[]
  ): number {
    // Calculate how much members share phones, vehicles, etc.
    const memberConnections = connections.filter((c) =>
      memberIds.includes(c.person_id)
    );

    if (memberConnections.length === 0) return 0;

    const totalSharedResources = memberConnections.reduce((acc, conn) => {
      return (
        acc +
        (conn.shared_attributes.shared_phones || 0) +
        (conn.shared_attributes.shared_vehicles || 0) +
        (conn.shared_attributes.shared_locations || 0)
      );
    }, 0);

    const avgSharedResources = totalSharedResources / memberConnections.length;

    // Normalize to 0-100 scale
    return Math.min(avgSharedResources * 20, 100);
  }

  private calculateActivityLevel(
    organizedScore: number
  ): 'high' | 'medium' | 'low' {
    if (organizedScore >= 70) return 'high';
    if (organizedScore >= 40) return 'medium';
    return 'low';
  }

  private generateClusterName(community: CommunityDetectionResult): string {
    // Generate a name like "Gang-Alpha", "Gang-Bravo", etc.
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const clusterNum = parseInt(community.community_id.replace(/\D/g, '')) || 0;
    const letter = alphabet[clusterNum % alphabet.length];
    return `Cluster-${letter}`;
  }

  private generateSnapshotVersion(): string {
    return `v${Date.now()}`;
  }
}

/**
 * Simple community detection algorithm (Louvain-style)
 * In production, use more sophisticated graph algorithms
 */
export class CommunityDetector {
  detect(connections: PersonConnection[]): CommunityDetectionResult[] {
    // Build adjacency map
    const adjacency = new Map<string, Set<string>>();

    for (const conn of connections) {
      if (!adjacency.has(conn.person_id)) {
        adjacency.set(conn.person_id, new Set());
      }
      for (const connectedTo of conn.connected_to) {
        adjacency.get(conn.person_id)!.add(connectedTo);
      }
    }

    // Simple greedy community detection
    const visited = new Set<string>();
    const communities: CommunityDetectionResult[] = [];
    let communityIndex = 0;

    for (const [personId, neighbors] of adjacency) {
      if (visited.has(personId)) continue;

      // BFS to find connected component
      const community = new Set<string>();
      const queue = [personId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        community.add(current);

        const currentNeighbors = adjacency.get(current) || new Set();
        for (const neighbor of currentNeighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      if (community.size >= 2) {
        const cohesion = this.calculateCohesion(
          Array.from(community),
          adjacency
        );

        communities.push({
          community_id: `comm_${communityIndex++}`,
          member_ids: Array.from(community),
          cohesion_score: cohesion,
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
}
