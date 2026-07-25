"use client";

import React, { useState } from "react";
import { Sparkles, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function QuickMLBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/chat?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-3xl mx-auto mb-8 shadow-lg shadow-primary/5 rounded-full group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Sparkles className="h-5 w-5 text-primary/70 group-focus-within:text-primary transition-colors" />
      </div>
      <Input
        type="text"
        className="block w-full pl-12 pr-24 py-6 text-base rounded-full border-primary/20 bg-card/80 backdrop-blur-sm focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/70"
        placeholder="Ask Catalyst QuickML (e.g. 'Show me vehicle thefts in Bengaluru South')"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="absolute inset-y-0 right-1.5 flex items-center">
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-full w-9 h-9 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
