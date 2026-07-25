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
   * Retrieves audit logs from localStorage.
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
   * Logs audit events via API route (server saves to Catalyst Data Store).
   * Also persists locally in browser localStorage for fast reads.
   */
  static async logEvent(event: Omit<AuditLogEntry, "id" | "timestamp" | "ip_address" | "session_id">) {
    const logId = `AL-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();
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

    // Save to Catalyst Data Store via API route (server-side only)
    if (this.isBrowser) {
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      }).catch(err => console.error("Failed to persist audit log:", err));

      // Also save to localStorage for fast UI reads
      try {
        const currentLogs = this.getLogs();
        const updatedLogs = [newLog, ...currentLogs].slice(0, 5000);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedLogs));
      } catch (e) {
        // Storage full or unavailable
      }
    }
  }

  static clearLogs() {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
