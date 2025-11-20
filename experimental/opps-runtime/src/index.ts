/**
 * @slimy/opps-runtime
 *
 * Runtime and collector scaffold for the opportunity engine.
 * This package provides:
 * - Stub collectors (markets, trends, class actions, freebies)
 * - In-memory storage for opportunities
 * - Radar orchestrator to assemble snapshots
 *
 * Note: All collectors currently return fake data.
 * External API integrations will be wired in future iterations.
 */

// Export radar orchestration
export { buildRadarSnapshot, createStore } from './radar.js';

// Export storage
export { InMemoryOpportunityStore } from './storage/inMemoryStore.js';
export type { OpportunityStore } from './storage/inMemoryStore.js';

// Export collectors
export { collectMarketSignalsNow } from './collectors/markets.js';
export { collectTrendSignalsNow } from './collectors/trends.js';
export { collectClassActionOpportunitiesNow } from './collectors/classActions.js';
export { collectFreebieOpportunitiesNow } from './collectors/freebies.js';
