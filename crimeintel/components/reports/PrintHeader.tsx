import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
}

export function PrintHeader({ title, subtitle }: PrintHeaderProps) {
  return (
    <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-slate-900" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wider">CrimeIntel</h1>
            <p className="text-xs text-slate-500 font-medium">KARNATAKA STATE POLICE — COMMAND CENTER</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">RESTRICTED</p>
          <p className="text-xs text-slate-500" suppressHydrationWarning>Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
