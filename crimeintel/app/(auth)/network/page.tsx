"use client";

import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { NetworkGraph } from "@/components/network/NetworkGraph";
import { GraphSidebar } from "@/components/network/GraphSidebar";
import { Network, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NetworkPage() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [nodeNotes, setNodeNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchGraphData() {
      try {
        const response = await fetch('/api/graph');
        const data = await response.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setLeads(data.leads || []);
      } catch (error) {
        console.error("Failed to load graph data", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGraphData();
  }, []);

  const handleLeadClick = (lead: any) => {
    // In a real app, this might highlight the specific nodes in the graph
    // and then route to the chat page with a pre-filled query.
    // We'll simulate the "Investigate Further" action by routing to chat.
    router.push('/chat');
  };

  // handleAddNode logic moved internally to NetworkGraph

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-4 bg-card shrink-0 shadow-sm z-10">
        <Network className="h-5 w-5 text-primary mr-2" />
        <h1 className="font-semibold text-foreground">Criminal Network Intelligence</h1>
        <div className="ml-4 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
          LIVE
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Graph Canvas */}
        <div className="flex-1 relative bg-muted/20">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-50">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground font-medium animate-pulse">Running Deep Graph Extraction...</p>
            </div>
          ) : (
            <ReactFlowProvider>
              <NetworkGraph 
                initialNodes={nodes} 
                initialEdges={edges} 
                onNodeClick={(node) => setSelectedNode(node)} 
                selectedNodeId={selectedNode?.id}
              />
            </ReactFlowProvider>
          )}
        </div>

        {/* Right Sidebar */}
        <GraphSidebar 
          selectedNode={selectedNode}
          leads={leads}
          onCloseNode={() => setSelectedNode(null)}
          onLeadClick={handleLeadClick}
          nodeNote={selectedNode ? nodeNotes[selectedNode.id] : ''}
          onUpdateNote={(note) => {
            if (selectedNode) {
              setNodeNotes(prev => ({ ...prev, [selectedNode.id]: note }));
            }
          }}
        />
        
      </div>
    </div>
  );
}
