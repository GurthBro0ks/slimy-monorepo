# @slimy/opps-core

Core type definitions for the Opportunity Radar system.

## Overview

This package provides the foundational type definitions used across the Opportunity Radar stack. It defines the structure of opportunities, domains, types, and risk levels.

## Types

### OpportunityDomain

Categories for opportunities:
- `crypto` - Cryptocurrency-related opportunities
- `stocks` - Stock market opportunities
- `real-estate` - Real estate investments
- `business` - Business ventures
- `career` - Career opportunities
- `education` - Learning and education
- `other` - Other opportunities

### OpportunityType

Types of opportunities:
- `investment` - Investment opportunities
- `trade` - Trading opportunities
- `learning` - Educational opportunities
- `networking` - Networking events
- `job` - Job opportunities
- `side-hustle` - Side project opportunities
- `other` - Other types

### RiskLevel

Risk assessment levels:
- `low` - Low risk
- `medium` - Medium risk
- `high` - High risk

### Opportunity

Core opportunity interface with:
- `id` - Unique identifier
- `title` - Opportunity title
- `description` - Detailed description
- `domain` - OpportunityDomain category
- `type` - OpportunityType classification
- `riskLevel` - RiskLevel assessment
- `createdAt` - ISO timestamp
- `metadata` - Optional additional data

## Usage

```typescript
import type { Opportunity, OpportunityDomain, RiskLevel } from "@slimy/opps-core";

const opportunity: Opportunity = {
  id: "opp-123",
  title: "Bitcoin Investment Opportunity",
  description: "Invest in Bitcoin during market dip",
  domain: "crypto",
  type: "investment",
  riskLevel: "high",
  createdAt: new Date().toISOString(),
};
```

## License

Private package - part of slimy-monorepo
