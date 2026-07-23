"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  ConnectionLineType,
  useReactFlow
} from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';
import { CustomNode } from './CustomNodes';

const nodeTypes = {
  customNode: CustomNode,
};

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  
  // 1. Build adjacency list to find connected components
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      adj.get(e.target)!.push(e.source);
    }
  });

  // 2. Find connected components using BFS
  const visited = new Set<string>();
  const components: any[][] = [];
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const compNodes: any[] = [];
      const q = [node.id];
      visited.add(node.id);
      
      while (q.length > 0) {
        const curr = q.shift()!;
        const currNode = nodes.find(n => n.id === curr);
        if (currNode) compNodes.push(currNode);
        
        (adj.get(curr) || []).forEach(neighbor => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            q.push(neighbor);
          }
        });
      }
      components.push(compNodes);
    }
  });

  // Sort components by size (largest first)
  components.sort((a, b) => b.length - a.length);

  const newNodes: any[] = [];
  let currentYOffset = 0;

  // 3. Layout each component and stack them
  components.forEach(comp => {
    if (comp.length === 0) return;
    
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ 
      rankdir: direction,
      nodesep: 150,
      ranksep: 250,
      edgesep: 80
    });

    const compNodeIds = new Set(comp.map(n => n.id));
    
    comp.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 220, height: 120 });
    });

    edges.forEach((edge) => {
      if (compNodeIds.has(edge.source) && compNodeIds.has(edge.target)) {
        dagreGraph.setEdge(edge.source, edge.target);
      }
    });

    dagre.layout(dagreGraph);

    let compMinY = Infinity;
    let compMaxY = -Infinity;
    
    comp.forEach(node => {
      const pos = dagreGraph.node(node.id);
      if (pos) {
        compMinY = Math.min(compMinY, pos.y);
        compMaxY = Math.max(compMaxY, pos.y + pos.height);
      }
    });
    
    // Shift component so its minY matches currentYOffset
    const shiftY = compMinY === Infinity ? currentYOffset : currentYOffset - compMinY;
    
    comp.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      if (!nodeWithPosition) {
         newNodes.push(node);
         return;
      }
      
      newNodes.push({
        ...node,
        targetPosition: isHorizontal ? 'left' : 'top',
        sourcePosition: isHorizontal ? 'right' : 'bottom',
        position: {
          x: nodeWithPosition.x - 110,
          y: nodeWithPosition.y - 60 + shiftY,
        },
      });
    });
    
    if (compMaxY !== -Infinity && compMinY !== Infinity) {
      currentYOffset += (compMaxY - compMinY) + 300; // 300px gap between subgraphs
    } else {
      currentYOffset += 200;
    }
  });

  return { nodes: newNodes, edges };
};

interface NetworkGraphProps {
  initialNodes: any[];
  initialEdges: any[];
  onNodeClick: (node: any) => void;
  selectedNodeId?: string | null;
}

export function NetworkGraph({ initialNodes, initialEdges, onNodeClick, selectedNodeId }: NetworkGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const { setCenter, screenToFlowPosition, getZoom, zoomTo } = useReactFlow();
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [isPinned, setIsPinned] = useState(false);

  const handleZoomIn = () => zoomTo(getZoom() * 2.5, { duration: 100 });
  const handleZoomOut = () => zoomTo(getZoom() / 2.5, { duration: 100 });

  useEffect(() => {
    if (initialNodes.length && initialEdges.length) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges,
        layoutDirection
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [initialNodes, initialEdges, layoutDirection, setNodes, setEdges]);

  // Focus Mode Effect
  useEffect(() => {
    setEdges((currentEdges) => {
      const neighbors = new Set<string>();
      if (selectedNodeId) {
        currentEdges.forEach(e => {
          if (e.source === selectedNodeId) neighbors.add(e.target);
          if (e.target === selectedNodeId) neighbors.add(e.source);
        });
      }

      setNodes((currentNodes) => 
        currentNodes.map(n => ({
          ...n,
          data: { 
            ...n.data, 
            isDimmed: selectedNodeId ? !(n.id === selectedNodeId || neighbors.has(n.id)) : false 
          }
        }))
      );
      
      return currentEdges.map(e => {
        if (!selectedNodeId) return { ...e, style: { ...e.style, opacity: 1, strokeWidth: 1 } };
        
        const isConnected = e.source === selectedNodeId || e.target === selectedNodeId;
        return {
           ...e,
           style: { 
             ...e.style, 
             opacity: isConnected ? 1 : (isPinned ? 0.1 : 0.25),
             strokeWidth: isConnected ? 2 : 1
           }
        };
      });
    });
  }, [selectedNodeId, isPinned, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds)),
    [setEdges]
  );

  const handleAddNode = () => {
    const customId = `CUSTOM_${Date.now()}`;
    const newNode = {
      id: customId,
      type: 'custom',
      data: {
        label: 'New Investigation Node',
        entityType: 'Unknown',
        details: { Status: 'Manually Added' }
      },
      position: screenToFlowPosition({ 
        x: window.innerWidth / 2, 
        y: window.innerHeight / 2 
      })
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleAddNote = () => {
    const customId = `NOTE_${Date.now()}`;
    const newNote = {
      id: customId,
      type: 'custom',
      data: {
        label: 'User Note (Double click to edit)',
        entityType: 'Note',
        details: { Author: 'Current User' }
      },
      position: screenToFlowPosition({ 
        x: window.innerWidth / 2 + 50, 
        y: window.innerHeight / 2 + 50 
      })
    };
    setNodes((nds) => [...nds, newNote]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const query = searchQuery.toLowerCase();
    const foundNode = nodes.find(n => 
      n.data.label?.toLowerCase().includes(query) || 
      n.data.entityType?.toLowerCase().includes(query) ||
      n.id.toLowerCase().includes(query)
    );
    
    if (foundNode) {
      setCenter(foundNode.position.x + 110, foundNode.position.y + 60, { duration: 800, zoom: 1 });
      onNodeClick(foundNode);
    }
  };

  return (
    <div className="flex-1 h-full w-full bg-background relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          if (!isPinned || selectedNodeId === node.id) {
            onNodeClick(node);
          }
        }}
        onNodeDoubleClick={(_, node) => {
          if (node.type === 'custom') {
            const newLabel = window.prompt("Edit Node Label:", node.data.label);
            if (newLabel) {
              setNodes((nds) => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, label: newLabel } } : n));
            }
          }
        }}
        onPaneClick={() => {
          if (!isPinned) onNodeClick(null);
        }}
        nodeTypes={nodeTypes}
        fitView
        className="dark:bg-background"
        minZoom={0.05}
        maxZoom={4}
      >
        <Panel position="top-left" className="bg-card/80 p-2 rounded-md shadow-sm border border-border backdrop-blur-sm text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Intelligence Graph Canvas
        </Panel>

        <Panel position="top-right" className="flex flex-col gap-2 items-end">
          <form onSubmit={handleSearch} className="bg-card/80 p-1.5 rounded-md shadow-sm border border-border backdrop-blur-sm flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground ml-1"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              type="text" 
              placeholder="Search graph..." 
              className="bg-transparent border-none focus:outline-none text-sm px-2 w-48 text-foreground placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-md transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
            </button>
          </form>

          <div className="bg-card/80 p-1.5 rounded-md shadow-sm border border-border backdrop-blur-sm flex flex-col gap-1.5 w-full">
            <div className="flex gap-1">
              <button 
                onClick={() => setLayoutDirection('TB')}
                className={`flex-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${layoutDirection === 'TB' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                Vertical
              </button>
              <button 
                onClick={() => setLayoutDirection('LR')}
                className={`flex-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${layoutDirection === 'LR' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                Horizontal
              </button>
            </div>
            
            <button 
              onClick={() => setIsPinned(!isPinned)}
              disabled={!selectedNodeId}
              className={`text-xs font-medium px-3 py-1.5 rounded flex items-center justify-center gap-2 transition-colors w-full ${!selectedNodeId ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed' : isPinned ? 'bg-amber-500 text-white shadow-sm' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
              {isPinned ? 'Unpin Focus' : 'Pin Focus'}
            </button>

            <button 
              onClick={handleAddNode}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1.5 rounded flex items-center justify-center gap-2 transition-colors w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Add Node
            </button>
            
            <button 
              onClick={handleAddNote}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium px-3 py-1.5 rounded flex items-center justify-center gap-2 transition-colors w-full shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Add Note
            </button>
          </div>
        </Panel>
        
        <Background gap={12} size={1} />
        <Controls 
          className="bg-card border-border fill-foreground" 
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
        <MiniMap 
          nodeColor={(n) => {
            if (n.type === 'custom') return 'var(--primary)';
            return '#fff';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="bg-card border-border" 
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
