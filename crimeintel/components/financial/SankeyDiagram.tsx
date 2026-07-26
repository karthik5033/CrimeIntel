"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Network } from "lucide-react";

interface SankeyNode {
  id: string;
  value: number;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  flagged?: boolean;
}

interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

import { useLanguage } from "@/lib/LanguageContext";

export function SankeyDiagram({ nodes, links }: SankeyDiagramProps) {
  const { t } = useLanguage();

  const { layoutNodes, layoutLinks, svgHeight } = useMemo(() => {
    const lNodes = new Map<string, any>();
    nodes.forEach(n => lNodes.set(n.id, { ...n, inDegree: 0, outDegree: 0, column: 1, y: 0 }));

    links.forEach(l => {
      if (lNodes.has(l.source)) lNodes.get(l.source).outDegree += l.value;
      if (lNodes.has(l.target)) lNodes.get(l.target).inDegree += l.value;
    });

    // Assign columns
    const cols = [[], [], []] as any[][];
    Array.from(lNodes.values()).forEach(n => {
      if (n.inDegree === 0) {
        n.column = 0;
        cols[0].push(n);
      } else if (n.outDegree === 0) {
        n.column = 2;
        cols[2].push(n);
      } else {
        n.column = 1;
        cols[1].push(n);
      }
    });

    // Compute Y positions
    const baseHeight = 400;
    let maxTotalHeight = baseHeight;

    cols.forEach((colNodes) => {
      const totalValue = colNodes.reduce((sum, n) => sum + Math.max(n.value, 1), 0);
      let currentY = 20;
      colNodes.forEach(n => {
        n.height = Math.max((n.value / totalValue) * (baseHeight - 100), 20);
        n.y = currentY;
        currentY += n.height + 20;
      });
      if (currentY > maxTotalHeight) {
        maxTotalHeight = currentY;
      }
    });

    const finalLinks = links.map(l => {
      const s = lNodes.get(l.source);
      const t = lNodes.get(l.target);
      return { ...l, sourceNode: s, targetNode: t };
    }).filter(l => l.sourceNode && l.targetNode);

    return { layoutNodes: Array.from(lNodes.values()), layoutLinks: finalLinks, svgHeight: maxTotalHeight };
  }, [nodes, links]);

  const width = 800;
  const colWidth = width / 3;

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          {t('financial.moneyTrail')}
        </CardTitle>
        <CardDescription>{t('financial.visualizingFlows')}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center overflow-x-auto">
        <svg width={width} height={svgHeight} className="min-w-[600px]">
          {/* Draw Links */}
          {layoutLinks.map((link, idx) => {
            const sx = link.sourceNode.column * colWidth + 100;
            const sy = link.sourceNode.y + link.sourceNode.height / 2;
            const tx = link.targetNode.column * colWidth;
            const ty = link.targetNode.y + link.targetNode.height / 2;
            
            // Cubic bezier curve
            const path = `M ${sx} ${sy} C ${sx + colWidth/2} ${sy}, ${tx - colWidth/2} ${ty}, ${tx} ${ty}`;
            const strokeColor = link.flagged ? "var(--destructive)" : "var(--primary)";
            const opacity = link.flagged ? 0.6 : 0.2;
            const strokeWidth = Math.max(2, (link.value / 100000) * 10);

            return (
              <path 
                key={`link-${idx}`} 
                d={path} 
                fill="none" 
                stroke={strokeColor} 
                strokeWidth={strokeWidth} 
                opacity={opacity} 
                className="transition-all hover:opacity-80"
              >
                <title>{`${link.source} → ${link.target} : ₹${link.value}`}</title>
              </path>
            );
          })}

          {/* Draw Nodes */}
          {layoutNodes.map((node, idx) => {
            const x = node.column * colWidth;
            return (
              <g key={`node-${idx}`} transform={`translate(${x}, ${node.y})`}>
                <rect 
                  width="100" 
                  height={node.height} 
                  fill="var(--card)" 
                  stroke="var(--border)"
                  rx="4"
                  className="shadow-sm"
                />
                <text x="50" y={node.height / 2} textAnchor="middle" alignmentBaseline="middle" className="text-[10px] fill-foreground font-mono">
                  {node.id.replace('BANK_', '')}
                </text>
                <title>{`${node.id} - Total: ₹${node.value}`}</title>
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
