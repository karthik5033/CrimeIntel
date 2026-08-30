"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Search, Moon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";

export function PublicHeader() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8 mx-auto">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5" />
            <span className="font-bold sm:inline-block">
              CrimeIntel
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium hidden md:flex">
            <Link href="/features/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">Dashboard</Link>
            <Link href="/features/network" className="transition-colors hover:text-foreground/80 text-foreground/60">Network Graph</Link>
            <Link href="/features/predictive" className="transition-colors hover:text-foreground/80 text-foreground/60">Predictive AI</Link>
            <Link href="/features/profiling" className="transition-colors hover:text-foreground/80 text-foreground/60">Suspect Profiling</Link>
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Moon className="h-4 w-4" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Palette className="h-4 w-4" />
              <span className="sr-only">Theme switcher</span>
            </Button>
            
            <div className="w-px h-4 bg-border mx-2"></div>
            
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
            
            <div className="w-px h-4 bg-border mx-2"></div>
            
            <Link href="/login">
              <Button variant="outline" className="h-9 font-medium px-4">
                {t('header.signIn') || 'Sign in'}
              </Button>
            </Link>
            <Link href="/login">
              <Button className="h-9 font-medium px-4 bg-primary text-primary-foreground hover:bg-primary/90">
                {t('header.getAllAccess') || 'Get all access'}
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
