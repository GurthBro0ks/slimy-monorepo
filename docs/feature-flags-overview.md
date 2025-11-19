# Feature Flags Overview

## Purpose

Feature flags (also called feature toggles) allow us to control feature availability at runtime without deploying new code. This enables:

- **Safe rollouts**: Deploy code behind a flag, enable for subset of users
- **A/B testing**: Compare different implementations
- **Kill switches**: Quickly disable problematic features
- **Development isolation**: Work on incomplete features in main branch

## Architecture

### Flag Storage Locations

Our feature flag system supports multiple storage backends:

#### 1. Environment Variables (Simple, Static)
Best for: Server-side flags that rarely change, deployment-specific configuration

```bash
FF_SNAIL_NEW_UI=true
FF_SNAIL_PREMIUM_GUILDS=false
FF_SNAIL_ANALYTICS_V2=true
```

**Pros**: Simple, no external dependencies, works in all environments
**Cons**: Requires restart to change, not suitable for dynamic rollouts

#### 2. JSON Configuration Files (Local, Version-Controlled)
Best for: Development/staging environments, default flag values

```json
{
  "FF_SNAIL_NEW_UI": {
    "enabled": true,
    "rollout": 100
  },
  "FF_SNAIL_PREMIUM_GUILDS": {
    "enabled": true,
    "allowlist": ["guild_123", "guild_456"]
  }
}
```

**Pros**: Version controlled, easy to review changes, structured data
**Cons**: Requires deployment to change, limited runtime flexibility

#### 3. Remote Service (Dynamic, Production)
Best for: Production gradual rollouts, real-time toggling

Future integration with services like:
- LaunchDarkly
- Unleash
- Custom Redis/database backend

**Pros**: Real-time updates, percentage rollouts, user targeting
**Cons**: External dependency, network latency, complexity

### Current Implementation

The initial `@slimy/feature-flags` package implements an **in-memory store** that can be loaded from:
1. Environment variables (prefix `FF_`)
2. JSON object passed at initialization
3. Combination of both (JSON provides defaults, env vars override)

## Naming Conventions

### Flag Name Format

```
FF_<PRODUCT>_<FEATURE_NAME>
```

Examples:
- `FF_SNAIL_NEW_UI` - New UI redesign for SNail
- `FF_SNAIL_PREMIUM_GUILDS` - Premium guild features
- `FF_CODES_BATCH_IMPORT` - Batch code import feature
- `FF_ADMIN_ANALYTICS_V2` - New analytics dashboard

### Guidelines

1. **Prefix**: Always start with `FF_` for easy identification
2. **Product**: Use product/app name (SNAIL, CODES, ADMIN, etc.)
3. **Feature**: Descriptive name in SCREAMING_SNAKE_CASE
4. **Be specific**: `FF_SNAIL_NEW_DASHBOARD` better than `FF_SNAIL_NEW_FEATURE`
5. **Avoid negatives**: `FF_SNAIL_NEW_EDITOR` not `FF_SNAIL_DISABLE_OLD_EDITOR`

### TypeScript Type Safety

Define flag names as a union type for compile-time safety:

```typescript
export type FeatureFlag =
  | 'FF_SNAIL_NEW_UI'
  | 'FF_SNAIL_PREMIUM_GUILDS'
  | 'FF_CODES_BATCH_IMPORT'
  | 'FF_ADMIN_ANALYTICS_V2';
```

## Rollout Strategies

### 1. Binary Toggle (On/Off)

Simplest approach: feature is fully on or fully off for everyone.

```typescript
if (isEnabled('FF_SNAIL_NEW_UI')) {
  return <NewDashboard />;
}
return <OldDashboard />;
```

**Use cases**:
- Kill switches
- Internal beta features
- A/B tests with manual assignment

### 2. Percentage Rollout

Gradually enable for N% of users based on deterministic hashing.

```json
{
  "FF_SNAIL_NEW_UI": {
    "enabled": true,
    "rollout": 25
  }
}
```

```typescript
// 25% of users see new UI, consistent per user
isEnabled('FF_SNAIL_NEW_UI', { userId: 'user_123' })
```

**Use cases**:
- Gradual production rollouts (1% → 10% → 50% → 100%)
- Load testing new features
- Risk mitigation for major changes

**Implementation**: Hash `userId` modulo 100, compare to rollout percentage

### 3. Allowlist (Explicit Users/Guilds)

Enable only for specific entities in an allowlist.

```json
{
  "FF_SNAIL_PREMIUM_GUILDS": {
    "enabled": true,
    "allowlist": ["guild_abc123", "guild_xyz789"]
  }
}
```

```typescript
isEnabled('FF_SNAIL_PREMIUM_GUILDS', { guildId: 'guild_abc123' }) // true
isEnabled('FF_SNAIL_PREMIUM_GUILDS', { guildId: 'guild_other' })  // false
```

**Use cases**:
- Beta testing with specific customers
- Premium/enterprise features
- Internal dogfooding

### 4. Blocklist (Explicit Exclusions)

Enable for everyone except specific entities.

```json
{
  "FF_SNAIL_NEW_ANALYTICS": {
    "enabled": true,
    "rollout": 100,
    "blocklist": ["guild_problematic"]
  }
}
```

**Use cases**:
- Excluding users with compatibility issues
- Temporary workarounds for specific customers

### 5. Compound Strategies

Combine multiple strategies for complex rollouts:

```json
{
  "FF_SNAIL_NEW_UI": {
    "enabled": true,
    "rollout": 10,
    "allowlist": ["internal_team_guild"],
    "blocklist": ["known_problem_guild"]
  }
}
```

**Evaluation order**:
1. Is flag globally enabled? If not, return false
2. Is entity in blocklist? If yes, return false
3. Is entity in allowlist? If yes, return true
4. Does entity hash pass rollout percentage? Return result

## Context Objects

Provide context to enable user/guild-specific evaluation:

```typescript
type FlagContext = {
  userId?: string;
  guildId?: string;
  sessionId?: string;
  environment?: 'development' | 'staging' | 'production';
  [key: string]: any;
};

// Usage
isEnabled('FF_SNAIL_NEW_UI', {
  userId: 'user_123',
  guildId: 'guild_abc',
  environment: 'production'
})
```

## Best Practices

### 1. Flag Lifecycle

```
Created → Enabled (partial) → Enabled (100%) → Removed
```

- **Create**: Add flag, default to disabled
- **Rollout**: Gradually increase percentage
- **Stabilize**: Monitor metrics, iterate
- **Complete**: Set to 100%, eventually remove flag and dead code
- **Clean up**: Remove flag checks after feature is stable (typically 1-2 releases)

### 2. Flag Hygiene

- Review flags monthly, remove unused flags
- Document flag purpose and owner in code comments
- Set expiration dates for temporary flags
- Track flag usage with metrics

### 3. Testing

- Test both enabled and disabled states
- Test rollout boundaries (0%, 1%, 50%, 99%, 100%)
- Test with missing context (graceful degradation)

### 4. Monitoring

- Log flag evaluations in development
- Track flag usage metrics in production
- Alert on unexpected flag evaluation patterns

## Migration Path

### Phase 1 (Current): In-Memory + Env
- Package implemented
- Load from env vars and JSON
- Use in local development

### Phase 2: Remote Service Integration
- Add Redis/database backend for dynamic updates
- Implement admin UI for flag management
- Add flag change history/audit log

### Phase 3: Advanced Features
- A/B test framework integration
- User segmentation
- Real-time flag updates via WebSocket
- Flag analytics dashboard

## Security Considerations

1. **Client-side flags**: Assume users can see all flag names/values
2. **Sensitive flags**: Keep server-side only
3. **Access control**: Limit who can toggle production flags
4. **Audit logging**: Track all flag changes in production

## Example Usage

```typescript
import { isEnabled } from '@slimy/feature-flags';

// Simple toggle
if (isEnabled('FF_SNAIL_NEW_UI')) {
  console.log('New UI enabled');
}

// User-specific rollout
function renderDashboard(userId: string) {
  if (isEnabled('FF_SNAIL_NEW_DASHBOARD', { userId })) {
    return <NewDashboard />;
  }
  return <OldDashboard />;
}

// Guild allowlist
function canAccessPremium(guildId: string) {
  return isEnabled('FF_SNAIL_PREMIUM_GUILDS', { guildId });
}
```

## References

- [Feature Toggles (Martin Fowler)](https://martinfowler.com/articles/feature-toggles.html)
- [Feature Flag Best Practices](https://launchdarkly.com/blog/feature-flag-best-practices/)
