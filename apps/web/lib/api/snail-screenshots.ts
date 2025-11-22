/**
 * Snail Screenshots API Client
 * Provides snail analysis data from screenshots
 * Supports sandbox mode when admin-api is not configured
 */

export interface SnailAnalysis {
  id: string;
  tier: string;
  level: number;
  screenshot: string;
  timestamp: string;
  confidence: number;
  stats?: {
    attack?: number;
    defense?: number;
    hp?: number;
  };
}

// Sandbox data
const SANDBOX_ANALYSES: SnailAnalysis[] = [
  {
    id: "sandbox-1",
    tier: "SSR",
    level: 250,
    screenshot: "/placeholder-snail.jpg",
    timestamp: new Date().toISOString(),
    confidence: 0.92,
    stats: {
      attack: 12500,
      defense: 10800,
      hp: 45000,
    },
  },
  {
    id: "sandbox-2",
    tier: "SR",
    level: 180,
    screenshot: "/placeholder-snail.jpg",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    confidence: 0.88,
    stats: {
      attack: 8500,
      defense: 7200,
      hp: 32000,
    },
  },
];

/**
 * Get all snail analyses
 */
export async function getSnailAnalyses(): Promise<SnailAnalysis[]> {
  const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE;

  if (!adminApiBase) {
    return Promise.resolve(SANDBOX_ANALYSES);
  }

  try {
    const response = await fetch(`${adminApiBase}/api/snail/analyses`, {
      credentials: "include",
    });

    if (!response.ok) {
      console.warn("Snail analyses fetch failed, using sandbox data");
      return SANDBOX_ANALYSES;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch snail analyses:", error);
    return SANDBOX_ANALYSES;
  }
}

/**
 * Get latest snail analysis
 */
export async function getLatestSnailAnalysis(): Promise<SnailAnalysis | null> {
  const analyses = await getSnailAnalyses();
  return analyses.length > 0 ? analyses[0] : null;
}

/**
 * Pick the best snail from analysis based on tier and level
 */
export function pickBestSnailFromAnalysis(analyses: SnailAnalysis[]): SnailAnalysis | null {
  if (analyses.length === 0) return null;

  const tierRanking: Record<string, number> = {
    SSR: 4,
    SR: 3,
    R: 2,
    N: 1,
  };

  return analyses.reduce((best, current) => {
    const bestTier = tierRanking[best.tier] || 0;
    const currentTier = tierRanking[current.tier] || 0;

    if (currentTier > bestTier) return current;
    if (currentTier === bestTier && current.level > best.level) return current;
    return best;
  }, analyses[0]);
}
