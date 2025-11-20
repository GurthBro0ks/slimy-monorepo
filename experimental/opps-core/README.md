# @slimy/opps-core

Core type definitions for the Opportunities system.

## Types

### Opportunity

The main opportunity type with the following structure:

```typescript
interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: OpportunityType;
  domain: OpportunityDomain;

  // Time and freshness
  detectedAt: string; // ISO timestamp
  expiresAt?: string; // ISO timestamp
  freshnessTier: FreshnessTier;

  // Estimates
  timeCostMinutesEstimate: number;
  expectedRewardEstimate: number; // In USD
  riskLevel: RiskLevel;

  // Additional metadata (flexible, collector-specific)
  metadata: Record<string, any>;
}
```

### Enums

- **OpportunityType**: `'market-signal' | 'trend-signal' | 'class-action' | 'freebie' | 'promo'`
- **OpportunityDomain**: `'stocks' | 'crypto' | 'video' | 'search' | 'legal' | 'promo' | 'saas'`
- **FreshnessTier**: `'realtime' | 'fast_batch' | 'slow_batch'`
- **RiskLevel**: `'low' | 'medium' | 'high'`

### RadarSnapshot

A complete snapshot of all opportunities at a point in time:

```typescript
interface RadarSnapshot {
  snapshotId: string;
  timestamp: string;
  opportunities: Opportunity[];
  stats: {
    total: number;
    byDomain: Record<OpportunityDomain, number>;
    byRisk: Record<RiskLevel, number>;
  };
}
```

## Usage

```typescript
import type { Opportunity, RadarSnapshot } from '@slimy/opps-core';
```

This package contains only type definitions and has no runtime code.
