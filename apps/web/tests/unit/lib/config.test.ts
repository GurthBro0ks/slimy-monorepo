/**
 * Tests for centralized configuration
 */

import { describe, it, expect } from 'vitest';
import { config } from '@/lib/config';

describe('Configuration', () => {
  describe('Cache Configuration', () => {
    it('should have cache TTLs defined', () => {
      expect(config.cache.codes.ttl).toBe(60);
      expect(config.cache.guilds.ttl).toBe(300);
      expect(config.cache.guildDetails.ttl).toBe(180);
    });

    it('should have stale-while-revalidate times', () => {
      expect(config.cache.codes.staleWhileRevalidate).toBeDefined();
      expect(config.cache.guilds.staleWhileRevalidate).toBeDefined();
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should have rate limits for chat', () => {
      expect(config.rateLimit.chat.maxRequests).toBe(10);
      expect(config.rateLimit.chat.windowSeconds).toBe(60);
    });

    it('should have rate limits for API', () => {
      expect(config.rateLimit.api.maxRequests).toBeGreaterThan(0);
      expect(config.rateLimit.api.windowSeconds).toBeGreaterThan(0);
    });
  });

  describe('API Client Configuration', () => {
    it('should have retry configuration', () => {
      expect(config.apiClient.retry.maxRetries).toBe(3);
      expect(config.apiClient.retry.initialDelayMs).toBeDefined();
      expect(config.apiClient.retry.maxDelayMs).toBeDefined();
    });

    it('should have timeout configuration', () => {
      expect(config.apiClient.timeout.defaultMs).toBeDefined();
      expect(config.apiClient.timeout.longRunningMs).toBeGreaterThan(
        config.apiClient.timeout.defaultMs
      );
    });
  });

  describe('Chat Configuration', () => {
    it('should have personality settings', () => {
      expect(config.chat.personalities.helpful).toBeDefined();
      expect(config.chat.personalities.sarcastic).toBeDefined();
      expect(config.chat.personalities.professional).toBeDefined();
      expect(config.chat.personalities.creative).toBeDefined();
      expect(config.chat.personalities.technical).toBeDefined();
    });

    it('should have different temperatures for personalities', () => {
      expect(config.chat.personalities.helpful.temperature).toBe(0.7);
      expect(config.chat.personalities.sarcastic.temperature).toBe(0.9);
      expect(config.chat.personalities.professional.temperature).toBe(0.5);
    });
  });

  describe('Security Configuration', () => {
    it('should have security headers defined', () => {
      expect(config.security.headers.frameOptions).toBe('DENY');
      expect(config.security.headers.contentTypeOptions).toBe('nosniff');
    });

    it('should have rate limiting enabled', () => {
      expect(config.security.rateLimiting.enabled).toBe(true);
      expect(config.security.rateLimiting.failOpen).toBe(true);
    });
  });

  describe('Pagination Configuration', () => {
    it('should have default and max limits', () => {
      expect(config.pagination.guilds.defaultLimit).toBeLessThanOrEqual(
        config.pagination.guilds.maxLimit
      );
      expect(config.pagination.members.defaultLimit).toBeLessThanOrEqual(
        config.pagination.members.maxLimit
      );
    });
  });

  describe('Monitoring Configuration', () => {
    it('should have monitoring settings', () => {
      expect(config.monitoring.healthCheck.intervalMs).toBeDefined();
      expect(config.monitoring.logging.level).toBeDefined();
    });
  });
});
