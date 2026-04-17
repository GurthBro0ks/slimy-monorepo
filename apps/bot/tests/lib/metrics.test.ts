import { trackCommand, trackError, getStats, reset } from '../../src/lib/metrics';

describe('metrics', () => {
  beforeEach(() => {
    reset();
  });

  describe('trackCommand', () => {
    it('should track a successful command', () => {
      trackCommand('test-cmd', 100, true);
      const stats = getStats();
      expect(stats.commands).toHaveProperty('test-cmd');
      const cmd = stats.commands['test-cmd'] as Record<string, unknown>;
      expect(cmd.count).toBe(1);
      expect(cmd.successCount).toBe(1);
      expect(cmd.failCount).toBe(0);
    });

    it('should track a failed command', () => {
      trackCommand('test-cmd', 50, false);
      const stats = getStats();
      const cmd = stats.commands['test-cmd'] as Record<string, unknown>;
      expect(cmd.count).toBe(1);
      expect(cmd.successCount).toBe(0);
      expect(cmd.failCount).toBe(1);
    });

    it('should accumulate multiple calls', () => {
      trackCommand('cmd1', 100, true);
      trackCommand('cmd1', 200, true);
      trackCommand('cmd1', 50, false);
      const stats = getStats();
      const cmd = stats.commands['cmd1'] as Record<string, unknown>;
      expect(cmd.count).toBe(3);
      expect(cmd.successCount).toBe(2);
      expect(cmd.failCount).toBe(1);
    });

    it('should calculate average time', () => {
      trackCommand('avg-cmd', 100, true);
      trackCommand('avg-cmd', 200, true);
      const stats = getStats();
      const cmd = stats.commands['avg-cmd'] as Record<string, unknown>;
      expect(cmd.avgTime).toBe('150ms');
    });

    it('should track multiple different commands', () => {
      trackCommand('cmd-a', 100, true);
      trackCommand('cmd-b', 200, false);
      const stats = getStats();
      expect(Object.keys(stats.commands)).toHaveLength(2);
    });
  });

  describe('trackError', () => {
    it('should track errors by type', () => {
      trackError('test-error', 'Something went wrong');
      const stats = getStats();
      expect(stats.errors).toHaveProperty('test-error');
      const err = stats.errors['test-error'] as Record<string, unknown>;
      expect(err.count).toBe(1);
      expect(err.lastSeen).toBeTruthy();
    });

    it('should accumulate errors of same type', () => {
      trackError('dup-error', 'first');
      trackError('dup-error', 'second');
      const stats = getStats();
      const err = stats.errors['dup-error'] as Record<string, unknown>;
      expect(err.count).toBe(2);
    });

    it('should cap recent messages at 3 in output', () => {
      for (let i = 0; i < 5; i++) {
        trackError('cap-error', `msg-${i}`);
      }
      const stats = getStats();
      const err = stats.errors['cap-error'] as { recentMessages: unknown[] };
      expect(err.recentMessages.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getStats', () => {
    it('should include uptime', () => {
      const stats = getStats();
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should calculate summary', () => {
      trackCommand('cmd', 100, true);
      trackCommand('cmd', 100, false);
      const stats = getStats();
      expect(stats.summary.totalCommands).toBe(2);
      expect(stats.summary.totalErrors).toBe(1);
      expect(stats.summary.successRate).toBe('50%');
    });

    it('should show 100% success rate when no failures', () => {
      trackCommand('cmd', 100, true);
      const stats = getStats();
      expect(stats.summary.successRate).toBe('100%');
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      trackCommand('cmd', 100, true);
      trackError('err', 'msg');
      reset();
      const stats = getStats();
      expect(Object.keys(stats.commands)).toHaveLength(0);
      expect(Object.keys(stats.errors)).toHaveLength(0);
    });
  });
});
