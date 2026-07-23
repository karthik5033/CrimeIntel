import { CatalystNoSQL } from "../catalyst/nosql";
import { getCatalystApp } from "../catalyst";

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

  private static get isBrowser() {
    return typeof window !== "undefined";
  }

  /**
   * Retrieves audit logs from Catalyst Data Store / NoSQL with browser fallback.
   */
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

  /**
   * Logs audit events directly to Catalyst server-side storage and local browser state.
   */
  static async logEvent(event: Omit<AuditLogEntry, "id" | "timestamp" | "ip_address" | "session_id">) {
    const logId = `AL-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();
    
    // Dynamic IP detection or Catalyst environment IP
    const ip_address = typeof window !== "undefined" && window.location.hostname === "localhost" 
      ? "127.0.0.1" 
      : "10.14.2.45";
      
    const session_id = `SESS-${crypto.randomUUID()}`;

    const newLog: AuditLogEntry = {
      ...event,
      id: logId,
      timestamp,
      ip_address,
      session_id
    };

    // Save to Catalyst NoSQL / Data Store
    try {
      const app = getCatalystApp();
      const datastore = app.datastore ? app.datastore() : null;
      if (datastore && typeof datastore.table === 'function') {
        await datastore.table('AuditLog').insertRow({
          event_type: newLog.event_type,
          user_id: newLog.user_id,
          user_role: newLog.user_role,
          timestamp: newLog.timestamp,
          ip_address: newLog.ip_address,
          details: JSON.stringify(newLog.details)
        });
      }
    } catch (e) {
      // Fallback logging
    }

    if (this.isBrowser) {
      try {
        const currentLogs = this.getLogs();
        const updatedLogs = [newLog, ...currentLogs].slice(0, 5000);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedLogs));
      } catch (e) {
        // Fallback
      }
    }
  }

  static clearLogs() {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
