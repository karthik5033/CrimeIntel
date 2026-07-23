"use client";

import React, { useState } from "react";
import { User, Bell, Shield, Palette, Key, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { role } = useAuth();

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings, preferences, and security configurations.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "profile" 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <User className="w-4 h-4" />
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("appearance")}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "appearance" 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Palette className="w-4 h-4" />
                Appearance
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "notifications" 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "security" 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Shield className="w-4 h-4" />
                Security & Access
              </button>
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>
                      This information will be displayed on your audit logs and reports.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input defaultValue="R. Kumar" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Badge Number</label>
                        <Input defaultValue="KA-0984-BLR" disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input defaultValue="rkumar@ksp.gov.in" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Role</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border text-sm font-medium text-foreground">
                        <ShieldAlert className="w-4 h-4 text-primary" />
                        {role}
                      </div>
                      <p className="text-xs text-muted-foreground">Your role is managed by the central AD system.</p>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card>
                  <CardHeader>
                    <CardTitle>Theme Preferences</CardTitle>
                    <CardDescription>
                      Customize how CrimeIntel looks on your device.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 border-2 border-primary rounded-lg bg-background flex flex-col items-center gap-2 cursor-pointer w-32">
                        <div className="w-16 h-10 bg-slate-100 rounded border shadow-sm flex items-center justify-center overflow-hidden">
                          <div className="w-full h-full bg-slate-50 flex">
                             <div className="w-1/3 bg-slate-200 h-full border-r"></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">Light</span>
                      </div>
                      <div className="p-4 border border-border hover:border-primary/50 rounded-lg bg-background flex flex-col items-center gap-2 cursor-pointer w-32 opacity-50">
                        <div className="w-16 h-10 bg-slate-900 rounded border border-slate-800 shadow-sm flex items-center justify-center overflow-hidden">
                          <div className="w-full h-full bg-slate-900 flex">
                             <div className="w-1/3 bg-slate-800 h-full border-r border-slate-700"></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">Dark</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      * Dark mode support is currently restricted in this environment.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card>
                  <CardHeader>
                    <CardTitle>Alert Settings</CardTitle>
                    <CardDescription>
                      Manage what events trigger a system notification or email.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">High-Risk Case Updates</h4>
                        <p className="text-xs text-muted-foreground">Receive alerts when severe anomaly scores are detected.</p>
                      </div>
                      <div className="w-10 h-5 bg-primary rounded-full relative">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">Network Graph Mentions</h4>
                        <p className="text-xs text-muted-foreground">Notify when your pinned entities connect to a new syndicate.</p>
                      </div>
                      <div className="w-10 h-5 bg-primary rounded-full relative">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">Audit Export Completions</h4>
                        <p className="text-xs text-muted-foreground">Email me when a bulk compliance report finishes generating.</p>
                      </div>
                      <div className="w-10 h-5 bg-slate-200 rounded-full relative">
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                      Add an extra layer of security to your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-emerald-50/50 border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-900">2FA is currently active</p>
                          <p className="text-xs text-emerald-700">Configured via KSP Authenticator App.</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>
                      Review devices currently logged into your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Lenovo ThinkPad (Current)</p>
                        <p className="text-xs text-muted-foreground">Bengaluru, KA • Chrome on Windows 11</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Active Now</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Mobile App (KSP Secure)</p>
                        <p className="text-xs text-muted-foreground">Mysuru, KA • Android 14</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive text-xs h-7">Revoke</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
