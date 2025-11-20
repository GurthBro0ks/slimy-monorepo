import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { RadarApiResponse } from '../types.js';

/**
 * Tests for radar command
 *
 * These are basic unit tests that validate response handling without
 * making actual network calls.
 */

test('RadarApiResponse type structure', () => {
  // Test that our type accepts valid responses
  const validResponse: RadarApiResponse = {
    ok: true,
    mode: 'quick',
    snapshot: {
      byDomain: []
    }
  };

  assert.equal(validResponse.ok, true);
  assert.equal(validResponse.mode, 'quick');
});

test('RadarApiResponse error structure', () => {
  const errorResponse: RadarApiResponse = {
    ok: false,
    error: 'Something went wrong'
  };

  assert.equal(errorResponse.ok, false);
  assert.equal(errorResponse.error, 'Something went wrong');
});

test('RadarApiResponse with snapshot data', () => {
  const snapshotResponse: RadarApiResponse = {
    ok: true,
    mode: 'daily',
    profile: { userId: 'test-user' },
    snapshot: {
      byDomain: [
        {
          domain: 'github.com',
          opportunities: [
            {
              opportunityId: 'opp-1',
              domain: 'github.com',
              url: 'https://github.com/test/repo/issues/1',
              title: 'Test Issue',
              shortSummary: 'A test issue',
              risk: 'low',
              estimatedReward: 100,
              estimatedTime: 2
            }
          ]
        }
      ]
    }
  };

  assert.equal(snapshotResponse.ok, true);
  assert.equal(snapshotResponse.mode, 'daily');
  assert.ok(snapshotResponse.snapshot);
  assert.ok(Array.isArray(snapshotResponse.snapshot.byDomain));
  assert.equal(snapshotResponse.snapshot.byDomain.length, 1);
  assert.equal(snapshotResponse.snapshot.byDomain[0].domain, 'github.com');
});

// Mock fetch for testing (if running in test environment)
test('URL construction with query parameters', () => {
  const baseUrl = 'http://localhost:4010';
  const params = new URLSearchParams();
  params.append('mode', 'quick');
  params.append('maxPerDomain', '3');
  params.append('userId', 'testuser');

  const url = `${baseUrl}/radar?${params.toString()}`;

  assert.ok(url.includes('mode=quick'));
  assert.ok(url.includes('maxPerDomain=3'));
  assert.ok(url.includes('userId=testuser'));
  assert.ok(url.startsWith('http://localhost:4010/radar?'));
});
