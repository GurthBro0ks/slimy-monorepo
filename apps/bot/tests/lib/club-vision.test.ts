import { describe, it, expect } from 'vitest';

const clampConfidence = (value: unknown): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return Math.round(num * 1000) / 1000;
};

const shouldRetry = (err: unknown): boolean => {
  if (!err) return false;
  const e = err as Record<string, unknown>;
  const status = e.status || e.statusCode || e.httpStatus || e.code;
  if (status === 429 || status === 'rate_limit_exceeded') return true;
  if (status === 500 || status === 502 || status === 503 || status === 504) return true;
  const message = String((err as Error).message || '').toLowerCase();
  if (message.includes('rate limit') || message.includes('exceeded quota')) return true;
  return false;
};

function reconcileDigits(
  valueA: string | number,
  valueB: string | number,
): { value: number | null; hasDisagreement: boolean; disagreements: Array<{ position: number; modelA: string; modelB: string }> } {
  const strA = String(valueA || '').padStart(12, '0');
  const strB = String(valueB || '').padStart(12, '0');
  let reconciled = '';
  let hasDisagreement = false;
  const disagreements: Array<{ position: number; modelA: string; modelB: string }> = [];

  for (let i = 0; i < Math.max(strA.length, strB.length); i++) {
    const digitA = strA[i] || '0';
    const digitB = strB[i] || '0';

    if (digitA === digitB) {
      reconciled += digitA;
    } else {
      hasDisagreement = true;
      disagreements.push({ position: i, modelA: digitA, modelB: digitB });
      reconciled += digitB;
    }
  }

  const finalValue = Number(reconciled);

  return {
    value: Number.isFinite(finalValue) ? finalValue : null,
    hasDisagreement,
    disagreements,
  };
}

describe('club-vision — clampConfidence', () => {
  it('should clamp between 0 and 1', () => {
    expect(clampConfidence(0.5)).toBe(0.5);
    expect(clampConfidence(-1)).toBe(0);
    expect(clampConfidence(2)).toBe(1);
    expect(clampConfidence(NaN)).toBe(0);
  });

  it('should round to 3 decimal places', () => {
    expect(clampConfidence(0.12345)).toBe(0.123);
  });
});

describe('club-vision — shouldRetry', () => {
  it('should retry on 429', () => {
    const err = new Error('rate limited');
    (err as Record<string, unknown>).status = 429;
    expect(shouldRetry(err)).toBe(true);
  });

  it('should retry on 500', () => {
    expect(shouldRetry(Object.assign(new Error('server error'), { status: 500 }))).toBe(true);
  });

  it('should retry on 502/503/504', () => {
    expect(shouldRetry(Object.assign(new Error(), { status: 502 }))).toBe(true);
    expect(shouldRetry(Object.assign(new Error(), { status: 503 }))).toBe(true);
    expect(shouldRetry(Object.assign(new Error(), { status: 504 }))).toBe(true);
  });

  it('should retry on rate limit message', () => {
    expect(shouldRetry(new Error('Rate limit exceeded'))).toBe(true);
    expect(shouldRetry(new Error('exceeded quota for this month'))).toBe(true);
  });

  it('should not retry on 400', () => {
    expect(shouldRetry(Object.assign(new Error('bad request'), { status: 400 }))).toBe(false);
  });

  it('should not retry on null', () => {
    expect(shouldRetry(null)).toBe(false);
  });
});

describe('club-vision — reconcileDigits', () => {
  it('should agree when both values are identical', () => {
    const result = reconcileDigits(12345, 12345);
    expect(result.value).toBe(12345);
    expect(result.hasDisagreement).toBe(false);
    expect(result.disagreements).toHaveLength(0);
  });

  it('should detect disagreement', () => {
    const result = reconcileDigits(12345, 12346);
    expect(result.hasDisagreement).toBe(true);
    expect(result.disagreements.length).toBeGreaterThan(0);
  });

  it('should default to model B on disagreement', () => {
    const result = reconcileDigits(100, 200);
    expect(result.value).toBe(200);
  });

  it('should handle zero values', () => {
    const result = reconcileDigits(0, 0);
    expect(result.value).toBe(0);
    expect(result.hasDisagreement).toBe(false);
  });
});
