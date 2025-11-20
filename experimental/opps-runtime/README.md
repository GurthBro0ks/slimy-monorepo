# @slimy/opps-runtime

Runtime utilities for the Opportunity Radar system.

## Overview

This package provides runtime utilities for managing and analyzing opportunities in the slimy-monorepo experimental Opportunity Radar stack. It currently includes user interaction history tracking and basic analytics capabilities.

## Features

### User History & Analytics

The history layer tracks user interactions with opportunities and provides basic analytics to infer user preferences. This functionality is currently a standalone library and is **not yet wired into the opps-api, Discord bot, or UI**.

#### What it does:

- **Event Tracking**: Records user actions on opportunities (shown, accepted, completed, ignored)
- **History Storage**: In-memory storage of user interaction events
- **Analytics**: Basic preference inference from user behavior
  - Domain preferences (crypto, stocks, real-estate, etc.)
  - Type preferences (investment, trade, learning, etc.)
  - Risk tolerance inference (low, medium, high)

#### Components:

1. **Types** (`src/history/types.ts`)
   - `UserOpportunityEvent`: Represents a single user action
   - `UserOpportunityAction`: Action types (shown, accepted, completed, ignored)
   - `UserHistorySnapshot`: Complete history for a user

2. **In-Memory Store** (`src/history/inMemoryHistoryStore.ts`)
   - `InMemoryUserHistoryStore`: Simple storage implementation
   - Not suitable for production (data lost on restart)
   - Provides CRUD operations for event tracking

3. **Analytics** (`src/history/analytics.ts`)
   - `inferBasicPreferencesFromHistory()`: Analyzes user history to infer preferences
   - Uses simple heuristics (positive vs negative action ratios)
   - Returns domain preferences, type preferences, and risk tolerance

4. **Factories** (`src/history/factories.ts`)
   - `createUserEvent()`: Helper for creating test events
   - `createUserEvents()`: Bulk event creation for tests

## Usage

```typescript
import {
  InMemoryUserHistoryStore,
  createUserEvent,
  inferBasicPreferencesFromHistory,
} from "@slimy/opps-runtime";

// Create a store
const store = new InMemoryUserHistoryStore();

// Log an event
store.logEvent(
  createUserEvent({
    userId: "user-123",
    opportunityId: "opp-456",
    action: "accepted",
    metadata: {
      domain: "crypto",
      type: "investment",
      riskLevel: "high",
    },
  })
);

// Get user history
const history = store.getHistoryForUser("user-123");

// Infer preferences
const preferences = inferBasicPreferencesFromHistory(history);
console.log(preferences.prefersDomains); // e.g., ["crypto"]
console.log(preferences.inferredRiskTolerance); // e.g., "high"
```

## Testing

Run all tests:
```bash
pnpm test
```

Run only history tests:
```bash
pnpm test:history
```

Or from the repository root:
```bash
cd experimental/opps-runtime
pnpm test
```

## Development Status

**Current Status**: Library implementation complete, not integrated

**Next Steps**:
- Wire into opps-api for actual opportunity tracking
- Add Discord bot commands for viewing user history
- Integrate analytics into opportunity recommendations
- Consider database-backed storage for production use

## Package Structure

```
experimental/opps-runtime/
├── src/
│   ├── history/
│   │   ├── types.ts              # Type definitions
│   │   ├── inMemoryHistoryStore.ts  # Storage implementation
│   │   ├── analytics.ts          # Preference inference
│   │   └── factories.ts          # Test helpers
│   └── index.ts                  # Public exports
├── tests/
│   └── history.test.ts           # Comprehensive tests
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- `@slimy/opps-core`: Core type definitions (OpportunityDomain, OpportunityType, RiskLevel)

## License

Private package - part of slimy-monorepo
