/**
 * Radar orchestration - assembles opportunities from all collectors
 *
 * This is the main runtime engine that:
 * 1. Calls all collectors to gather opportunities
 * 2. Scores them based on user profile
 * 3. Ranks and filters to build a RadarSnapshot
 *
 * Note: No AI calls here - this is pure data assembly.
 * AI enrichment happens in a separate layer (opps-ai).
 */

// Import types and helpers from opps-core via relative path
import type { UserProfile } from '../../opps-core/src/types.js';
import type { RadarSnapshot } from '../../opps-core/src/aiContracts.js';
import type { Opportunity, OpportunityDomain } from '../../opps-core/src/types.js';
import { scoreOpportunity } from '../../opps-core/src/scoring.js';

// Import storage
import { InMemoryOpportunityStore } from './storage/inMemoryStore.js';

// Import collectors
import { collectMarketSignalsNow } from './collectors/markets.js';
import { collectTrendSignalsNow } from './collectors/trends.js';
import { collectClassActionOpportunitiesNow } from './collectors/classActions.js';
import { collectFreebieOpportunitiesNow } from './collectors/freebies.js';

/**
 * Build a complete radar snapshot for a user
 *
 * @param profile - User profile with preferences and context
 * @param limitPerDomain - Max opportunities to return per domain (default: 5)
 * @returns RadarSnapshot with top opportunities organized by category
 */
export async function buildRadarSnapshot(
  profile: UserProfile,
  limitPerDomain = 5
): Promise<RadarSnapshot> {
  // Initialize storage
  const store = new InMemoryOpportunityStore();

  // Collect from all sources in parallel
  const [marketOpps, trendOpps, classActionOpps, freebieOpps] = await Promise.all([
    collectMarketSignalsNow(),
    collectTrendSignalsNow(),
    collectClassActionOpportunitiesNow(),
    collectFreebieOpportunitiesNow(),
  ]);

  // Store all collected opportunities
  store.upsertMany([...marketOpps, ...trendOpps, ...classActionOpps, ...freebieOpps]);

  // Get all opportunities
  const allOpportunities = store.getAll();

  // Score each opportunity based on user profile
  const scoredOpportunities = allOpportunities.map((opp) => ({
    ...opp,
    score: scoreOpportunity(opp, profile),
  }));

  // Group by domain and take top N per domain
  const domains: OpportunityDomain[] = [
    'stocks',
    'crypto',
    'video',
    'search',
    'legal',
    'promo',
  ];

  const topByCategory: Record<string, Opportunity[]> = {};

  for (const domain of domains) {
    const domainOpps = scoredOpportunities
      .filter((opp) => opp.domain === domain)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limitPerDomain);

    if (domainOpps.length > 0) {
      topByCategory[domain] = domainOpps;
    }
  }

  // Build the radar snapshot
  const snapshot: RadarSnapshot = {
    generatedAt: new Date().toISOString(),
    userId: profile.userId,
    topByCategory,
    metadata: {
      totalCollected: allOpportunities.length,
      totalReturned: Object.values(topByCategory).reduce((sum, opps) => sum + opps.length, 0),
      collectorsRun: ['markets', 'trends', 'classActions', 'freebies'],
      scoringApplied: true,
    },
  };

  return snapshot;
}

/**
 * Create a new in-memory store instance
 * Exposed for testing or custom use cases
 */
export function createStore(): InMemoryOpportunityStore {
  return new InMemoryOpportunityStore();
}
