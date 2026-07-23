"use client";

import React from "react";
import { Bell, Search, Menu, Command, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopHeader() {
  const { language, setLanguage, t } = useLanguage();
  const { role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  let title = t('header.commandCenter');
  if (pathname?.includes('/chat')) {
    title = t('sidebar.intelligenceChat');
  } else if (pathname?.includes('/network')) {
    title = t('sidebar.criminalNetwork');
  } else if (pathname?.includes('/dashboard')) {
    title = t('sidebar.commandCenter');
  } else if (pathname?.includes('/analytics')) {
    title = t('sidebar.analytics');
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-card/80 px-6 backdrop-blur-md">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="text-sm font-medium text-muted-foreground hidden md:flex items-center">
          <span className="hover:text-foreground cursor-pointer transition-colors">{t('header.workspace')}</span>
          <span className="mx-2 text-border">/</span>
          <span className="text-foreground font-semibold">{title}</span>
        </div>
      </div>
      
      <div className="flex flex-1 items-center justify-end space-x-4">
        {/* Global Search */}
        <form onSubmit={handleSearch} className="relative hidden w-full max-w-md md:flex items-center group">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('header.search')}
            className="w-full bg-muted/50 border-transparent pl-9 pr-12 focus-visible:ring-1 focus-visible:bg-background transition-all"
          />
          <div className="absolute right-1.5 flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </form>

        {/* User Role Badge */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center px-3 py-1.5 bg-muted/50 border rounded-md text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-primary" />
            {role}
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center border rounded-md overflow-hidden bg-muted/30">
          <button 
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs transition-colors ${language === 'en' ? 'font-semibold bg-background border-r shadow-sm text-foreground' : 'font-medium text-muted-foreground hover:text-foreground'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLanguage('kn')}
            className={`px-2.5 py-1 text-xs transition-colors ${language === 'kn' ? 'font-semibold bg-background border-l shadow-sm text-foreground' : 'font-medium text-muted-foreground hover:text-foreground'}`}
          >
            ಕನ್ನಡ
          </button>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-2 rounded-md hover:bg-muted focus-visible:outline-none transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-card animate-pulse"></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <span className="font-semibold text-sm">New High-Risk Case Detected</span>
                <span className="text-xs text-muted-foreground">Case #FIR-2025-089 has been flagged with 92% anomaly score.</span>
                <span className="text-[10px] text-muted-foreground/70 mt-1">10 minutes ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <span className="font-semibold text-sm">Network Syndicate Match</span>
                <span className="text-xs text-muted-foreground">A known suspect is linked to a new gang in Bengaluru South.</span>
                <span className="text-[10px] text-muted-foreground/70 mt-1">1 hour ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <span className="font-semibold text-sm">Report Export Complete</span>
                <span className="text-xs text-muted-foreground">Your Q3 Financial Audit report is ready for download.</span>
                <span className="text-[10px] text-muted-foreground/70 mt-1">Yesterday</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
