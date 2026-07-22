"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50 dark:opacity-20" />
      
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
      </div>

      <div className="w-full max-w-md z-10 relative">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 border border-primary/20">
            <ShieldAlert className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">CrimeIntel</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">AI Investigator Copilot for Karnataka State Police</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-none overflow-hidden backdrop-blur-xl">
          <div className="p-8 space-y-6">
            <div className="space-y-2 text-center pb-2">
              <h2 className="text-xl font-bold tracking-tight flex items-center justify-center gap-2">
                <LockKeyhole className="w-5 h-5 text-primary" /> Secure Gateway
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Authorized law enforcement personnel only.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="officerId" className="text-zinc-700 dark:text-zinc-300 font-semibold">Officer ID</Label>
                <Input 
                  id="officerId" 
                  name="officerId"
                  placeholder="KA-POL-XXXX" 
                  className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300 font-semibold">Passcode</Label>
                  <Link href="#" className="text-xs font-medium text-primary hover:underline transition-all">
                    Reset credentials?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary h-11"
                  required
                />
              </div>
              
              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold shadow-md shadow-primary/20 transition-all hover:scale-[1.02] mt-4">
                {loading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authenticating...</>
                ) : (
                  <>Authenticate & Enter <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
            </form>
          </div>
          
          <div className="bg-zinc-50 dark:bg-zinc-950/80 px-8 py-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-[11px] text-zinc-500 font-medium">
            By accessing this system, you agree to the KSP Data Governance Policy. All queries are strictly audited.
          </div>
        </div>
      </div>
    </div>
  );
}
