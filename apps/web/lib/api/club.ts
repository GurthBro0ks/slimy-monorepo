/**
 * Club Analytics API Client
 *
 * Provides access to club metrics endpoints from the admin-api.
 * Supports both live mode (via admin-api) and sandbox mode (mock data).
 */

import { adminApiClient } from './admin-client';
import type { ApiResponse } from './admin-client';

// ============================================================================
// Types
// ============================================================================

export interface ClubMemberMetrics {
  memberKey: string;
  name: string;
  simPower: number | null;
  totalPower: number | null;
  changePercent: number | null;
  lastSeenAt?: string | null;
}

export interface ClubLatestResponse {
  ok: boolean;
  guildId: string;
  members: ClubMemberMetrics[];
}

export interface ClubRescanResponse {
  ok: boolean;
  guildId: string;
  message: string;
  scannedCount?: number;
}

// ============================================================================
// Mock Data (for sandbox mode)
// ============================================================================

const MOCK_CLUB_MEMBERS: ClubMemberMetrics[] = [
  {
    memberKey: 'member-001',
    name: 'SlimyKing',
    simPower: 45000,
    totalPower: 128000,
    changePercent: 12.5,
    lastSeenAt: new Date().toISOString(),
  },
  {
    memberKey: 'member-002',
    name: 'SnailMaster',
    simPower: 38000,
    totalPower: 115000,
    changePercent: 8.3,
    lastSeenAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    memberKey: 'member-003',
    name: 'MucusWarrior',
    simPower: 42000,
    totalPower: 121000,
    changePercent: -2.1,
    lastSeenAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    memberKey: 'member-004',
    name: 'ShellDefender',
    simPower: 35000,
    totalPower: 98000,
    changePercent: 15.7,
    lastSeenAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    memberKey: 'member-005',
    name: 'GooCommander',
    simPower: 40000,
    totalPower: 112000,
    changePercent: 5.2,
    lastSeenAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    memberKey: 'member-006',
    name: 'TrailBlazer',
    simPower: 30000,
    totalPower: 89000,
    changePercent: -5.4,
    lastSeenAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    memberKey: 'member-007',
    name: 'SlimeCaptain',
    simPower: 37000,
    totalPower: 105000,
    changePercent: 9.8,
    lastSeenAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    memberKey: 'member-008',
    name: 'MolluskGuard',
    simPower: 33000,
    totalPower: 94000,
    changePercent: 3.1,
    lastSeenAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

function getMockClubData(guildId?: string): ClubLatestResponse {
  return {
    ok: true,
    guildId: guildId || 'sandbox-guild-123',
    members: MOCK_CLUB_MEMBERS,
  };
}

// ============================================================================
// Sandbox Detection
// ============================================================================

/**
 * Check if we're in sandbox mode (no admin API configured)
 */
function isSandboxMode(): boolean {
  return !adminApiClient.isConfigured();
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch latest club metrics for a guild
 *
 * @param guildId - Optional guild ID. If not provided, uses current user's guild.
 * @returns Club metrics response with member data
 *
 * @example
 * ```ts
 * const result = await fetchClubLatest('guild-123');
 * if (result.ok) {
 *   console.log(`Found ${result.members.length} members`);
 * }
 * ```
 */
export async function fetchClubLatest(guildId?: string): Promise<ClubLatestResponse> {
  // Sandbox mode: return mock data
  if (isSandboxMode()) {
    console.log('[ClubAPI] Sandbox mode - returning mock data');
    return getMockClubData(guildId);
  }

  // Live mode: call admin-api via proxy route
  try {
    // Use the Next.js API proxy route
    const path = guildId
      ? `/api/club/latest?guildId=${encodeURIComponent(guildId)}`
      : '/api/club/latest';

    const response = await fetch(path);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch club metrics: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[ClubAPI] Error fetching club latest:', error);

    // On error, return an error response
    return {
      ok: false,
      guildId: guildId || 'unknown',
      members: [],
    };
  }
}

/**
 * Trigger a rescan of club metrics
 *
 * @param guildId - Guild ID to rescan
 * @returns Rescan response with status
 *
 * @example
 * ```ts
 * const result = await triggerClubRescan('guild-123');
 * if (result.ok) {
 *   console.log(result.message);
 * }
 * ```
 */
export async function triggerClubRescan(guildId: string): Promise<ClubRescanResponse> {
  // Sandbox mode: return mock response
  if (isSandboxMode()) {
    console.log('[ClubAPI] Sandbox mode - simulating rescan');
    return {
      ok: true,
      guildId,
      message: 'Rescan simulated in sandbox mode',
      scannedCount: MOCK_CLUB_MEMBERS.length,
    };
  }

  // Live mode: call admin-api via proxy route
  try {
    const response = await fetch(`/api/club/rescan?guildId=${encodeURIComponent(guildId)}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to trigger rescan: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[ClubAPI] Error triggering rescan:', error);

    return {
      ok: false,
      guildId,
      message: error instanceof Error ? error.message : 'Failed to trigger rescan',
    };
  }
}

/**
 * Get sandbox mode status
 */
export function getSandboxStatus(): { isSandbox: boolean; reason?: string } {
  const isSandbox = isSandboxMode();
  return {
    isSandbox,
    reason: isSandbox ? 'Admin API not configured' : undefined,
  };
}
