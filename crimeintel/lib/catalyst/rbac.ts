import { Role } from '../AuthContext';

export interface PermissionConfig {
  minRole: Role;
  allowedRoles: Role[];
}

const ROLE_HIERARCHY: Record<Role, number> = {
  CONSTABLE: 1,
  INSPECTOR: 2,
  SUPERINTENDENT: 3,
  ADMIN: 4,
};

export const PERMISSION_MATRIX: Record<string, Role> = {
  'chat.own_station': 'CONSTABLE',
  'chat.cross_station': 'INSPECTOR',
  'network_graph': 'INSPECTOR',
  'analytics.view': 'CONSTABLE',
  'analytics.full': 'SUPERINTENDENT',
  'offender_profiles.view': 'CONSTABLE',
  'financial_crime': 'SUPERINTENDENT',
  'predictive_alerts': 'INSPECTOR',
  'reasoning_config': 'SUPERINTENDENT',
  'audit_logs': 'SUPERINTENDENT',
  'system_settings': 'ADMIN',
};

/**
 * Validates whether a given user role has permission to access a feature.
 */
export function hasPermission(userRole: Role, featureKey: string): boolean {
  const requiredRole = PERMISSION_MATRIX[featureKey];
  if (!requiredRole) return true; // Default allow if unmapped

  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Server-side RBAC validation helper for Next.js API route handlers / Catalyst functions.
 */
export function enforceRoleAccess(userRole: Role, featureKey: string): { authorized: boolean; reason?: string } {
  const isAuthorized = hasPermission(userRole, featureKey);
  if (!isAuthorized) {
    return {
      authorized: false,
      reason: `Access Denied: Feature '${featureKey}' requires minimum role '${PERMISSION_MATRIX[featureKey]}'. Current role is '${userRole}'.`
    };
  }
  return { authorized: true };
}
