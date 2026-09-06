/**
 * Phase 6: Theory-Driven Reasoning Engine Simple Test
 * 
 * Tests all 4 criminological theories and reasoning pipeline
 * Run: npx tsx scripts/test-reasoning-simple.ts
 */

import { ReasoningEngine } from '../lib/reasoning/reasoning-engine';
import { ReasoningQuery } from '../lib/reasoning/types';

async function testReasoning() {
  console.log('=== Phase 6: Theory-Driven Reasoning Engine Test ===\n');

  const engine = new ReasoningEngine();

  // Test 1: Routine Activity Theory (Why + Risk question)
  console.log('📋 Test 1: Routine Activity Theory\n');
  
  const ratQuery: ReasoningQuery = {
    query: 'Why is District X at high risk for vehicle theft in the next 2 weeks?',
    context: {
      district: 'Bengaluru',
      crimeTypes: ['Vehicle Theft'],
      timeWindow: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    },
  };

  const ratResult = await engine.reason(ratQuery);
  console.log('Claim:', ratResult.claim);
  console.log('');
  console.log('Mechanisms:');
  ratResult.mechanisms.forEach(m => {
    console.log(`  - ${m.theory}`);
    if (m.theory === 'routine_activity_theory') {
      const rat = m;
      console.log(`    Motivated Offender: ${rat.factors.motivatedOffender.explanation}`);
      console.log(`    Suitable Target: ${rat.factors.suitableTarget.explanation}`);
      console.log(`    Absent Guardian: ${rat.factors.absentGuardian.explanation}`);
      console.log(`    Risk Score: ${rat.riskScore}/100`);
    }
  });
  console.log('');
  console.log('Confidence:', ratResult.confidence.overall, `(${(ratResult.confidence.score * 100).toFixed(0)}%)`);
  console.log('  - Mechanism Support:', (ratResult.confidence.factors.mechanismSupport * 100).toFixed(0) + '%');
  console.log('  - Historical Precedent:', (ratResult.confidence.factors.historicalPrecedent * 100).toFixed(0) + '%');
  console.log('  - Statistical Significance:', (ratResult.confidence.factors.statisticalSignificance * 100).toFixed(0) + '%');
  console.log('');
  console.log('Alternatives Considered:');
  ratResult.alternatives.forEach(alt => {
    console.log(`  - ${alt.hypothesis}`);
    console.log(`    Status: ${alt.status}`);
    console.log(`    Explanation: ${alt.explanation}`);
  });
  console.log('');
  console.log(`Processing Time: ${ratResult.processingTime}ms`);
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Crime Pattern Theory (Location question)
  console.log('📋 Test 2: Crime Pattern Theory\n');
  
  const cptQuery: ReasoningQuery = {
    query: 'Which offenders have activity nodes near the MG Road crime location?',
    theories: ['crime_pattern_theory'], // Explicitly request CPT
  };

  const cptResult = await engine.reason(cptQuery);
  console.log('Claim:', cptResult.claim);
  console.log('');
  console.log('Mechanisms:');
  cptResult.mechanisms.forEach(m => {
    if (m.theory === 'crime_pattern_theory') {
      const cpt = m;
      console.log(`  - Crime Pattern Theory`);
      console.log(`    Crime Location: ${cpt.crimeLocation.address}`);
      console.log(`    Overlapping Offenders: ${cpt.overlappingOffenders.length}`);
      cpt.overlappingOffenders.forEach(offender => {
        console.log(`      * ${offender.name}`);
        console.log(`        Closest Node: ${offender.closestNodeDistance}m away`);
        console.log(`        MO Match: ${offender.moMatch ? 'Yes' : 'No'}`);
        console.log(`        Explanation: ${offender.explanation}`);
      });
    }
  });
  console.log('');
  console.log(`Processing Time: ${cptResult.processingTime}ms`);
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Rational Choice Theory (Behavior question)
  console.log('📋 Test 3: Rational Choice Theory\n');
  
  const rctQuery: ReasoningQuery = {
    query: 'What is the behavioral pattern of offender P-123?',
    theories: ['rational_choice_theory'],
  };

  const rctResult = await engine.reason(rctQuery);
  console.log('Claim:', rctResult.claim);
  console.log('');
  console.log('Mechanisms:');
  rctResult.mechanisms.forEach(m => {
    if (m.theory === 'rational_choice_theory') {
      const rct = m;
      console.log(`  - Rational Choice Theory`);
      console.log(`    Offender ID: ${rct.offenderId}`);
      console.log(`    Preferred Time: ${rct.behavioralProfile.preferredTime.timeRange} (${rct.behavioralProfile.preferredTime.percentage}% of incidents)`);
      console.log(`    Target Profile: ${rct.behavioralProfile.targetProfile.type}`);
      console.log(`    Method: ${rct.behavioralProfile.method.description}`);
      console.log(`    Escalation Trend: ${rct.behavioralProfile.method.escalationTrend}`);
      console.log(`    Geographic Range: ${rct.behavioralProfile.geographicRange.radiusKm}km radius`);
      console.log(`    MO Consistency: ${(rct.moConsistencyScore * 100).toFixed(0)}%`);
      console.log(`    Recidivism Risk: ${rct.recidivismRisk}`);
      console.log(`    Violence Escalation Risk: ${rct.violenceEscalationRisk}`);
    }
  });
  console.log('');
  console.log(`Processing Time: ${rctResult.processingTime}ms`);
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 4: Social Disorganization Theory (District trends)
  console.log('📋 Test 4: Social Disorganization Theory\n');
  
  const sdtQuery: ReasoningQuery = {
    query: 'Why does District X have higher crime rates than other districts?',
    theories: ['social_disorganization'],
  };

  const sdtResult = await engine.reason(sdtQuery);
  console.log('Claim:', sdtResult.claim);
  console.log('');
  console.log('Mechanisms:');
  sdtResult.mechanisms.forEach(m => {
    if (m.theory === 'social_disorganization') {
      const sdt = m;
      console.log(`  - Social Disorganization Theory`);
      console.log(`    District: ${sdt.district}`);
      console.log(`    Crime Rate: ${sdt.crimeMetrics.crimeRate} per 100k (${sdt.crimeMetrics.comparisonToStateAvg}x state avg)`);
      console.log(`    Socio-Economic Factors:`);
      console.log(`      * Unemployment: ${sdt.socioEconomicFactors.unemploymentRate}%`);
      console.log(`      * Migration Rate: +${sdt.socioEconomicFactors.migrationRate}%`);
      console.log(`      * Population Density: ${sdt.socioEconomicFactors.populationDensity}/sq km`);
      console.log(`    Correlation Analysis:`);
      sdt.correlationAnalysis.forEach(corr => {
        console.log(`      * ${corr.factor}: ${(corr.correlation * 100).toFixed(0)}% correlation`);
        console.log(`        Mechanism: ${corr.mechanism}`);
      });
      console.log(`    Caveats:`);
      sdt.caveats.forEach(caveat => {
        console.log(`      - ${caveat}`);
      });
    }
  });
  console.log('');
  console.log(`Processing Time: ${sdtResult.processingTime}ms`);
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 5: Multi-Theory Analysis
  console.log('📋 Test 5: Multi-Theory Analysis (Auto-Select)\n');
  
  const multiQuery: ReasoningQuery = {
    query: 'Analyze the vehicle theft pattern in Bengaluru and predict future risk',
    // No explicit theories - let engine auto-select
  };

  const multiResult = await engine.reason(multiQuery);
  console.log('Claim:', multiResult.claim);
  console.log('');
  console.log('Theories Applied:', multiResult.mechanisms.length);
  multiResult.mechanisms.forEach(m => {
    console.log(`  - ${m.theory}`);
  });
  console.log('');
  console.log('Evidence Items:', multiResult.evidence.length);
  multiResult.evidence.slice(0, 3).forEach(ev => {
    console.log(`  - [${ev.type}] ${ev.title}`);
    console.log(`    ${ev.summary}`);
    console.log(`    Relevance: ${(ev.relevance * 100).toFixed(0)}%`);
  });
  console.log('');
  console.log('Confidence:', multiResult.confidence.overall);
  console.log('Alternatives:', multiResult.alternatives.length);
  console.log(`Processing Time: ${multiResult.processingTime}ms`);

  console.log('\n✅ All reasoning engine tests completed!\n');
}

// Run tests
testReasoning().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
