import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, FileText, CheckCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';

export interface CrimeEvent {
  id: string;
  type: string;
  location: string;
  message: string;
  timestamp: string;
}

export function LiveEventFeed() {
  const [events, setEvents] = useState<CrimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (e) => {
      try {
        const newEvent = JSON.parse(e.data);
        if (newEvent.type === 'CONNECTED') {
          setIsConnected(true);
          return;
        }

        setEvents((prev) => [newEvent, ...prev].slice(0, 10)); // Keep last 10
      } catch (err) {
        console.error("Failed to parse SSE data", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      // Optional: implement reconnect logic
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'FIR_CREATED': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'ALERT_TRIGGERED': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'SUSPECT_SPOTTED': return <ShieldAlert className="w-4 h-4 text-destructive" />;
      case 'CASE_CLOSED': return <CheckCircle className="w-4 h-4 text-success" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTranslatedMessage = (evt: CrimeEvent) => {
    const loc = t(`location.${evt.location}` as any) || evt.location;
    switch (evt.type) {
      case 'FIR_CREATED':
        return t('dashboard.events.firCreated').replace('{location}', loc);
      case 'ALERT_TRIGGERED':
        return t('dashboard.events.alertTriggered').replace('{location}', loc);
      case 'SUSPECT_SPOTTED':
        return t('dashboard.events.suspectSpotted').replace('{location}', loc);
      case 'CASE_CLOSED':
        const caseId = evt.id.replace('evt_', '').toUpperCase();
        return t('dashboard.events.caseClosed').replace('{location}', loc).replace('{id}', caseId);
      default:
        return evt.message;
    }
  };

  return (
    <div className="w-full bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col h-[300px]">
      <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between sticky top-0 z-10">
        <h3 className="text-sm font-semibold text-foreground flex items-center">
          <Activity className="w-4 h-4 mr-2 text-primary" />
          {t('dashboard.liveFeed')}
        </h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>}
            <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isConnected ? "bg-success" : "bg-muted-foreground")}></span>
          </span>
          <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
            {isConnected ? t('dashboard.live') : t('dashboard.offline')}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scroll-smooth">
        <AnimatePresence initial={false}>
          {events.length === 0 && (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
              {t('dashboard.waitingSignals')}
            </div>
          )}
          {events.map((evt) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="p-3 bg-background rounded-md border border-border shadow-sm flex items-start gap-3"
            >
              <div className="mt-0.5 p-1.5 rounded-full bg-muted">
                {getEventIcon(evt.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{getTranslatedMessage(evt)}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase">{t(`location.${evt.location}` as any) || evt.location}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
