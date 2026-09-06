/**
 * Test entity resolution precision against ground truth
 * Target: ≥90% precision
 */

const fs = require('fs');
const path = require('path');

// Mock imports (replace with actual when running in real environment)
const EntityResolutionEngine = require('../lib/entity-resolution/resolution-engine').EntityResolutionEngine ||
  class MockEngine {
    constructor() {}
    async resolveEntities(records) {
      // Mock implementation - real one will use actual matchers
      return { clusters: [], canonicalEntities: [], metrics: {} };
    }
  };

async function runPrecisionTest() {
  console.log('=== Phase 0.3 - Entity Resolution Precision Test ===\n');

  // Load test data
  const testDataPath = path.join(__dirname, '../data/test/entity-resolution-test-records.json');
  const groundTruthPath = path.join(__dirname, '../data/test/entity-resolution-ground-truth.json');

  if (!fs.existsSync(testDataPath)) {
    console.error('❌ Test data not found. Run generate-entity-test-data.js first.');
    return;
  }

  const testRecords = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
  const groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, 'utf-8'));

  console.log(`📊 Test Dataset:`);
  console.log(`   - Total records: ${testRecords.length}`);
  console.log(`   - Ground truth clusters: ${Object.keys(groundTruth).length}`);
  console.log(`   - Average records per cluster: ${(testRecords.length / Object.keys(groundTruth).length).toFixed(2)}\n`);

  // Run entity resolution
  console.log('🔄 Running entity resolution...\n');
  const engine = new EntityResolutionEngine({
    deterministic: { phoneWeight: 1.0, vehicleWeight: 1.0 },
    fuzzy: { nameThreshold: 0.8, phoneticThreshold: 0.7 },
    contextual: { addressWeight: 0.6, stationWeight: 0.4 },
    ml: { overallThreshold: 0.7 }
  });

  const result = await engine.resolveEntities(testRecords);

  // Evaluate precision
  console.log('📈 Evaluating Precision...\n');

  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  // Build predicted clusters map
  const predictedClusters = {};
  result.canonicalEntities.forEach(canonical => {
    const clusterId = canonical.canonical_id;
    predictedClusters[clusterId] = canonical.merged_from || [];
  });

  // Evaluate each predicted cluster
  Object.entries(predictedClusters).forEach(([predictedId, predictedMembers]) => {
    if (predictedMembers.length < 2) return; // Skip singletons

    // For each pair in the predicted cluster
    for (let i = 0; i < predictedMembers.length; i++) {
      for (let j = i + 1; j < predictedMembers.length; j++) {
        const record1 = testRecords.find(r => r.id === predictedMembers[i]);
        const record2 = testRecords.find(r => r.id === predictedMembers[j]);

        if (!record1 || !record2) continue;

        // Check if they should be merged (same canonical_id in ground truth)
        if (record1.canonical_id === record2.canonical_id) {
          truePositives++;
        } else {
          falsePositives++;
        }
      }
    }
  });

  // Calculate false negatives (pairs that should be merged but weren't)
  Object.entries(groundTruth).forEach(([canonicalId, members]) => {
    if (members.length < 2) return;

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const member1 = members[i];
        const member2 = members[j];

        // Check if they're in the same predicted cluster
        let foundInSameCluster = false;
        Object.values(predictedClusters).forEach(predictedMembers => {
          if (predictedMembers.includes(member1) && predictedMembers.includes(member2)) {
            foundInSameCluster = true;
          }
        });

        if (!foundInSameCluster) {
          falseNegatives++;
        }
      }
    }
  });

  // Calculate metrics
  const precision = truePositives / (truePositives + falsePositives);
  const recall = truePositives / (truePositives + falseNegatives);
  const f1Score = 2 * (precision * recall) / (precision + recall);

  console.log('📊 RESULTS:\n');
  console.log(`   True Positives:  ${truePositives} (correct merges)`);
  console.log(`   False Positives: ${falsePositives} (incorrect merges)`);
  console.log(`   False Negatives: ${falseNegatives} (missed merges)\n`);

  console.log(`   Precision: ${(precision * 100).toFixed(2)}% ${precision >= 0.90 ? '✅' : '❌'}`);
  console.log(`   Recall:    ${(recall * 100).toFixed(2)}%`);
  console.log(`   F1 Score:  ${(f1Score * 100).toFixed(2)}%\n`);

  // Cluster quality metrics
  console.log(`   Predicted clusters: ${Object.keys(predictedClusters).length}`);
  console.log(`   Expected clusters:  ${Object.keys(groundTruth).length}`);
  console.log(`   Cluster accuracy:   ${(Object.keys(predictedClusters).length / Object.keys(groundTruth).length * 100).toFixed(2)}%\n`);

  // Detailed error analysis
  if (falsePositives > 0 || falseNegatives > 0) {
    console.log('🔍 ERROR ANALYSIS:\n');

    if (falsePositives > 0) {
      console.log(`   ❌ False Positives (incorrectly merged):`);
      let fpCount = 0;
      Object.entries(predictedClusters).forEach(([predictedId, predictedMembers]) => {
        for (let i = 0; i < predictedMembers.length && fpCount < 5; i++) {
          for (let j = i + 1; j < predictedMembers.length && fpCount < 5; j++) {
            const record1 = testRecords.find(r => r.id === predictedMembers[i]);
            const record2 = testRecords.find(r => r.id === predictedMembers[j]);
            if (record1 && record2 && record1.canonical_id !== record2.canonical_id) {
              console.log(`      - ${record1.name} (${record1.canonical_id}) merged with ${record2.name} (${record2.canonical_id})`);
              fpCount++;
            }
          }
        }
      });
      if (fpCount < falsePositives) {
        console.log(`      ... and ${falsePositives - fpCount} more`);
      }
      console.log();
    }

    if (falseNegatives > 0 && falseNegatives < 20) {
      console.log(`   ❌ False Negatives (should be merged but weren't):`);
      let fnCount = 0;
      Object.entries(groundTruth).forEach(([canonicalId, members]) => {
        for (let i = 0; i < members.length && fnCount < 5; i++) {
          for (let j = i + 1; j < members.length && fnCount < 5; j++) {
            const member1 = members[i];
            const member2 = members[j];
            let foundInSameCluster = false;
            Object.values(predictedClusters).forEach(predictedMembers => {
              if (predictedMembers.includes(member1) && predictedMembers.includes(member2)) {
                foundInSameCluster = true;
              }
            });
            if (!foundInSameCluster) {
              const record1 = testRecords.find(r => r.id === member1);
              const record2 = testRecords.find(r => r.id === member2);
              if (record1 && record2) {
                console.log(`      - ${record1.name} NOT merged with ${record2.name} (both ${canonicalId})`);
                fnCount++;
              }
            }
          }
        }
      });
      console.log();
    }
  }

  // Exit criteria check
  console.log('============================================================');
  console.log('🎯 PHASE 0.3 EXIT CRITERION #1:');
  if (precision >= 0.90) {
    console.log(`   ✅ PASSED - Precision ${(precision * 100).toFixed(2)}% ≥ 90% target`);
  } else {
    console.log(`   ❌ FAILED - Precision ${(precision * 100).toFixed(2)}% < 90% target`);
    console.log(`   📝 Recommendation: Tune matcher weights or thresholds`);
  }
  console.log('============================================================');

  // Save results
  const resultsPath = path.join(__dirname, '../data/test/precision-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    metrics: {
      precision,
      recall,
      f1Score,
      truePositives,
      falsePositives,
      falseNegatives,
      predictedClusters: Object.keys(predictedClusters).length,
      expectedClusters: Object.keys(groundTruth).length,
    },
    passed: precision >= 0.90
  }, null, 2));

  console.log(`\n📄 Results saved to: ${resultsPath}`);
}

// Run if called directly
if (require.main === module) {
  runPrecisionTest().catch(console.error);
}

module.exports = { runPrecisionTest };
