# @slimy-monorepo/test-fixtures

Reusable test data and fixture library for the slimy-monorepo.

## Overview

This package provides strongly-typed factory functions and canned constants for testing:
- **Snails** - SnailEvent fixtures
- **Guilds** - Discord guild fixtures
- **Users** - User profile fixtures
- **Minecraft Stats** - Game statistics and screenshot analysis fixtures

All fixtures are **pure and deterministic** - no network calls, no side effects.

## Installation (Future)

> **Note:** This library has been scaffolded but not yet integrated into the monorepo build system.
> No existing tests have been modified to use it yet.

Once integrated, you would install it like this:

```bash
# In another package within the monorepo
pnpm add @slimy-monorepo/test-fixtures --workspace
```

## Usage Examples

### Importing Fixtures

```typescript
import {
  // Snail fixtures
  makeSnailEvent,
  DEMO_SNAIL_MAXED,
  DEMO_SNAIL_BEGINNER,

  // Guild fixtures
  makeGuild,
  DEMO_GUILD_SMALL,
  DEMO_GUILD_LARGE,

  // User fixtures
  makeUser,
  DEMO_USER_PREMIUM,
  DEMO_USER_NEW,

  // Minecraft stats fixtures
  makeStat,
  makeScreenshotAnalysis,
  DEMO_STAT_HIGH_KILLS,
  DEMO_SCREENSHOT_LEADERBOARD,
} from '@slimy-monorepo/test-fixtures';
```

### Factory Functions

Factory functions create objects with sensible defaults. You can override any field:

```typescript
// Create a user with defaults
const user1 = makeUser();
// => { id: 'user-1', discordId: '987654321098765432', username: 'testuser', ... }

// Override specific fields
const user2 = makeUser({
  username: 'custom_user',
  globalName: 'Custom User'
});

// Create a guild with custom settings
const guild = makeGuild({
  name: 'My Test Guild',
  settings: { prefix: '?', language: 'es' }
});

// Create a stat with custom type and value
const stat = makeStat({
  type: 'minecraft_kills',
  value: 500
});
```

### Canned Constants

Use pre-defined constants for common test scenarios:

```typescript
describe('User tests', () => {
  it('should handle premium users', () => {
    const user = DEMO_USER_PREMIUM;
    expect(user.username).toBe('snailmaster');
    expect(user.globalName).toBe('Snail Master');
  });

  it('should handle new users', () => {
    const user = DEMO_USER_NEW;
    expect(user.avatar).toBeNull();
  });
});

describe('Guild tests', () => {
  it('should handle large guilds', () => {
    const guild = DEMO_GUILD_LARGE;
    expect(guild.settings?.features).toContain('tournaments');
  });
});

describe('Screenshot analysis tests', () => {
  it('should handle leaderboard screenshots', () => {
    const analysis = DEMO_SCREENSHOT_LEADERBOARD;
    expect(analysis.screenshotType).toBe('leaderboard');
    expect(analysis.confidence).toBeGreaterThan(0.9);
  });
});
```

## Available Fixtures

### Snails (`src/snails.ts`)

**Factory:**
- `makeSnailEvent(overrides?)` - Create a SnailEvent

**Constants:**
- `DEMO_SNAIL_MAXED` - Championship-level event
- `DEMO_SNAIL_BEGINNER` - Tutorial event
- `DEMO_SNAIL_RARE_EVENT` - Special event

### Guilds (`src/guilds.ts`)

**Factory:**
- `makeGuild(overrides?)` - Create a Guild

**Constants:**
- `DEMO_GUILD_SMALL` - Small community guild
- `DEMO_GUILD_LARGE` - Large guild with full settings
- `DEMO_GUILD_NO_SETTINGS` - Guild with null settings
- `DEMO_GUILD_NEW` - Freshly created guild

### Users (`src/users.ts`)

**Factory:**
- `makeUser(overrides?)` - Create a User

**Constants:**
- `DEMO_USER_PREMIUM` - Premium user with full profile
- `DEMO_USER_NEW` - New user with minimal profile
- `DEMO_USER_NO_USERNAME` - User with no username
- `DEMO_USER_MODERATOR` - Moderator user
- `DEMO_USER_ADMIN` - Admin user

### Minecraft Stats (`src/minecraft.ts`)

**Factories:**
- `makeStat(overrides?)` - Create a Stat
- `makeScreenshotAnalysis(overrides?)` - Create a ScreenshotAnalysis
- `makeScreenshotData(overrides?)` - Create ScreenshotData

**Stat Constants:**
- `DEMO_STAT_HIGH_KILLS` - High kill count stat
- `DEMO_STAT_PLAYTIME` - Playtime hours stat
- `DEMO_STAT_ACHIEVEMENTS` - Achievements stat

**Screenshot Constants:**
- `DEMO_SCREENSHOT_LEADERBOARD` - High-confidence leaderboard analysis
- `DEMO_SCREENSHOT_ACHIEVEMENT` - Achievement unlock analysis
- `DEMO_SCREENSHOT_LOW_CONFIDENCE` - Low-quality screenshot
- `DEMO_SCREENSHOT_PROFILE` - Detailed profile analysis

**Screenshot Data Constants:**
- `DEMO_SCREENSHOT_DATA_LEVEL` - Level data point
- `DEMO_SCREENSHOT_DATA_RANK` - Rank data point

## Type Definitions

All fixtures export their TypeScript interfaces:

```typescript
import type {
  SnailEvent,
  Guild,
  User,
  Stat,
  ScreenshotAnalysis,
  ScreenshotType,
  ScreenshotData
} from '@slimy-monorepo/test-fixtures';
```

## Design Principles

1. **Pure Functions** - No side effects, network calls, or database access
2. **Deterministic** - Same input always produces same output
3. **Type-Safe** - Full TypeScript support with exported interfaces
4. **Composable** - Factory functions with override support
5. **Realistic** - Fixtures based on actual Prisma models and app types

## Integration Status

**⚠️ NOT YET INTEGRATED**

This library has been scaffolded but is not yet wired into any existing tests. To integrate:

1. Add to monorepo workspace configuration (pnpm-workspace.yaml)
2. Build the package: `cd packages/test-fixtures && pnpm build`
3. Import in test files: `import { makeUser } from '@slimy-monorepo/test-fixtures'`
4. Update existing tests to use fixtures instead of inline test data

## Future Enhancements

Potential additions:
- Session fixtures
- ChatMessage fixtures
- AuditLog fixtures
- Conversation fixtures
- ClubAnalysis fixtures
- Helper utilities for common test patterns
- Builders for complex nested objects
- Array generators for bulk test data

## License

MIT
