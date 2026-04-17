import { describe, it, expect } from 'vitest';

const stripCodeFence = (text: string): string => {
  let cleaned = String(text || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
  }
  return cleaned.trim();
};

const normalizeStatValue = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  const cleaned = String(value).replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.round(num) : null;
};

const _clampConfidence = (value: unknown): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return Math.round(num * 1000) / 1000;
};

describe('snail-vision — normalizeStatValue', () => {
  it('should return null for null', () => {
    expect(normalizeStatValue(null)).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(normalizeStatValue(undefined)).toBeNull();
  });

  it('should round numbers', () => {
    expect(normalizeStatValue(123.7)).toBe(124);
  });

  it('should return null for NaN', () => {
    expect(normalizeStatValue(NaN)).toBeNull();
    expect(normalizeStatValue(Infinity)).toBeNull();
  });

  it('should parse string numbers', () => {
    expect(normalizeStatValue('456')).toBe(456);
  });

  it('should strip non-numeric chars from strings', () => {
    expect(normalizeStatValue('1,234,567')).toBe(1234567);
  });

  it('should return null for non-numeric strings', () => {
    expect(normalizeStatValue('abc')).toBeNull();
  });
});

describe('snail-vision — stripCodeFence', () => {
  it('should strip markdown code fences', () => {
    expect(stripCodeFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('should strip fences without language tag', () => {
    expect(stripCodeFence('```\nhello\n```')).toBe('hello');
  });

  it('should pass through non-fenced text', () => {
    expect(stripCodeFence('plain text')).toBe('plain text');
  });

  it('should handle empty string', () => {
    expect(stripCodeFence('')).toBe('');
  });
});

describe('snail-vision — _clampConfidence', () => {
  it('should clamp values between 0 and 1', () => {
    expect(_clampConfidence(0.5)).toBe(0.5);
    expect(_clampConfidence(-0.1)).toBe(0);
    expect(_clampConfidence(1.5)).toBe(1);
    expect(_clampConfidence(NaN)).toBe(0);
  });

  it('should round to 3 decimal places', () => {
    expect(_clampConfidence(0.12345)).toBe(0.123);
  });
});

describe('snail-vision — formatSnailAnalysis', () => {
  it('should format analysis with stats', async () => {
    const { formatSnailAnalysis } = await import('../../src/lib/snail-vision');
    const analysis = {
      stats: { hp: 1000, atk: 500, def: 300, rush: 200, fame: 100, tech: 50, art: 75, civ: 60, fth: 40 },
      confidence: { hp: 0.9, atk: 0.9, def: 0.9, rush: 0.9, fame: 0.9, tech: 0.9, art: 0.9, civ: 0.9, fth: 0.9 },
    };
    const result = formatSnailAnalysis(analysis);
    expect(result).toContain('Super Snail Stats');
    expect(result).toContain('1,000');
    expect(result).toContain('500');
  });

  it('should show missing stats', async () => {
    const { formatSnailAnalysis } = await import('../../src/lib/snail-vision');
    const analysis = {
      stats: { hp: 100, atk: null, def: null, rush: null, fame: null, tech: null, art: null, civ: null, fth: null },
      confidence: { hp: 0.5 },
    };
    const result = formatSnailAnalysis(analysis);
    expect(result).toContain('Missing');
  });

  it('should show notes', async () => {
    const { formatSnailAnalysis } = await import('../../src/lib/snail-vision');
    const analysis = {
      stats: {},
      confidence: {},
      notes: 'blurry screenshot',
    };
    const result = formatSnailAnalysis(analysis);
    expect(result).toContain('blurry screenshot');
  });
});
