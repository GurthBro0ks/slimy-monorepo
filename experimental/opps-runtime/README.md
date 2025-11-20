# @slimy/opps-runtime

Runtime collectors for the Opportunities system. Provides mock data sources for various opportunity types.

## Features

- **No External Dependencies**: All collectors return realistic mock data without making any network requests
- **Multiple Domains**: Covers stocks, crypto, video trends, search trends, legal opportunities, and freebies
- **Varied Risk Levels**: Opportunities span low, medium, and high risk levels
- **Rich Metadata**: Each opportunity includes domain-specific metadata for enhanced filtering and display

## Collectors

### Market Signals (`markets.ts`)
Collects stock and cryptocurrency opportunities with varied patterns:
- Breakout patterns
- Momentum plays
- Mean reversion
- Whale accumulation
- Support/resistance bounces

**Freshness Tier**: `realtime`

### Trend Signals (`trends.ts`)
Collects video and search trend opportunities:
- YouTube/TikTok content opportunities
- Search engine trending topics
- Niche discovery
- Social momentum detection

**Freshness Tier**: `fast_batch`

### Class Actions (`classActions.ts`)
Collects legal settlement opportunities:
- Data breach settlements
- Product defect claims
- Privacy violation cases
- Subscription disputes

**Freshness Tier**: `slow_batch`

### Freebies (`freebies.ts`)
Collects promotional opportunities:
- SaaS free trials and credits
- Physical product samples
- Lifetime deals
- Student/education discounts

**Freshness Tier**: `slow_batch`

## Usage

```typescript
import { buildRadarSnapshot } from '@slimy/opps-runtime';

// Get a complete snapshot from all collectors
const snapshot = await buildRadarSnapshot();
console.log(`Found ${snapshot.stats.total} opportunities`);
console.log('By domain:', snapshot.stats.byDomain);
console.log('By risk:', snapshot.stats.byRisk);

// Or collect from individual sources
import {
  collectMarketSignalsNow,
  collectTrendSignalsNow,
  collectClassActionOpportunitiesNow,
  collectFreebieOpportunitiesNow,
} from '@slimy/opps-runtime';

const markets = await collectMarketSignalsNow();
const trends = await collectTrendSignalsNow();
```

## Testing

```bash
pnpm test
```

All tests verify:
- Minimum opportunity counts
- Domain coverage
- Proper freshness tiers
- Metadata completeness
- No external API calls (pure in-memory)

## Development

The mock data is designed to be realistic and varied, covering edge cases and different opportunity characteristics. Each collector includes:

- Multiple domains within its category
- Varied risk levels
- Different time costs and rewards
- Rich metadata for filtering and display

To add new opportunities, simply extend the arrays in each collector file. Use the `createOpportunity()` helper from `utils.ts` to maintain consistent structure.
