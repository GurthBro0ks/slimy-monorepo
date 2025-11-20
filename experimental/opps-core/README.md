# @slimy/opps-core

Core types and interfaces for the opportunities ("opps") system.

## Overview

This package defines the fundamental types for representing **opportunities** — potential actions that could generate value, whether immediate (selling an item, taking a gig) or long-term (learning a skill, building infrastructure).

## Key Types

### `Opportunity`

The core interface representing a single opportunity:

- `type`: Category (arbitrage, gig, sale, investment, other)
- `domain`: Market context (ecommerce, freelance, crypto, local, misc)
- `riskLevel`: Risk assessment (low, medium, high)
- `freshnessTier`: How often to refresh (realtime, hourly, daily, slow_batch)
- `expectedRewardEstimate`: Numeric value estimate (not necessarily dollars)
- `timeCostMinutesEstimate`: How long it takes
- `metadata`: Extensible data (e.g., skill investment details)

### `OpportunityStore`

A simple in-memory store for managing opportunities:

- `add(opp)` / `addMany(opps)`: Add opportunities
- `get(id)`: Retrieve by ID
- `getAll()`: Get all opportunities
- `getByDomain(domain)`: Filter by domain
- `clear()`: Reset the store

### `RadarSnapshot`

A point-in-time view of all opportunities, grouped by domain.

## Usage

```typescript
import { Opportunity, OpportunityStore, OpportunityType } from "@slimy/opps-core";

const store = new OpportunityStore();

const opp: Opportunity = {
  id: "learn-typescript",
  title: "Deep dive into TypeScript",
  type: "other",
  domain: "misc",
  riskLevel: "low",
  freshnessTier: "slow_batch",
  expectedRewardEstimate: 500,
  timeCostMinutesEstimate: 300,
  collectedAt: new Date(),
  metadata: {
    category: "skill_investment",
    area: "frontend",
  },
};

store.add(opp);
```

## Philosophy

Opportunities can represent:
- **Immediate value**: Arbitrage, sales, gigs
- **Long-term value**: Skill investments, infrastructure improvements

By modeling them uniformly, we can build radar systems that help prioritize both short-term and long-term actions.
