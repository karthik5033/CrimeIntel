/**
 * Phase 0.15: Security Beyond RBAC Simple Test
 * 
 * Tests field masking, row filtering, query auditing, and anomaly detection
 * Run: npx tsx scripts/test-security-simple.ts
 */

import { SecurityManager } from '../lib/security/security-manager';
import { AnomalyDetector } from '../lib/security/anomaly-detector';
import { SecurityContext, QueryAuditLog } from '../lib/security/types';

async function testSecurity() {
  console.log('=== Phase 0.15: Security Beyond RBAC Test ===\n');

  const securityManager = new SecurityManager();
  const anomalyDetector = new AnomalyDetector();

  // Scenario 1: Field-level masking
  console.log('📋 Scenario 1: Field-Level Masking\n');

  const sampleData = [
    {
      id: 1,
      name: 'John Doe',
      phone_number: '9876543210',
      address: '123 Main St, Bengaluru',
      age: 35,
    },
    {
      id: 2,
      name: 'Jane Smith',
      phone_number: '8765432109',
      address: '456 Park Ave, Mysuru',
      age: 28,
    },
  ];

  // Test as Constable (should mask phone and address)
  const constableContext: SecurityContext = {
    userId: 'user-001',
    userRole: 'Constable',
    station: 'Koramangala Station',
    sessionId: 'session-001',
    timestamp: new Date(),
  };

  const { masked: maskedConstable, maskedFields: fieldsConstable } = 
    await securityManager.applyFieldMasking(sampleData, constableContext);

  console.log('As Constable:');
  console.log('  Masked fields:', fieldsConstable);
  console.log('  Sample masked data:', JSON.stringify(maskedConstable[0], null, 2));
  console.log('');

  // Test as Investigator (should NOT mask)
  const investigatorContext: SecurityContext = {
    userId: 'user-002',
    userRole: 'Investigator',
    sessionId: 'session-002',
    timestamp: new Date(),
  };

  const { masked: maskedInvestigator, maskedFields: fieldsInvestigator } = 
    await securityManager.applyFieldMasking(sampleData, investigatorContext);

  console.log('As Investigator:');
  console.log('  Masked fields:', fieldsInvestigator);
  console.log('  Sample data:', JSON.stringify(maskedInvestigator[0], null, 2));
  console.log('');

  // Scenario 2: Row-level filtering
  console.log('\n📋 Scenario 2: Row-Level Filtering\n');

  const originalQuery = 'SELECT * FROM FIRs WHERE crime_type = "Vehicle Theft"';
  
  const filteredConstableQuery = securityManager.applyRowLevelFilter(
    originalQuery,
    ['FIRs'],
    constableContext
  );

  const filteredInvestigatorQuery = securityManager.applyRowLevelFilter(
    originalQuery,
    ['FIRs'],
    investigatorContext
  );

  console.log('Original query:', originalQuery);
  console.log('');
  console.log('Constable (station-filtered):', filteredConstableQuery);
  console.log('');
  console.log('Investigator (no filter):', filteredInvestigatorQuery);
  console.log('');

  // Scenario 3: Field reveal request
  console.log('\n📋 Scenario 3: Field Reveal Request\n');

  const revealRequest = {
    userId: 'user-001',
    userRole: constableContext.userRole,
    table: 'Persons',
    column: 'phone_number',
    rowId: '123',
    justification: 'Need phone number to contact witness for active investigation case #FIR-045-2025',
    timestamp: new Date(),
  };

  const revealLog = await securityManager.requestFieldReveal(revealRequest);
  console.log(`Reveal request from Constable:`);
  console.log(`  Granted: ${revealLog.granted}`);
  console.log(`  Reason: ${revealLog.denialReason || 'Valid justification and permissions'}`);
  console.log('');

  const investigatorRevealRequest = {
    ...revealRequest,
    userId: 'user-002',
    userRole: 'Investigator',
  };

  const investigatorRevealLog = await securityManager.requestFieldReveal(investigatorRevealRequest);
  console.log(`Reveal request from Investigator:`);
  console.log(`  Granted: ${investigatorRevealLog.granted}`);
  console.log(`  Reason: ${investigatorRevealLog.denialReason || 'Valid justification and permissions'}`);
  console.log('');

  // Scenario 4: Query auditing
  console.log('\n📋 Scenario 4: Query Auditing\n');

  await securityManager.logQuery(
    originalQuery,
    constableContext,
    25,
    150
  );

  await securityManager.logQuery(
    'SELECT * FROM Persons WHERE district = "Bengaluru"',
    investigatorContext,
    120,
    450
  );

  const auditLogs = securityManager.getAuditLogs();
  console.log(`Total audit logs: ${auditLogs.length}`);
  console.log('Recent log:', {
    user: auditLogs[0].userId,
    role: auditLogs[0].userRole,
    queryType: auditLogs[0].queryType,
    tables: auditLogs[0].tables,
    rowsReturned: auditLogs[0].rowsReturned,
    duration: `${auditLogs[0].duration}ms`,
  });
  console.log('');

  // Scenario 5: Anomaly detection
  console.log('\n📋 Scenario 5: Anomaly Detection\n');

  // Simulate suspicious activity (high volume queries)
  const suspiciousLogs: QueryAuditLog[] = [];
  for (let i = 0; i < 150; i++) {
    suspiciousLogs.push({
      id: `audit-${i}`,
      userId: 'user-003',
      userRole: 'Constable',
      query: 'SELECT * FROM FIRs',
      queryType: 'SELECT',
      tables: ['FIRs'],
      rowsReturned: 100,
      timestamp: new Date(),
      duration: 200,
      sessionId: 'session-003',
    });
  }

  const timeWindow = {
    start: new Date(Date.now() - 3600000), // 1 hour ago
    end: new Date(),
  };

  const pattern = anomalyDetector.analyzeAccessPattern(
    suspiciousLogs,
    'user-003',
    timeWindow
  );

  console.log('Access pattern analysis:');
  console.log('  User:', pattern.userId);
  console.log('  Role:', pattern.userRole);
  console.log('  Total queries:', pattern.metrics.totalQueries);
  console.log('  Anomaly score:', pattern.anomalyScore.toFixed(2));
  console.log('  Flags:', pattern.flags.length);
  console.log('');

  if (pattern.flags.length > 0) {
    console.log('Detected anomalies:');
    pattern.flags.forEach(flag => {
      console.log(`  - [${flag.severity.toUpperCase()}] ${flag.type}: ${flag.description}`);
    });
    console.log('');
  }

  // Generate alert if high severity
  const alert = anomalyDetector.generateAlert(pattern);
  if (alert) {
    console.log('⚠️ Anomaly alert generated:');
    console.log('  Alert ID:', alert.id);
    console.log('  Status:', alert.status);
    console.log('  High severity flags:', pattern.flags.filter(f => f.severity === 'high' || f.severity === 'critical').length);
  }

  // Scenario 6: Integrated secured query
  console.log('\n\n📋 Scenario 6: Integrated Secured Query\n');

  const securedResult = await securityManager.executeSecuredQuery(
    'SELECT * FROM FIRs WHERE district = "Bengaluru"',
    constableContext
  );

  console.log('Secured query result:');
  console.log('  Data rows:', securedResult.data.length);
  console.log('  Masked fields:', securedResult.maskedFields);
  console.log('  Filtered rows:', securedResult.filteredRows);
  console.log('  Audit log ID:', securedResult.auditLogId);
  console.log('  Warnings:', securedResult.warnings.length);
  if (securedResult.warnings.length > 0) {
    securedResult.warnings.forEach(w => console.log(`    - ${w}`));
  }

  console.log('\n✅ All security tests completed!\n');
}

// Run tests
testSecurity().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
