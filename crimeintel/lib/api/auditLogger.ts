export type AuditEventType = 
  | "QUERY" 
  | "DATA_ACCESS" 
  | "REASONING" 
  | "EXPORT" 
  | "AUTH" 
  | "ALERT" 
  | "CONFIG"
  | "UNMASK_DATA";

export interface AuditLogEntry {
  id: string;
  event_type: AuditEventType;
  user_id: string;
  user_role: string;
  timestamp: string;
  details: Record<string, any>;
  ip_address: string;
  session_id: string;
}

export class AuditLogger {
  private static STORAGE_KEY = "crimeintel_audit_logs";

  // In Next.js, ensure we only access localStorage in the browser
  private static get isBrowser() {
    return typeof window !== "undefined";
  }

  static getLogs(): AuditLogEntry[] {
    if (!this.isBrowser) return [];
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load audit logs", e);
      return [];
    }
  }

  static logEvent(event: Omit<AuditLogEntry, "id" | "timestamp" | "ip_address" | "session_id">) {
    if (!this.isBrowser) return;

    const newLog: AuditLogEntry = {
      ...event,
      id: `AL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ip_address: "192.168.1.100", // Simulated IP
      session_id: "SESS-" + Math.random().toString(36).substr(2, 9)
    };

    try {
      const currentLogs = this.getLogs();
      const updatedLogs = [newLog, ...currentLogs].slice(0, 5000); // Keep last 5000
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedLogs));
      
      // Also log to console in dev
      if (process.env.NODE_ENV !== "production") {
        console.log(`[AUDIT] ${newLog.event_type}:`, newLog);
      }
    } catch (e) {
      console.error("Failed to save audit log", e);
    }
  }

  static clearLogs() {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
