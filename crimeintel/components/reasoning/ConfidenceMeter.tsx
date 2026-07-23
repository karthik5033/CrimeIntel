import React from 'react';
import { ConfidenceScore } from '@/lib/reasoning/types';

interface ConfidenceMeterProps {
  confidence: ConfidenceScore;
}

export function ConfidenceMeter({ confidence }: ConfidenceMeterProps) {
  // Determine color and width based on score
  let color = 'bg-red-500';
  if (confidence.score >= 40) color = 'bg-amber-500';
  if (confidence.score >= 70) color = 'bg-emerald-500';

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">Confidence: {confidence.level}</span>
        <span className="text-muted-foreground">{confidence.score}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${confidence.score}%` }} 
        />
      </div>

      {/* Factors List */}
      <ul className="text-xs text-muted-foreground list-disc pl-4 mt-2 space-y-1">
        {confidence.factors.map((factor, idx) => (
          <li key={idx}>{factor}</li>
        ))}
      </ul>
    </div>
  );
}
