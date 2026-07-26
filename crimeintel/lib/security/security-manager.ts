/**
 * Phase 0.15: Security Manager
 * 
 * Core security orchestration - field masking, row filtering, query auditing
 */

import {
  SecurityContext,
  SecurityPolicy,
  DEFAULT_SECURITY_POLICY,
  SensitiveField,
  FieldRevealRequest,
  FieldRevealLog,
  QueryAuditLog,
  SecuredQueryResult,
  RowLevelFilter,
  RedactionRule,
} from './types';

/**
 * Main security manager
 */
export class SecurityManager {
  private policy: SecurityPolicy;
  private auditLogs: QueryAuditLog[] = [];
  private revealLogs: FieldRevealLog[] = [];

  constructor(policy: Partial<SecurityPolicy> = {}) {
    this.policy = { ...DEFAULT_SECURITY_POLICY, ...policy };
  }

  /**
   * Apply field-level masking to a result set
   */
  async applyFieldMasking<T = any>(
    data: T[],
    context: SecurityContext
  ): Promise<{ masked: T[]; maskedFields: string[] }> {
    if (!this.policy.masking.enabled || data.length === 0) {
      return { masked: data, maskedFields: [] };
    }

    const maskedFields = new Set<string>();
    const masked = data.map(row => {
      const maskedRow = { ...row };

      // Check each field in the row
      for (const [key, value] of Object.entries(row as any)) {
        const field = this.getSensitiveFieldConfig(key);
        
        if (field && this.shouldMaskField(field, context)) {
          // Apply masking
          maskedRow[key as keyof T] = this.maskValue(
            value as string,
            field.maskingPattern || 'partial'
          ) as any;
          maskedFields.add(`${field.table}.${field.column}`);
        }
      }

      return maskedRow;
    });

    return { masked, maskedFields: Array.from(maskedFields) };
  }

  /**
   * Apply row-level filtering to a query
   */
  applyRowLevelFilter(
    query: string,
    tables: string[],
    context: SecurityContext
  ): string {
    const filter = this.policy.rowLevelFilters.find(
      f => f.userRole === context.userRole
    );

    if (!filter) {
      throw new Error(`No row-level filter defined for role: ${context.userRole}`);
    }

    // Check if user has access to requested tables
    if (!this.hasTableAccess(tables, filter)) {
      throw new Error(
        `Role ${context.userRole} does not have access to tables: ${tables.join(', ')}`
      );
    }

    // Apply role-specific filters
    let filteredQuery = query;

    if (context.userRole === 'Constable' && context.station) {
      // Constables only see their station's data
      filteredQuery = this.injectWhereClause(
        filteredQuery,
        `station_name = '${context.station}'`
      );
    } else if (context.userRole === 'Supervisor' && context.district) {
      // Supervisors only see their district's data
      filteredQuery = this.injectWhereClause(
        filteredQuery,
        `district = '${context.district}'`
      );
    }

    return filteredQuery;
  }

  /**
   * Log a query execution for audit trail
   */
  async logQuery(
    query: string,
    context: SecurityContext,
    rowsReturned: number,
    duration: number
  ): Promise<string> {
    const tables = this.extractTablesFromQuery(query);
    const queryType = this.detectQueryType(query);

    const log: QueryAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: context.userId,
      userRole: context.userRole,
      query,
      queryType,
      tables,
      rowsReturned,
      timestamp: context.timestamp,
      duration,
      sessionId: context.sessionId,
    };

    this.auditLogs.push(log);

    // In production, this would write to Catalyst Data Store
    console.log(`🔍 AUDIT: ${log.userId} (${log.userRole}) executed ${log.queryType} on ${log.tables.join(', ')} - ${log.rowsReturned} rows in ${log.duration}ms`);

    return log.id;
  }

  /**
   * Request to reveal a masked field
   */
  async requestFieldReveal(
    request: FieldRevealRequest
  ): Promise<FieldRevealLog> {
    const field = this.getSensitiveFieldConfig(request.column);

    if (!field) {
      return {
        id: `reveal-${Date.now()}`,
        request,
        granted: false,
        denialReason: `Field ${request.column} is not a sensitive field`,
        timestamp: new Date(),
      };
    }

    // Check if user role is allowed
    const granted = field.allowedRoles.includes(request.userRole) && 
                   field.revealable &&
                   request.justification.length >= 10; // Require meaningful justification

    const log: FieldRevealLog = {
      id: `reveal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      request,
      granted,
      denialReason: granted ? undefined : 'Insufficient permissions or invalid justification',
      timestamp: new Date(),
    };

    this.revealLogs.push(log);

    // In production, this would write to Catalyst Data Store
    console.log(
      `🔓 REVEAL ${granted ? 'GRANTED' : 'DENIED'}: ${request.userId} (${request.userRole}) requested ${request.table}.${request.column} - "${request.justification}"`
    );

    return log;
  }

  /**
   * Apply redaction rules to data
   */
  applyRedactionRules<T = any>(
    data: T[],
    context: SecurityContext
  ): { redacted: T[]; redactedCount: number } {
    let redactedCount = 0;

    const redacted = data.map(row => {
      const redactedRow = { ...row };

      for (const rule of this.policy.redactionRules) {
        // Check if rule applies to this row
        const conditionMet = this.checkCondition(row, rule.condition);

        if (conditionMet) {
          // Check if user can override
          const canOverride = rule.overrideRequiresRole?.includes(context.userRole);

          if (!canOverride) {
            // Apply redaction
            if (rule.action === 'redact') {
              // Redact the entire row or specific fields
              Object.keys(redactedRow).forEach(key => {
                if (key !== 'id' && key !== 'ROWID') {
                  redactedRow[key as keyof T] = '[REDACTED - ' + rule.reason + ']' as any;
                }
              });
              redactedCount++;
            } else if (rule.action === 'mask') {
              // Apply masking to sensitive fields
              const field = this.getSensitiveFieldConfig(rule.condition.column);
              if (field) {
                redactedRow[rule.condition.column as keyof T] = this.maskValue(
                  (row as any)[rule.condition.column],
                  field.maskingPattern || 'full'
                ) as any;
                redactedCount++;
              }
            } else if (rule.action === 'remove') {
              // Remove the entire row (will be filtered out)
              return null;
            }
          }
        }
      }

      return redactedRow;
    }).filter(row => row !== null) as T[];

    return { redacted, redactedCount };
  }

  /**
   * Execute a secured query (combines all security controls)
   */
  async executeSecuredQuery<T = any>(
    query: string,
    context: SecurityContext
  ): Promise<SecuredQueryResult<T>> {
    const startTime = Date.now();

    // 1. Extract tables from query
    const tables = this.extractTablesFromQuery(query);

    // 2. Apply row-level filtering
    const filteredQuery = this.applyRowLevelFilter(query, tables, context);

    // 3. Execute query (mock - in production, call Catalyst Data Store)
    const rawData: T[] = await this.mockExecuteQuery(filteredQuery);
    const originalCount = rawData.length;

    // 4. Apply redaction rules
    const { redacted, redactedCount } = this.applyRedactionRules(rawData, context);

    // 5. Apply field masking
    const { masked, maskedFields } = await this.applyFieldMasking(redacted, context);

    // 6. Log query for audit
    const duration = Date.now() - startTime;
    const auditLogId = await this.logQuery(filteredQuery, context, masked.length, duration);

    // 7. Build warnings
    const warnings: string[] = [];
    if (maskedFields.length > 0) {
      warnings.push(`${maskedFields.length} sensitive field(s) masked. Use "reveal" action to unmask.`);
    }
    if (redactedCount > 0) {
      warnings.push(`${redactedCount} record(s) redacted per security policy.`);
    }

    return {
      data: masked,
      maskedFields,
      filteredRows: originalCount - masked.length,
      auditLogId,
      warnings,
    };
  }

  /**
   * Get all audit logs (for admin review)
   */
  getAuditLogs(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): QueryAuditLog[] {
    let logs = this.auditLogs;

    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    if (startDate) {
      logs = logs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      logs = logs.filter(log => log.timestamp <= endDate);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all reveal logs (for admin review)
   */
  getRevealLogs(
    userId?: string,
    granted?: boolean
  ): FieldRevealLog[] {
    let logs = this.revealLogs;

    if (userId) {
      logs = logs.filter(log => log.request.userId === userId);
    }

    if (granted !== undefined) {
      logs = logs.filter(log => log.granted === granted);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // ============ Private Helper Methods ============

  private getSensitiveFieldConfig(column: string): SensitiveField | undefined {
    return this.policy.sensitiveFields.find(f => f.column === column);
  }

  private shouldMaskField(field: SensitiveField, context: SecurityContext): boolean {
    // Always mask if user role is not in allowed roles
    return !field.allowedRoles.includes(context.userRole);
  }

  private maskValue(value: string, pattern: string): string {
    if (!value) return value;

    // Ensure value is a string
    const strValue = String(value);

    const patterns = this.policy.masking.patterns;

    switch (pattern) {
      case 'phone':
        if (strValue.length >= 10) {
          return patterns.phone.replace(/#+/g, strValue.slice(-4));
        }
        return patterns.phone;

      case 'account':
        if (strValue.length >= 4) {
          return patterns.account.replace(/#+/g, strValue.slice(-4));
        }
        return patterns.account;

      case 'full':
        return patterns.full;

      case 'partial':
        return patterns.partial(strValue);

      default:
        return patterns.full;
    }
  }

  private hasTableAccess(tables: string[], filter: RowLevelFilter): boolean {
    if (filter.allowedTables.includes('*')) {
      return true;
    }

    return tables.every(table => filter.allowedTables.includes(table));
  }

  private injectWhereClause(query: string, condition: string): string {
    const queryUpper = query.toUpperCase();
    
    if (queryUpper.includes('WHERE')) {
      // Append to existing WHERE clause
      return query.replace(/WHERE/i, `WHERE ${condition} AND`);
    } else if (queryUpper.includes('FROM')) {
      // Add new WHERE clause after FROM
      return query.replace(/FROM\s+(\w+)/i, `FROM $1 WHERE ${condition}`);
    }

    return query;
  }

  private extractTablesFromQuery(query: string): string[] {
    const tables: string[] = [];
    
    // Simple regex to extract table names from FROM and JOIN clauses
    const fromMatches = query.match(/FROM\s+(\w+)/gi);
    if (fromMatches) {
      fromMatches.forEach(match => {
        const table = match.replace(/FROM\s+/i, '');
        tables.push(table);
      });
    }

    const joinMatches = query.match(/JOIN\s+(\w+)/gi);
    if (joinMatches) {
      joinMatches.forEach(match => {
        const table = match.replace(/JOIN\s+/i, '');
        tables.push(table);
      });
    }

    return Array.from(new Set(tables)); // Remove duplicates
  }

  private detectQueryType(query: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' {
    const queryUpper = query.trim().toUpperCase();
    
    if (queryUpper.startsWith('SELECT')) return 'SELECT';
    if (queryUpper.startsWith('INSERT')) return 'INSERT';
    if (queryUpper.startsWith('UPDATE')) return 'UPDATE';
    if (queryUpper.startsWith('DELETE')) return 'DELETE';
    
    return 'SELECT'; // Default
  }

  private checkCondition(row: any, condition: any): boolean {
    const value = row[condition.column];
    
    if (condition.value.startsWith('<')) {
      // Less than comparison (e.g., '<18' for age)
      const threshold = parseInt(condition.value.slice(1), 10);
      return parseInt(value, 10) < threshold;
    } else {
      // Exact match
      return value === condition.value;
    }
  }

  private async mockExecuteQuery<T>(query: string): Promise<T[]> {
    // Mock implementation - in production, this would call Catalyst Data Store
    console.log(`🔍 Mock Query Execution: ${query.substring(0, 100)}...`);
    
    // Return empty array for mock
    return [];
  }
}
