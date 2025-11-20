# @slimy/opps-runtime

Runtime utilities and modules for the Opportunities (Opps) system.

## Overview

This package provides runtime functionality for generating and managing Opportunities. It includes various modules that analyze user data and generate actionable opportunities for users.

## Modules

### Subscription Trim (Experimental)

The **Subscription Trim** module helps users identify cost-cutting opportunities from their subscriptions.

#### Key Features

- ✅ **No External APIs**: Works with manually-provided subscription data only
- ✅ **No Real Bank Integration**: All data is synthetic/user-provided
- ✅ **Heuristic Analysis**: Uses simple rules to identify savings opportunities
- ✅ **Opportunity Generation**: Converts subscription data into standard Opportunity objects

#### How It Works

If a user provides a list of their subscriptions as JSON, this module can:

1. Analyze each subscription based on usage patterns and cost
2. Generate suggestions (cancel, downgrade, or monitor)
3. Convert suggestions into Opportunities with estimated savings and time costs

#### Usage Example

```typescript
import { buildSubscriptionTrimOpportunitiesForUser } from "@slimy/opps-runtime";
import type { RawSubscription } from "@slimy/opps-runtime";

// User provides their subscription data
const subscriptions: RawSubscription[] = [
  {
    id: "sub-1",
    name: "Netflix",
    category: "entertainment",
    monthlyCost: 15.99,
    lastUsedAt: "2024-05-01T00:00:00Z", // 6 months ago
  },
  {
    id: "sub-2",
    name: "GPT-5.1 Pro",
    category: "ai",
    monthlyCost: 25.00,
    lastUsedAt: "2024-11-15T00:00:00Z", // Recently used
  },
  {
    id: "sub-3",
    name: "Spotify",
    category: "entertainment",
    monthlyCost: 9.99,
    lastUsedAt: "2024-11-19T00:00:00Z", // Yesterday
  },
];

// Generate opportunities
const opportunities = buildSubscriptionTrimOpportunitiesForUser(
  "user-123",
  subscriptions,
  {
    rarelyUsedThresholdDays: 90,
    highCostThreshold: 20,
  }
);

// Result: Array of Opportunity objects
// - opportunities[0]: Suggest canceling Netflix (not used in 180+ days)
// - opportunities[1]: Suggest downgrading GPT-5.1 Pro (high cost AI subscription)
// - opportunities[2]: Monitor Spotify (low cost, actively used)
```

#### Suggestion Heuristics

The module uses the following simple heuristics:

1. **Cancel Suggestion**
   - Triggered when: `lastUsedAt` is older than `rarelyUsedThresholdDays` (default: 90 days)
   - Estimated savings: Full `monthlyCost`

2. **Downgrade Suggestion**
   - Triggered when: Recently used AND `monthlyCost` > `highCostThreshold` (default: $20) AND category is "ai" or "productivity"
   - Estimated savings: 50% of `monthlyCost` (rough estimate)

3. **Monitor Suggestion**
   - Triggered when: Neither of the above conditions are met
   - Estimated savings: $0

#### Configuration Options

```typescript
interface SubscriptionTrimOptions {
  rarelyUsedThresholdDays?: number; // Default: 90 days
  highCostThreshold?: number;        // Default: $20
}
```

#### Data Types

**RawSubscription**

```typescript
interface RawSubscription {
  id: string;
  name: string;
  category?: "ai" | "entertainment" | "productivity" | "gaming" | "other";
  monthlyCost: number;
  lastUsedAt?: string | null; // ISO timestamp or null if unknown
  notes?: string;
}
```

**SubscriptionTrimSuggestion**

```typescript
interface SubscriptionTrimSuggestion {
  subscription: RawSubscription;
  suggestionType: "cancel" | "downgrade" | "monitor";
  estimatedSavingsMonthly: number;
  reasoning: string;
}
```

#### Limitations

- **No automatic data collection**: Users must manually provide their subscription data
- **No real bank integration**: This is intentional for the experimental phase
- **Simple heuristics**: The suggestion engine uses basic rules and may not capture complex usage patterns
- **No external API calls**: All processing is done locally with user-provided data

#### Future Enhancements

Potential future improvements (not implemented yet):

- Integration with opps-api to accept subscription data via HTTP endpoint
- More sophisticated ML-based usage prediction
- Integration with calendar/activity data for better usage detection
- Support for family/shared subscriptions

## Testing

Run tests with:

```bash
pnpm test
```

## Status

**Experimental** - This package is part of the experimental opps stack and is subject to change.
