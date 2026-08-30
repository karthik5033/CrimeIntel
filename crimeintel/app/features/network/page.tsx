"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Network, Users, Search, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { FadeIn } from "@/components/ui/scroll-animation";

export default function NetworkFeaturePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <PublicHeader />
      
      <main className="flex-1">
        <section className="w-full pt-12 pb-24 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none z-0"></div>
          
          <FadeIn className="container px-4 md:px-6 relative z-10 mx-auto max-w-5xl">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
            </Link>
            
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-2">
                <Network className="mr-2 h-4 w-4" /> Feature Spotlight
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                Network Analysis & Graphing
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mt-4 leading-relaxed">
                Powerful entity-relationship graphs to visualize connections between suspects, vehicles, properties, and criminal organizations. Map out hidden crime syndicates with a click.
              </p>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                <div className="h-12 w-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Detect Syndicates</h3>
                <p className="text-muted-foreground">
                  Quickly detect money laundering rings, organized crime syndicates, and recurring accomplices across multiple independent FIRs and jurisdictions.
                </p>
              </div>
              
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                <div className="h-12 w-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">One-Click Expansion</h3>
                <p className="text-muted-foreground">
                  Expand suspect networks infinitely. One-click expansion of suspect associates, financial records, and known vehicle usage.
                </p>
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <h2 className="text-2xl font-bold mb-6">Ready to see it in action?</h2>
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90">
                  Request a Demo
                </Button>
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>
    </div>
  );
}
