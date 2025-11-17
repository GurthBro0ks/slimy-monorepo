/**
 * Tests for environment variable validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ensureRequiredClientEnv = () => {
  process.env.NEXT_PUBLIC_ADMIN_API_BASE ||= 'http://localhost:3080';
  process.env.NEXT_PUBLIC_SNELP_CODES_URL ||= 'https://snelp.com/api/codes';
};

const loadEnvModule = async () => {
  const currentWindow = (globalThis as { window?: unknown }).window;
  // Ensure server-only env validation runs by temporarily removing window
  if (typeof currentWindow !== 'undefined') {
    delete (globalThis as { window?: unknown }).window;
  }
  ensureRequiredClientEnv();
  const mod = await import('@/lib/env');
  if (typeof currentWindow !== 'undefined') {
    (globalThis as { window?: unknown }).window = currentWindow;
  }
  return mod;
};

describe('Environment Variables', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    // Reset modules to clear cached env
    process.env = { ...originalEnv };
    await vi.resetModules();
    ensureRequiredClientEnv();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Validation', () => {
    it('should validate required client environment variables', async () => {
      process.env.NEXT_PUBLIC_ADMIN_API_BASE = 'http://localhost:3080';
      process.env.NEXT_PUBLIC_SNELP_CODES_URL = 'https://snelp.com/api/codes';

      await expect(loadEnvModule()).resolves.toBeDefined();
    });

    it('should provide default values for optional variables', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NODE_ENV;

      const { env } = await loadEnvModule();

      expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
      expect(env.NODE_ENV).toBe('development');
    });
  });

  describe('Helper Functions', () => {
    it('should check if OpenAI is configured', async () => {
      process.env.OPENAI_API_KEY = 'sk-test';
      let { hasOpenAI } = await loadEnvModule();
      expect(hasOpenAI()).toBe(true);

      await vi.resetModules();
      delete process.env.OPENAI_API_KEY;
      ({ hasOpenAI } = await loadEnvModule());
      expect(hasOpenAI()).toBe(false);
    });

    it('should check if Redis is configured', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      let { hasRedis } = await loadEnvModule();
      expect(hasRedis()).toBe(true);

      await vi.resetModules();
      delete process.env.REDIS_URL;
      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_PORT = '6379';
      ({ hasRedis } = await loadEnvModule());
      expect(hasRedis()).toBe(true);

      await vi.resetModules();
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      ({ hasRedis } = await loadEnvModule());
      expect(hasRedis()).toBe(false);
    });

    it('should check environment mode helpers', async () => {
      process.env.NODE_ENV = 'production';
      let { isProduction, isDevelopment, isTest } = await loadEnvModule();
      expect(isProduction).toBe(true);
      expect(isDevelopment).toBe(false);
      expect(isTest).toBe(false);

      await vi.resetModules();
      process.env.NODE_ENV = 'development';
      ({ isProduction, isDevelopment, isTest } = await loadEnvModule());
      expect(isProduction).toBe(false);
      expect(isDevelopment).toBe(true);
      expect(isTest).toBe(false);

      await vi.resetModules();
      process.env.NODE_ENV = 'test';
      ({ isProduction, isDevelopment, isTest } = await loadEnvModule());
      expect(isProduction).toBe(false);
      expect(isDevelopment).toBe(false);
      expect(isTest).toBe(true);
    });
  });
});
