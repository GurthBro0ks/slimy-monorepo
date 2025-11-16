/**
 * Tests for environment variable validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Environment Variables', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to clear cached env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Validation', () => {
    it('should validate required client environment variables', () => {
      process.env.NEXT_PUBLIC_ADMIN_API_BASE = 'http://localhost:3080';
      process.env.NEXT_PUBLIC_SNELP_CODES_URL = 'https://snelp.com/api/codes';

      expect(() => {
        // Re-import to trigger validation
        require('@/lib/env');
      }).not.toThrow();
    });

    it('should provide default values for optional variables', () => {
      process.env.NEXT_PUBLIC_APP_URL = '';
      process.env.NODE_ENV = '';

      const { env } = require('@/lib/env');

      expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
      expect(env.NODE_ENV).toBe('development');
    });
  });

  describe('Helper Functions', () => {
    it('should check if OpenAI is configured', () => {
      const { hasOpenAI } = require('@/lib/env');

      process.env.OPENAI_API_KEY = 'sk-test';
      expect(hasOpenAI()).toBe(true);

      delete process.env.OPENAI_API_KEY;
      expect(hasOpenAI()).toBe(false);
    });

    it('should check if Redis is configured', () => {
      const { hasRedis } = require('@/lib/env');

      process.env.REDIS_URL = 'redis://localhost:6379';
      expect(hasRedis()).toBe(true);

      delete process.env.REDIS_URL;
      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_PORT = '6379';
      expect(hasRedis()).toBe(true);
    });

    it('should check environment mode helpers', () => {
      const { isProduction, isDevelopment, isTest } = require('@/lib/env');

      process.env.NODE_ENV = 'production';
      expect(isProduction).toBe(true);
      expect(isDevelopment).toBe(false);
      expect(isTest).toBe(false);
    });
  });
});
