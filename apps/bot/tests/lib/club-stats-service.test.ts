import { formatNumber, formatDelta, buildCsv, DEFAULT_TOP, MIN_TOP, MAX_TOP } from '../../src/lib/club-stats-service';
import type { LatestMemberRow } from '../../src/lib/club-store';

describe('club-stats-service — formatNumber', () => {
  it('should format integers', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('should return dash for null', () => {
    expect(formatNumber(null)).toBe('—');
  });

  it('should return dash for undefined', () => {
    expect(formatNumber(undefined)).toBe('—');
  });

  it('should format compact notation', () => {
    const result = formatNumber(1500000, { notation: 'compact' });
    expect(result).toMatch(/M/);
  });

  it('should format with fraction digits', () => {
    expect(formatNumber(1234.567, { maximumFractionDigits: 2 })).toBe('1,234.57');
  });
});

describe('club-stats-service — formatDelta', () => {
  it('should show positive delta with plus', () => {
    expect(formatDelta(100, 50)).toBe('+50');
  });

  it('should show negative delta', () => {
    expect(formatDelta(50, 100)).toBe('-50');
  });

  it('should return dash for null values', () => {
    expect(formatDelta(null, 50)).toBe('—');
    expect(formatDelta(50, null)).toBe('—');
  });

  it('should format large numbers with commas', () => {
    const result = formatDelta(1000000, 500000);
    expect(result).toContain('500,000');
  });
});

describe('club-stats-service — buildCsv', () => {
  it('should produce header and data rows', () => {
    const rows: LatestMemberRow[] = [
      {
        member_id: 1,
        name_canonical: 'alice',
        name_display: 'Alice',
        sim_power: 100,
        total_power: 200,
        sim_prev: null,
        total_prev: null,
        sim_pct_change: null,
        total_pct_change: 5.5,
        latest_at: new Date(),
      },
    ];
    const csv = buildCsv(rows);
    expect(csv).toContain('Name,SimPower,TotalPower,SimWoW%,TotalWoW%');
    expect(csv).toContain('"Alice"');
    expect(csv).toContain('100');
    expect(csv).toContain('200');
    expect(csv).toContain('5.5');
  });

  it('should escape quotes in names', () => {
    const rows: LatestMemberRow[] = [
      {
        member_id: 1,
        name_canonical: 'alice',
        name_display: 'Alice "The Great"',
        sim_power: null,
        total_power: null,
        sim_prev: null,
        total_prev: null,
        sim_pct_change: null,
        total_pct_change: null,
        latest_at: new Date(),
      },
    ];
    const csv = buildCsv(rows);
    expect(csv).toContain('Alice ""The Great""');
  });
});

describe('club-stats-service — constants', () => {
  it('DEFAULT_TOP should be 10', () => {
    expect(DEFAULT_TOP).toBe(10);
  });

  it('MIN_TOP should be 3', () => {
    expect(MIN_TOP).toBe(3);
  });

  it('MAX_TOP should be 25', () => {
    expect(MAX_TOP).toBe(25);
  });
});
