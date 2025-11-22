import { calculateClubStats, calculatePercentageChange } from '../../src/utils/stats';

describe('calculateClubStats', () => {
  it('should calculate basic stats correctly', () => {
    const stats = calculateClubStats(100, 75, 500);

    expect(stats.totalMembers).toBe(100);
    expect(stats.activeMembers).toBe(75);
    expect(stats.totalMessages).toBe(500);
    expect(stats.averageMessagesPerMember).toBe(5);
  });

  it('should handle zero members', () => {
    const stats = calculateClubStats(0, 0, 0);

    expect(stats.totalMembers).toBe(0);
    expect(stats.activeMembers).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.averageMessagesPerMember).toBe(0);
  });

  it('should round average to 2 decimal places', () => {
    const stats = calculateClubStats(3, 2, 10);

    expect(stats.averageMessagesPerMember).toBe(3.33);
  });

  it('should throw on negative values', () => {
    expect(() => calculateClubStats(-1, 0, 0)).toThrow('non-negative');
    expect(() => calculateClubStats(0, -1, 0)).toThrow('non-negative');
    expect(() => calculateClubStats(0, 0, -1)).toThrow('non-negative');
  });

  it('should throw when active > total members', () => {
    expect(() => calculateClubStats(50, 100, 0)).toThrow('cannot exceed');
  });
});

describe('calculatePercentageChange', () => {
  it('should calculate positive change', () => {
    expect(calculatePercentageChange(100, 150)).toBe(50);
    expect(calculatePercentageChange(50, 100)).toBe(100);
  });

  it('should calculate negative change', () => {
    expect(calculatePercentageChange(100, 50)).toBe(-50);
    expect(calculatePercentageChange(200, 100)).toBe(-50);
  });

  it('should handle zero old value', () => {
    expect(calculatePercentageChange(0, 100)).toBe(100);
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });

  it('should handle no change', () => {
    expect(calculatePercentageChange(100, 100)).toBe(0);
  });

  it('should round to 2 decimal places', () => {
    expect(calculatePercentageChange(3, 10)).toBe(233.33);
  });
});
