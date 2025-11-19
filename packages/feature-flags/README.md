# @slimy/feature-flags

Type-safe feature flag system for gradual rollouts, A/B testing, and feature gating in the slimy-monorepo.

## Overview

This package provides a lightweight, type-safe feature flag implementation with support for:

- **Type safety**: Define flags as a union type for compile-time checking
- **Multiple storage**: Load from environment variables or JSON configuration
- **Rollout strategies**: Percentage rollouts, allowlists, blocklists
- **Context-aware**: Target specific users, guilds, or sessions
- **Zero dependencies**: Simple in-memory implementation

For architecture details and best practices, see [docs/feature-flags-overview.md](../../docs/feature-flags-overview.md).

## Installation

```bash
# Already available as a workspace package
pnpm add @slimy/feature-flags
```

## Quick Start

### 1. Initialize Flags

```typescript
import { initializeFlags, loadFlagsFromEnv } from '@slimy/feature-flags';

// Option A: Load from JSON configuration
initializeFlags({
  FF_SNAIL_NEW_UI: { enabled: true, rollout: 50 },
  FF_SNAIL_PREMIUM_GUILDS: { enabled: true, allowlist: ['guild_123'] },
  FF_CODES_BATCH_IMPORT: false,
});

// Option B: Load from environment variables
loadFlagsFromEnv();

// Option C: Combine both (JSON as defaults, env vars override)
initializeFlags({
  FF_SNAIL_NEW_UI: { enabled: false },
});
loadFlagsFromEnv(process.env, true); // override=true
```

### 2. Check Flags

```typescript
import { isEnabled } from '@slimy/feature-flags';

// Simple check
if (isEnabled('FF_SNAIL_NEW_UI')) {
  console.log('New UI is enabled');
}

// With user context for percentage rollout
if (isEnabled('FF_SNAIL_NEW_UI', { userId: 'user_123' })) {
  return <NewDashboard />;
}

// With guild context for allowlist
if (isEnabled('FF_SNAIL_PREMIUM_GUILDS', { guildId: 'guild_abc' })) {
  return <PremiumFeatures />;
}
```

## Usage Examples

### Basic Toggle

Enable/disable a feature for everyone:

```typescript
import { setFlag, isEnabled } from '@slimy/feature-flags';

// Enable for everyone
setFlag('FF_SNAIL_NEW_UI', true);

// Disable for everyone
setFlag('FF_SNAIL_NEW_UI', false);

// Check
if (isEnabled('FF_SNAIL_NEW_UI')) {
  console.log('Feature is on');
}
```

### Percentage Rollout

Gradually roll out to N% of users:

```typescript
import { initializeFlags, isEnabled } from '@slimy/feature-flags';

// Enable for 25% of users
initializeFlags({
  FF_SNAIL_NEW_UI: {
    enabled: true,
    rollout: 25,
  },
});

// Check - same user always gets same result (deterministic)
function renderDashboard(userId: string) {
  if (isEnabled('FF_SNAIL_NEW_UI', { userId })) {
    return <NewDashboard />;
  }
  return <OldDashboard />;
}
```

The rollout is deterministic based on a hash of the identifier, so the same user will always get the same experience.

### Allowlist (Beta Users)

Enable only for specific users or guilds:

```typescript
import { initializeFlags, isEnabled } from '@slimy/feature-flags';

initializeFlags({
  FF_SNAIL_PREMIUM_GUILDS: {
    enabled: true,
    allowlist: ['guild_abc123', 'guild_xyz789', 'guild_internal'],
  },
});

function canAccessPremiumFeatures(guildId: string): boolean {
  return isEnabled('FF_SNAIL_PREMIUM_GUILDS', { guildId });
}

// Usage
if (canAccessPremiumFeatures('guild_abc123')) {
  // true - in allowlist
}
if (canAccessPremiumFeatures('guild_other')) {
  // false - not in allowlist
}
```

### Blocklist (Exclusions)

Enable for everyone except specific entities:

```typescript
initializeFlags({
  FF_SNAIL_NEW_ANALYTICS: {
    enabled: true,
    rollout: 100,
    blocklist: ['guild_problematic', 'user_incompatible'],
  },
});

// Everyone gets the feature except those in blocklist
function showAnalytics(userId: string, guildId: string): boolean {
  return isEnabled('FF_SNAIL_NEW_ANALYTICS', { userId, guildId });
}
```

### Compound Strategy

Combine multiple strategies:

```typescript
initializeFlags({
  FF_SNAIL_NEW_UI: {
    enabled: true,
    rollout: 10, // 10% of general population
    allowlist: ['internal_team_guild'], // Always on for internal team
    blocklist: ['known_bug_guild'], // Never on for this guild
  },
});

// Evaluation order:
// 1. Blocklist check (highest priority)
// 2. Allowlist check
// 3. Percentage rollout
// 4. Global enabled state
```

### React Component Example

Gate a new feature behind a flag:

```typescript
import { isEnabled } from '@slimy/feature-flags';
import { useUser } from '../hooks/useUser';

export function Dashboard() {
  const user = useUser();

  // Check flag with user context
  const showNewUI = isEnabled('FF_SNAIL_NEW_UI', {
    userId: user.id,
    guildId: user.currentGuildId,
  });

  if (showNewUI) {
    return <NewDashboard user={user} />;
  }

  return <OldDashboard user={user} />;
}
```

### Server-Side API Example

Control feature availability in API endpoints:

```typescript
import { isEnabled } from '@slimy/feature-flags';
import { Request, Response } from 'express';

export async function handleBatchImport(req: Request, res: Response) {
  const userId = req.user.id;

  // Check if batch import is enabled for this user
  if (!isEnabled('FF_CODES_BATCH_IMPORT', { userId })) {
    return res.status(403).json({
      error: 'Batch import is not available',
    });
  }

  // Feature is enabled, proceed
  const result = await batchImportCodes(req.body);
  return res.json(result);
}
```

### Custom Hook (React)

Create a reusable hook for flag checks:

```typescript
import { isEnabled, type FeatureFlag } from '@slimy/feature-flags';
import { useUser } from './useUser';

/**
 * Hook to check feature flags with current user context
 */
export function useFeatureFlag(flagName: FeatureFlag): boolean {
  const user = useUser();

  return isEnabled(flagName, {
    userId: user?.id,
    guildId: user?.currentGuildId,
  });
}

// Usage in components
function MyComponent() {
  const hasNewUI = useFeatureFlag('FF_SNAIL_NEW_UI');
  const hasPremium = useFeatureFlag('FF_SNAIL_PREMIUM_GUILDS');

  return (
    <div>
      {hasNewUI && <NewFeature />}
      {hasPremium && <PremiumBadge />}
    </div>
  );
}
```

### Environment Variables

Load flags from environment variables:

```bash
# .env file
FF_SNAIL_NEW_UI=true
FF_SNAIL_PREMIUM_GUILDS=false
FF_CODES_BATCH_IMPORT=true

# Or JSON for complex config
FF_SNAIL_NEW_UI='{"enabled":true,"rollout":50}'
```

```typescript
import { loadFlagsFromEnv } from '@slimy/feature-flags';

// Load all FF_* environment variables
loadFlagsFromEnv();
```

### Testing

Set flags explicitly in tests:

```typescript
import { setFlag, clearFlags, isEnabled } from '@slimy/feature-flags';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Dashboard', () => {
  beforeEach(() => {
    clearFlags(); // Reset before each test
  });

  it('renders new UI when flag is enabled', () => {
    setFlag('FF_SNAIL_NEW_UI', true);

    const result = renderDashboard('user_123');

    expect(result).toContain('New Dashboard');
  });

  it('renders old UI when flag is disabled', () => {
    setFlag('FF_SNAIL_NEW_UI', false);

    const result = renderDashboard('user_123');

    expect(result).toContain('Old Dashboard');
  });

  it('respects percentage rollout', () => {
    setFlag('FF_SNAIL_NEW_UI', {
      enabled: true,
      rollout: 50,
    });

    // Test determinism - same user always gets same result
    const result1 = isEnabled('FF_SNAIL_NEW_UI', { userId: 'user_123' });
    const result2 = isEnabled('FF_SNAIL_NEW_UI', { userId: 'user_123' });

    expect(result1).toBe(result2);
  });
});
```

### Debugging

Use the debug helper to understand flag evaluation:

```typescript
import { debugFlag } from '@slimy/feature-flags';

const debug = debugFlag('FF_SNAIL_NEW_UI', { userId: 'user_123' });

console.log(debug);
// {
//   configured: true,
//   config: { enabled: true, rollout: 50 },
//   result: true,
//   reason: 'Rollout 50%, identifier user_123 passes'
// }
```

## API Reference

### Types

```typescript
type FeatureFlag =
  | 'FF_SNAIL_NEW_UI'
  | 'FF_SNAIL_PREMIUM_GUILDS'
  | 'FF_SNAIL_ANALYTICS_V2'
  | 'FF_CODES_BATCH_IMPORT'
  | 'FF_ADMIN_DASHBOARD_V2';

type FlagContext = {
  userId?: string;
  guildId?: string;
  sessionId?: string;
  environment?: 'development' | 'staging' | 'production';
  [key: string]: any;
};

type FlagConfig = {
  enabled: boolean;
  rollout?: number;
  allowlist?: string[];
  blocklist?: string[];
  description?: string;
};
```

### Functions

#### `initializeFlags(config: FlagStore): void`

Initialize the flag store from a configuration object.

#### `loadFlagsFromEnv(env?: Record<string, string | undefined>, override?: boolean): void`

Load flags from environment variables prefixed with `FF_`.

#### `setFlag(flagName: FeatureFlag, config: FlagConfig | boolean): void`

Set a single flag configuration.

#### `isEnabled(flagName: FeatureFlag, context?: FlagContext): boolean`

Check if a feature flag is enabled for the given context.

#### `isDisabled(flagName: FeatureFlag, context?: FlagContext): boolean`

Check if a feature flag is disabled (inverse of `isEnabled`).

#### `getFlag(flagName: FeatureFlag): FlagConfig | undefined`

Get the current configuration for a flag.

#### `getAllFlags(): Map<FeatureFlag, FlagConfig>`

Get all configured flags.

#### `clearFlags(): void`

Clear all flags from the store.

#### `createFlagChecker(context: FlagContext): (flagName: FeatureFlag) => boolean`

Create a flag checker function bound to a specific context.

#### `debugFlag(flagName: FeatureFlag, context?: FlagContext): DebugInfo`

Get debug information about flag evaluation.

## Adding New Flags

To add a new flag:

1. **Add to type definition** in `src/index.ts`:

```typescript
export type FeatureFlag =
  | 'FF_SNAIL_NEW_UI'
  | 'FF_YOUR_NEW_FLAG' // Add here
  | 'FF_CODES_BATCH_IMPORT';
```

2. **Configure the flag**:

```typescript
initializeFlags({
  FF_YOUR_NEW_FLAG: {
    enabled: true,
    rollout: 0, // Start at 0%
    description: 'Description of what this flag controls',
  },
});
```

3. **Use in code**:

```typescript
if (isEnabled('FF_YOUR_NEW_FLAG', { userId })) {
  // New behavior
} else {
  // Old behavior
}
```

4. **Document**: Add to this README and update overview docs.

## Best Practices

1. **Always provide context** when checking flags that use rollout/targeting
2. **Clean up old flags** after features are stable (typically 1-2 releases)
3. **Test both states** - write tests for enabled and disabled cases
4. **Start small** - Begin with 0-1% rollout, gradually increase
5. **Monitor metrics** - Track feature usage and performance
6. **Use descriptive names** - `FF_SNAIL_NEW_CHECKOUT` not `FF_SNAIL_TEST`
7. **Avoid double negatives** - `FF_ENABLE_X` not `FF_DISABLE_X`

## Limitations

This is a simple in-memory implementation suitable for:
- Development and staging environments
- Static configuration that doesn't change at runtime
- Single-instance deployments

For production with dynamic updates, consider integrating a remote service like LaunchDarkly or Unleash (see Phase 2 in the overview docs).

## Future Enhancements

- Redis/database backend for multi-instance deployments
- Admin UI for managing flags
- Real-time updates via WebSocket
- A/B test analytics integration
- Audit logging for flag changes
- Scheduled flag changes

## License

MIT
