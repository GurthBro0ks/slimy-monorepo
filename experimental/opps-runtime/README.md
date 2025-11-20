# @slimy/opps-runtime

Runtime collectors and radar snapshot builder for the Opportunity Radar system.

## Overview

This package implements the core runtime logic for collecting and aggregating opportunities from various sources. It provides:

- **Collectors**: Async functions that gather opportunities from different domains
- **Radar Snapshot Builder**: Aggregates opportunities and categorizes them for easy consumption

## Collectors

### Found Money Collectors

The Found Money module provides two collectors focused on financial recovery and savings opportunities:

#### `collectRebateOpportunitiesNow()`

Collects synthetic rebate opportunities across several categories:

- **Energy Efficiency Rebates**: Home insulation, smart thermostats, and other utility-sponsored programs
- **Device Trade-In Programs**: Electronics recycling and trade-in credits
- **Bill Credits**: ISP, mobile carrier, and other service provider credits

**Metadata Structure:**
```typescript
{
  category: "rebate",
  programType: "energy" | "device-trade-in" | "bill-credit",
  region: "US" | "EU" | "global",
  requiresPaperwork: boolean
}
```

All rebate opportunities:
- Use `domain: "promo"` or `"legal"`
- Have `riskLevel: "low"`
- Use `freshnessTier: "slow_batch"`
- Include reasonable `expectedRewardEstimate` and `timeCostMinutesEstimate` values

#### `collectUnclaimedPropertyNudgesNow()`

Collects "nudge" opportunities that prompt users to check official government and financial institution sites for unclaimed property:

- State treasury unclaimed property databases
- National-level unclaimed funds updates
- Dormant bank account reminders

These are **meta-opportunities** - they don't represent specific found money but rather suggest where users should look.

**Metadata Structure:**
```typescript
{
  category: "unclaimed_property_nudge",
  region: "US" | "EU" | "global",
  officialSitesHint: true
}
```

All unclaimed property nudges:
- Use `domain: "legal"` or `"misc"`
- Have `riskLevel: "low"`
- Use `freshnessTier: "slow_batch"`
- Have low `timeCostMinutesEstimate` (typically 5-15 minutes)

**Important Notes:**
- All data returned by Found Money collectors is **synthetic and non-personal**
- No external API calls are made; all opportunities are mock data
- Real integrations would require official government APIs, utility provider partnerships, and proper data sources
- This module serves as a proof-of-concept for the opportunity structure

## API

### `buildRadarSnapshot(profile, limitPerDomain?)`

Builds a radar snapshot for a given user profile by:
1. Running all registered collectors in parallel
2. Aggregating opportunities into an OpportunityStore
3. Categorizing by domain and applying limits

**Parameters:**
- `profile: UserProfile` - User profile with preferences
- `limitPerDomain?: number` - Max opportunities per domain (default: 10)

**Returns:**
```typescript
{
  profileId: string;
  timestamp: Date;
  totalOpportunities: number;
  topByCategory: {
    [domain]: Opportunity[];
  };
}
```

## Usage Example

```typescript
import { buildRadarSnapshot } from "@slimy/opps-runtime";
import type { UserProfile } from "@slimy/opps-core";

const profile: UserProfile = {
  userId: "user-123",
  preferences: {
    domains: ["promo", "legal"],
    maxRisk: "low",
  },
};

const snapshot = await buildRadarSnapshot(profile, 5);

console.log(`Found ${snapshot.totalOpportunities} total opportunities`);
console.log(`Promo opportunities:`, snapshot.topByCategory.promo);
console.log(`Legal opportunities:`, snapshot.topByCategory.legal);
```

## Testing

Run tests with:
```bash
pnpm test
```

Watch mode:
```bash
pnpm test:watch
```

## Development

This is an experimental package. The collector interface and radar snapshot structure may evolve as new opportunity types are added.

### Adding New Collectors

To add a new collector:

1. Create a new file in `src/collectors/`
2. Export async functions that return `Opportunity[]`
3. Import and call them in `radar.ts` within `buildRadarSnapshot()`
4. Add corresponding tests in `tests/`

Future collectors might include:
- Credit card rewards optimization
- Scholarship and grant opportunities
- Cashback and loyalty program trackers
- Tax credit and deduction reminders
