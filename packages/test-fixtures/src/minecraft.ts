/**
 * Minecraft Stats Test Fixtures
 *
 * Factory functions and canned constants for Minecraft-related stats testing.
 * Includes Stat model and ScreenshotAnalysis model fixtures.
 */

// ============================================================================
// STAT MODEL
// ============================================================================

export interface Stat {
  id: string;
  userId: string | null;
  guildId: string | null;
  type: string;
  value: any; // JSON value
  timestamp: Date;
}

/**
 * Creates a Stat with sensible defaults.
 * All fields can be overridden via the `overrides` parameter.
 *
 * @example
 * const stat = makeStat({ type: 'kills', value: 100 });
 */
export function makeStat(overrides?: Partial<Stat>): Stat {
  const defaults: Stat = {
    id: 'stat-1',
    userId: 'user-1',
    guildId: 'guild-1',
    type: 'message_count',
    value: 42,
    timestamp: new Date('2025-01-15T10:00:00Z'),
  };

  return { ...defaults, ...overrides };
}

/**
 * A high-score stat for kills.
 */
export const DEMO_STAT_HIGH_KILLS: Stat = {
  id: 'stat-kills-high',
  userId: 'user-premium',
  guildId: 'guild-large',
  type: 'minecraft_kills',
  value: 9999,
  timestamp: new Date('2025-01-18T15:30:00Z'),
};

/**
 * A stat for playtime in hours.
 */
export const DEMO_STAT_PLAYTIME: Stat = {
  id: 'stat-playtime',
  userId: 'user-1',
  guildId: 'guild-1',
  type: 'minecraft_playtime_hours',
  value: 256.5,
  timestamp: new Date('2025-01-15T12:00:00Z'),
};

/**
 * A stat for achievements unlocked.
 */
export const DEMO_STAT_ACHIEVEMENTS: Stat = {
  id: 'stat-achievements',
  userId: 'user-premium',
  guildId: null,
  type: 'minecraft_achievements',
  value: {
    total: 95,
    recent: ['nether_explorer', 'diamond_miner', 'ender_dragon_slayer'],
  },
  timestamp: new Date('2025-01-19T08:00:00Z'),
};

// ============================================================================
// SCREENSHOT ANALYSIS MODEL
// ============================================================================

export type ScreenshotType =
  | 'game-stats'
  | 'leaderboard'
  | 'profile'
  | 'achievement'
  | 'inventory'
  | 'clan-guild'
  | 'performance'
  | 'social'
  | 'custom';

export interface ScreenshotAnalysis {
  id: string;
  userId: string;
  screenshotType: ScreenshotType;
  imageUrl: string;
  title: string;
  description: string;
  summary: string;
  confidence: number; // 0-1
  processingTime: number; // milliseconds
  modelUsed: string;
  rawResponse: any | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a ScreenshotAnalysis with sensible defaults.
 * All fields can be overridden via the `overrides` parameter.
 *
 * @example
 * const analysis = makeScreenshotAnalysis({ screenshotType: 'leaderboard' });
 */
export function makeScreenshotAnalysis(
  overrides?: Partial<ScreenshotAnalysis>
): ScreenshotAnalysis {
  const now = new Date('2025-01-15T10:00:00Z');
  const defaults: ScreenshotAnalysis = {
    id: 'screenshot-analysis-1',
    userId: 'user-1',
    screenshotType: 'game-stats',
    imageUrl: 'https://example.com/screenshot.png',
    title: 'Game Stats Analysis',
    description: 'Analysis of player game statistics',
    summary: 'Player shows good progression with balanced stats across categories.',
    confidence: 0.85,
    processingTime: 1200,
    modelUsed: 'claude-sonnet-4',
    rawResponse: null,
    createdAt: now,
    updatedAt: now,
  };

  return { ...defaults, ...overrides };
}

/**
 * High-confidence analysis of a leaderboard screenshot.
 */
export const DEMO_SCREENSHOT_LEADERBOARD: ScreenshotAnalysis = {
  id: 'screenshot-leaderboard-1',
  userId: 'user-premium',
  screenshotType: 'leaderboard',
  imageUrl: 'https://example.com/leaderboard-top10.png',
  title: 'Top 10 Leaderboard Analysis',
  description: 'Player ranked #3 in global leaderboard',
  summary:
    'Excellent performance! Player maintains top 3 position with 15,420 points. Strong competitive standing.',
  confidence: 0.95,
  processingTime: 850,
  modelUsed: 'claude-sonnet-4',
  rawResponse: {
    rank: 3,
    score: 15420,
    totalPlayers: 50000,
    percentile: 99.994,
  },
  createdAt: new Date('2025-01-18T14:00:00Z'),
  updatedAt: new Date('2025-01-18T14:00:00Z'),
};

/**
 * Achievement unlock screenshot analysis.
 */
export const DEMO_SCREENSHOT_ACHIEVEMENT: ScreenshotAnalysis = {
  id: 'screenshot-achievement-1',
  userId: 'user-1',
  screenshotType: 'achievement',
  imageUrl: 'https://example.com/achievement-diamond.png',
  title: 'Achievement Unlocked: Diamond Collector',
  description: 'Player unlocked rare diamond achievement',
  summary:
    'Congratulations! Unlocked "Diamond Collector" achievement for mining 1000 diamonds. Rare achievement (only 5% of players).',
  confidence: 0.92,
  processingTime: 980,
  modelUsed: 'claude-sonnet-4',
  rawResponse: {
    achievementId: 'diamond_collector',
    rarity: 'rare',
    percentUnlocked: 5.2,
    rewardPoints: 500,
  },
  createdAt: new Date('2025-01-17T09:30:00Z'),
  updatedAt: new Date('2025-01-17T09:30:00Z'),
};

/**
 * Low-confidence analysis (unclear screenshot).
 */
export const DEMO_SCREENSHOT_LOW_CONFIDENCE: ScreenshotAnalysis = {
  id: 'screenshot-unclear-1',
  userId: 'user-new',
  screenshotType: 'custom',
  imageUrl: 'https://example.com/blurry-screenshot.png',
  title: 'Unclear Screenshot Analysis',
  description: 'Screenshot quality too low for accurate analysis',
  summary:
    'Unable to extract detailed information due to image quality. Recommend uploading a clearer screenshot.',
  confidence: 0.35,
  processingTime: 1500,
  modelUsed: 'claude-sonnet-4',
  rawResponse: null,
  createdAt: new Date('2025-01-19T11:00:00Z'),
  updatedAt: new Date('2025-01-19T11:00:00Z'),
};

/**
 * Profile stats screenshot with detailed metrics.
 */
export const DEMO_SCREENSHOT_PROFILE: ScreenshotAnalysis = {
  id: 'screenshot-profile-1',
  userId: 'user-premium',
  screenshotType: 'profile',
  imageUrl: 'https://example.com/profile-stats.png',
  title: 'Player Profile Analysis',
  description: 'Comprehensive profile statistics analysis',
  summary:
    'Veteran player with 500+ hours, level 85, and balanced skill distribution. Strong in combat (A-tier) and exploration (S-tier).',
  confidence: 0.88,
  processingTime: 1100,
  modelUsed: 'claude-sonnet-4',
  rawResponse: {
    level: 85,
    playtimeHours: 523,
    combatRating: 'A',
    explorationRating: 'S',
    buildingRating: 'B',
    totalAchievements: 78,
    favoriteGameMode: 'survival',
  },
  createdAt: new Date('2025-01-16T16:45:00Z'),
  updatedAt: new Date('2025-01-16T16:45:00Z'),
};

// ============================================================================
// SCREENSHOT DATA (Related to ScreenshotAnalysis)
// ============================================================================

export interface ScreenshotData {
  id: string;
  analysisId: string;
  key: string;
  value: any; // JSON value
  dataType: string;
  category: string;
  confidence: number | null;
}

/**
 * Creates ScreenshotData with sensible defaults.
 */
export function makeScreenshotData(
  overrides?: Partial<ScreenshotData>
): ScreenshotData {
  const defaults: ScreenshotData = {
    id: 'screenshot-data-1',
    analysisId: 'screenshot-analysis-1',
    key: 'level',
    value: 42,
    dataType: 'number',
    category: 'player_stats',
    confidence: 0.9,
  };

  return { ...defaults, ...overrides };
}

/**
 * Sample screenshot data for level.
 */
export const DEMO_SCREENSHOT_DATA_LEVEL: ScreenshotData = {
  id: 'data-level',
  analysisId: 'screenshot-profile-1',
  key: 'level',
  value: 85,
  dataType: 'number',
  category: 'player_stats',
  confidence: 0.95,
};

/**
 * Sample screenshot data for rank.
 */
export const DEMO_SCREENSHOT_DATA_RANK: ScreenshotData = {
  id: 'data-rank',
  analysisId: 'screenshot-leaderboard-1',
  key: 'rank',
  value: 3,
  dataType: 'number',
  category: 'leaderboard',
  confidence: 0.98,
};
