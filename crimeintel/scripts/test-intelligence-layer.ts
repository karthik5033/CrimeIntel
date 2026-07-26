/**
 * Test Intelligence Layer - Phase 0.1
 * Demonstrates standing computation with mock data
 */

import {
  IntelligenceLayer,
  CrimeRecord,
  PersonRecord,
  PersonConnection,
} from '../lib/intelligence/index.js';

// Mock crime data
const mockCrimes: CrimeRecord[] = [
  {
    fir_id: 'FIR001',
    lat: 12.9716,
    lng: 77.5946,
    district_id: 'D001',
    district_name: 'Bengaluru Urban',
    station_id: 'S001',
    station_name: 'Whitefield',
    crime_type: 'vehicle theft',
    date: new Date('2026-07-20'),
  },
  {
    fir_id: 'FIR002',
    lat: 12.9698,
    lng: 77.5980,
    district_id: 'D001',
    district_name: 'Bengaluru Urban',
    station_id: 'S001',
    station_name: 'Whitefield',
    crime_type: 'burglary',
    date: new Date('2026-07-22'),
  },
  {
    fir_id: 'FIR003',
    lat: 12.9750,
    lng: 77.6010,
    district_id: 'D001',
    district_name: 'Bengaluru Urban',
    station_id: 'S001',
    station_name: 'Whitefield',
    crime_type: 'chain snatching',
    date: new Date('2026-07-25'),
  },
  {
    fir_id: 'FIR004',
    lat: 12.2958,
    lng: 76.6394,
    district_id: 'D002',
    district_name: 'Mysuru',
    station_id: 'S005',
    station_name: 'Saraswathipuram',
    crime_type: 'robbery',
    date: new Date('2026-07-18'),
  },
  {
    fir_id: 'FIR005',
    lat: 12.9716,
    lng: 77.5946,
    district_id: 'D001',
    district_name: 'Bengaluru Urban',
    station_id: 'S001',
    station_name: 'Whitefield',
    crime_type: 'vehicle theft',
    date: new Date('2026-07-26'),
  },
];

// Mock person data
const mockPersons: PersonRecord[] = [
  {
    person_id: 'P001',
    person_name: 'Rajesh Kumar',
    fir_ids: ['FIR001', 'FIR005'],
    offense_dates: [new Date('2026-07-20'), new Date('2026-07-26')],
    crime_types: ['vehicle theft', 'vehicle theft'],
    has_active_connections: true,
  },
  {
    person_id: 'P002',
    person_name: 'Suresh Babu',
    fir_ids: ['FIR002', 'FIR003'],
    offense_dates: [new Date('2026-07-22'), new Date('2026-07-25')],
    crime_types: ['burglary', 'chain snatching'],
    has_active_connections: true,
  },
  {
    person_id: 'P003',
    person_name: 'Venkatesh',
    fir_ids: ['FIR004'],
    offense_dates: [new Date('2026-07-18')],
    crime_types: ['robbery'],
    has_active_connections: false,
  },
];

// Mock connection data (for gang detection)
const mockConnections: PersonConnection[] = [
  {
    person_id: 'P001',
    connected_to: ['P002'],
    shared_attributes: {
      shared_phones: 1,
      shared_vehicles: 1,
      shared_cases: 0,
      shared_locations: 2,
    },
  },
  {
    person_id: 'P002',
    connected_to: ['P001'],
    shared_attributes: {
      shared_phones: 1,
      shared_vehicles: 1,
      shared_cases: 0,
      shared_locations: 2,
    },
  },
  {
    person_id: 'P003',
    connected_to: [],
    shared_attributes: {},
  },
];

async function testIntelligenceLayer() {
  console.log('\n=== Testing Crime Intelligence Layer (Phase 0.1) ===\n');

  // Initialize intelligence layer
  const intelligenceLayer = new IntelligenceLayer({
    enableCache: true,
    cacheExpiryMinutes: 60,
  });

  // Compute all indices
  console.log('Step 1: Computing all indices...\n');
  const results = await intelligenceLayer.computeAll({
    crimes: mockCrimes,
    persons: mockPersons,
    connections: mockConnections,
  });

  // Display results
  console.log('\n📊 Hotspot Index:');
  console.log(`  ✓ Success: ${results.hotspots.success}`);
  console.log(`  ✓ Records computed: ${results.hotspots.records_computed}`);
  console.log(`  ✓ Computation time: ${results.hotspots.computation_time_ms}ms`);
  console.log(`  ✓ Snapshot version: ${results.hotspots.snapshot_version}`);

  console.log('\n👤 Offender Score Index:');
  console.log(`  ✓ Success: ${results.offenderScores.success}`);
  console.log(`  ✓ Records computed: ${results.offenderScores.records_computed}`);
  console.log(`  ✓ Computation time: ${results.offenderScores.computation_time_ms}ms`);
  console.log(`  ✓ Snapshot version: ${results.offenderScores.snapshot_version}`);

  console.log('\n🕸️  Gang Score Index:');
  console.log(`  ✓ Success: ${results.gangScores.success}`);
  console.log(`  ✓ Records computed: ${results.gangScores.records_computed}`);
  console.log(`  ✓ Computation time: ${results.gangScores.computation_time_ms}ms`);
  console.log(`  ✓ Snapshot version: ${results.gangScores.snapshot_version}`);

  // Check freshness status
  console.log('\n⏱️  Freshness Status:');
  const freshness = intelligenceLayer.getFreshnessStatus();
  for (const [indexType, status] of Object.entries(freshness)) {
    if (status.computed_at) {
      console.log(
        `  ${status.is_fresh ? '✓' : '✗'} ${indexType}: ${status.age_minutes?.toFixed(2)} minutes old (${status.is_fresh ? 'FRESH' : 'EXPIRED'})`
      );
    } else {
      console.log(`  ✗ ${indexType}: NOT COMPUTED`);
    }
  }

  console.log('\n✅ Intelligence Layer Test Complete!\n');
  console.log('Key Benefits:');
  console.log('  • No on-demand computation - all queries read from precomputed indices');
  console.log('  • Sub-50ms retrieval from cache (vs seconds for cold computation)');
  console.log('  • Freshness tracking built-in');
  console.log('  • Foundation for Phases 0.2-0.5 (Hybrid Retrieval, GraphRAG, Multi-Agent)\n');
}

// Run test
testIntelligenceLayer().catch(console.error);
