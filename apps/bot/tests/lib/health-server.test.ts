import { getBotStats, recordBotError } from '../../src/lib/health-server';

describe('health-server — getBotStats', () => {
  it('should return default stats when globalThis.botStats is not set', () => {
    const saved = (globalThis as Record<string, unknown>).botStats;
    delete (globalThis as Record<string, unknown>).botStats;
    const stats = getBotStats();
    expect(stats.startTime).toBeTypeOf('number');
    expect(stats.errors.count).toBe(0);
    expect(stats.errors.lastError).toBeNull();
    expect(stats.errors.lastErrorTime).toBeNull();
    (globalThis as Record<string, unknown>).botStats = saved;
  });
});

describe('health-server — recordBotError', () => {
  it('should increment error count and record last error', () => {
    const saved = (globalThis as Record<string, unknown>).botStats;
    delete (globalThis as Record<string, unknown>).botStats;

    recordBotError(new Error('test error'));
    const stats = getBotStats();
    expect(stats.errors.count).toBe(1);
    expect(stats.errors.lastError).toContain('test error');
    expect(stats.errors.lastErrorTime).toBeTypeOf('number');

    (globalThis as Record<string, unknown>).botStats = saved;
  });

  it('should accumulate multiple errors', () => {
    const saved = (globalThis as Record<string, unknown>).botStats;
    delete (globalThis as Record<string, unknown>).botStats;

    recordBotError(new Error('first'));
    recordBotError(new Error('second'));
    const stats = getBotStats();
    expect(stats.errors.count).toBe(2);
    expect(stats.errors.lastError).toContain('second');

    (globalThis as Record<string, unknown>).botStats = saved;
  });
});
