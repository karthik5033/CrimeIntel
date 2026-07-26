/**
 * Phase 0.15: Anomaly Detector
 * 
 * Detects unusual access patterns for misuse prevention
 */

import {
  AccessPattern,
  AnomalyFlag,
  AnomalyAlert,
  QueryAuditLog,
  SecurityPolicy,
  DEFAULT_SECURITY_POLICY,
  UserRole,
} from './types';

/**
 * Anomaly detector for access pattern monitoring
 */
export class AnomalyDetector {
  private policy: SecurityPolicy;
  private alerts: AnomalyAlert[] = [];

  constructor(policy: Partial<SecurityPolicy> = {}) {
    this.policy = { ...DEFAULT_SECURITY_POLICY, ...policy };
  }

  /**
   * Analyze access pattern for anomalies
   */
  analyzeAccessPattern(
    logs: QueryAuditLog[],
    userId: string,
    timeWindow: { start: Date; end: Date }
  ): AccessPattern {
    // Filter logs for this user and time window
    const userLogs = logs.filter(
      log =>
        log.userId === userId &&
        log.timestamp >= timeWindow.start &&
        log.timestamp <= timeWindow.end
    );

    if (userLogs.length === 0) {
      // No activity
      return this.createEmptyPattern(userId, userLogs[0]?.userRole || 'Constable', timeWindow);
    }

    // Calculate metrics
    const metrics = {
      totalQueries: userLogs.length,
      crossDistrictQueries: this.countCrossDistrictQueries(userLogs),
      sensitiveFieldAccesses: this.countSensitiveFieldAccesses(userLogs),
      revealRequests: this.countRevealRequests(userLogs),
      distinctTablesAccessed: new Set(userLogs.flatMap(log => log.tables)).size,
      queryVolume: userLogs.reduce((sum, log) => sum + log.query.length, 0),
    };

    // Detect anomalies
    const flags = this.detectAnomalies(metrics, userLogs[0].userRole, timeWindow);

    // Calculate anomaly score (0-1)
    const anomalyScore = this.calculateAnomalyScore(flags);

    return {
      userId,
      userRole: userLogs[0].userRole,
      timeWindow,
      metrics,
      anomalyScore,
      flags,
    };
  }

  /**
   * Generate anomaly alert for admin review
   */
  generateAlert(pattern: AccessPattern): AnomalyAlert | null {
    // Only generate alert if there are high/critical flags
    const highSeverityFlags = pattern.flags.filter(
      f => f.severity === 'high' || f.severity === 'critical'
    );

    if (highSeverityFlags.length === 0) {
      return null;
    }

    const alert: AnomalyAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: pattern.userId,
      userRole: pattern.userRole,
      pattern,
      status: 'new',
      timestamp: new Date(),
    };

    this.alerts.push(alert);

    console.log(
      `🚨 ANOMALY ALERT: ${alert.userId} (${alert.userRole}) - ${highSeverityFlags.length} high/critical flag(s)`
    );

    return alert;
  }

  /**
   * Get all alerts
   */
  getAlerts(status?: AnomalyAlert['status']): AnomalyAlert[] {
    if (status) {
      return this.alerts.filter(a => a.status === status);
    }
    return this.alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Update alert status (for admin review)
   */
  updateAlertStatus(
    alertId: string,
    status: AnomalyAlert['status'],
    reviewedBy: string,
    notes?: string
  ): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = status;
      alert.reviewedBy = reviewedBy;
      alert.reviewNotes = notes;
    }
  }

  // ============ Private Helper Methods ============

  private createEmptyPattern(
    userId: string,
    userRole: UserRole,
    timeWindow: { start: Date; end: Date }
  ): AccessPattern {
    return {
      userId,
      userRole,
      timeWindow,
      metrics: {
        totalQueries: 0,
        crossDistrictQueries: 0,
        sensitiveFieldAccesses: 0,
        revealRequests: 0,
        distinctTablesAccessed: 0,
        queryVolume: 0,
      },
      anomalyScore: 0,
      flags: [],
    };
  }

  private countCrossDistrictQueries(logs: QueryAuditLog[]): number {
    // Count queries that access data from multiple districts
    // In mock, we'll estimate based on query patterns
    return logs.filter(log =>
      log.query.toLowerCase().includes('district') &&
      !log.query.toLowerCase().includes('where district')
    ).length;
  }

  private countSensitiveFieldAccesses(logs: QueryAuditLog[]): number {
    const sensitiveColumns = this.policy.sensitiveFields.map(f => f.column);
    
    return logs.filter(log =>
      sensitiveColumns.some(col => log.query.toLowerCase().includes(col.toLowerCase()))
    ).length;
  }

  private countRevealRequests(logs: QueryAuditLog[]): number {
    // In production, this would check actual reveal logs
    // For now, estimate based on query patterns
    return logs.filter(log =>
      log.query.toLowerCase().includes('reveal') ||
      log.query.toLowerCase().includes('unmask')
    ).length;
  }

  private detectAnomalies(
    metrics: AccessPattern['metrics'],
    userRole: UserRole,
    timeWindow: { start: Date; end: Date }
  ): AnomalyFlag[] {
    const flags: AnomalyFlag[] = [];
    const thresholds = this.policy.anomalyThresholds;

    // Calculate time window duration in hours
    const hours = (timeWindow.end.getTime() - timeWindow.start.getTime()) / (1000 * 60 * 60);

    // 1. High volume detection
    const queriesPerHour = metrics.totalQueries / Math.max(hours, 1);
    if (queriesPerHour > thresholds.highVolumeQueriesPerHour) {
      flags.push({
        type: 'high_volume',
        severity: queriesPerHour > thresholds.highVolumeQueriesPerHour * 2 ? 'critical' : 'high',
        description: `Unusually high query volume: ${queriesPerHour.toFixed(1)} queries/hour`,
        threshold: thresholds.highVolumeQueriesPerHour,
        actual: queriesPerHour,
        timestamp: new Date(),
      });
    }

    // 2. Cross-district query detection (for Constable/Supervisor)
    if (userRole === 'Constable' || userRole === 'Supervisor') {
      if (metrics.crossDistrictQueries > thresholds.crossDistrictQueriesPerDay) {
        flags.push({
          type: 'cross_district',
          severity: 'high',
          description: `${userRole} making unusual cross-district queries`,
          threshold: thresholds.crossDistrictQueriesPerDay,
          actual: metrics.crossDistrictQueries,
          timestamp: new Date(),
        });
      }
    }

    // 3. Sensitive field access detection
    if (metrics.sensitiveFieldAccesses > thresholds.sensitiveFieldAccessesPerDay) {
      flags.push({
        type: 'sensitive_access',
        severity: 'medium',
        description: 'Unusually high sensitive field access',
        threshold: thresholds.sensitiveFieldAccessesPerDay,
        actual: metrics.sensitiveFieldAccesses,
        timestamp: new Date(),
      });
    }

    // 4. Reveal request detection
    if (metrics.revealRequests > thresholds.revealRequestsPerDay) {
      flags.push({
        type: 'sensitive_access',
        severity: 'high',
        description: 'Unusually high reveal requests',
        threshold: thresholds.revealRequestsPerDay,
        actual: metrics.revealRequests,
        timestamp: new Date(),
      });
    }

    // 5. Bulk export detection
    if (metrics.queryVolume > thresholds.bulkExportSizeBytes) {
      flags.push({
        type: 'bulk_export',
        severity: 'critical',
        description: 'Potential bulk data export detected',
        threshold: thresholds.bulkExportSizeBytes,
        actual: metrics.queryVolume,
        timestamp: new Date(),
      });
    }

    // 6. Time pattern detection (queries at unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      // Queries between 10 PM and 6 AM
      if (metrics.totalQueries > 10) {
        flags.push({
          type: 'time_pattern',
          severity: 'medium',
          description: `${metrics.totalQueries} queries at unusual hours (${hour}:00)`,
          threshold: 10,
          actual: metrics.totalQueries,
          timestamp: new Date(),
        });
      }
    }

    return flags;
  }

  private calculateAnomalyScore(flags: AnomalyFlag[]): number {
    if (flags.length === 0) return 0;

    // Weight by severity
    const weights = {
      low: 0.1,
      medium: 0.3,
      high: 0.6,
      critical: 1.0,
    };

    const totalWeight = flags.reduce((sum, flag) => sum + weights[flag.severity], 0);
    return Math.min(1.0, totalWeight / flags.length);
  }
}
