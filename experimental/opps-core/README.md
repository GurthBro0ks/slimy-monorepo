# @slimy/opps-core

Core types and utilities for the Opportunity Radar system.

## Overview

This package provides the foundational TypeScript types used across the Opportunity Radar stack:

- **Opportunity**: Represents a potential action item with reward estimates, time costs, risk levels, and metadata
- **UserProfile**: User preferences for opportunity filtering
- **RadarSnapshot**: Aggregated view of opportunities categorized by domain

## Types

### OpportunityType
- `other`, `financial`, `career`, `education`

### OpportunityDomain
- `promo`, `legal`, `misc`, `finance`, `career`, `learning`

### RiskLevel
- `low`, `medium`, `high`

### FreshnessTier
- `realtime`: Live data sources
- `fast_poll`: Polled every few minutes
- `slow_batch`: Refreshed daily or less frequently

## Usage

```typescript
import type { Opportunity, OpportunityDomain } from "@slimy/opps-core";

const opp: Opportunity = {
  id: "example-001",
  title: "Example Opportunity",
  description: "Description here",
  type: "other",
  domain: "promo",
  riskLevel: "low",
  freshnessTier: "slow_batch",
  expectedRewardEstimate: 100,
  timeCostMinutesEstimate: 15,
  createdAt: new Date(),
};
```

## Development

This is an experimental package. Types may change as the Opportunity Radar system evolves.
