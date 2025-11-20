# @slimy/opps-runtime

Runtime collectors and radar system for the experimental opportunities (opps) stack.

## Overview

This package provides collectors that gather opportunity data and the radar system that aggregates them. It depends on `@slimy/opps-core` for core types and scoring logic.

## Architecture

- **Collectors**: Functions that return arrays of `Opportunity` objects
- **Radar**: Orchestrates collectors and builds snapshots of all available opportunities
- **No network calls**: All data is currently synthetic for testing and development

## Time-for-Money Tasks

The Time-for-Money Tasks module represents two categories of opportunities for trading time directly for income:

### Gig Tasks

Small, discrete coding jobs typically found on freelance platforms, OSS bounty boards, or through direct client connections. Characteristics:

- **Time investment**: 30-240 minutes
- **Reward range**: $75-$200 equivalent
- **Examples**:
  - Fix TypeScript config in a small open-source repo
  - Write a script to sync screenshots to cloud storage
  - Add simple logging + dashboard to a small Node API
  - Migrate Jest tests to Vitest
  - Build CSV export feature for analytics dashboard
  - Implement rate limiting for REST API endpoints

Metadata includes:
- `category: "gig_task"`
- `skillTags`: Array of required skills (e.g., ["typescript", "node", "automation"])
- `platformHint`: Source type ("freelance_board", "oss_bounty", "direct_client")
- `difficulty`: Complexity level ("easy", "medium", "hard")
- `hourlyRateApprox`: Implied hourly rate

### Micro-Services

Reusable service implementations that solve recurring problems and can potentially be sold to multiple clients or turned into products. Characteristics:

- **Time investment**: 120-600 minutes (higher than gig tasks)
- **Reward range**: $350-$800 equivalent (higher due to reusability)
- **Examples**:
  - Turn recurring spreadsheet cleanup into Python automation
  - Wrap CLI tool in tiny web UI for non-technical users
  - Build Discord bot to summarize server logs
  - Create email digest service for RSS feeds
  - Build screenshot annotation tool as web service

Metadata includes:
- `category: "micro_service"`
- `reusable: true` (always true for micro-services)
- `idealClientProfile`: Description of target users
- `technicalStackHint`: Suggested technologies
- `potentialForResale`: Can be sold multiple times
- `monthlyRevenuePotential`: Could generate recurring revenue

### Key Differences

| Aspect | Gig Tasks | Micro-Services |
|--------|-----------|----------------|
| Time investment | Lower (30-240 min) | Higher (120-600 min) |
| Reusability | One-off | Reusable/resellable |
| Revenue model | One-time payment | Potential for multiple sales |
| Scope | Specific to one client | Generic solution |
| Risk | Lower | Medium (more upfront investment) |

### Current Data

**All current data is synthetic and non-networked.** The collectors generate realistic example opportunities for testing the opps system. In the future, these could be backed by:
- Real freelance platform APIs
- OSS bounty aggregators
- Community-submitted opportunities
- Custom integrations with gig platforms

## Usage

### Basic Radar Usage

```typescript
import { buildRadarSnapshot } from "@slimy/opps-runtime";

// Get all opportunities
const snapshot = await buildRadarSnapshot();
console.log(`Found ${snapshot.opportunities.length} opportunities`);

// Filter by category
const gigTasks = snapshot.opportunities.filter(
  (opp) => opp.metadata?.category === "gig_task"
);
const microServices = snapshot.opportunities.filter(
  (opp) => opp.metadata?.category === "micro_service"
);
```

### Using Collectors Directly

```typescript
import {
  collectGigTaskOpportunitiesNow,
  collectMicroServiceOpportunitiesNow,
} from "@slimy/opps-runtime";

const gigs = await collectGigTaskOpportunitiesNow();
const microServices = await collectMicroServiceOpportunitiesNow();
```

### With User Profile and Scoring

```typescript
import { buildRadarSnapshot } from "@slimy/opps-runtime";
import { scoreOpportunities } from "@slimy/opps-core";

const snapshot = await buildRadarSnapshot();

// Score based on user profile
const scored = scoreOpportunities(snapshot.opportunities, {
  skills: ["typescript", "node", "python"],
  maxRiskLevel: "medium",
  minReward: 100,
  maxTimeMinutes: 300,
});

// Get top 5 opportunities
const top5 = scored.slice(0, 5);
```

## Collectors

### Gig Tasks Collector

**Function**: `collectGigTaskOpportunitiesNow()`

Returns synthetic gig task opportunities. All opportunities have:
- `type: "other"`
- `domain: "misc"`
- `metadata.category: "gig_task"`
- Variety of skill tags, platforms, and difficulty levels

### Micro-Services Collector

**Function**: `collectMicroServiceOpportunitiesNow()`

Returns synthetic micro-service opportunities. All opportunities have:
- `type: "other"`
- `domain: "misc"`
- `metadata.category: "micro_service"`
- `metadata.reusable: true`
- Higher time estimates and rewards than gig tasks

## Testing

Run tests with:

```bash
pnpm test
```

Tests verify:
- Collectors return valid opportunity structures
- All required metadata fields are present
- Domain and category values are correct
- Micro-services have `reusable: true`
- Integration with radar system works correctly

## Future Enhancements

Potential additions:
1. Real API integrations (Upwork, Freelancer, etc.)
2. OSS bounty aggregation (Gitcoin, Bountysource)
3. User-submitted opportunities
4. ML-based opportunity matching
5. Historical tracking and success metrics
6. Community ratings and reviews

## Non-Goals

This package does NOT:
- Make external network calls (all data is synthetic)
- Provide authentication or user management
- Handle payments or transactions
- Track opportunity state over time (that's future scope)
