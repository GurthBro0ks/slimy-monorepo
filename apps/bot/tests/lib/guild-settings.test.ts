import { extractSheetId, normalizeSheetInput } from '../../src/lib/guild-settings';

describe('extractSheetId', () => {
  it('should extract sheet ID from full Google Sheets URL', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1abcXYZ1234567890def/duplicate';
    const result = extractSheetId(url);
    expect(result).toBe('1abcXYZ1234567890def');
  });

  it('should extract sheet ID from docs.google.com prefix', () => {
    const input = 'docs.google.com/spreadsheets/d/1abcXYZ1234567890def';
    const result = extractSheetId(input);
    expect(result).toBe('1abcXYZ1234567890def');
  });

  it('should accept a raw sheet ID (20+ alphanumeric chars)', () => {
    const id = '1abcXYZ1234567890defG';
    const result = extractSheetId(id);
    expect(result).toBe('1abcXYZ1234567890defG');
  });

  it('should return null for empty input', () => {
    expect(extractSheetId('')).toBeNull();
    expect(extractSheetId('  ')).toBeNull();
  });

  it('should return null for invalid input', () => {
    expect(extractSheetId('not-a-url')).toBeNull();
    expect(extractSheetId('short')).toBeNull();
  });

  it('should handle URLs with query parameters', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1abcXYZ1234567890def/edit?usp=sharing';
    const result = extractSheetId(url);
    expect(result).toBe('1abcXYZ1234567890def');
  });
});

describe('normalizeSheetInput', () => {
  it('should normalize a full URL', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1abcXYZ1234567890def/edit';
    const result = normalizeSheetInput(url);
    expect(result.sheetId).toBe('1abcXYZ1234567890def');
    expect(result.url).toBe(url);
  });

  it('should normalize a raw sheet ID into a URL', () => {
    const id = '1abcXYZ1234567890defG';
    const result = normalizeSheetInput(id);
    expect(result.sheetId).toBe('1abcXYZ1234567890defG');
    expect(result.url).toBe('https://docs.google.com/spreadsheets/d/1abcXYZ1234567890defG');
  });

  it('should return nulls for empty input', () => {
    const result = normalizeSheetInput('');
    expect(result.sheetId).toBeNull();
    expect(result.url).toBeNull();
  });

  it('should return nulls for whitespace-only input', () => {
    const result = normalizeSheetInput('   ');
    expect(result.sheetId).toBeNull();
    expect(result.url).toBeNull();
  });

  it('should handle a non-sheets HTTPS URL', () => {
    const result = normalizeSheetInput('https://example.com');
    expect(result.url).toBe('https://example.com');
    expect(result.sheetId).toBeNull();
  });
});
