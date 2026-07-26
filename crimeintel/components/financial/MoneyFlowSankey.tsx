'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import type { MoneyTrailNode, MoneyTrailEdge, Transaction } from '@/types';

interface MoneyFlowSankeyProps {
  nodes: MoneyTrailNode[];
  edges: MoneyTrailEdge[];
  onNodeClick?: (node: MoneyTrailNode) => void;
  onEdgeClick?: (edge: MoneyTrailEdge) => void;
  height?: number;
}

export function MoneyFlowSankey({
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
  height = 600,
}: MoneyFlowSankeyProps) {
  // Layout algorithm: Position nodes in columns based on flow depth
  const layout = useMemo(() => {
    const nodeDepths = new Map<string, number>();
    const visited = new Set<string>();
    
    // Find source nodes (no incoming edges)
    const sourceNodes = nodes.filter(node =>
      !edges.some(e => e.to === node.accountId)
    );
    
    // BFS to assign depths
    const queue: Array<{ id: string; depth: number }> = sourceNodes.map(n => ({
      id: n.accountId,
      depth: 0,
    }));
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      
      visited.add(id);
      nodeDepths.set(id, depth);
      
      // Find all outgoing edges
      edges.forEach(edge => {
        if (edge.from === id && !visited.has(edge.to)) {
          queue.push({ id: edge.to, depth: depth + 1 });
        }
      });
    }
    
    // Handle unvisited nodes (isolated or only destinations)
    nodes.forEach(node => {
      if (!nodeDepths.has(node.accountId)) {
        nodeDepths.set(node.accountId, 0);
      }
    });
    
    // Group nodes by depth
    const columns = new Map<number, MoneyTrailNode[]>();
    nodes.forEach(node => {
      const depth = nodeDepths.get(node.accountId) || 0;
      if (!columns.has(depth)) {
        columns.set(depth, []);
      }
      columns.get(depth)!.push(node);
    });
    
    // Calculate positions
    const columnWidth = 200;
    const nodeHeight = 60;
    const nodeSpacing = 20;
    const padding = 40;
    
    const positions = new Map<string, { x: number; y: number }>();
    
    Array.from(columns.entries()).forEach(([depth, columnNodes]) => {
      const x = padding + depth * columnWidth;
      const columnHeight = columnNodes.length * (nodeHeight + nodeSpacing);
      const startY = (height - columnHeight) / 2;
      
      columnNodes.forEach((node, idx) => {
        const y = startY + idx * (nodeHeight + nodeSpacing);
        positions.set(node.accountId, { x, y });
      });
    });
    
    return { positions, nodeHeight, columnWidth };
  }, [nodes, edges, height]);
  
  // Calculate total flow volume for scaling
  const maxFlow = useMemo(() => {
    return Math.max(...edges.map(e => e.totalAmount), 1);
  }, [edges]);
  
  // Format currency
  const formatAmount = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`;
    return `₹${amount.toFixed(0)}`;
  };
  
  // Get suspicion color
  const getSuspicionColor = (flagged: boolean, isMule: boolean) => {
    if (isMule) return 'text-red-600 border-red-500 bg-red-50';
    if (flagged) return 'text-amber-600 border-amber-500 bg-amber-50';
    return 'text-slate-600 border-slate-300 bg-white';
  };
  
  // Generate SVG path for curved flow
  const generateFlowPath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number
  ) => {
    const midX = (x1 + x2) / 2;
    return `
      M ${x1} ${y1}
      C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}
      L ${x2} ${y2 + width}
      C ${midX} ${y2 + width}, ${midX} ${y1 + width}, ${x1} ${y1 + width}
      Z
    `;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Money Flow Analysis</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Normal
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              Flagged
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              Mule Account
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-x-auto" style={{ height }}>
          <svg
            width="100%"
            height={height}
            className="absolute inset-0"
            style={{ minWidth: (Math.max(...Array.from(layout.positions.values()).map(p => p.x)) + 200) }}
          >
            {/* Render flows (edges) */}
            {edges.map((edge, idx) => {
              const fromPos = layout.positions.get(edge.from);
              const toPos = layout.positions.get(edge.to);
              
              if (!fromPos || !toPos) return null;
              
              // Calculate flow width based on amount (logarithmic scale for better visualization)
              const flowWidth = Math.max(2, Math.log10(edge.totalAmount / maxFlow * 100 + 1) * 15);
              
              const x1 = fromPos.x + 160; // Right edge of source node
              const y1 = fromPos.y + layout.nodeHeight / 2;
              const x2 = toPos.x;
              const y2 = toPos.y + layout.nodeHeight / 2;
              
              const color = edge.flagged ? '#f59e0b' : '#94a3b8';
              const opacity = edge.flagged ? 0.7 : 0.4;
              
              return (
                <g
                  key={`edge-${idx}`}
                  onClick={() => onEdgeClick?.(edge)}
                  className="cursor-pointer transition-opacity hover:opacity-100"
                >
                  <path
                    d={generateFlowPath(x1, y1 - flowWidth / 2, x2, y2 - flowWidth / 2, flowWidth)}
                    fill={color}
                    opacity={opacity}
                    stroke="none"
                  />
                  {/* Amount label */}
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 5}
                    fontSize="11"
                    fill={edge.flagged ? '#d97706' : '#64748b'}
                    textAnchor="middle"
                    className="pointer-events-none font-medium"
                  >
                    {formatAmount(edge.totalAmount)}
                  </text>
                  {edge.flagged && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 + 10}
                      fontSize="10"
                      fill="#d97706"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      ⚠ Flagged
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Render nodes */}
          {nodes.map((node) => {
            const pos = layout.positions.get(node.accountId);
            if (!pos) return null;
            
            const colorClass = getSuspicionColor(node.flagged, node.isMule);
            
            return (
              <div
                key={node.accountId}
                className={`absolute border-2 rounded-lg p-2 shadow-md transition-all hover:shadow-lg hover:scale-105 cursor-pointer ${colorClass}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: 160,
                  height: layout.nodeHeight,
                }}
                onClick={() => onNodeClick?.(node)}
              >
                <div className="flex flex-col h-full justify-between">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-mono truncate flex-1">
                      {node.accountNumber.slice(-8)}
                    </span>
                    {node.isMule && (
                      <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0" />
                    )}
                    {node.flagged && !node.isMule && (
                      <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-green-600 font-medium">
                        ↓ {formatAmount(node.totalIn)}
                      </span>
                      <span className="text-red-600 font-medium">
                        ↑ {formatAmount(node.totalOut)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium block">
                        {formatAmount(node.balance)}
                      </span>
                      <span className="text-xs opacity-60">
                        {node.transactionCount} txns
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend and statistics */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-600">Total Accounts:</span>
            <span className="ml-2 font-semibold">{nodes.length}</span>
          </div>
          <div>
            <span className="text-slate-600">Total Flows:</span>
            <span className="ml-2 font-semibold">{edges.length}</span>
          </div>
          <div>
            <span className="text-slate-600">Flagged:</span>
            <span className="ml-2 font-semibold text-amber-600">
              {nodes.filter(n => n.flagged).length} accounts
            </span>
          </div>
          <div>
            <span className="text-slate-600">Mule Accounts:</span>
            <span className="ml-2 font-semibold text-red-600">
              {nodes.filter(n => n.isMule).length}
            </span>
          </div>
          <div>
            <span className="text-slate-600">Total Volume:</span>
            <span className="ml-2 font-semibold">
              {formatAmount(edges.reduce((sum, e) => sum + e.totalAmount, 0))}
            </span>
          </div>
          <div>
            <span className="text-slate-600">Flagged Volume:</span>
            <span className="ml-2 font-semibold text-amber-600">
              {formatAmount(
                edges.filter(e => e.flagged).reduce((sum, e) => sum + e.totalAmount, 0)
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
