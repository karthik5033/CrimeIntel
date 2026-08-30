
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Map, Activity, Users, Database, Server, Radio } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';

export default function FeaturesIndex() {
  return (
    <div className='flex min-h-screen flex-col bg-slate-50'>
      <PublicHeader />
      <main className='flex-1 container mx-auto px-4 py-12'>
        <Link href='/' className='inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8'>
          <ArrowLeft className='mr-2 h-4 w-4' /> Back to home
        </Link>
        <div className='max-w-3xl'>
          <h1 className='text-4xl font-extrabold tracking-tight mb-4'>CrimeIntel Platform Features</h1>
          <p className='text-lg text-slate-600 mb-12'>Explore the comprehensive suite of tools built for modern law enforcement and intelligence agencies.</p>
        </div>
        
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Link href='/features/dashboard' className='block group'>
            <div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-primary/50 h-full'>
              <div className='h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                <Activity className='h-6 w-6' />
              </div>
              <h3 className='text-xl font-bold mb-2 text-slate-900'>Central Dashboard</h3>
              <p className='text-slate-600 leading-relaxed'>Real-time monitoring, live crime mapping, and jurisdiction activity statistics.</p>
            </div>
          </Link>

          <Link href='/features/network' className='block group'>
            <div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-primary/50 h-full'>
              <div className='h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                <Database className='h-6 w-6' />
              </div>
              <h3 className='text-xl font-bold mb-2 text-slate-900'>Network Analysis</h3>
              <p className='text-slate-600 leading-relaxed'>Entity-relationship graphs to visualize connections between suspects and properties.</p>
            </div>
          </Link>

          <Link href='/features/predictive' className='block group'>
            <div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-primary/50 h-full'>
              <div className='h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                <Map className='h-6 w-6' />
              </div>
              <h3 className='text-xl font-bold mb-2 text-slate-900'>Predictive Analytics</h3>
              <p className='text-slate-600 leading-relaxed'>Forecast crime hotspots and identify emerging trends before they escalate.</p>
            </div>
          </Link>

          <Link href='/features/profiling' className='block group'>
            <div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-primary/50 h-full'>
              <div className='h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                <Users className='h-6 w-6' />
              </div>
              <h3 className='text-xl font-bold mb-2 text-slate-900'>Suspect Profiling</h3>
              <p className='text-slate-600 leading-relaxed'>Cross-reference aliases and build comprehensive profiles across multiple districts.</p>
            </div>
          </Link>

          <div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full opacity-60'>
            <div className='h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4'>
              <Radio className='h-6 w-6' />
            </div>
            <h3 className='text-xl font-bold mb-2 text-slate-900'>Live Dispatch (CAD)</h3>
            <p className='text-slate-600 leading-relaxed'>Coming soon: Real-time unit tracking and automated dispatch recommendations.</p>
          </div>

          <div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full opacity-60'>
            <div className='h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4'>
              <Server className='h-6 w-6' />
            </div>
            <h3 className='text-xl font-bold mb-2 text-slate-900'>Secure Evidence Vault</h3>
            <p className='text-slate-600 leading-relaxed'>Coming soon: Cryptographically secured digital evidence management system.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

