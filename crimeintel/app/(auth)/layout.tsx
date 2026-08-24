import React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopHeader } from "@/components/layout/TopHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="print:hidden h-full flex"><AppSidebar /></div>
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <div className="print:hidden"><TopHeader /></div>
        <main className="flex-1 flex flex-col relative overflow-y-auto bg-slate-50/50 dark:bg-background/95">
          {children}
        </main>
      </div>
    </div>
  );
}
