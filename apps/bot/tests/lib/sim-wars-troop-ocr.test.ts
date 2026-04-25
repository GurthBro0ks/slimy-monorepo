import { describe, it, expect } from 'vitest';
import { normalizeTroopValue, parseLeadershipPair } from '../../src/lib/sim-wars-troop-ocr';

describe('normalizeTroopValue', () => {
  it('should return null for null input', () => {
    expect(normalizeTroopValue(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(normalizeTroopValue(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(normalizeTroopValue('')).toBeNull();
  });

  it('should return null for dash', () => {
    expect(normalizeTroopValue('-')).toBeNull();
  });

  it('should return null for "n/a"', () => {
    expect(normalizeTroopValue('n/a')).toBeNull();
  });

  it('should parse plain integers', () => {
    expect(normalizeTroopValue(12345)).toBe(12345);
    expect(normalizeTroopValue('12345')).toBe(12345);
    expect(normalizeTroopValue(0)).toBe(0);
  });

  it('should parse comma-separated numbers', () => {
    expect(normalizeTroopValue('1,000')).toBe(1000);
    expect(normalizeTroopValue('1,234,567')).toBe(1234567);
    expect(normalizeTroopValue('12,345,678')).toBe(12345678);
  });

  it('should parse K suffix', () => {
    expect(normalizeTroopValue('10K')).toBe(10000);
    expect(normalizeTroopValue('10k')).toBe(10000);
    expect(normalizeTroopValue('1.5K')).toBe(1500);
  });

  it('should parse M suffix', () => {
    expect(normalizeTroopValue('1M')).toBe(1000000);
    expect(normalizeTroopValue('12.0M')).toBe(12000000);
    expect(normalizeTroopValue('10.5M')).toBe(10500000);
    expect(normalizeTroopValue('0.5M')).toBe(500000);
  });

  it('should parse B suffix', () => {
    expect(normalizeTroopValue('1B')).toBe(1000000000);
    expect(normalizeTroopValue('2.5B')).toBe(2500000000);
  });

  it('should parse percentage values stripping % sign', () => {
    expect(normalizeTroopValue('20.8%')).toBe(20.8);
    expect(normalizeTroopValue('100%')).toBe(100);
    expect(normalizeTroopValue('0%')).toBe(0);
    expect(normalizeTroopValue('15.25%')).toBe(15.25);
  });

  it('should parse leadership slash format as current value', () => {
    expect(normalizeTroopValue('1979/1979')).toBe(1979);
    expect(normalizeTroopValue('1500/2000')).toBe(1500);
  });

  it('should handle numbers with spaces', () => {
    expect(normalizeTroopValue('  42  ')).toBe(42);
    expect(normalizeTroopValue('1 000')).toBe(1000);
  });

  it('should return null for unparseable strings', () => {
    expect(normalizeTroopValue('abc')).toBeNull();
    expect(normalizeTroopValue('hello world')).toBeNull();
  });

  it('should handle numeric input with decimals', () => {
    expect(normalizeTroopValue(42.5)).toBe(42);
    expect(normalizeTroopValue(0.001)).toBe(0);
  });
});

describe('parseLeadershipPair', () => {
  it('should parse "1979/1979" into current=1979 max=1979', () => {
    const result = parseLeadershipPair('1979/1979');
    expect(result.current).toBe(1979);
    expect(result.max).toBe(1979);
  });

  it('should parse "1500/2000" into current=1500 max=2000', () => {
    const result = parseLeadershipPair('1500/2000');
    expect(result.current).toBe(1500);
    expect(result.max).toBe(2000);
  });

  it('should handle comma-formatted leadership "1,979/1,979"', () => {
    const result = parseLeadershipPair('1,979/1,979');
    expect(result.current).toBe(1979);
    expect(result.max).toBe(1979);
  });

  it('should handle spaces around slash "1500 / 2000"', () => {
    const result = parseLeadershipPair('1500 / 2000');
    expect(result.current).toBe(1500);
    expect(result.max).toBe(2000);
  });

  it('should return nulls for null input', () => {
    const result = parseLeadershipPair(null);
    expect(result.current).toBeNull();
    expect(result.max).toBeNull();
  });

  it('should return nulls for undefined input', () => {
    const result = parseLeadershipPair(undefined);
    expect(result.current).toBeNull();
    expect(result.max).toBeNull();
  });

  it('should return current only for plain integer', () => {
    const result = parseLeadershipPair('1979');
    expect(result.current).toBe(1979);
    expect(result.max).toBeNull();
  });

  it('should return nulls for unparseable input', () => {
    const result = parseLeadershipPair('abc');
    expect(result.current).toBeNull();
    expect(result.max).toBeNull();
  });

  it('should handle zero values "0/2000"', () => {
    const result = parseLeadershipPair('0/2000');
    expect(result.current).toBe(0);
    expect(result.max).toBe(2000);
  });
});
