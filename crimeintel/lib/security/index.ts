/**
 * Phase 0.15: Security Beyond RBAC - Main Export
 */

export * from './types';
export { SecurityManager } from './security-manager';
export { AnomalyDetector } from './anomaly-detector';

// Singleton instances
let _securityManagerInstance: SecurityManager | null = null;
let _anomalyDetectorInstance: AnomalyDetector | null = null;

export function getSecurityManager(): SecurityManager {
  if (!_securityManagerInstance) {
    _securityManagerInstance = new SecurityManager();
  }
  return _securityManagerInstance;
}

export function getAnomalyDetector(): AnomalyDetector {
  if (!_anomalyDetectorInstance) {
    _anomalyDetectorInstance = new AnomalyDetector();
  }
  return _anomalyDetectorInstance;
}

export function resetSecurityInstances(): void {
  _securityManagerInstance = null;
  _anomalyDetectorInstance = null;
}
