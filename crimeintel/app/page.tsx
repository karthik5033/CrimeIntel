import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Database, Zap, Network, BarChart2, LayoutTemplate, Layout, TrendingUp, MousePointerClick, Palette, Search, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { FadeIn } from "@/components/ui/scroll-animation";
import { Slideshow } from "@/components/ui/slideshow";

// Helper component for the flowchart cards
const FlowCard = ({ icon, text, side }: { icon: React.ReactNode, text: string, side: "left" | "right" }) => (
  <div className="relative w-full md:w-[280px] h-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex items-center px-5 z-10 transition-transform hover:scale-[1.02]">
    <div className="text-zinc-500 mr-4 shrink-0">{icon}</div>
    <span className="text-[15px] leading-tight font-semibold">{text}</span>
    {/* Twig (hidden on mobile) */}
    <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-8 h-px bg-zinc-200 dark:bg-zinc-800 z-0 ${side === "left" ? "-right-8" : "-left-8"}`} />
  </div>
);

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-zinc-900 selection:text-white">
      <PublicHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full pt-4 pb-12 md:pt-8 md:pb-20 lg:pt-12 lg:pb-24 relative overflow-hidden">
          {/* Subtle glowing background instead of stripes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-zinc-200/50 dark:bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
          
          <FadeIn className="container px-4 md:px-6 relative z-10 mx-auto text-center">
            
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-2 bg-muted/50 border rounded-full px-3 py-1 text-sm font-medium">
                <div className="flex -space-x-2">
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-zinc-200"></div>
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-zinc-300"></div>
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-zinc-400"></div>
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-zinc-500"></div>
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-zinc-900 flex items-center justify-center text-[10px] text-white">+</div>
                </div>
                <span className="text-muted-foreground ml-2">Trusted by <span className="text-foreground font-semibold">1600+</span> Police Stations</span>
              </div>
            </div>

            <div className="space-y-4 max-w-4xl mx-auto">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl/none">
                Build Investigative Intelligence at Warp Speed with <span className="underline decoration-4 underline-offset-8 decoration-zinc-900 dark:decoration-white">AI Copilots</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-6">
                Accelerate your investigations with ready-to-use and fully customizable AI models supported by the KSP Crime Database. Automate reasoning, detect patterns, and solve cases faster.
              </p>
            </div>
            
            <div className="flex justify-center mt-12 mb-16 overflow-hidden relative w-full opacity-50 grayscale max-w-5xl mx-auto mask-image-linear-edges">
              <div className="flex w-max animate-marquee space-x-12 md:space-x-20">
                {/* Logo Set 1 */}
                <div className="flex gap-12 md:gap-20 items-center">
                  <div className="font-bold text-xl flex items-center"><ShieldCheck className="mr-2 h-6 w-6"/> CID</div>
                  <div className="font-bold text-xl flex items-center"><Database className="mr-2 h-6 w-6"/> CCTNS</div>
                  <div className="font-bold text-xl flex items-center"><Zap className="mr-2 h-6 w-6"/> ZOHO</div>
                  <div className="font-bold text-xl flex items-center"><Network className="mr-2 h-6 w-6"/> INTERPOL</div>
                </div>
                {/* Logo Set 2 */}
                <div className="flex gap-12 md:gap-20 items-center">
                  <div className="font-bold text-xl flex items-center"><ShieldCheck className="mr-2 h-6 w-6"/> CID</div>
                  <div className="font-bold text-xl flex items-center"><Database className="mr-2 h-6 w-6"/> CCTNS</div>
                  <div className="font-bold text-xl flex items-center"><Zap className="mr-2 h-6 w-6"/> ZOHO</div>
                  <div className="font-bold text-xl flex items-center"><Network className="mr-2 h-6 w-6"/> INTERPOL</div>
                </div>
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-sm flex-col gap-4 sm:flex-row sm:max-w-md justify-center mt-8">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
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
              The Ultimate <span className="underline decoration-4 underline-offset-8 decoration-zinc-900 dark:decoration-white">Intelligence System</span>, Tailored<br/> Exclusively for CrimeIntel
            </h2>
            <p className="mx-auto max-w-[800px] text-muted-foreground md:text-lg mt-6 mb-20">
              CrimeIntel offers <span className="font-semibold text-zinc-900 dark:text-white">real-time crime mapping</span>, suspect profiling, intelligence graphs, and an automated case file system that integrates deeply with existing law enforcement infrastructure.
            </p>
            
            {/* Flexbox Flowchart Engine */}
            <div className="relative w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-y-12 md:gap-y-0 md:gap-x-16 min-h-[300px]">
               
               {/* Left Column */}
               <div className="flex flex-col gap-y-6 relative w-full md:w-auto items-center md:items-end">
                 {/* Vertical Trunk Line (Left) - Adjusted to 40px to match h-20 card center */}
                 <div className="hidden md:block absolute top-[40px] bottom-[40px] -right-8 w-px bg-zinc-200 dark:bg-zinc-800 z-0" />
                 
                 <FlowCard icon={<BarChart2 className="w-5 h-5"/>} text="Real-time Crime Mapping" side="left" />
                 <FlowCard icon={<LayoutTemplate className="w-5 h-5"/>} text="Suspect Profiling Database" side="left" />
                 <FlowCard icon={<Layout className="w-5 h-5"/>} text="Automated Case Files" side="left" />
               </div>

               {/* Center Nodes & Main Horizontal Line */}
               <div className="relative flex items-center justify-center gap-x-4">
                 {/* Main Horizontal Line connecting the left & right trunks */}
                 <div className="hidden md:block absolute top-1/2 left-[-2rem] right-[-2rem] h-px bg-zinc-200 dark:bg-zinc-800 z-0 -translate-y-1/2" />
                 
                 <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-zinc-200 shadow-sm flex items-center justify-center z-10 relative"></div>
                 <span className="font-bold text-zinc-400 z-10 relative">+</span>
                 <div className="w-16 h-16 rounded-[1.25rem] bg-zinc-900 shadow-xl flex items-center justify-center z-10 relative"></div>
               </div>

               {/* Right Column */}
               <div className="flex flex-col gap-y-6 relative w-full md:w-auto items-center md:items-start">
                 {/* Vertical Trunk Line (Right) - Adjusted to 40px */}
                 <div className="hidden md:block absolute top-[40px] bottom-[40px] -left-8 w-px bg-zinc-200 dark:bg-zinc-800 z-0" />
                 
                 <FlowCard icon={<TrendingUp className="w-5 h-5"/>} text="Live Unit Dispatch (CAD)" side="right" />
                 <FlowCard icon={<MousePointerClick className="w-5 h-5"/>} text="Network Intelligence Graphs" side="right" />
                 <FlowCard icon={<Palette className="w-5 h-5"/>} text="Predictive Crime Analytics" side="right" />
               </div>
            </div>
            
            <div className="mt-16 text-center w-full">
              <Button size="lg" className="h-12 px-8 bg-zinc-900 text-white hover:bg-zinc-800">
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
                <Button size="lg" className="h-12 px-8 bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm">
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
                     <li className="flex items-start"><span className="mr-2 text-zinc-400">•</span> Seamless integration with state CCTNS and Zoho databases.</li>
                     <li className="flex items-start"><span className="mr-2 text-zinc-400">•</span> Live crime heatmaps and jurisdictional activity statistics.</li>
                  </ul>
                  <div className="pt-4">
                    <Button variant="outline" className="h-10 px-6 bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 font-medium hover:bg-zinc-100">
                      Explore more <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-center">
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/crime_heatmap_ui_1784728718764.png" alt="Crime Heatmap" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/police_cad_dashboard_ui_1784723433845.png" alt="CAD Dashboard" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/unit_tracker_ui_1784728761379.png" alt="Unit Tracker Map" fill className="object-cover" />
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
                     <li className="flex items-start"><span className="mr-2 text-zinc-400">•</span> Detect money laundering rings and organized crime syndicates.</li>
                     <li className="flex items-start"><span className="mr-2 text-zinc-400">•</span> One-click expansion of suspect associates and financial records.</li>
                  </ul>
                  <div className="pt-4">
                    <Button variant="outline" className="h-10 px-6 bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 font-medium hover:bg-zinc-100">
                      Explore more <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-center">
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/intelligence_graph_ui_1784723448238.png" alt="Intelligence Graph" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/facial_recognition_ui_1784728734412.png" alt="Facial Recognition" fill className="object-cover" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 aspect-video relative group shadow-sm transition-transform hover:scale-[1.02]">
                     <Image src="/images/crime_case_file_ui_1784723422475.png" alt="Case File UI" fill className="object-cover" />
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
              <span className="underline decoration-[3px] underline-offset-[10px] decoration-zinc-900 dark:decoration-white">Enterprise-Grade Security</span>
            </h2>
            
            <p className="text-lg md:text-[20px] text-muted-foreground mb-4">
              Deployed securely <strong className="font-semibold text-foreground">on-premise</strong> or via <strong className="font-semibold text-foreground">government cloud</strong>.
            </p>
            <p className="text-muted-foreground text-[17px] mb-20">
              Built exclusively for law enforcement and intelligence agencies.
            </p>
            
            {/* Grayscale Features */}
            <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-40 grayscale mb-20">
              <div className="font-bold text-[24px] tracking-tighter flex items-center">AES-256</div>
              <div className="font-extrabold text-[24px] tracking-tight">Audit Logging</div>
              <div className="font-bold text-[22px] leading-none text-left flex items-center gap-2">
                <div className="flex flex-col">
                  <span>CCTNS</span>
                  <span className="font-normal text-sm">integrated</span>
                </div>
                <div className="w-5 h-7 bg-zinc-900 transform -skew-x-12"></div>
              </div>
              <div className="font-medium text-[24px] tracking-tight text-zinc-600">CJIS <span className="font-bold text-zinc-900">Compliant</span></div>
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
