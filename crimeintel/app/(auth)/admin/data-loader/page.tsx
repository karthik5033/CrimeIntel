"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Upload, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function DataLoaderPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/admin/load-data');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check status:', error);
      toast.error('Failed to check Catalyst Data Store status');
    } finally {
      setChecking(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/load-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: ['firs', 'persons', 'vehicles', 'relationships'] })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Seed data loaded successfully!');
        await checkStatus(); // Refresh status
      } else {
        toast.error(`Failed to load data: ${data.error}`);
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Network error loading data');
    } finally {
      setLoading(false);
    }
  };

  const hasData = status?.counts?.firs > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Database className="w-8 h-8 text-primary" />
          Catalyst Data Store Manager
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Load seed data into Catalyst Data Store tables. This is a one-time operation.
        </p>
      </div>

      {/* Status Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Status</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkStatus}
              disabled={checking}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            {checking ? 'Checking Catalyst Data Store...' : status?.status}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <div className="text-sm text-muted-foreground">FIRs</div>
                <div className="text-2xl font-bold">{status.counts?.firs || 0}</div>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <div className="text-sm text-muted-foreground">Persons</div>
                <div className="text-2xl font-bold">{status.counts?.persons || 0}</div>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <div className="text-sm text-muted-foreground">Vehicles</div>
                <div className="text-2xl font-bold">{status.counts?.vehicles || 0}</div>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <div className="text-sm text-muted-foreground">Relationships</div>
                <div className="text-2xl font-bold">{status.counts?.relationships || 0}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load Data Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Load Seed Data
          </CardTitle>
          <CardDescription>
            This will load all seed JSON files into Catalyst Data Store. 
            {hasData && ' Tables already contain data - loading again will create duplicates.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasData ? (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                Data already loaded. Dashboard should be showing real data.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-400">
                Tables are empty. Load seed data to populate the database.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">What will be loaded:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• ~200 FIR records</li>
              <li>• ~500 Person records</li>
              <li>• ~100 Vehicle records</li>
              <li>• ~2000 Entity Relationships (graph edges)</li>
            </ul>
          </div>

          <Button 
            onClick={loadAllData} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Data into Catalyst...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Load All Seed Data
              </>
            )}
          </Button>

          {loading && (
            <p className="text-xs text-center text-muted-foreground">
              This may take 1-2 minutes depending on network speed...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Next Steps After Loading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <div>
              <p className="font-medium">Verify Dashboard</p>
              <p className="text-muted-foreground">Go to /dashboard and confirm real FIRs are showing</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <div>
              <p className="font-medium">Check Cases Page</p>
              <p className="text-muted-foreground">Navigate to /cases to see all loaded FIRs</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <div>
              <p className="font-medium">Test Network Graph</p>
              <p className="text-muted-foreground">Visit /network to see relationship visualization</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">4</Badge>
            <div>
              <p className="font-medium">Remove Fallbacks (If Not Done)</p>
              <p className="text-muted-foreground">Ensure lib/catalyst/datastore.ts has no JSON fallbacks</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
