/**
 * Phase 0.15: Security Beyond RBAC - Type Definitions
 * 
 * Data-level and behavioral security controls beyond basic RBAC
 */

/**
 * User role from Phase 2 RBAC
 */
export type UserRole = 
  | 'Admin' 
  | 'Investigator' 
  | 'Supervisor' 
  | 'Constable' 
  | 'Analyst';

/**
 * Field sensitivity classification (from Phase 0.0.2)
 */
export type SensitivityLevel = 
  | 'Public'           // No restrictions
  | 'Internal'         // Restricted to authenticated users
  | 'Restricted'       // Requires specific role
  | 'Highly Restricted'; // Requires reveal action + audit

/**
 * Sensitive field definition
 */
export interface SensitiveField {
  table: string;
  column: string;
  sensitivity: SensitivityLevel;
  allowedRoles: UserRole[];
  maskingPattern?: 'phone' | 'account' | 'full' | 'partial'; // How to mask
  revealable: boolean; // Can be unmasked with explicit action
  redactionRules?: RedactionRule[]; // Additional rules
}

/**
 * Redaction rule for sensitive categories
 */
export interface RedactionRule {
  condition: {
    table: string;
    column: string;
    value: any; // e.g., crime_type = 'Sexual Assault'
  };
  action: 'redact' | 'mask' | 'remove';
  overrideRequiresRole?: UserRole[];
  reason: string;
}

/**
 * Masking configuration
 */
export interface MaskingConfig {
  enabled: boolean;
  patterns: {
    phone: string; // e.g., "XXX-XXX-1234"
    account: string; // e.g., "XXXX-XXXX-1234"
    full: string; // e.g., "[REDACTED]"
    partial: (value: string) => string; // Custom masking function
  };
}

/**
 * Field reveal request
 */
export interface FieldRevealRequest {
  userId: string;
  userRole: UserRole;
  table: string;
  column: string;
  rowId: string;
  justification: string; // Required reason for unmasking
  timestamp: Date;
}

/**
 * Field reveal audit log
 */
export interface FieldRevealLog {
  id: string;
  request: FieldRevealRequest;
  granted: boolean;
  actualValue?: string; // Only logged if granted
  denialReason?: string;
  timestamp: Date;
}

/**
 * Row-level permission filter
 */
export interface RowLevelFilter {
  userRole: UserRole;
  station?: string; // For Constable role
  district?: string; // For Supervisor role
  allowedTables: string[];
  filterConditions: Record<string, any>; // SQL WHERE conditions
}

/**
 * Query audit log entry
 */
export interface QueryAuditLog {
  id: string;
  userId: string;
  userRole: UserRole;
  query: string; // Original query
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  tables: string[];
  rowsReturned: number;
  timestamp: Date;
  duration: number; // milliseconds
  sourceIP?: string;
  sessionId?: string;
}

/**
 * Access pattern for anomaly detection
 */
export interface AccessPattern {
  userId: string;
  userRole: UserRole;
  timeWindow: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalQueries: number;
    crossDistrictQueries: number;
    sensitiveFieldAccesses: number;
    revealRequests: number;
    distinctTablesAccessed: number;
    queryVolume: number; // bytes
  };
  anomalyScore: number; // 0-1, higher = more anomalous
  flags: AnomalyFlag[];
}

/**
 * Anomaly flag
 */
export interface AnomalyFlag {
  type: 
    | 'high_volume'           // Unusual query volume
    | 'cross_district'        // Too many cross-district queries
    | 'sensitive_access'      // Unusual sensitive field access
    | 'time_pattern'          // Queries at unusual hours
    | 'bulk_export'           // Large data export
    | 'failed_auth'           // Multiple failed reveal attempts
    | 'privilege_escalation'; // Attempted unauthorized access
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  threshold: number; // Value that triggered the flag
  actual: number; // Actual value
  timestamp: Date;
}

/**
 * Anomaly alert for administrators
 */
export interface AnomalyAlert {
  id: string;
  userId: string;
  userRole: UserRole;
  pattern: AccessPattern;
  status: 'new' | 'reviewing' | 'resolved' | 'false_positive';
  reviewedBy?: string;
  reviewNotes?: string;
  timestamp: Date;
}

/**
 * Security policy configuration
 */
export interface SecurityPolicy {
  masking: MaskingConfig;
  rowLevelFilters: RowLevelFilter[];
  sensitiveFields: SensitiveField[];
  redactionRules: RedactionRule[];
  anomalyThresholds: {
    highVolumeQueriesPerHour: number;
    crossDistrictQueriesPerDay: number;
    sensitiveFieldAccessesPerDay: number;
    revealRequestsPerDay: number;
    bulkExportSizeBytes: number;
  };
  auditRetentionDays: number; // How long to keep audit logs
}

/**
 * Default security policy
 */
export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  masking: {
    enabled: true,
    patterns: {
      phone: 'XXX-XXX-####',
      account: 'XXXX-XXXX-####',
      full: '[REDACTED]',
      partial: (value: string) => {
        if (value.length <= 4) return 'XXXX';
        return 'X'.repeat(value.length - 4) + value.slice(-4);
      },
    },
  },
  rowLevelFilters: [
    {
      userRole: 'Constable',
      allowedTables: ['FIRs', 'Persons', 'Vehicles', 'PhoneRecords'],
      filterConditions: {
        // Will be dynamically populated with station filter
        // e.g., { station_name: user.station }
      },
    },
    {
      userRole: 'Supervisor',
      allowedTables: ['FIRs', 'Persons', 'Vehicles', 'PhoneRecords', 'Cases'],
      filterConditions: {
        // Will be dynamically populated with district filter
        // e.g., { district: user.district }
      },
    },
    {
      userRole: 'Investigator',
      allowedTables: ['FIRs', 'Persons', 'Vehicles', 'PhoneRecords', 'Cases', 'Evidence'],
      filterConditions: {}, // No geographic restrictions
    },
    {
      userRole: 'Analyst',
      allowedTables: ['FIRs', 'Persons', 'Vehicles', 'Cases', 'Analytics'],
      filterConditions: {}, // Read-only, no geographic restrictions
    },
    {
      userRole: 'Admin',
      allowedTables: ['*'], // All tables
      filterConditions: {}, // No restrictions
    },
  ],
  sensitiveFields: [
    // Highly Restricted (per Phase 0.0.2)
    {
      table: 'Persons',
      column: 'phone_number',
      sensitivity: 'Highly Restricted',
      allowedRoles: ['Investigator', 'Supervisor', 'Admin'],
      maskingPattern: 'phone',
      revealable: true,
    },
    {
      table: 'Persons',
      column: 'address',
      sensitivity: 'Highly Restricted',
      allowedRoles: ['Investigator', 'Supervisor', 'Admin'],
      maskingPattern: 'partial',
      revealable: true,
    },
    {
      table: 'FIRs',
      column: 'victim_name',
      sensitivity: 'Highly Restricted',
      allowedRoles: ['Investigator', 'Supervisor', 'Admin'],
      maskingPattern: 'partial',
      revealable: true,
      redactionRules: [
        {
          condition: { table: 'FIRs', column: 'crime_type', value: 'Sexual Assault' },
          action: 'redact',
          overrideRequiresRole: ['Admin'],
          reason: 'Victim protection for sexual offense cases',
        },
      ],
    },
    {
      table: 'PhoneRecords',
      column: 'phone_number',
      sensitivity: 'Highly Restricted',
      allowedRoles: ['Investigator', 'Admin'],
      maskingPattern: 'phone',
      revealable: true,
    },
    // Restricted
    {
      table: 'FIRs',
      column: 'accused_name',
      sensitivity: 'Restricted',
      allowedRoles: ['Investigator', 'Supervisor', 'Admin'],
      maskingPattern: 'partial',
      revealable: true,
    },
    {
      table: 'Persons',
      column: 'age',
      sensitivity: 'Restricted',
      allowedRoles: ['Investigator', 'Supervisor', 'Analyst', 'Admin'],
      revealable: false, // No masking, just access control
    },
  ],
  redactionRules: [
    {
      condition: { table: 'FIRs', column: 'crime_type', value: 'Sexual Assault' },
      action: 'redact',
      overrideRequiresRole: ['Admin'],
      reason: 'Victim protection for sexual offense cases',
    },
    {
      condition: { table: 'Persons', column: 'age', value: '<18' },
      action: 'redact',
      overrideRequiresRole: ['Admin'],
      reason: 'Juvenile protection',
    },
  ],
  anomalyThresholds: {
    highVolumeQueriesPerHour: 100,
    crossDistrictQueriesPerDay: 50,
    sensitiveFieldAccessesPerDay: 20,
    revealRequestsPerDay: 10,
    bulkExportSizeBytes: 10 * 1024 * 1024, // 10 MB
  },
  auditRetentionDays: 365, // 1 year
};

/**
 * Security context for request
 */
export interface SecurityContext {
  userId: string;
  userRole: UserRole;
  station?: string;
  district?: string;
  sessionId: string;
  timestamp: Date;
}

/**
 * Secured query result
 */
export interface SecuredQueryResult<T = any> {
  data: T[];
  maskedFields: string[]; // Fields that were masked
  filteredRows: number; // Number of rows filtered by row-level security
  auditLogId: string; // Reference to audit log entry
  warnings: string[]; // Security warnings (e.g., "Some sensitive fields masked")
}
