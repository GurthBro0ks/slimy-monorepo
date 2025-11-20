/**
 * Basic tests for radar functionality
 *
 * Note: These tests use fake data from stub collectors.
 * Once opps-core is available, import actual types.
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';

// Import runtime functions
import { buildRadarSnapshot, createStore } from '../src/index.js';

// Import collectors
import {
  collectMarketSignalsNow,
  collectTrendSignalsNow,
  collectClassActionOpportunitiesNow,
  collectFreebieOpportunitiesNow,
} from '../src/index.js';

/**
 * Create a fake user profile for testing
 * TODO: Import actual UserProfile type from opps-core once available
 */
function createTestUserProfile() {
  return {
    userId: 'test-user-123',
    preferences: {
      domains: ['stocks', 'crypto', 'video', 'search', 'legal', 'promo'],
      interests: ['technology', 'finance', 'gaming', 'trends'],
      riskTolerance: 'moderate',
    },
    context: {
      location: 'US',
      timezone: 'America/New_York',
    },
  };
}

describe('Radar Runtime Tests', () => {
  test('buildRadarSnapshot returns non-empty topByCategory', async () => {
    const profile = createTestUserProfile();
    const snapshot = await buildRadarSnapshot(profile, 5);

    assert.ok(snapshot, 'Snapshot should be defined');
    assert.ok(snapshot.topByCategory, 'topByCategory should be defined');
    assert.ok(Object.keys(snapshot.topByCategory).length > 0, 'Should have at least one category');
    assert.strictEqual(snapshot.userId, 'test-user-123', 'UserId should match profile');
  });

  test('all opportunities have required fields', async () => {
    const profile = createTestUserProfile();
    const snapshot = await buildRadarSnapshot(profile, 10);

    for (const [domain, opportunities] of Object.entries(snapshot.topByCategory)) {
      assert.ok(Array.isArray(opportunities), `${domain} should be an array`);

      for (const opp of opportunities) {
        assert.ok(opp.id, 'Opportunity should have id');
        assert.ok(opp.type, 'Opportunity should have type');
        assert.ok(opp.domain, 'Opportunity should have domain');
        assert.ok(opp.freshnessTier, 'Opportunity should have freshnessTier');
        assert.ok(opp.title, 'Opportunity should have title');
        assert.ok(opp.description, 'Opportunity should have description');
        assert.ok(opp.detectedAt, 'Opportunity should have detectedAt');
        assert.ok(typeof opp.score === 'number', 'Opportunity should have numeric score');
      }
    }
  });

  test('collectors return expected opportunity counts', async () => {
    const marketOpps = await collectMarketSignalsNow();
    const trendOpps = await collectTrendSignalsNow();
    const classActionOpps = await collectClassActionOpportunitiesNow();
    const freebieOpps = await collectFreebieOpportunitiesNow();

    assert.ok(marketOpps.length > 0, 'Market collector should return opportunities');
    assert.ok(trendOpps.length > 0, 'Trend collector should return opportunities');
    assert.ok(classActionOpps.length > 0, 'Class action collector should return opportunities');
    assert.ok(freebieOpps.length > 0, 'Freebie collector should return opportunities');
  });

  test('in-memory store operations work correctly', () => {
    const store = createStore();

    const testOpp = {
      id: 'test-001',
      type: 'market_move' as const,
      domain: 'stocks' as const,
      freshnessTier: 'realtime' as const,
      title: 'Test opportunity',
      description: 'Test description',
      detectedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000000).toISOString(),
      actionUrl: 'https://example.com',
      tags: ['test'],
      score: 0.5,
    };

    // Test upsert
    store.upsert(testOpp);
    assert.strictEqual(store.getAll().length, 1, 'Store should have 1 opportunity');

    // Test getByDomain
    const stockOpps = store.getByDomain('stocks');
    assert.strictEqual(stockOpps.length, 1, 'Should have 1 stock opportunity');
    assert.strictEqual(stockOpps[0].id, 'test-001', 'Should retrieve correct opportunity');

    // Test clear
    store.clear();
    assert.strictEqual(store.getAll().length, 0, 'Store should be empty after clear');
  });

  test('limitPerDomain parameter works correctly', async () => {
    const profile = createTestUserProfile();
    const snapshot = await buildRadarSnapshot(profile, 1);

    // Check that no domain has more than 1 opportunity
    for (const [domain, opportunities] of Object.entries(snapshot.topByCategory)) {
      assert.ok(
        opportunities.length <= 1,
        `${domain} should have at most 1 opportunity, got ${opportunities.length}`
      );
    }
  });

  test('snapshot metadata is populated', async () => {
    const profile = createTestUserProfile();
    const snapshot = await buildRadarSnapshot(profile, 5);

    assert.ok(snapshot.metadata, 'Metadata should be defined');
    assert.ok(snapshot.metadata.totalCollected > 0, 'Should have collected opportunities');
    assert.ok(snapshot.metadata.totalReturned > 0, 'Should have returned opportunities');
    assert.ok(
      Array.isArray(snapshot.metadata.collectorsRun),
      'collectorsRun should be an array'
    );
    assert.strictEqual(
      snapshot.metadata.scoringApplied,
      true,
      'scoringApplied should be true'
    );
  });
});
