/**
 * Phase 0.11: Semantic Memory Simple Test
 * 
 * Tests conversation frame extraction and query enrichment
 * Run: npx tsx scripts/test-semantic-memory-simple.ts
 */

import { SemanticMemoryManager } from '../lib/semantic-memory/semantic-memory-manager';

async function testSemanticMemory() {
  console.log('=== Phase 0.11: Semantic Memory Test ===\n');

  const manager = new SemanticMemoryManager();
  const sessionId = 'test-session-001';
  const userId = 'officer-123';

  // Scenario 1: Context building over multiple queries
  console.log('📋 Scenario 1: Context Building\n');
  
  const queries = [
    'Show me vehicle thefts in Bengaluru',
    'What about last 3 months?',
    'Are there any repeat offenders?',
    'Check FIR-045-2025',
  ];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`Query ${i + 1}: "${query}"`);
    
    const updateResult = await manager.updateFrame(sessionId, userId, query);
    const frame = updateResult.frame;
    
    console.log(`  District: ${frame.activeDistrict || 'none'}`);
    console.log(`  Crime Types: ${frame.activeCrimeTypes.join(', ') || 'none'}`);
    console.log(`  Time Window: ${frame.activeTimeWindow?.label || 'none'}`);
    console.log(`  Entities: ${frame.activeEntities.length}`);
    console.log(`  Focus: ${frame.activeFocus || 'none'}`);
    console.log(`  Confidence: ${frame.confidence.toFixed(2)}`);
    console.log(`  Updates: ${updateResult.explanation}`);
    console.log('');
  }

  // Scenario 2: Query enrichment
  console.log('\n📋 Scenario 2: Query Enrichment\n');
  
  const shortQuery = 'Show me recent cases';
  console.log(`Original query: "${shortQuery}"`);
  
  const enriched = await manager.enrichQuery(sessionId, userId, shortQuery);
  console.log(`\nEnriched query:\n${enriched.enrichedQuery}`);
  console.log(`\nContext added: ${enriched.contextAdded.join(', ')}`);
  console.log(`Confidence: ${enriched.confidence.toFixed(2)}`);

  // Scenario 3: Session analytics
  console.log('\n\n📋 Scenario 3: Session Analytics\n');
  
  const analytics = await manager.getAnalytics(sessionId);
  if (analytics) {
    console.log(`Total Queries: ${analytics.totalQueries}`);
    console.log(`Dominant District: ${analytics.dominantDistrict || 'none'}`);
    console.log(`Dominant Crime Types: ${analytics.dominantCrimeTypes.join(', ')}`);
    console.log(`Average Time Window: ${analytics.averageTimeWindow.toFixed(0)} days`);
    console.log(`Most Mentioned Entities: ${analytics.mostMentionedEntities.length}`);
    console.log(`Session Duration: ${(analytics.sessionDuration / 1000).toFixed(1)}s`);
  }

  // Scenario 4: Multi-session test
  console.log('\n\n📋 Scenario 4: Multi-Session Handling\n');
  
  const session2Id = 'test-session-002';
  await manager.updateFrame(session2Id, 'officer-456', 'Show me murders in Mysuru last year');
  
  const stats = manager.getStats();
  console.log(`Total Active Sessions: ${stats.totalFrames}`);
  console.log(`Total Entities Tracked: ${stats.totalEntities}`);
  console.log(`Average Confidence: ${stats.averageConfidence.toFixed(2)}`);
  console.log(`Oldest Frame: ${stats.oldestFrame?.toISOString()}`);

  // Scenario 5: Context persistence
  console.log('\n\n📋 Scenario 5: Context Persistence\n');
  
  const frame1 = await manager.getFrame(sessionId, userId);
  console.log(`Before: District = ${frame1.activeDistrict}`);
  
  // Simulate time passing (in real app, this would be actual time)
  frame1.lastActivity = new Date(Date.now() - 2000000); // 33 minutes ago
  
  const frame2 = await manager.getFrame(sessionId, userId);
  console.log(`After TTL: District = ${frame2.activeDistrict} (should be reset)`);

  console.log('\n✅ All semantic memory tests completed!\n');
}

// Run tests
testSemanticMemory().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
