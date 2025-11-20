# @slimy/opps-core

Core types and utilities for the Opportunities (Opps) system.

## Overview

This package defines the fundamental `Opportunity` interface and related types used throughout the experimental opps stack.

An **Opportunity** represents an actionable item that could benefit the user, such as:
- Cost optimization suggestions
- Reward opportunities
- Productivity improvements
- Engagement activities

## Types

### `Opportunity`

The core interface representing an opportunity:

```typescript
interface Opportunity {
  id: string;
  type: OpportunityType;
  domain: OpportunityDomain;
  title: string;
  shortSummary: string;
  expectedRewardEstimate?: number;
  timeCostMinutesEstimate?: number;
  riskLevel: RiskLevel;
  freshnessTier: FreshnessTier;
  metadata?: Record<string, any>;
}
```

### Supporting Types

- `OpportunityType`: "other" | "reward" | "optimization" | "engagement"
- `OpportunityDomain`: "misc" | "finance" | "productivity" | "social"
- `RiskLevel`: "low" | "medium" | "high"
- `FreshnessTier`: "realtime" | "fast_batch" | "slow_batch" | "static"

## Usage

```typescript
import { Opportunity } from "@slimy/opps-core";

const opportunity: Opportunity = {
  id: "unique-id",
  type: "optimization",
  domain: "finance",
  title: "Cancel unused subscription",
  shortSummary: "You haven't used Netflix in 90 days",
  expectedRewardEstimate: 179.88, // Annual savings
  timeCostMinutesEstimate: 5,
  riskLevel: "low",
  freshnessTier: "slow_batch",
  metadata: {
    category: "subscription_trim",
    monthlyCost: 14.99
  }
};
```

## Status

**Experimental** - This package is part of the experimental opps stack and is subject to change.
