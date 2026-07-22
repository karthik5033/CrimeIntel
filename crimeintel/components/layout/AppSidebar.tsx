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
  ChevronRight
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

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card shadow-sm z-10 transition-all duration-300">
      {/* Brand Section */}
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <ShieldAlert className="h-6 w-6 text-primary mr-3" />
        <span className="text-lg font-bold tracking-tight text-foreground">CrimeIntel</span>
        <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">KSP</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Main Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center">
                <item.icon className={cn(
                  "mr-3 h-4 w-4 transition-colors", 
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.name}
              </div>
              {isActive && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Section */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted cursor-pointer">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src="" alt="Officer" />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">IO</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none mb-1">R. Kumar</span>
              <span className="text-xs text-muted-foreground">Inspector</span>
            </div>
          </div>
          <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
        </div>
      </div>
    </div>
  );
}
