"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  MessageSquare, 
  Network, 
  LineChart, 
  FileText, 
  Users, 
  BellRing, 
  Landmark, 
  Settings, 
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { name: "Command Center", href: "/dashboard", icon: LayoutDashboard },
  { name: "Intelligence Chat", href: "/chat", icon: MessageSquare },
  { name: "Criminal Network", href: "/network", icon: Network },
  { name: "Analytics & Trends", href: "/analytics", icon: LineChart },
  { name: "Cases", href: "/cases", icon: FileText },
  { name: "Offenders", href: "/profiles", icon: Users },
  { name: "Early Warnings", href: "/alerts", icon: BellRing },
  { name: "Financial Links", href: "/financial", icon: Landmark },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className={cn(
      "flex h-screen flex-col border-r bg-card shadow-sm z-30 transition-all duration-300 relative group",
      isCollapsed ? "w-[80px]" : "w-64"
    )}>
      {/* Brand Section */}
      <div className={cn("flex h-16 items-center border-b border-border/50 transition-all overflow-hidden whitespace-nowrap", isCollapsed ? "justify-center px-0" : "px-6")}>
        <ShieldAlert className={cn("text-primary shrink-0 transition-all", isCollapsed ? "h-8 w-8" : "h-6 w-6 mr-3")} />
        {!isCollapsed && (
          <>
            <span className="text-lg font-bold tracking-tight text-foreground">CrimeIntel</span>
            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">KSP</span>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 overflow-x-hidden">
        <div className={cn(
          "flex items-center mb-2",
          isCollapsed ? "justify-center" : "justify-between px-3"
        )}>
          {!isCollapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap">
              Main Menu
            </span>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-all"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 overflow-hidden",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed ? "justify-center" : "justify-between"
              )}
            >
              <div className="flex items-center">
                <item.icon className={cn(
                  "shrink-0 transition-colors", 
                  isCollapsed ? "h-5 w-5" : "mr-3 h-4 w-4",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </div>
              {!isCollapsed && isActive && (
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse ml-2" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Section */}
      <div className="border-t border-border/50 p-4 overflow-hidden">
        <div className={cn(
          "flex items-center rounded-lg p-2 transition-colors hover:bg-muted cursor-pointer",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9 border border-border shrink-0">
              <AvatarImage src="" alt="Officer" />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">IO</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-sm font-medium leading-none mb-1">R. Kumar</span>
                <span className="text-xs text-muted-foreground">Inspector</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <LogOut className="h-4 w-4 shrink-0 text-muted-foreground hover:text-destructive transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
}
