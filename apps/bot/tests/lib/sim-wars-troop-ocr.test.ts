import { describe, it, expect } from 'vitest';
import { normalizeTroopValue, normalizeTroopInteger, parseLeadershipPair } from '../../src/lib/sim-wars-troop-ocr';

// player_name is manual (modal input), not OCR — only these 13 fields are OCR-extracted
const OCR_STAT_FIELD_KEYS = [
  'troop_power', 'troop_hp', 'troop_attack', 'troop_defense', 'troop_rush',
  'troop_leadership_current', 'troop_leadership_max',
  'troop_crit_dmg_reduc_pct',
  'troop_fire_dmg', 'troop_water_dmg', 'troop_earth_dmg', 'troop_wind_dmg', 'troop_poison_dmg',
] as const;

describe('OCR field count', () => {
  it('should have exactly 13 OCR-extracted stat fields (player_name is manual)', () => {
    expect(OCR_STAT_FIELD_KEYS).toHaveLength(13);
  });

  it('should count extracted fields correctly when all 13 are present', () => {
    const stats = Object.fromEntries(OCR_STAT_FIELD_KEYS.map(k => [k, 1]));
    const ocrExtracted = OCR_STAT_FIELD_KEYS.filter(k => (stats as Record<string, unknown>)[k] !== null).length;
    expect(ocrExtracted).toBe(13);
    expect(`${ocrExtracted}/${OCR_STAT_FIELD_KEYS.length}`).toBe('13/13');
  });

  it('should count extracted fields correctly when some are null', () => {
    const stats: Record<string, unknown> = {
      troop_power: 100, troop_hp: 200, troop_attack: null, troop_defense: null,
      troop_rush: null, troop_leadership_current: null, troop_leadership_max: null,
      troop_crit_dmg_reduc_pct: null, troop_fire_dmg: null, troop_water_dmg: null,
      troop_earth_dmg: null, troop_wind_dmg: null, troop_poison_dmg: null,
    };
    const ocrExtracted = OCR_STAT_FIELD_KEYS.filter(k => stats[k] !== null).length;
    expect(ocrExtracted).toBe(2);
    expect(`${ocrExtracted}/${OCR_STAT_FIELD_KEYS.length}`).toBe('2/13');
  });
});

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

  it('should parse percentage values preserving decimal precision', () => {
    expect(normalizeTroopValue('20.8%')).toBe(20.8);
    expect(normalizeTroopValue('100%')).toBe(100);
    expect(normalizeTroopValue('0%')).toBe(0);
    expect(normalizeTroopValue('15.25%')).toBe(15.25);
  });

  it('should preserve numeric percent from model as decimal', () => {
    expect(normalizeTroopValue(20.8)).toBe(20.8);
    expect(normalizeTroopValue(15)).toBe(15);
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

  it('should preserve decimal numbers from numeric input', () => {
    expect(normalizeTroopValue(42.5)).toBe(42.5);
    expect(normalizeTroopValue(0.001)).toBe(0.001);
  });

  it('should floor integer strings', () => {
    expect(normalizeTroopValue('1979')).toBe(1979);
  });
});

describe('normalizeTroopInteger', () => {
  it('should floor numeric input with decimals', () => {
    expect(normalizeTroopInteger(42.5)).toBe(42);
    expect(normalizeTroopInteger(0.9)).toBe(0);
  });

  it('should preserve exact integers', () => {
    expect(normalizeTroopInteger(1979)).toBe(1979);
    expect(normalizeTroopInteger(0)).toBe(0);
  });

  it('should return null for null input', () => {
    expect(normalizeTroopInteger(null)).toBeNull();
  });

  it('should parse string integers', () => {
    expect(normalizeTroopInteger('1,979')).toBe(1979);
  });

  it('should floor M suffix values', () => {
    expect(normalizeTroopInteger('12.0M')).toBe(12000000);
  });

  it('should floor percentage values to integer', () => {
    expect(normalizeTroopInteger('20.8%')).toBe(20);
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
