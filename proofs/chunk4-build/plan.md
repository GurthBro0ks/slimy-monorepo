# Chunk 4 — Build Plan

## Order: simplest first

### Phase 1: Simple read-only commands (quick wins)

#### 1.1 export.ts
- **What:** Test memory export to JSON file
- **Tests:** happy path with memories, empty memories, database fallback to memoryStore, large payload path
- **Mocks:** database, memoryStore

#### 1.2 diag.ts
- **What:** Test diagnostics embed generation
- **Tests:** database connected, database not configured, database error, metrics present
- **Mocks:** database, metrics

#### 1.3 stats.ts
- **What:** Test user stats display
- **Tests:** own stats, other user with admin perms, other user denied, error handling (ECONNREFUSED, auth)
- **Mocks:** mcpClient

#### 1.4 leaderboard.ts
- **What:** Test snail leaderboard display
- **Tests:** with data, empty leaderboard, DM (no guild), error handling
- **Mocks:** mcpClient

### Phase 2: Admin-gated commands

#### 2.1 usage.ts
- **What:** Test OpenAI usage/costs display
- **Tests:** permission denied, happy path with data, empty data, invalid date range
- **Mocks:** usage-openai (parseWindow, fetchOpenAIUsage, fetchLocalImageStats, aggregateUsage, PRICING)

#### 2.2 personality-config.ts
- **What:** Test personality config subcommands
- **Tests:** permission denied, view, adjust, test, analytics
- **Mocks:** personalityEngine, personality-store

#### 2.3 dream.ts
- **What:** Test image generation command
- **Tests:** rate limited, no API key, successful generation, generation failure, style selection
- **Mocks:** rate-limiter, images, modes, metrics

### Phase 3: Complex commands

#### 3.1 mode.ts
- **What:** Test mode management subcommands
- **Tests:** set, view, list, clear, unknown subcommand
- **Mocks:** mode-store

#### 3.2 club-stats.ts
- **What:** Test club stats command
- **Tests:** permission denied, no database, happy path with data, CSV format, empty data
- **Mocks:** database, club-stats-service, metrics

#### 3.3 club-admin.ts
- **What:** Test club admin subcommands
- **Tests:** aliases view, stats view, stats url update, correct, rollback, export
- **Mocks:** database, club-store, club-corrections, guild-settings, week-anchor, metrics

#### 3.4 farming.ts
- **What:** Test airdrop farming subcommands
- **Tests:** trigger (dry/live), status, log, airdrops, API error
- **Mocks:** fetch (global)

## Integration points
- All commands use module.exports pattern (CJS interop)
- All import from ../lib/*.js with .js extension
- Tests must use vi.mock with hoisted mocks before import

## Items NOT pulled forward from Chunk 5/6
- chat, remember, forget, consent, snail — all stay in Chunk 5
