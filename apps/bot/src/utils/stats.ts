/**
 * Basic statistical utilities for club analytics.
 * TODO: Replace with actual club analytics logic when migrated.
 */

export interface ClubStats {
  totalMembers: number;
  activeMembers: number;
  totalMessages: number;
  averageMessagesPerMember: number;
}

/**
 * Calculate basic club statistics from raw data.
 */
export function calculateClubStats(
  members: number,
  activeMembers: number,
  totalMessages: number
): ClubStats {
  if (members < 0 || activeMembers < 0 || totalMessages < 0) {
    throw new Error('Stats values must be non-negative');
  }

  if (activeMembers > members) {
    throw new Error('Active members cannot exceed total members');
  }

  const averageMessagesPerMember = members > 0
    ? totalMessages / members
    : 0;

  return {
    totalMembers: members,
    activeMembers,
    totalMessages,
    averageMessagesPerMember: Math.round(averageMessagesPerMember * 100) / 100,
  };
}

/**
 * Calculate percentage change between two values.
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) {
    return newValue > 0 ? 100 : 0;
  }

  return Math.round(((newValue - oldValue) / oldValue) * 10000) / 100;
}
