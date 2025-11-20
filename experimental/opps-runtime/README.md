# @slimy/opps-runtime

Runtime and collector scaffold for the opportunity engine. This package provides the data collection and orchestration layer for discovering and assembling opportunities.

## Overview

This is a **pure scaffold** package with stub implementations. It currently uses only **fake data** and has **no external API integrations** yet. The architecture is designed to support real collectors in future iterations.

## Status

- ✅ In-memory storage abstraction
- ✅ Stub collectors (markets, trends, class actions, freebies)
- ✅ Radar orchestrator for assembling snapshots
- ✅ Basic test coverage
- ❌ No external API integrations (coming later)
- ❌ Not integrated with monorepo build

## Dependencies

This package relies on `experimental/opps-core` via **relative imports**. It expects opps-core to provide:

- `types.ts`: Core types (`Opportunity`, `UserProfile`, `OpportunityDomain`, etc.)
- `scoring.ts`: Scoring helpers (`scoreOpportunity`)
- `aiContracts.ts`: AI interface types (`RadarSnapshot`)

**Note**: Until opps-core is fully implemented, this package may have type errors. This is expected during the scaffolding phase.

## Architecture

```
experimental/opps-runtime/
├── src/
│   ├── index.ts              # Main exports
│   ├── radar.ts              # Orchestrator (calls collectors, builds snapshot)
│   ├── storage/
│   │   └── inMemoryStore.ts  # In-memory opportunity storage
│   └── collectors/
│       ├── markets.ts        # Market signals (stocks, crypto)
│       ├── trends.ts         # Trending narratives (video, search)
│       ├── classActions.ts   # Class action lawsuits
│       └── freebies.ts       # Promotional offers and freebies
├── tests/
│   └── radar.test.ts         # Basic runtime tests
├── package.json
├── tsconfig.json
└── README.md
```

## Collectors

### 1. Markets (`markets.ts`)

**Freshness**: `realtime`
**Domains**: `stocks`, `crypto`

**Current**: Returns hard-coded market opportunities (NVDA stock, BTC price)
**Future**: Wire API integrations for:
- Stock price feeds (Alpha Vantage, Polygon, etc.)
- Crypto price feeds (CoinGecko, CoinMarketCap)
- On-chain providers (Alchemy, Infura for DeFi signals)
- Options flow / unusual activity

### 2. Trends (`trends.ts`)

**Freshness**: `fast_batch`
**Domains**: `video`, `search`

**Current**: Returns hard-coded trend opportunities (YouTube AI tools, Google tax searches)
**Future**: Wire API integrations for:
- YouTube trending API
- Google Trends API
- Reddit trending topics
- Twitter/X trending hashtags
- TikTok trending sounds/challenges

### 3. Class Actions (`classActions.ts`)

**Freshness**: `slow_batch`
**Domains**: `legal`

**Current**: Returns hard-coded class action opportunities (data breach settlement, price-fixing)
**Future**: Wire integrations for:
- ClassAction.org API or scraper
- TopClassActions.com scraper
- Court filing databases (PACER)
- Settlement monitoring services

### 4. Freebies (`freebies.ts`)

**Freshness**: `slow_batch`
**Domains**: `promo`

**Current**: Returns hard-coded freebie opportunities (Epic Games, Spotify trial)
**Future**: Wire integrations for:
- Reddit /r/freebies scraper
- Slickdeals API/scraper
- Epic Games free games API
- Steam free games scraper
- Brand promotional campaign APIs

## Storage

### InMemoryOpportunityStore

Simple in-memory storage for opportunities during runtime. No persistence.

**Interface**:
```typescript
interface OpportunityStore {
  upsert(opportunity: Opportunity): void;
  upsertMany(opportunities: Opportunity[]): void;
  getAll(): Opportunity[];
  getByDomain(domain: OpportunityDomain): Opportunity[];
  clear(): void;
}
```

**Usage**:
```typescript
import { createStore } from '@slimy/opps-runtime';

const store = createStore();
store.upsert(opportunity);
const allOpps = store.getAll();
```

## Radar Orchestrator

The `buildRadarSnapshot` function is the main entry point. It:

1. Calls all collectors in parallel
2. Stores opportunities in memory
3. Scores opportunities based on user profile (using opps-core helpers)
4. Ranks and filters by domain
5. Returns a `RadarSnapshot` with top opportunities per category

**Signature**:
```typescript
async function buildRadarSnapshot(
  profile: UserProfile,
  limitPerDomain = 5
): Promise<RadarSnapshot>
```

**Example**:
```typescript
import { buildRadarSnapshot } from '@slimy/opps-runtime';

const profile = {
  userId: 'user-123',
  preferences: {
    domains: ['stocks', 'crypto', 'video'],
    interests: ['technology', 'finance'],
    riskTolerance: 'moderate',
  },
  context: {
    location: 'US',
    timezone: 'America/New_York',
  },
};

const snapshot = await buildRadarSnapshot(profile, 5);
console.log(snapshot.topByCategory);
```

## Running Tests

From this directory:

```bash
# Install dependencies
npm install

# Type check (will fail until opps-core exists)
npm run type-check

# Run tests (using tsx to handle TypeScript)
npm run test:ts

# Build (will fail until opps-core exists)
npm run build
```

**Note**: Tests will fail until `experimental/opps-core` is created and provides the required types.

## Development Workflow

1. **Now**: Stub collectors return fake data
2. **Next**: Wire real API integrations in each collector
3. **Later**: Add persistence layer (database, cache)
4. **Future**: Integrate with monorepo build system

## Integration Notes

- **Not yet integrated** with monorepo workspace configuration
- **Standalone package** for now
- **No path aliases** - uses relative imports to opps-core
- **No Docker/deployment** - runtime-only scaffold

## Freshness Tiers

- `realtime`: Updates every few seconds (markets)
- `fast_batch`: Updates every few minutes (trends)
- `slow_batch`: Updates hourly or daily (class actions, freebies)

## Next Steps

1. Create `experimental/opps-core` with required types
2. Wire real API integrations in collectors
3. Add persistence layer (Redis, PostgreSQL)
4. Integrate with monorepo build
5. Add rate limiting and error handling
6. Add logging and observability
7. Create collector scheduler for batch jobs

## License

MIT
