/**
 * club-store.test.js - Tests for club metrics storage
 */

"use strict";

const {
  canonicalize,
  recordMetrics,
  recomputeLatest,
  getLatest,
  enableInMemoryMode,
  disableInMemoryMode
} = require('../lib/club-store');

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

async function run() {
  console.log("\n=== Club Store Tests ===\n");

  // Enable in-memory mode for all tests
  enableInMemoryMode();

  // Test 1: canonicalize creates correct record
  console.log("Test 1: canonicalize creates canonical record");
  const now = new Date();
  const record = canonicalize('guild123', 'TestUser', 100000, 200000, now);

  assertEqual(record.guild_id, 'guild123', 'guild_id');
  assertEqual(record.member_key, 'testuser', 'member_key');
  assertEqual(record.name, 'TestUser', 'name');
  assertEqual(record.sim_power, 100000, 'sim_power');
  assertEqual(record.total_power, 200000, 'total_power');
  assertEqual(record.observed_at, now, 'observed_at');
  console.log("✓ Passed\n");

  // Test 2: canonicalize normalizes member_key
  console.log("Test 2: canonicalize normalizes member_key");
  const record2 = canonicalize('guild123', 'Test User-123!', 100, 200);
  assertEqual(record2.member_key, 'testuser123', 'Normalized member_key');
  console.log("✓ Passed\n");

  // Test 3: canonicalize uses current time if not provided
  console.log("Test 3: canonicalize uses current time if not provided");
  const before = new Date();
  const record3 = canonicalize('guild123', 'User', 100, 200);
  const after = new Date();

  if (!(record3.observed_at instanceof Date)) {
    throw new Error('observed_at should be a Date instance');
  }
  if (record3.observed_at.getTime() < before.getTime() || record3.observed_at.getTime() > after.getTime()) {
    throw new Error('observed_at should be between before and after');
  }
  console.log("✓ Passed\n");

  // Test 4: records and retrieves metrics
  console.log("Test 4: records and retrieves metrics");
  enableInMemoryMode(); // Reset
  const r1 = canonicalize('guild1', 'Alice', 50000, 100000);
  const r2 = canonicalize('guild1', 'Bob', 60000, 120000);

  await recordMetrics(r1);
  await recordMetrics(r2);
  await recomputeLatest('guild1');

  const latest = await getLatest('guild1');

  if (latest.length !== 2) {
    throw new Error(`Expected 2 members, got ${latest.length}`);
  }

  const alice = latest.find(m => m.name === 'Alice');
  const bob = latest.find(m => m.name === 'Bob');

  if (!alice || alice.sim_power !== 50000 || alice.total_power !== 100000) {
    throw new Error('Alice record not found or incorrect');
  }
  if (!bob || bob.sim_power !== 60000 || bob.total_power !== 120000) {
    throw new Error('Bob record not found or incorrect');
  }
  console.log("✓ Passed\n");

  // Test 5: handles multiple guilds separately
  console.log("Test 5: handles multiple guilds separately");
  enableInMemoryMode(); // Reset
  const r3 = canonicalize('guild1', 'Alice', 50000, 100000);
  const r4 = canonicalize('guild2', 'Bob', 60000, 120000);

  await recordMetrics(r3);
  await recordMetrics(r4);
  await recomputeLatest('guild1');
  await recomputeLatest('guild2');

  const latest1 = await getLatest('guild1');
  const latest2 = await getLatest('guild2');

  if (latest1.length !== 1 || latest1[0].name !== 'Alice') {
    throw new Error('Guild 1 should have only Alice');
  }
  if (latest2.length !== 1 || latest2[0].name !== 'Bob') {
    throw new Error('Guild 2 should have only Bob');
  }
  console.log("✓ Passed\n");

  // Test 6: updates metrics for same member
  console.log("Test 6: updates metrics for same member");
  enableInMemoryMode(); // Reset
  const now1 = new Date('2025-01-01T10:00:00Z');
  const now2 = new Date('2025-01-01T11:00:00Z');

  const r5 = canonicalize('guild1', 'Alice', 50000, 100000, now1);
  const r6 = canonicalize('guild1', 'Alice', 55000, 110000, now2);

  await recordMetrics(r5);
  await recordMetrics(r6);
  await recomputeLatest('guild1');

  const latest3 = await getLatest('guild1');

  if (latest3.length !== 1) {
    throw new Error(`Expected 1 member, got ${latest3.length}`);
  }
  if (latest3[0].sim_power !== 55000 || latest3[0].total_power !== 110000) {
    throw new Error('Alice metrics should be updated to latest values');
  }
  console.log("✓ Passed\n");

  // Test 7: returns empty array for unknown guild
  console.log("Test 7: returns empty array for unknown guild");
  const latestUnknown = await getLatest('unknown-guild');
  if (!Array.isArray(latestUnknown) || latestUnknown.length !== 0) {
    throw new Error('Should return empty array for unknown guild');
  }
  console.log("✓ Passed\n");

  // Test 8: computes latest from multiple observations
  console.log("Test 8: computes latest from multiple observations");
  enableInMemoryMode(); // Reset
  const t1 = new Date('2025-01-01T10:00:00Z');
  const t2 = new Date('2025-01-01T11:00:00Z');
  const t3 = new Date('2025-01-01T12:00:00Z');

  await recordMetrics(canonicalize('guild1', 'Alice', 50000, 100000, t1));
  await recordMetrics(canonicalize('guild1', 'Alice', 55000, 110000, t2));
  await recordMetrics(canonicalize('guild1', 'Bob', 40000, 80000, t3));

  await recomputeLatest('guild1');

  const latest4 = await getLatest('guild1');

  if (latest4.length !== 2) {
    throw new Error(`Expected 2 members, got ${latest4.length}`);
  }

  const alice2 = latest4.find(m => m.name === 'Alice');
  if (!alice2 || alice2.sim_power !== 55000 || alice2.total_power !== 110000) {
    throw new Error('Alice should have latest metrics (55000, 110000)');
  }
  console.log("✓ Passed\n");

  // Cleanup
  disableInMemoryMode();

  console.log("=== All club store tests passed! ===\n");
}

if (require.main === module) {
  run()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n❌ Test failed:", err.message);
      console.error(err.stack);
      process.exit(1);
    });
}

module.exports = { run };
