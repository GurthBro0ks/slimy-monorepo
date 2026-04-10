/**
 * Unit tests for roster-ocr diff logic.
 * Tests diffResults() with mocked model outputs.
 */

import { describe, it, expect } from 'vitest';
import { diffResults } from '../src/services/roster-ocr.js';
import type { RosterRow } from '../src/services/roster-ocr.js';

// Helper to build RosterRow
function row(name: string, power: number | bigint, last_seen = '5h ago'): RosterRow {
  return { name, power: BigInt(power), last_seen };
}

describe('diffResults', () => {
  it('returns agreed entries when both models match', () => {
    const gemini: RosterRow[] = [
      row('Alice', 1234567890),
      row('Bob', 9876543210),
    ];
    const glm: RosterRow[] = [
      row('Alice', 1234567890),
      row('Bob', 9876543210),
    ];

    const result = diffResults(gemini, glm);

    expect(result).toHaveLength(2);
    for (const entry of result) {
      expect(entry.confidence).toBe('high');
      expect(entry.source).toBe('agreed');
    }
  });

  it('flags low confidence when only one model has a row', () => {
    const gemini: RosterRow[] = [row('Alice', 1000)];
    const glm: RosterRow[] = [];

    const result = diffResults(gemini, glm);

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('gemini');
    expect(result[0].confidence).toBe('low');
    expect(result[0].geminiValue).toBe(1000n);
    expect(result[0].glmValue).toBeUndefined();
  });

  it('flags conflict when values differ', () => {
    const gemini: RosterRow[] = [row('Alice', 1234)];
    const glm: RosterRow[] = [row('Alice', 5678)];

    const result = diffResults(gemini, glm);

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('conflict');
    expect(result[0].confidence).toBe('low');
    expect(result[0].geminiValue).toBe(1234n);
    expect(result[0].glmValue).toBe(5678n);
    expect(result[0].power).toBe(1234n); // first value (gemini) is used as provisional
  });

  it('handles multiple rows with mixed agreement/conflict/missing', () => {
    const gemini: RosterRow[] = [
      row('Alice', 1000),
      row('Bob', 2000),
      row('Carol', 3000),
      row('Dave', 4000),
    ];
    const glm: RosterRow[] = [
      row('Alice', 1000),        // agreed
      row('Bob', 9999),          // conflict
      row('Carol', 3000),        // agreed
      // Dave missing from glm
    ];

    const result = diffResults(gemini, glm);

    expect(result).toHaveLength(4);

    const alice = result.find((e) => e.name === 'Alice')!;
    expect(alice.source).toBe('agreed');
    expect(alice.confidence).toBe('high');

    const bob = result.find((e) => e.name === 'Bob')!;
    expect(bob.source).toBe('conflict');
    expect(bob.confidence).toBe('low');

    const carol = result.find((e) => e.name === 'Carol')!;
    expect(carol.source).toBe('agreed');
    expect(carol.confidence).toBe('high');

    const dave = result.find((e) => e.name === 'Dave')!;
    expect(dave.source).toBe('gemini');
    expect(dave.confidence).toBe('low');
  });

  it('is case-insensitive when matching names', () => {
    const gemini: RosterRow[] = [row('ALICE', 1000)];
    const glm: RosterRow[] = [row('alice', 1000)];

    const result = diffResults(gemini, glm);

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('agreed');
    expect(result[0].confidence).toBe('high');
  });

  it('handles empty arrays for both models', () => {
    const result = diffResults([], []);
    expect(result).toHaveLength(0);
  });

  it('assigns correct row_index values', () => {
    const gemini: RosterRow[] = [row('Alice', 1000), row('Bob', 2000), row('Carol', 3000)];
    const glm: RosterRow[] = [row('Alice', 1000), row('Bob', 2000), row('Carol', 3000)];

    const result = diffResults(gemini, glm);

    expect(result[0].row_index).toBe(0);
    expect(result[1].row_index).toBe(1);
    expect(result[2].row_index).toBe(2);
  });

  it('bigint powers are preserved through diff', () => {
    const largePower = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
    const gemini: RosterRow[] = [row('BigPlayer', largePower)];
    const glm: RosterRow[] = [row('BigPlayer', largePower)];

    const result = diffResults(gemini, glm);

    expect(result).toHaveLength(1);
    expect(result[0].power).toBe(largePower);
    expect(typeof result[0].power).toBe('bigint');
  });
});

describe('parseRosterJson (via diffResults integration)', () => {
  it('uses gemini value when glm is missing on conflict', () => {
    const gemini: RosterRow[] = [row('TestPlayer', 5000n, 'Online')];
    const glm: RosterRow[] = [];

    const result = diffResults(gemini, glm);

    expect(result).toHaveLength(1);
    expect(result[0].power).toBe(5000n);
    expect(result[0].source).toBe('gemini');
  });

  it('uses glm value when gemini is missing', () => {
    const gemini: RosterRow[] = [];
    const glm: RosterRow[] = [row('TestPlayer', 6000n, '2h ago')];

    const result = diffResults(gemini, glm);

    expect(result).toHaveLength(1);
    expect(result[0].power).toBe(6000n);
    expect(result[0].source).toBe('glm');
  });
});
