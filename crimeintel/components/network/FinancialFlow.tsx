"use client";

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Transaction } from '@/lib/graph/financial';

const BankNode = ({ data }: any) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-card border-2 ${data.isFlagged ? 'border-destructive' : 'border-border'}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex flex-col">
        <div className="font-bold text-sm text-foreground">{data.label}</div>
        <div className="text-xs text-muted-foreground">{data.bank || 'Unknown Bank'}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
};

const nodeTypes = {
  bank: BankNode,
};

export function FinancialFlow({ transactions, accountIds = [] }: { transactions: Transaction[], accountIds?: string[] }) {
  // Simple layout logic: source on left, target on right
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodesMap = new Map();
    const edgesList: any[] = [];
    
    // Y-position counters for layout
    let leftY = 50;
    let rightY = 50;
    let midY = 50;

    transactions.forEach((tx) => {
      // Create Edge
      edgesList.push({
        id: tx.id,
        source: tx.from_account_id,
        target: tx.to_account_id,
        label: `₹${tx.amount.toLocaleString()}`,
        animated: tx.flagged,
        style: {
          stroke: tx.flagged ? '#ef4444' : '#64748b',
          strokeWidth: Math.max(1, Math.min(5, tx.amount / 10000)), // Thicker for larger amounts
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: tx.flagged ? '#ef4444' : '#64748b',
        },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: 'var(--card)', color: 'var(--foreground)', fillOpacity: 0.8 },
      });

      // Create Source Node if missing
      if (!nodesMap.has(tx.from_account_id)) {
        // Simple heuristic: if it's primarily a source, put left. If dest, put right.
        const isFocus = accountIds.includes(tx.from_account_id);
        const xPos = isFocus ? 400 : 50;
        const yPos = isFocus ? midY : leftY;
        if (isFocus) midY += 100; else leftY += 100;
        
        nodesMap.set(tx.from_account_id, {
          id: tx.from_account_id,
          type: 'bank',
          position: { x: xPos, y: yPos },
          data: { label: tx.from_account_id, isFlagged: tx.flagged },
        });
      }

      // Create Target Node if missing
      if (!nodesMap.has(tx.to_account_id)) {
        const isFocus = accountIds.includes(tx.to_account_id);
        const xPos = isFocus ? 400 : 750;
        const yPos = isFocus ? midY : rightY;
        if (isFocus) midY += 100; else rightY += 100;
        
        nodesMap.set(tx.to_account_id, {
          id: tx.to_account_id,
          type: 'bank',
          position: { x: xPos, y: yPos },
          data: { label: tx.to_account_id, isFlagged: tx.flagged },
        });
      }
    });

    return {
      initialNodes: Array.from(nodesMap.values()),
      initialEdges: edgesList
    };
  }, [transactions, accountIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100%', height: '100%' }} className="bg-background rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <MiniMap zoomable pannable nodeClassName="bg-primary/20" />
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
