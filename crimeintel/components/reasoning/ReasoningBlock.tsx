"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, Search, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ReasoningOutput } from '@/lib/reasoning/types';
import { ConfidenceMeter } from './ConfidenceMeter';
import { EvidenceList } from './EvidenceList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReasoningBlockProps {
  output: ReasoningOutput;
}

export function ReasoningBlock({ output }: ReasoningBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Staggered reveal effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <Card className="w-full my-4 border-primary/20 shadow-md bg-gradient-to-b from-card to-card/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
        <CardTitle className="text-lg font-semibold flex items-center text-primary">
          <Brain className="w-5 h-5 mr-2" />
          Investigative Reasoning
        </CardTitle>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
          >
            <CardContent className="pt-4 space-y-6">
              
              {/* CLAIM */}
              <motion.div variants={itemVariants} className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <h3 className="text-sm font-bold text-primary mb-1 uppercase tracking-wider">Claim</h3>
                <p className="text-foreground font-medium">{output.claim}</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* MECHANISMS & EVIDENCE (Takes 2/3 width) */}
                <div className="md:col-span-2 space-y-6">
                  {/* MECHANISMS */}
                  <motion.div variants={itemVariants}>
                    <h3 className="text-sm font-bold text-foreground flex items-center mb-3 uppercase tracking-wider">
                      <Target className="w-4 h-4 mr-2 text-indigo-500" /> 
                      Mechanism: {output.mechanisms[0]?.name}
                    </h3>
                    {output.mechanisms.map((mech, mIdx) => (
                      <div key={mIdx} className="pl-6 border-l-2 border-indigo-200/50 mb-4">
                        <p className="text-sm text-muted-foreground mb-3">{mech.description}</p>
                        <ul className="space-y-2">
                          {mech.factors.map((factor, fIdx) => (
                            <li key={fIdx} className="text-sm flex items-start">
                              <span className="text-indigo-500 mr-2">↳</span>
                              <span className="text-foreground">{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </motion.div>

                  {/* EVIDENCE */}
                  <motion.div variants={itemVariants}>
                    <h3 className="text-sm font-bold text-foreground flex items-center mb-3 uppercase tracking-wider">
                      <Search className="w-4 h-4 mr-2 text-amber-500" /> 
                      Evidence
                    </h3>
                    <EvidenceList evidence={output.evidence} />
                  </motion.div>
                </div>

                {/* SIDEBAR: CONFIDENCE & ALTERNATIVES (Takes 1/3 width) */}
                <div className="space-y-6">
                  {/* CONFIDENCE */}
                  <motion.div variants={itemVariants} className="bg-muted/30 p-4 rounded-lg border border-border">
                    <ConfidenceMeter confidence={output.confidence} />
                  </motion.div>

                  {/* ALTERNATIVES */}
                  <motion.div variants={itemVariants}>
                    <h3 className="text-sm font-bold text-foreground flex items-center mb-3 uppercase tracking-wider">
                      <XCircle className="w-4 h-4 mr-2 text-rose-500" /> 
                      Alternatives Considered
                    </h3>
                    <div className="space-y-3">
                      {output.alternatives.map((alt, aIdx) => (
                        <div key={aIdx} className="text-sm bg-card p-3 rounded border border-border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{alt.hypothesis}</span>
                            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
                              alt.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                              alt.status === 'Supported' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {alt.status}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-xs leading-relaxed">{alt.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
