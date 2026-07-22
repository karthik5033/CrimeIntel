import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <ShieldAlert className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">CrimeIntel</h1>
          <p className="text-slate-500 dark:text-slate-400">AI Investigator Copilot for Karnataka State Police</p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl">Secure Login</CardTitle>
            <CardDescription>
              Enter your official credentials to access the command center.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="officer-id">Officer ID or Email</Label>
              <Input 
                id="officer-id" 
                placeholder="KA-POL-XXXX" 
                className="bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col pt-2 space-y-4">
            <Link href="/dashboard" className="w-full">
              <Button className="w-full h-11 text-base font-medium">
                Authenticate & Enter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <div className="text-center text-xs text-slate-500">
              By accessing this system, you agree to the KSP Data Governance Policy. All actions are audited.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
