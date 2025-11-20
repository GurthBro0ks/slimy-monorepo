/**
 * Mock data for Club Dashboard (Labs)
 *
 * This file contains type definitions and mock data for the club dashboard demo.
 * In production, this data would come from the database via API calls.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ClubMember {
  id: string;
  name: string;
  simPower: number;
  totalPower: number;
  weeklyContribution: number;
  weeklyChange: number; // percentage change from previous week
  rank: number;
  isActive: boolean;
}

export interface ClubWeeklySnapshot {
  weekNumber: number;
  weekStart: string; // ISO date
  weekEnd: string; // ISO date
  totalPower: number;
  totalSimPower: number;
  activeMemberCount: number;
  totalMemberCount: number;
  averageMemberPower: number;
  topContributor: string;
}

export interface ClubSummary {
  clubId: string;
  clubName: string;
  currentWeek: ClubWeeklySnapshot;
  previousWeek: ClubWeeklySnapshot;
  members: ClubMember[];
  weeklyHistory: ClubWeeklySnapshot[];
}

export interface ClubDashboardStats {
  totalPower: number;
  totalPowerChange: number; // percentage
  simPower: number;
  simPowerChange: number; // percentage
  activeMembers: number;
  activeMembersChange: number; // percentage
  averagePower: number;
  averagePowerChange: number; // percentage
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_MEMBERS: ClubMember[] = [
  {
    id: 'member-1',
    name: 'SnailMaster3000',
    simPower: 15000000,
    totalPower: 45000000,
    weeklyContribution: 3500000,
    weeklyChange: 12.5,
    rank: 1,
    isActive: true,
  },
  {
    id: 'member-2',
    name: 'SlimyChampion',
    simPower: 12500000,
    totalPower: 38000000,
    weeklyContribution: 2800000,
    weeklyChange: 8.3,
    rank: 2,
    isActive: true,
  },
  {
    id: 'member-3',
    name: 'TurboSnail',
    simPower: 11000000,
    totalPower: 35000000,
    weeklyContribution: 2500000,
    weeklyChange: 15.2,
    rank: 3,
    isActive: true,
  },
  {
    id: 'member-4',
    name: 'SpeedySlime',
    simPower: 9800000,
    totalPower: 30000000,
    weeklyContribution: 2200000,
    weeklyChange: -3.1,
    rank: 4,
    isActive: true,
  },
  {
    id: 'member-5',
    name: 'MegaMollusk',
    simPower: 8500000,
    totalPower: 28000000,
    weeklyContribution: 1800000,
    weeklyChange: 5.7,
    rank: 5,
    isActive: true,
  },
  {
    id: 'member-6',
    name: 'GlowingGastropod',
    simPower: 7200000,
    totalPower: 24000000,
    weeklyContribution: 1500000,
    weeklyChange: 10.1,
    rank: 6,
    isActive: true,
  },
  {
    id: 'member-7',
    name: 'NeonNautilus',
    simPower: 6500000,
    totalPower: 22000000,
    weeklyContribution: 1200000,
    weeklyChange: 2.4,
    rank: 7,
    isActive: true,
  },
  {
    id: 'member-8',
    name: 'RadiantRacer',
    simPower: 5800000,
    totalPower: 20000000,
    weeklyContribution: 980000,
    weeklyChange: -1.5,
    rank: 8,
    isActive: false,
  },
  {
    id: 'member-9',
    name: 'CosmicCrawler',
    simPower: 4900000,
    totalPower: 18000000,
    weeklyContribution: 750000,
    weeklyChange: 7.8,
    rank: 9,
    isActive: true,
  },
  {
    id: 'member-10',
    name: 'InactiveSnail',
    simPower: 3200000,
    totalPower: 12000000,
    weeklyContribution: 0,
    weeklyChange: -100,
    rank: 10,
    isActive: false,
  },
];

const CURRENT_WEEK: ClubWeeklySnapshot = {
  weekNumber: 47,
  weekStart: '2025-11-17',
  weekEnd: '2025-11-23',
  totalPower: 272000000,
  totalSimPower: 84400000,
  activeMemberCount: 8,
  totalMemberCount: 10,
  averageMemberPower: 27200000,
  topContributor: 'SnailMaster3000',
};

const PREVIOUS_WEEK: ClubWeeklySnapshot = {
  weekNumber: 46,
  weekStart: '2025-11-10',
  weekEnd: '2025-11-16',
  totalPower: 255000000,
  totalSimPower: 78200000,
  activeMemberCount: 9,
  totalMemberCount: 10,
  averageMemberPower: 25500000,
  topContributor: 'SnailMaster3000',
};

const WEEKLY_HISTORY: ClubWeeklySnapshot[] = [
  CURRENT_WEEK,
  PREVIOUS_WEEK,
  {
    weekNumber: 45,
    weekStart: '2025-11-03',
    weekEnd: '2025-11-09',
    totalPower: 242000000,
    totalSimPower: 75000000,
    activeMemberCount: 9,
    totalMemberCount: 10,
    averageMemberPower: 24200000,
    topContributor: 'SlimyChampion',
  },
  {
    weekNumber: 44,
    weekStart: '2025-10-27',
    weekEnd: '2025-11-02',
    totalPower: 235000000,
    totalSimPower: 72000000,
    activeMemberCount: 8,
    totalMemberCount: 10,
    averageMemberPower: 23500000,
    topContributor: 'SnailMaster3000',
  },
];

export const MOCK_CLUB_SUMMARY: ClubSummary = {
  clubId: 'club-demo-001',
  clubName: 'Elite Snail Squad',
  currentWeek: CURRENT_WEEK,
  previousWeek: PREVIOUS_WEEK,
  members: MOCK_MEMBERS,
  weeklyHistory: WEEKLY_HISTORY,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate dashboard statistics from club summary
 */
export function calculateDashboardStats(summary: ClubSummary): ClubDashboardStats {
  const totalPowerChange = ((summary.currentWeek.totalPower - summary.previousWeek.totalPower) / summary.previousWeek.totalPower) * 100;
  const simPowerChange = ((summary.currentWeek.totalSimPower - summary.previousWeek.totalSimPower) / summary.previousWeek.totalSimPower) * 100;
  const activeMembersChange = summary.currentWeek.activeMemberCount - summary.previousWeek.activeMemberCount;
  const averagePowerChange = ((summary.currentWeek.averageMemberPower - summary.previousWeek.averageMemberPower) / summary.previousWeek.averageMemberPower) * 100;

  return {
    totalPower: summary.currentWeek.totalPower,
    totalPowerChange,
    simPower: summary.currentWeek.totalSimPower,
    simPowerChange,
    activeMembers: summary.currentWeek.activeMemberCount,
    activeMembersChange,
    averagePower: summary.currentWeek.averageMemberPower,
    averagePowerChange,
  };
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatPower(power: number): string {
  if (power >= 1_000_000_000) {
    return `${(power / 1_000_000_000).toFixed(2)}B`;
  }
  if (power >= 1_000_000) {
    return `${(power / 1_000_000).toFixed(2)}M`;
  }
  if (power >= 1_000) {
    return `${(power / 1_000).toFixed(2)}K`;
  }
  return power.toString();
}

/**
 * Format percentage change with + or - prefix
 */
export function formatPercentChange(change: number): string {
  const prefix = change >= 0 ? '+' : '';
  return `${prefix}${change.toFixed(1)}%`;
}

/**
 * Get color class based on change value
 */
export function getChangeColorClass(change: number): string {
  if (change > 0) return 'text-emerald-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-400';
}
