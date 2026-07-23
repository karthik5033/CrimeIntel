"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Search className="w-8 h-8 text-primary" />
            Search Results
          </h1>
          <p className="text-sm text-muted-foreground">
            {query ? `Showing global intelligence search results for "${query}"` : "Enter a search query to find cases, FIRs, or suspects."}
          </p>
        </div>

        {query ? (
          <div className="space-y-4">
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3">
                <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
                <p>Advanced indexing for <strong>"{query}"</strong> is being processed.</p>
                <p className="text-xs">Once the synthetic dataset is fully populated and indexed in the Zoho DataStore, global search results across all modules will appear here.</p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading search...</div>}>
      <SearchResults />
    </Suspense>
  );
}
