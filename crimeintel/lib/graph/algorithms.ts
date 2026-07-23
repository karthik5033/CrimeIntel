// algorithms.ts - Graph Analytics implementations

/**
 * Predicts links between nodes using Jaccard Similarity of their neighbors.
 * Returns an array of predicted edges.
 */
export function predictLinks(nodes: any[], edges: any[], threshold: number = 0.5) {
  const predictedEdges: any[] = [];
  const adjacencyList = new Map<string, Set<string>>();

  // Build adjacency list
  nodes.forEach(n => adjacencyList.set(n.id, new Set()));
  edges.forEach(e => {
    if (adjacencyList.has(e.source) && adjacencyList.has(e.target)) {
      adjacencyList.get(e.source)!.add(e.target);
      adjacencyList.get(e.target)!.add(e.source);
    }
  });

  // Calculate Jaccard similarity for all unconnected pairs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const u = nodes[i].id;
      const v = nodes[j].id;

      const neighborsU = adjacencyList.get(u)!;
      const neighborsV = adjacencyList.get(v)!;

      // Skip if already connected
      if (neighborsU.has(v)) continue;
      
      // Calculate Jaccard Similarity = |U intersect V| / |U union V|
      let intersection = 0;
      neighborsU.forEach(n => {
        if (neighborsV.has(n)) intersection++;
      });

      if (intersection > 0) {
        const union = new Set([...neighborsU, ...neighborsV]).size;
        const jaccard = intersection / union;

        if (jaccard >= threshold) {
          predictedEdges.push({
            id: `pred_${u}_${v}`,
            source: u,
            target: v,
            label: `Predicted (${(jaccard * 100).toFixed(0)}%)`,
            type: 'predicted',
            animated: true,
            style: { strokeDasharray: '5,5', stroke: '#8b5cf6', strokeWidth: 2 }
          });
        }
      }
    }
  }

  return predictedEdges;
}

/**
 * Detects communities using a simplified connected components algorithm.
 * Returns a map of nodeId -> communityId.
 */
export function detectCommunities(nodes: any[], edges: any[]) {
  const adjacencyList = new Map<string, string[]>();
  nodes.forEach(n => adjacencyList.set(n.id, []));
  edges.forEach(e => {
    // Ignore predicted edges for community detection
    if (e.type === 'predicted') return;
    if (adjacencyList.has(e.source)) adjacencyList.get(e.source)!.push(e.target);
    if (adjacencyList.has(e.target)) adjacencyList.get(e.target)!.push(e.source);
  });

  const visited = new Set<string>();
  const nodeCommunityMap = new Map<string, number>();
  let communityId = 0;

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      communityId++;
      // BFS
      const queue = [node.id];
      visited.add(node.id);
      
      while (queue.length > 0) {
        const curr = queue.shift()!;
        nodeCommunityMap.set(curr, communityId);

        const neighbors = adjacencyList.get(curr) || [];
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        });
      }
    }
  });

  return nodeCommunityMap;
}
