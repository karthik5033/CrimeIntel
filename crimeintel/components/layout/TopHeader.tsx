"use client";

import React from "react";
import { Bell, Search, Menu, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/LanguageContext";

export function TopHeader() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-card/80 px-6 backdrop-blur-md">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="text-sm font-medium text-muted-foreground hidden md:flex items-center">
          <span className="hover:text-foreground cursor-pointer transition-colors">{t('header.workspace')}</span>
          <span className="mx-2 text-border">/</span>
          <span className="text-foreground font-semibold">{t('header.commandCenter')}</span>
        </div>
      </div>
      
      <div className="flex flex-1 items-center justify-end space-x-4">
        {/* Global Search */}
        <div className="relative hidden w-full max-w-md md:flex items-center group">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="search"
            placeholder={t('header.search')}
            className="w-full bg-muted/50 border-transparent pl-9 pr-12 focus-visible:ring-1 focus-visible:bg-background transition-all"
          />
          <div className="absolute right-1.5 flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <Command className="h-3 w-3" />
            <span>K</span>
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-card"></span>
        </Button>
      </div>
    </header>
  );
}
