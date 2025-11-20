# @slimy/opps-core

Core library for the "opportunity radar" engine. Provides types, scoring algorithms, and AI-facing interfaces for discovering, filtering, and prioritizing opportunities.

## Status

**⚠️ Experimental - Not Yet Integrated**

This package is currently standalone and **NOT** wired into the monorepo build system or workspace configuration. It exists as a self-contained library for development and testing purposes.

## What This Package Does

The opps-core library provides:

1. **Type Definitions** - Strongly-typed interfaces for opportunities, user profiles, and preferences
2. **Filtering Logic** - Filter opportunities based on user constraints (risk, capital, time, preferences)
3. **Scoring & Ranking** - Simple EV-based scoring to prioritize opportunities for a given user
4. **AI Contracts** - Pure-data structures designed to be passed to LLMs for planning and analysis

## Architecture

```
experimental/opps-core/
├── src/
│   ├── types.ts          # Core type definitions (Opportunity, RiskLevel, etc.)
│   ├── userProfile.ts    # User profile and filtering logic
│   ├── scoring.ts        # Scoring and ranking algorithms
│   ├── aiContracts.ts    # AI-facing data structures (RadarSnapshot, WeeklyPlanDraft)
│   └── index.ts          # Public API exports
├── tests/
│   └── basic.scoring.test.ts  # Test suite for scoring logic
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md (this file)
```

## Key Concepts

### Opportunity

An opportunity represents a potential action or event with:
- **Type**: market_move, trend_narrative, class_action, freebie, other
- **Domain**: stocks, crypto, video, search, legal, promo, misc
- **Risk Level**: low, medium, high
- **Estimates**: expected reward, time cost, capital required
- **Freshness**: realtime, fast_batch, slow_batch

### User Profile

User profiles define preferences and constraints:
- Maximum risk tolerance
- Capital and time limits
- Preferred/avoided domains and types

### Scoring

Opportunities are scored using a simple heuristic:
1. Base score = expected reward (or default if unknown)
2. Subtract time cost (converted to monetary value)
3. Apply risk multiplier based on user's tolerance
4. Add small bonuses for matching preferences

Higher scores = better opportunities for that user.

## Usage Examples

### Basic Scoring

```typescript
import { scoreOpportunity, rankOpportunitiesForUser } from '@slimy/opps-core';

const profile = {
  id: 'user123',
  maxRiskLevel: 'medium',
  maxCapitalPerOpportunity: 1000,
  maxTimePerOpportunityMinutes: 60,
  prefersDomains: ['crypto', 'stocks'],
};

const opportunity = {
  id: 'opp-xyz',
  type: 'market_move',
  domain: 'crypto',
  title: 'BTC dip opportunity',
  shortSummary: 'Bitcoin dropped 5%, historically good entry point',
  source: 'collector_crypto_whales',
  expectedRewardEstimate: 500,
  timeCostMinutesEstimate: 30,
  capitalRequiredEstimate: 200,
  riskLevel: 'medium',
  freshnessTier: 'realtime',
  createdAt: new Date().toISOString(),
  lastUpdatedAt: new Date().toISOString(),
};

// Score a single opportunity
const scored = scoreOpportunity(opportunity, profile);
console.log(scored.score); // e.g. 350.5
console.log(scored.reasons); // ["Expected reward: $500", "Time cost: 30 min (-$15.00)", ...]

// Rank multiple opportunities
const opportunities = [/* ... */];
const topOpps = rankOpportunitiesForUser(profile, opportunities, 10);
// Returns top 10 opportunities sorted by score
```

### Creating AI Contracts

```typescript
import { createRadarSnapshot, createBasicWeeklyPlan } from '@slimy/opps-core';

// Create a radar snapshot for an LLM
const snapshot = createRadarSnapshot(profile, scoredOpportunities, 5);
// Pass snapshot to LLM for analysis

// Create a weekly plan
const plan = createBasicWeeklyPlan(profile, scoredOpportunities, 7);
// Pass plan to LLM for refinement
```

## Running Tests

From this directory (`experimental/opps-core/`):

```bash
# Install dependencies first
pnpm install

# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm typecheck
```

## Development Notes

### Design Principles

1. **Simple & Readable** - Scoring logic uses straightforward heuristics, not complex ML models
2. **Strongly Typed** - All data structures are fully typed for safety and IDE support
3. **Pure Functions** - Scoring and filtering are deterministic pure functions
4. **AI-First** - Contracts are designed to serialize cleanly for LLM prompts

### Scoring Algorithm Details

The scoring algorithm is intentionally simple:

```
score = expectedReward - (timeCost * $0.50/min)
score = score * riskMultiplier  // 1.0 for low, 0.7 for medium, 0.4 for high
score += $5 for domain match
score += $5 for type match
```

This can be refined later based on real-world usage data.

### Future Integration

When ready to integrate with the monorepo:
1. Add to `pnpm-workspace.yaml` workspaces
2. Add build script to compile TypeScript
3. Update other packages to consume via `@slimy/opps-core`
4. Wire into existing apps (web, admin-api, etc.)

## API Reference

### Exports

```typescript
// Types
export type {
  Opportunity,
  OpportunityType,
  OpportunityDomain,
  RiskLevel,
  FreshnessTier,
  UserProfile,
  ScoredOpportunity,
  RadarSnapshot,
  OpportunityBucket,
  WeeklyPlanDraft,
};

// Functions
export {
  filterOpportunitiesForUser,
  scoreOpportunity,
  rankOpportunitiesForUser,
  createRadarSnapshot,
  createEmptyWeeklyPlan,
  createBasicWeeklyPlan,
};
```

## Contributing

This is an experimental package. Feel free to iterate on:
- Scoring algorithm improvements
- New AI contract types
- Additional filtering logic
- Performance optimizations

All changes should include tests.

## License

Private - Part of the slimy-monorepo project.
