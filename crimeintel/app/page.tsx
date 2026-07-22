import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Database, Zap, Network, BarChart2, LayoutTemplate, Layout, TrendingUp, MousePointerClick, Palette, Search, Copy, Share2, CheckCircle2, Map, Users, FolderOpen, Radio, BrainCircuit, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { FadeIn } from "@/components/ui/scroll-animation";
import { Slideshow } from "@/components/ui/slideshow";

// Helper component for the flowchart cards
const FlowCard = ({ icon, text, side }: { icon: React.ReactNode, text: string, side: "left" | "right" }) => (
  <div className="relative w-full md:w-[280px] h-20 bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex items-center px-5 z-10 transition-all hover:scale-[1.03] hover:shadow-[0_8px_30px_-5px_rgba(6,81,237,0.1)] hover:border-primary/30 group">
    <div className="text-zinc-400 group-hover:text-primary transition-colors mr-4 shrink-0 bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">{icon}</div>
    <span className="text-[14px] md:text-[15px] leading-tight font-semibold text-zinc-800 dark:text-zinc-200">{text}</span>
    {/* Twig (hidden on mobile) */}
    <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-8 h-px bg-zinc-200 dark:bg-zinc-800 z-0 overflow-hidden ${side === "left" ? "-right-8" : "-left-8"}`}>
      <div className="absolute inset-0 opacity-40 data-flow-line-horizontal" />
    </div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <PublicHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full pt-2 pb-12 md:pt-4 md:pb-20 lg:pt-6 lg:pb-24 relative overflow-hidden">
          {/* Subtle glowing background instead of stripes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-zinc-200/50 dark:bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none z-0"></div>
          
          {/* 3D XZ and YZ Plane Rotating Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] md:w-[1150px] md:h-[1150px] pointer-events-none z-0 [perspective:1200px] [transform-style:preserve-3d]">
            
            {/* Ring 1 - Outer Circle (XZ Plane Rotation) */}
            <div className="absolute inset-0 rounded-full border-[1.5px] border-emerald-900/35 dark:border-emerald-500/35"
                 style={{ animation: "spinXZ 32s linear infinite" }}>
            </div>

            {/* Ring 2 - Inner Circle (YZ Plane Rotation) */}
            <div className="absolute inset-[22%] rounded-full border-[1.5px] border-emerald-900/30 dark:border-emerald-500/30"
                 style={{ animation: "spinYZ 24s linear infinite" }}>
            </div>
          </div>
          
          <FadeIn className="container px-4 md:px-6 relative z-10 mx-auto text-center">
            
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-2 bg-muted/50 border rounded-full px-3 py-1 text-sm font-medium">
                <div className="flex -space-x-2">
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-zinc-200"></div>
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-zinc-300"></div>
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-zinc-400"></div>
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-zinc-500"></div>
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] text-primary-foreground">+</div>
                </div>
                <span className="text-muted-foreground ml-2">Trusted by <span className="text-primary font-bold">1600+</span> Police Stations</span>
              </div>
            </div>

            <div className="space-y-3 max-w-4xl mx-auto">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl/none">
                Build Investigative Intelligence at Warp Speed with <span className="text-primary underline decoration-4 underline-offset-8 decoration-primary/30">AI Copilots</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-4">
                Accelerate your investigations with ready-to-use and fully customizable AI models supported by the <span className="font-semibold text-primary">KSP Crime Database</span>. Automate reasoning, detect patterns, and solve cases faster.
              </p>
            </div>
            
            <div className="flex justify-center mt-8 mb-8 overflow-hidden relative w-full opacity-60 max-w-5xl mx-auto mask-image-linear-edges">
              <div className="flex w-max animate-marquee">
                {/* Metric Set 1 */}
                <div className="flex gap-10 md:gap-16 items-center pr-10 md:pr-16 whitespace-nowrap">
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Database className="mr-2 h-5 w-5 text-primary"/> 1.2M+ Records</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/> 450+ Agencies</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Network className="mr-2 h-5 w-5 text-primary"/> 14+ States</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Zap className="mr-2 h-5 w-5 text-primary"/> Sub-second Queries</div>
                </div>
                {/* Metric Set 2 */}
                <div className="flex gap-10 md:gap-16 items-center pr-10 md:pr-16 whitespace-nowrap">
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Database className="mr-2 h-5 w-5 text-primary"/> 1.2M+ Records</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/> 450+ Agencies</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Network className="mr-2 h-5 w-5 text-primary"/> 14+ States</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Zap className="mr-2 h-5 w-5 text-primary"/> Sub-second Queries</div>
                </div>
                {/* Metric Set 3 */}
                <div className="flex gap-10 md:gap-16 items-center pr-10 md:pr-16 whitespace-nowrap">
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Database className="mr-2 h-5 w-5 text-primary"/> 1.2M+ Records</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/> 450+ Agencies</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Network className="mr-2 h-5 w-5 text-primary"/> 14+ States</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Zap className="mr-2 h-5 w-5 text-primary"/> Sub-second Queries</div>
                </div>
                {/* Metric Set 4 */}
                <div className="flex gap-10 md:gap-16 items-center pr-10 md:pr-16 whitespace-nowrap">
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Database className="mr-2 h-5 w-5 text-primary"/> 1.2M+ Records</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/> 450+ Agencies</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Network className="mr-2 h-5 w-5 text-primary"/> 14+ States</div>
                  <div className="font-semibold text-lg flex items-center text-zinc-600 dark:text-zinc-400"><Zap className="mr-2 h-5 w-5 text-primary"/> Sub-second Queries</div>
                </div>
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-sm flex-col gap-4 sm:flex-row sm:max-w-md justify-center mt-6">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90">
                  Get all access <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base border-zinc-200 dark:border-zinc-800">
                Explore more <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </FadeIn>
        </section>

        {/* The Flowchart Section - Perfected Layout */}
        <section className="w-full py-24 relative bg-background border-t border-border/40 overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto text-center relative z-10">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              The Ultimate <span className="text-primary underline decoration-4 underline-offset-8 decoration-primary/30">Intelligence System</span>, Tailored<br/> Exclusively for CrimeIntel
            </h2>
            <p className="mx-auto max-w-[800px] text-muted-foreground md:text-lg mt-6 mb-20">
              CrimeIntel offers <span className="font-semibold text-primary">real-time crime mapping</span>, suspect profiling, intelligence graphs, and an automated case file system that integrates deeply with existing law enforcement infrastructure.
            </p>
            
            {/* Flexbox Flowchart Engine */}
            <div className="relative w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-y-12 md:gap-y-0 md:gap-x-16 min-h-[300px]">
               
               {/* Left Column */}
               <div className="flex flex-col gap-y-6 relative w-full md:w-auto items-center md:items-end">
                 {/* Vertical Trunk Line (Left) */}
                 <div className="hidden md:block absolute top-[40px] bottom-[40px] -right-8 w-px bg-zinc-200 dark:bg-zinc-800 z-0 overflow-hidden">
                   <div className="absolute inset-0 opacity-40 data-flow-line-vertical" />
                 </div>
                 
                 <FlowCard icon={<Map className="w-5 h-5"/>} text="Real-time Crime Mapping" side="left" />
                 <FlowCard icon={<Users className="w-5 h-5"/>} text="Suspect Profiling Database" side="left" />
                 <FlowCard icon={<FolderOpen className="w-5 h-5"/>} text="Automated Case Files" side="left" />
               </div>

               {/* Center Nodes & Main Horizontal Line */}
               <div className="relative flex items-center justify-center gap-x-4 md:gap-x-6">
                 {/* Main Horizontal Line connecting the left & right trunks */}
                 <div className="hidden md:block absolute top-1/2 left-[-2rem] right-[-2rem] h-px bg-zinc-200 dark:bg-zinc-800 z-0 -translate-y-1/2 overflow-hidden">
                   <div className="absolute inset-0 opacity-50 data-flow-line-horizontal" />
                 </div>
                 
                 {/* Data Source Node */}
                 <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-zinc-200 shadow-sm flex items-center justify-center z-10 relative">
                   <Database className="w-7 h-7 text-zinc-400" />
                 </div>
                 
                 <span className="font-bold text-zinc-400 z-10 relative">+</span>
                 
                 {/* AI Engine Node */}
                 <div className="relative z-10 group cursor-pointer">
                   <div className="absolute inset-0 bg-primary/30 rounded-[1.25rem] blur-xl group-hover:blur-2xl transition-all animate-pulse"></div>
                   <div className="w-16 h-16 rounded-[1.25rem] bg-primary shadow-xl flex items-center justify-center relative border border-white/20 transition-transform group-hover:scale-105">
                     <Sparkles className="w-7 h-7 text-white" />
                   </div>
                 </div>
               </div>

               {/* Right Column */}
               <div className="flex flex-col gap-y-6 relative w-full md:w-auto items-center md:items-start">
                 {/* Vertical Trunk Line (Right) */}
                 <div className="hidden md:block absolute top-[40px] bottom-[40px] -left-8 w-px bg-zinc-200 dark:bg-zinc-800 z-0 overflow-hidden">
                   <div className="absolute inset-0 opacity-40 data-flow-line-vertical" />
                 </div>
                 
                 <FlowCard icon={<Radio className="w-5 h-5"/>} text="Live Unit Dispatch (CAD)" side="right" />
                 <FlowCard icon={<Network className="w-5 h-5"/>} text="Network Intelligence Graphs" side="right" />
                 <FlowCard icon={<BrainCircuit className="w-5 h-5"/>} text="Predictive Crime Analytics" side="right" />
               </div>
            </div>
            
            <div className="mt-16 text-center w-full">
              <Button size="lg" className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90">
                Get all access <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Interactive Studio Preview Section - Perfected Layout */}
        <section className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 relative py-20">
          <FadeIn className="container px-4 md:px-6 mx-auto">
            <div className="text-center pb-12">
              <h2 className="text-2xl md:text-[28px] text-zinc-600 max-w-4xl mx-auto leading-relaxed font-normal">
                Access comprehensive intelligence dashboards, cross-reference suspect data instantly, and export detailed case reports in seconds. Turn raw data into actionable police intelligence.
              </h2>
              <div className="mt-10 flex justify-center space-x-4">
                <Button size="lg" className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                  Get all access
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 bg-white border-zinc-200 hover:bg-zinc-100 font-medium transition-all shadow-sm">
                  Explore more <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-zinc-900">
              
               {/* Left side text tabs */}
               <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                {/* Tab 1 - Active */}
                <div className="p-6 md:p-8 lg:pl-10 border-l-[4px] border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-900/20 cursor-pointer">
                   <h3 className="text-lg md:text-xl font-bold flex items-center mb-2">
                     <Search className="mr-3 h-5 w-5 text-zinc-700 dark:text-zinc-300" /> Search → Cross-Reference
                   </h3>
                   <p className="text-muted-foreground text-[14px] leading-relaxed max-w-sm">
                     Instantly query databases, cross-reference suspect aliases, and identify hidden network connections across multiple districts.
                   </p>
                </div>
                
                {/* Tab 2 - Inactive */}
                <div className="p-6 md:p-8 lg:pl-10 border-l-[4px] border-transparent hover:bg-zinc-50/50 cursor-pointer transition-colors border-t border-b border-zinc-200 dark:border-zinc-800">
                   <h3 className="text-lg md:text-xl font-bold flex items-center mb-2">
                     <Copy className="mr-3 h-5 w-5 text-zinc-700 dark:text-zinc-300" /> Export Automated Reports
                   </h3>
                   <p className="text-muted-foreground text-[14px] leading-relaxed max-w-sm">
                     Generate comprehensive FIR summaries, export intelligence dossiers, and prepare court-ready documents with a single click.
                   </p>
                </div>
                
                {/* Tab 3 - Inactive */}
                <div className="p-6 md:p-8 lg:pl-10 border-l-[4px] border-transparent hover:bg-zinc-50/50 cursor-pointer transition-colors">
                   <h3 className="text-lg md:text-xl font-bold flex items-center mb-2">
                     <Share2 className="mr-3 h-5 w-5 text-zinc-700 dark:text-zinc-300" /> Secure Case Management
                   </h3>
                   <p className="text-muted-foreground text-[14px] leading-relaxed max-w-sm">
                     Manage active investigations securely, save digital evidence, and collaborate in real-time with other stations.
                   </p>
                </div>
               </div>
            
            {/* Right side Images/Mockup Slideshow */}
            <div className="bg-zinc-50/80 dark:bg-zinc-900/30 flex flex-col items-center justify-center p-8 md:p-12 relative overflow-hidden min-h-[500px]">
               
               {/* Mockup Container */}
               <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white group z-10">
                  
                  {/* Top bar browser mockup */}
                  <div className="absolute top-0 left-0 w-full h-10 border-b border-zinc-200 bg-white z-20 flex items-center px-4">
                     <div className="flex space-x-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-zinc-200"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-zinc-200"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-zinc-200"></div>
                     </div>
                     <div className="absolute left-1/2 -translate-x-1/2 bg-zinc-50 border border-zinc-200 shadow-sm rounded flex items-center justify-center h-6 px-10">
                        <span className="text-[10px] text-zinc-500 font-medium font-mono flex items-center">
                           <ShieldCheck className="h-3 w-3 mr-1.5 text-zinc-900" /> crimeintel.dev
                        </span>
                     </div>
                  </div>

                  {/* Image Slideshow wrapper */}
                  <div className="absolute top-10 left-0 right-0 bottom-0 bg-white">
                    <Slideshow images={[
                      "/images/dashboard-ui.png",
                      "/images/crime_case_file_ui_1784723422475.png",
                      "/images/network-ui.png",
                      "/images/police_cad_dashboard_ui_1784723433845.png",
                      "/images/analytics-ui.png",
                      "/images/intelligence_graph_ui_1784723448238.png"
                    ]} interval={3500} />
                  </div>
               </div>
               
               {/* Helper text - explicitly placed below the mockup */}
               <div className="mt-8 z-10 relative">
                  <div className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase bg-white border border-zinc-200 px-5 py-2 rounded-full shadow-sm">
                    LIVE AI GENERATION PREVIEW
                  </div>
               </div>
             </div>
            </div>
          </FadeIn>
        </section>

        {/* Product Display Rows Section */}
        <section className="w-full bg-background relative border-t border-zinc-100 dark:border-zinc-900 py-12 md:py-16">
          <div className="container px-4 md:px-6 mx-auto">
            
            {/* Dashboard Row */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 md:gap-12 pb-8 md:pb-10 border-b border-dashed border-zinc-200 dark:border-zinc-800">
               <div className="flex flex-col justify-center space-y-4">
                  <h3 className="text-[22px] font-bold tracking-tight">Central Intelligence Dashboard</h3>
                  <p className="text-muted-foreground text-[17px] leading-relaxed">
                    Real-time monitoring and analytics for police superintendents, inspectors, and intelligence officers.
                  </p>
                  <ul className="space-y-3 text-muted-foreground mt-2 text-[15px]">
                     <li className="flex items-start"><CheckCircle2 className="mr-3 h-5 w-5 text-primary shrink-0" /> Seamless integration with state CCTNS and Zoho databases.</li>
                     <li className="flex items-start"><CheckCircle2 className="mr-3 h-5 w-5 text-primary shrink-0" /> Live crime heatmaps and jurisdictional activity statistics.</li>
                  </ul>
                  <div className="pt-4">
                    <Button variant="outline" className="h-10 px-6 bg-zinc-50 border-primary/30 dark:bg-zinc-900 dark:border-primary/30 font-medium hover:bg-primary/5 hover:text-primary transition-colors text-zinc-900 dark:text-zinc-100">
                      Explore more <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 items-center">
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/crime_heatmap_ui_1784728718764.png" alt="Crime Heatmap" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/police_cad_dashboard_ui_1784723433845.png" alt="CAD Dashboard" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/unit_tracker_ui_1784728761379.png" alt="Unit Tracker Map" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/dashboard-ui.png" alt="Dashboard UI" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/analytics-ui.png" alt="Analytics UI" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/crime_case_file_ui_1784723422475.png" alt="Case File" fill className="object-cover" />
                  </div>
               </div>
            </div>

            {/* Frontend Templates Row */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 md:gap-12 pt-8 md:pt-10">
               <div className="flex flex-col justify-center space-y-4">
                  <h3 className="text-[22px] font-bold tracking-tight">Network Analysis & Graphing</h3>
                  <p className="text-muted-foreground text-[17px] leading-relaxed">
                    Powerful entity-relationship graphs to visualize connections between suspects, vehicles, properties, and criminal organizations.
                  </p>
                  <ul className="space-y-3 text-muted-foreground mt-2 text-[15px]">
                     <li className="flex items-start"><CheckCircle2 className="mr-3 h-5 w-5 text-primary shrink-0" /> Detect money laundering rings and organized crime syndicates.</li>
                     <li className="flex items-start"><CheckCircle2 className="mr-3 h-5 w-5 text-primary shrink-0" /> One-click expansion of suspect associates and financial records.</li>
                  </ul>
                  <div className="pt-4">
                    <Button variant="outline" className="h-10 px-6 bg-zinc-50 border-primary/30 dark:bg-zinc-900 dark:border-primary/30 font-medium hover:bg-primary/5 hover:text-primary transition-colors text-zinc-900 dark:text-zinc-100">
                      Explore more <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 items-center">
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/intelligence_graph_ui_1784723448238.png" alt="Intelligence Graph" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/facial_recognition_ui_1784728734412.png" alt="Facial Recognition" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/crime_case_file_ui_1784723422475.png" alt="Case File UI" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/network-ui.png" alt="Network UI" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/crime_heatmap_ui_1784728718764.png" alt="Crime Heatmap" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/police_cad_dashboard_ui_1784723433845.png" alt="CAD Dashboard" fill className="object-cover" />
                  </div>
               </div>
            </div>
            
          </div>
        </section>

        {/* Security & Deployment Section */}
        <section className="w-full bg-background relative border-t border-zinc-100 dark:border-zinc-900 py-24 md:py-32">
          <div className="container px-4 md:px-6 mx-auto text-center max-w-4xl">
            <div className="inline-block mb-6">
              <span className="text-[13px] font-medium italic border-b border-zinc-400 dark:border-zinc-600 pb-0.5">Security</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-8">
              <span className="text-primary underline decoration-[3px] underline-offset-[10px] decoration-primary/30">Enterprise-Grade Security</span>
            </h2>
            
            <p className="text-lg md:text-[20px] text-muted-foreground mb-4">
              Deployed securely <strong className="font-semibold text-foreground">on-premise</strong> or via <strong className="font-semibold text-foreground">government cloud</strong>.
            </p>
            <p className="text-muted-foreground text-[17px] mb-20">
              Built exclusively for law enforcement and intelligence agencies.
            </p>
            
            {/* Animated Marquee Features */}
            <div className="relative flex overflow-hidden w-full max-w-full mask-image-linear-edges py-4 mb-20 group">
              <div className="flex w-max animate-marquee whitespace-nowrap items-center gap-16 md:gap-24 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
                {/* We repeat the array 4 times to ensure it can scroll -50% and loop perfectly */}
                {[1, 2, 3, 4].map((i) => (
                  <React.Fragment key={i}>
                    <div className="font-bold text-[24px] tracking-tighter flex items-center">AES-256</div>
                    <div className="font-extrabold text-[24px] tracking-tight">Audit Logging</div>
                    <div className="font-bold text-[22px] leading-none text-left flex items-center gap-2">
                      <div className="flex flex-col">
                        <span>CCTNS</span>
                        <span className="font-normal text-sm">integrated</span>
                      </div>
                      <div className="w-5 h-7 bg-zinc-900 dark:bg-zinc-100 transform -skew-x-12"></div>
                    </div>
                    <div className="font-medium text-[24px] tracking-tight text-zinc-600 dark:text-zinc-400">CJIS <span className="font-bold text-zinc-900 dark:text-zinc-100">Compliant</span></div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-[15px] text-muted-foreground">
                <strong className="text-foreground font-semibold">Strictly Audited Access:</strong> Every search, query, and export is logged and monitored for compliance and operational integrity.
              </p>
              <p className="text-[15px] text-muted-foreground flex items-center justify-center gap-2">
                <span className="text-zinc-400">✓</span> Regular security patches and intelligence module updates.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
