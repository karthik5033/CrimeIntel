import { Suspense } from 'react';
import { ClientFinancial } from './ClientFinancial';

export default function FinancialPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Financial Crime & Transaction Analysis
        </h1>
        <p className="text-slate-600 mt-2">
          Money trail visualization, suspicious transaction detection, and UPI/bank account link analysis
        </p>
      </div>
      
      <Suspense fallback={<div className="text-center py-8">Loading financial data...</div>}>
        <ClientFinancial />
      </Suspense>
    </div>
  );
}
