"use client";

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, FileText, Car, Landmark, Activity, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeData {
  label: string;
  entityType: 'Person' | 'FIR' | 'Vehicle' | 'Bank' | 'Phone' | 'Location' | 'Note' | 'Unknown';
  details?: any;
  isDimmed?: boolean;
}

const getStylesForType = (type: string) => {
  switch (type) {
    case 'Person':
      return {
        bg: 'bg-indigo-600 dark:bg-indigo-600/90',
        border: 'border-indigo-400',
        text: 'text-white',
        icon: User,
        shape: 'rounded-full px-4 py-4 min-w-[120px] aspect-square flex flex-col justify-center'
      };
    case 'FIR':
      return {
        bg: 'bg-amber-600 dark:bg-amber-600/90',
        border: 'border-amber-400',
        text: 'text-white',
        icon: FileText,
        shape: 'rounded-xl px-4 py-3 min-w-[150px]'
      };
    case 'Vehicle':
      return {
        bg: 'bg-emerald-600 dark:bg-emerald-600/90',
        border: 'border-emerald-400',
        text: 'text-white',
        icon: Car,
        shape: 'rounded-xl px-4 py-3 min-w-[120px]'
      };
    case 'Bank':
      return {
        bg: 'bg-teal-600 dark:bg-teal-600/90',
        border: 'border-teal-400',
        text: 'text-white',
        icon: Landmark,
        shape: 'rounded-sm px-4 py-3 min-w-[160px]'
      };
    case 'Note':
      return {
        bg: 'bg-yellow-200 dark:bg-yellow-200/90',
        border: 'border-yellow-400',
        text: 'text-yellow-900',
        icon: StickyNote,
        shape: 'rounded-sm px-4 py-3 min-w-[150px]'
      };
    default:
      return {
        bg: 'bg-slate-700 dark:bg-slate-700/90',
        border: 'border-slate-500',
        text: 'text-white',
        icon: Activity,
        shape: 'rounded-lg px-4 py-3 min-w-[120px]'
      };
  }
};

const CustomNodeComponent = ({ data, selected }: { data: NodeData, selected: boolean }) => {
  const styles = getStylesForType(data.entityType);
  const Icon = styles.icon;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-muted-foreground border-none" />
      
      <div 
        className={cn(
          "flex items-center gap-3 border-2 backdrop-blur-sm transition-all shadow-md text-shadow-sm",
          styles.bg,
          styles.text,
          styles.shape,
          selected ? `ring-2 ring-offset-2 ring-offset-background ${styles.border}` : `${styles.border} border-opacity-70 hover:border-opacity-100 hover:shadow-lg`,
          data.isDimmed ? "opacity-30 grayscale" : "opacity-100"
        )}
      >
        <div className={cn("shrink-0 p-2 rounded-full border", data.entityType === 'Note' ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-900" : "bg-black/20 border-white/20 text-white")}>
          <Icon className={cn("h-5 w-5 drop-shadow-md", data.entityType === 'Note' ? "" : "text-white")} />
        </div>
        <div className="flex flex-col text-center w-full">
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", data.entityType === 'Note' ? "text-yellow-900/80" : "text-white/80")}>
            {data.entityType}
          </span>
          <span className={cn("font-semibold text-sm leading-tight mt-0.5 truncate max-w-[100px]", data.entityType === 'Note' ? "text-yellow-900" : "text-white")}>
            {data.label}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-muted-foreground border-none" />
    </>
  );
};

export const CustomNode = memo(CustomNodeComponent);
