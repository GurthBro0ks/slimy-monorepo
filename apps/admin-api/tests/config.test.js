/**
 * Tests for typed configuration module
 *
 * These tests verify that the configuration system:
 * 1. Loads and validates environment variables correctly
 * 2. Fails with clear errors when required vars are missing
 * 3. Applies proper defaults for optional vars
 * 4. Provides the expected structure
 */

const assert = require('assert');
const path = require('path');

// Helper to clear module cache and reload config
function clearConfigCache() {
  const configPath = path.resolve(__dirname, '../dist/lib/config/typed-config.js');
  const libConfigPath = path.resolve(__dirname, '../src/lib/config/index.js');
  const srcConfigPath = path.resolve(__dirname, '../src/config.js');
  const mainLibConfigPath = path.resolve(__dirname, '../src/lib/config.js');

  delete require.cache[configPath];
  delete require.cache[libConfigPath];
  delete require.cache[srcConfigPath];
  delete require.cache[mainLibConfigPath];
}

// Save original env
const originalEnv = { ...process.env };

// Helper to reset env
function resetEnv() {
  Object.keys(process.env).forEach((key) => {
    if (!originalEnv.hasOwnProperty(key)) {
      delete process.env[key];
    }
  });
  Object.keys(originalEnv).forEach((key) => {
    process.env[key] = originalEnv[key];
  });
}

// Helper to set minimal valid env
function setMinimalValidEnv() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long-xxxxxxxxxxxx';
  process.env.SESSION_SECRET = 'test-session-secret-at-least-32-chars-long-xxx';
  process.env.DISCORD_CLIENT_ID = '1234567890123456789';
  process.env.DISCORD_CLIENT_SECRET = 'test-discord-client-secret';
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
}

// Simple test runner
if (require.main === module) {
  let passed = 0;
  let failed = 0;

  const tests = {
    'Typed Configuration': {
      'Required Environment Variables': {
        'should fail without JWT_SECRET': function() {
          resetEnv();
          clearConfigCache();
          process.env.SESSION_SECRET = 'test-session-secret-at-least-32-chars-long-xxx';
          process.env.DISCORD_CLIENT_ID = '1234567890123456789';
          process.env.DISCORD_CLIENT_SECRET = 'test-discord-secret';
          process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

          try {
            require('../src/config');
            throw new Error('Should have thrown');
          } catch (error) {
            if (!/JWT_SECRET/i.test(error.message)) throw error;
          }
        },
        'should fail without DATABASE_URL': function() {
          resetEnv();
          clearConfigCache();
          process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long-xxxxxxxxxxxx';
          process.env.SESSION_SECRET = 'test-session-secret-at-least-32-chars-long-xxx';
          process.env.DISCORD_CLIENT_ID = '1234567890123456789';
          process.env.DISCORD_CLIENT_SECRET = 'test-discord-secret';

          try {
            require('../src/config');
            throw new Error('Should have thrown');
          } catch (error) {
            if (!/DATABASE_URL/i.test(error.message)) throw error;
          }
        }
      },
      'Valid Configuration': {
        'should load with minimal valid env vars': function() {
          resetEnv();
          clearConfigCache();
          setMinimalValidEnv();

          const config = require('../src/config');
          assert.strictEqual(config.server.nodeEnv, 'test');
          assert.ok(config.jwt.secret);
        },
        'should apply default values correctly': function() {
          resetEnv();
          clearConfigCache();
          setMinimalValidEnv();

          const config = require('../src/config');
          assert.strictEqual(config.server.port, 3080);
          assert.strictEqual(config.openai.model, 'gpt-4o-mini');
        }
      }
    }
  };

  console.log('\n=== Running Configuration Tests ===\n');

  for (const [suite, suiteTests] of Object.entries(tests)) {
    console.log(`\n${suite}:`);
    for (const [group, groupTests] of Object.entries(suiteTests)) {
      console.log(`  ${group}:`);
      for (const [name, test] of Object.entries(groupTests)) {
        try {
          test();
          console.log(`    ✓ ${name}`);
          passed++;
        } catch (error) {
          console.log(`    ✗ ${name}`);
          console.log(`      Error: ${error.message}`);
          failed++;
        }
      }
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}\n`);

  resetEnv();
  clearConfigCache();

  process.exit(failed > 0 ? 1 : 0);
}
