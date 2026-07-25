"use client";

import React, { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Bell, CheckCheck, Trash2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

type NotificationType = "CRITICAL" | "WARNING" | "INFO";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "CRITICAL",
    title: "notifications.n1.title",
    message: "notifications.n1.message",
    time: "notifications.n1.time",
    read: false,
    link: "/cases/CASE_2025_089"
  },
  {
    id: "n2",
    type: "WARNING",
    title: "notifications.n2.title",
    message: "notifications.n2.message",
    time: "notifications.n2.time",
    read: false,
    link: "/network"
  },
  {
    id: "n3",
    type: "INFO",
    title: "notifications.n3.title",
    message: "notifications.n3.message",
    time: "notifications.n3.time",
    read: true,
    link: "/audit"
  }
];

export function NotificationCenter() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "CRITICAL": return <AlertCircle className="w-5 h-5 text-destructive" />;
      case "WARNING": return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "INFO": return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    
    // Navigate if there's a link
    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="relative p-2 rounded-md hover:bg-muted focus-visible:outline-none transition-colors cursor-pointer">
        <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-pulse border-2 border-card shadow-sm">
            {unreadCount}
          </span>
        )}
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[450px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              {t('notifications.title')}
              {unreadCount > 0 && (
                <Badge variant="secondary" className="px-1.5 min-w-[20px] justify-center">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={markAllAsRead} title={t('notifications.markAllRead')} className="h-8 w-8">
                <CheckCheck className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onClick={clearAll} title={t('notifications.clearAll')} className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">{t('notifications.emptyTitle')}</p>
              <p className="text-xs mt-1">{t('notifications.emptyDesc')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer relative",
                    !notification.read && "bg-muted/30"
                  )}
                >
                  {!notification.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                  )}
                  <div className="mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-sm font-semibold", !notification.read && "text-foreground")}>
                      {t(notification.title as any)}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {t(notification.message as any)}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium pt-1">
                      {t(notification.time as any)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
