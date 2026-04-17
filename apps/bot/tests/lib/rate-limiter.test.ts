import { rateLimiter } from '../../src/lib/rate-limiter';

describe('rateLimiter', () => {
  beforeEach(() => {
    rateLimiter.resetCooldown('test-user');
    rateLimiter.resetCooldown('test-user', 'cmd1');
    rateLimiter.resetCooldown('test-user', 'cmd2');
  });

  describe('checkCooldown', () => {
    it('should allow first call', () => {
      const result = rateLimiter.checkCooldown('test-user', 'cmd1', 5);
      expect(result.limited).toBe(false);
      expect(result.remaining).toBeUndefined();
    });

    it('should rate limit subsequent call within cooldown', () => {
      rateLimiter.checkCooldown('test-user', 'cmd1', 5);
      const result = rateLimiter.checkCooldown('test-user', 'cmd1', 5);
      expect(result.limited).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.remaining!).toBeLessThanOrEqual(5);
    });

    it('should use default cooldown of 3 seconds', () => {
      rateLimiter.checkCooldown('test-user', 'cmd-default');
      const result = rateLimiter.checkCooldown('test-user', 'cmd-default');
      expect(result.limited).toBe(true);
    });

    it('should track different commands independently', () => {
      rateLimiter.checkCooldown('test-user', 'cmd1', 5);
      const result = rateLimiter.checkCooldown('test-user', 'cmd2', 5);
      expect(result.limited).toBe(false);
    });

    it('should track different users independently', () => {
      rateLimiter.checkCooldown('user-a', 'cmd1', 5);
      const result = rateLimiter.checkCooldown('user-b', 'cmd1', 5);
      expect(result.limited).toBe(false);
    });
  });

  describe('checkGlobalCooldown', () => {
    it('should rate limit globally for same user', () => {
      rateLimiter.checkGlobalCooldown('test-user', 2);
      const result = rateLimiter.checkGlobalCooldown('test-user', 2);
      expect(result.limited).toBe(true);
    });

    it('should not affect other users', () => {
      rateLimiter.checkGlobalCooldown('test-user', 2);
      const result = rateLimiter.checkGlobalCooldown('other-user', 2);
      expect(result.limited).toBe(false);
    });
  });

  describe('resetCooldown', () => {
    it('should reset specific command cooldown', () => {
      rateLimiter.checkCooldown('test-user', 'cmd1', 60);
      rateLimiter.resetCooldown('test-user', 'cmd1');
      const result = rateLimiter.checkCooldown('test-user', 'cmd1', 60);
      expect(result.limited).toBe(false);
    });

    it('should reset all cooldowns for a user when no command specified', () => {
      rateLimiter.checkCooldown('test-user', 'cmd1', 60);
      rateLimiter.checkCooldown('test-user', 'cmd2', 60);
      rateLimiter.resetCooldown('test-user');
      expect(rateLimiter.checkCooldown('test-user', 'cmd1', 60).limited).toBe(false);
      expect(rateLimiter.checkCooldown('test-user', 'cmd2', 60).limited).toBe(false);
    });
  });
});
