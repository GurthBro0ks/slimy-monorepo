import { parseNumber, isValidSnowflake, extractMentions } from '../../src/utils/parsing';

describe('parseNumber', () => {
  it('should parse plain numbers', () => {
    expect(parseNumber('42')).toBe(42);
    expect(parseNumber('1500')).toBe(1500);
    expect(parseNumber('0')).toBe(0);
  });

  it('should parse numbers with commas', () => {
    expect(parseNumber('1,500')).toBe(1500);
    expect(parseNumber('1,000,000')).toBe(1000000);
  });

  it('should parse numbers with k suffix', () => {
    expect(parseNumber('1.5k')).toBe(1500);
    expect(parseNumber('2k')).toBe(2000);
    expect(parseNumber('10K')).toBe(10000);
  });

  it('should parse numbers with m suffix', () => {
    expect(parseNumber('1.5m')).toBe(1500000);
    expect(parseNumber('2M')).toBe(2000000);
  });

  it('should handle invalid input', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('k')).toBeNull();
  });

  it('should handle whitespace', () => {
    expect(parseNumber('  42  ')).toBe(42);
    expect(parseNumber(' 1.5k ')).toBe(1500);
  });
});

describe('isValidSnowflake', () => {
  it('should accept valid snowflakes', () => {
    expect(isValidSnowflake('123456789012345678')).toBe(true);
    expect(isValidSnowflake('1234567890123456789')).toBe(true);
  });

  it('should reject invalid snowflakes', () => {
    expect(isValidSnowflake('')).toBe(false);
    expect(isValidSnowflake('123')).toBe(false);
    expect(isValidSnowflake('abc123')).toBe(false);
    expect(isValidSnowflake('12345678901234567890')).toBe(false); // too long
  });

  it('should handle edge cases', () => {
    expect(isValidSnowflake('12345678901234567')).toBe(true); // 17 digits
    expect(isValidSnowflake('1234567890123456')).toBe(false); // 16 digits
  });
});

describe('extractMentions', () => {
  it('should extract user mentions', () => {
    const mentions = extractMentions('Hey <@123456789012345678> and <@987654321098765432>!');
    expect(mentions).toEqual(['123456789012345678', '987654321098765432']);
  });

  it('should extract mentions with ! (nickname format)', () => {
    const mentions = extractMentions('Hey <@!123456789012345678>!');
    expect(mentions).toEqual(['123456789012345678']);
  });

  it('should return empty array for no mentions', () => {
    expect(extractMentions('Hello world')).toEqual([]);
    expect(extractMentions('')).toEqual([]);
  });

  it('should handle mixed content', () => {
    const mentions = extractMentions('Check out <@123456789012345678> and visit https://example.com');
    expect(mentions).toEqual(['123456789012345678']);
  });
});
