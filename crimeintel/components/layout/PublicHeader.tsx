import React from "react";
import Link from "next/link";
import { ShieldAlert, Search, Moon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
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
            <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
            <Link href="#solutions" className="transition-colors hover:text-foreground/80 text-foreground/60">Solutions</Link>
            <Link href="#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
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
            
            <Link href="/login">
              <Button variant="outline" className="h-9 font-medium px-4">
                Sign in
              </Button>
            </Link>
            <Link href="/login">
              <Button className="h-9 font-medium px-4 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
                Get all access
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
