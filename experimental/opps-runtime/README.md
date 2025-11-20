# @slimy/opps-runtime

Runtime system for collecting, managing, and organizing opportunities.

## Overview

This package provides the runtime infrastructure for the opportunities ("opps") system. It includes:

- **Collectors**: Modules that generate opportunities from various sources
- **Radar**: Orchestration layer that builds complete opportunity snapshots
- **Utilities**: Helper functions for organizing and filtering opportunities

## Architecture

```
opps-runtime
├── src/
│   ├── collectors/
│   │   ├── skills.ts          # Skill investment opportunities
│   │   └── skillsBuckets.ts   # Time-horizon grouping for skills
│   ├── radar.ts               # Main orchestration layer
│   └── index.ts
└── tests/
    └── skills.collectors.test.ts
```

## Usage

### Building a Radar Snapshot

The `buildRadarSnapshot` function collects opportunities from all available collectors and returns a complete snapshot:

```typescript
import { buildRadarSnapshot } from "@slimy/opps-runtime";

const snapshot = await buildRadarSnapshot();

console.log(`Total opportunities: ${snapshot.totalCount}`);
console.log(`Misc opportunities: ${snapshot.opportunitiesByDomain.misc.length}`);
```

### Skill Investment Opportunities

The skill investment collector generates opportunities that represent **long-term learning and practice tasks**. These are not "get cash today" opportunities, but rather "improve your future earning power" investments.

#### Philosophy

Skill investment opportunities treat learning and practice as compounding assets:

- **Not immediate cash**: These won't directly generate revenue today
- **Future EV improvement**: They increase your expected value over time
- **Time-intensive**: Typically require 3-10 hours of focused work
- **Low risk**: Most have low to medium risk, as learning is generally safe
- **Slow batch**: These don't need frequent refreshing—they're evergreen

#### Example Opportunities

The collector currently generates opportunities across five areas:

1. **Quant & Analytics**: Learn statistical methods for opportunity scoring
2. **Automation & Tooling**: Build internal APIs and CLIs
3. **AI Tooling**: Study new AI model providers and their ecosystems
4. **Frontend & Design**: Design and document complete modules
5. **Infrastructure**: Master Docker, deployment patterns, and DevOps

Each opportunity includes:

- `expectedRewardEstimate`: Approximate annual impact (100-1000 range)
  - **Note**: This is a rough proxy, not real money. It represents estimated value gain over a year.
- `timeCostMinutesEstimate`: 180-900 minutes (3-15 hours)
- `metadata`:
  - `category`: Always "skill_investment"
  - `area`: The skill domain (quant, automation, ai_tooling, frontend, infra)
  - `suggestedResources`: List of learning resources (names/descriptions, not real URLs)
  - `recommendedSessionLengthMinutes`: Suggested session length for effective learning

#### Collecting Skill Opportunities

```typescript
import { collectSkillInvestmentOpportunitiesNow } from "@slimy/opps-runtime";

const skillOpps = await collectSkillInvestmentOpportunitiesNow();

for (const opp of skillOpps) {
  console.log(`${opp.title}: ${opp.timeCostMinutesEstimate} minutes`);
}
```

#### Organizing by Time Horizon

The `groupSkillOpportunitiesForHorizon` helper organizes skill opportunities based on your planning horizon:

```typescript
import {
  collectSkillInvestmentOpportunitiesNow,
  groupSkillOpportunitiesForHorizon,
} from "@slimy/opps-runtime";

const skillOpps = await collectSkillInvestmentOpportunitiesNow();

// Short horizon (7 days): only lighter tasks
const thisWeek = groupSkillOpportunitiesForHorizon(7, skillOpps);
console.log("This week's quick wins:", thisWeek);

// Medium horizon (30 days): grouped by intensity
const thisMonth = groupSkillOpportunitiesForHorizon(30, skillOpps);
console.log("This month's learning plan:", thisMonth);

// Long horizon (60+ days): grouped by area
const longTerm = groupSkillOpportunitiesForHorizon(60, skillOpps);
console.log("Long-term skill development:", longTerm);
```

##### Horizon Logic

- **≤ 7 days**: Returns "This Week" bucket with tasks < 4 hours
- **8-30 days**: Returns buckets grouped by intensity:
  - Light Investment (< 4 hours)
  - Moderate Investment (4-6 hours)
  - Deep Dive (> 6 hours)
- **> 30 days**: Returns buckets grouped by skill area:
  - Quant & Analytics
  - Automation & Tooling
  - AI & ML Tools
  - Frontend & Design
  - Infrastructure & DevOps

#### Integration with Radar

Skill investment opportunities are automatically integrated into the radar system:

```typescript
import { buildRadarSnapshot } from "@slimy/opps-runtime";

const snapshot = await buildRadarSnapshot();

// Skill opportunities appear under the "misc" domain
const miscOpps = snapshot.opportunitiesByDomain.misc;

// Filter for skill investments
const skillOpps = miscOpps.filter(
  (opp) => opp.metadata?.category === "skill_investment"
);

console.log(`Found ${skillOpps.length} skill investment opportunities`);
```

## Testing

Run tests with:

```bash
pnpm test
```

The test suite covers:

- Skill collector: Validates opportunity structure, metadata, and values
- Skill buckets: Tests time-horizon grouping logic
- Radar integration: Ensures proper integration into the radar system

## Design Decisions

### Why model skills as opportunities?

By treating skill development as opportunities in the same system as immediate revenue opportunities, we can:

1. **Unified prioritization**: Compare learning vs. earning in the same framework
2. **Time allocation**: Make explicit tradeoffs between short-term and long-term value
3. **Tracking**: Use the same radar UI to visualize both types of opportunities
4. **Compounding awareness**: Constantly remind ourselves that investing in skills compounds over time

### Why use synthetic values for rewards?

The `expectedRewardEstimate` for skill opportunities is not real money—it's a proxy for estimated annual impact. This allows:

- Rough comparison between different skill investments
- Integration with scoring algorithms that consider ROI
- Flexibility to adjust estimates as we learn more

These values are intentionally approximate and should be tuned based on your context.

## Future Extensions

Potential additions:

- More collectors (gig platforms, arbitrage, local opportunities)
- Personalization based on existing skills
- Dynamic reward estimates based on market data
- Integration with calendar/scheduling systems

## License

Private package for slimy-monorepo.
