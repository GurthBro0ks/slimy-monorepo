import { parsePower } from '../../src/lib/numparse';

describe('parsePower', () => {
  it('should return null for null input', () => {
    const result = parsePower(null);
    expect(result.value).toBeNull();
    expect(result.corrected).toBe(false);
    expect(result.reason).toBe('null input');
  });

  it('should return null for undefined input', () => {
    const result = parsePower(undefined);
    expect(result.value).toBeNull();
    expect(result.reason).toBe('null input');
  });

  it('should parse plain integer strings', () => {
    expect(parsePower('42').value).toBe(42);
    expect(parsePower('0').value).toBe(0);
    expect(parsePower('999999').value).toBe(999999);
  });

  it('should parse comma-separated numbers', () => {
    expect(parsePower('1,000').value).toBe(1000);
    expect(parsePower('1,000,000').value).toBe(1000000);
    expect(parsePower('12,345,678').value).toBe(12345678);
  });

  it('should parse suffix K notation', () => {
    expect(parsePower('10K').value).toBe(10000);
    expect(parsePower('10k').value).toBe(10000);
    expect(parsePower('1.5K').value).toBe(1500);
  });

  it('should parse suffix M notation', () => {
    expect(parsePower('1M').value).toBe(1000000);
    expect(parsePower('10.5M').value).toBe(10500000);
    expect(parsePower('0.5m').value).toBe(500000);
  });

  it('should parse suffix B notation', () => {
    expect(parsePower('1B').value).toBe(1000000000);
    expect(parsePower('2.5B').value).toBe(2500000000);
  });

  it('should handle OCR character substitutions (O→0, l→1)', () => {
    expect(parsePower('1O').value).toBe(10);
    expect(parsePower('l5').value).toBe(15);
    expect(parsePower('lO').value).toBe(10);
  });

  it('should parse lone O as zero after normalization', () => {
    expect(parsePower('O').value).toBe(0);
  });

  it('should handle whitespace and unicode spaces', () => {
    expect(parsePower('  42  ').value).toBe(42);
    expect(parsePower('1\u00A0000').value).toBe(1000);
  });

  it('should return unparseable for non-numeric strings', () => {
    const result = parsePower('abc');
    expect(result.value).toBeNull();
    expect(result.reason).toBe('unparseable');
  });

  it('should parse decimal numbers', () => {
    expect(parsePower('42.5').value).toBe(42.5);
    expect(parsePower('0.001').value).toBe(0.001);
  });

  it('should handle fullwidth comma (，)', () => {
    expect(parsePower('1，000').value).toBe(1000);
  });

  it('should handle numbers with mixed separators', () => {
    expect(parsePower('1,000.5').value).toBe(1000.5);
  });
});
