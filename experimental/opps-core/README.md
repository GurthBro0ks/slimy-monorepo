# @slimy/opps-core

Core types, scoring logic, and utilities for the experimental opportunities (opps) system.

## Overview

This package provides the foundational types and logic for managing and scoring opportunities:

- **Types**: `Opportunity`, `UserProfile`, `OpportunityStore`, `ScoredOpportunity`
- **Scoring**: Functions to score and rank opportunities based on user profiles
- **Store**: Simple in-memory storage for opportunities

## Key Types

### Opportunity

Represents a single opportunity with:
- `type`: Type of opportunity (grant, bounty, challenge, other)
- `domain`: Domain classification (tech, creative, research, etc.)
- `riskLevel`: Risk assessment (low, medium, high)
- `expectedRewardEstimate`: Estimated reward value
- `timeCostMinutesEstimate`: Estimated time investment
- `metadata`: Extensible metadata object

### UserProfile

User preferences for filtering and scoring:
- `skills`: User's skill set
- `interests`: Domains of interest
- `maxRiskLevel`: Risk tolerance
- `minReward`: Minimum acceptable reward
- `maxTimeMinutes`: Maximum time willing to invest

## Scoring

The scoring system evaluates opportunities based on:
- **Reward factor**: Higher rewards = higher score
- **Time factor**: Lower time costs = higher score
- **Risk factor**: Lower risk = higher score
- **Metadata bonuses**: Special flags (e.g., `reusable: true`)
- **Profile matching**: Skill alignment, risk tolerance, constraints

## Usage

```typescript
import { scoreOpportunity, createOpportunityStore } from "@slimy/opps-core";

const store = createOpportunityStore();
store.addOpportunity({
  id: "opp-1",
  title: "Example Task",
  description: "Do something",
  type: "other",
  domain: "tech",
  riskLevel: "low",
  freshnessTier: "fast_batch",
  expectedRewardEstimate: 100,
  timeCostMinutesEstimate: 60,
});

const scored = scoreOpportunity(store.getAll()[0], {
  skills: ["typescript"],
  maxRiskLevel: "medium",
});

console.log(scored.score);
```

## Non-Goals

This package does NOT:
- Make network calls
- Connect to external APIs
- Provide real opportunity data (see `@slimy/opps-runtime` for collectors)
