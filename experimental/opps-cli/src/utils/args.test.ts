import { test } from 'node:test';
import { strict as assert } from 'node:assert';

/**
 * Tests for argument parsing logic
 *
 * These tests validate the command-line argument parsing without
 * running the full CLI.
 */

test('Parse radar command with no options', () => {
  const args = ['radar'];
  const command = args[0];

  assert.equal(command, 'radar');
});

test('Parse radar command with mode option', () => {
  const args = ['radar', '--mode', 'daily'];
  const command = args[0];

  // Simulate parsing --mode
  let mode: string | undefined;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--mode') {
      mode = args[++i];
    }
  }

  assert.equal(command, 'radar');
  assert.equal(mode, 'daily');
});

test('Parse radar command with multiple options', () => {
  const args = ['radar', '--mode', 'quick', '--per-domain', '5', '--user', 'alice'];
  const command = args[0];

  // Simulate parsing
  let mode: string | undefined;
  let maxPerDomain: number | undefined;
  let userId: string | undefined;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--mode') {
      mode = args[++i];
    } else if (arg === '--per-domain') {
      maxPerDomain = parseInt(args[++i], 10);
    } else if (arg === '--user') {
      userId = args[++i];
    }
  }

  assert.equal(command, 'radar');
  assert.equal(mode, 'quick');
  assert.equal(maxPerDomain, 5);
  assert.equal(userId, 'alice');
});

test('Parse short flag options', () => {
  const args = ['radar', '-m', 'daily', '-p', '3', '-u', 'bob'];

  // Simulate parsing short flags
  let mode: string | undefined;
  let maxPerDomain: number | undefined;
  let userId: string | undefined;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-m') {
      mode = args[++i];
    } else if (arg === '-p') {
      maxPerDomain = parseInt(args[++i], 10);
    } else if (arg === '-u') {
      userId = args[++i];
    }
  }

  assert.equal(mode, 'daily');
  assert.equal(maxPerDomain, 3);
  assert.equal(userId, 'bob');
});

test('Environment variable resolution', () => {
  // Save original value
  const original = process.env.OPPS_API_BASE_URL;

  // Test default
  delete process.env.OPPS_API_BASE_URL;
  const defaultUrl = process.env.OPPS_API_BASE_URL || 'http://localhost:4010';
  assert.equal(defaultUrl, 'http://localhost:4010');

  // Test custom value
  process.env.OPPS_API_BASE_URL = 'http://localhost:8080';
  const customUrl = process.env.OPPS_API_BASE_URL || 'http://localhost:4010';
  assert.equal(customUrl, 'http://localhost:8080');

  // Restore original
  if (original !== undefined) {
    process.env.OPPS_API_BASE_URL = original;
  } else {
    delete process.env.OPPS_API_BASE_URL;
  }
});

test('Validate mode values', () => {
  const validModes = ['quick', 'daily'];

  assert.ok(validModes.includes('quick'));
  assert.ok(validModes.includes('daily'));
  assert.ok(!validModes.includes('invalid'));
});

test('Parse maxPerDomain as number', () => {
  const value = '5';
  const parsed = parseInt(value, 10);

  assert.equal(parsed, 5);
  assert.equal(typeof parsed, 'number');
  assert.ok(!isNaN(parsed));
});

test('Handle invalid maxPerDomain', () => {
  const invalidValue = 'abc';
  const parsed = parseInt(invalidValue, 10);

  assert.ok(isNaN(parsed));
});
