# Chunk 4 — Secondary Commands Scope Inventory

## Date: 2026-04-16

## Baseline
- Tests: 99/99 passing
- ESLint: 0 errors, 0 warnings
- Build: clean
- Pre-commit: working

## Scope: Secondary Commands (already ported, no tests)

| # | Command | File | Lines | Category | Pre-done? |
|---|---------|------|-------|----------|-----------|
| 1 | export | src/commands/export.ts | 146 | Utility | NO — needs test |
| 2 | diag | src/commands/diag.ts | 156 | Admin | NO — needs test |
| 3 | stats | src/commands/stats.ts | 128 | Utility | NO — needs test |
| 4 | leaderboard | src/commands/leaderboard.ts | 112 | Utility | NO — needs test |
| 5 | usage | src/commands/usage.ts | 183 | Admin | NO — needs test |
| 6 | personality-config | src/commands/personality-config.ts | 189 | Admin | NO — needs test |
| 7 | dream | src/commands/dream.ts | 209 | User-facing | NO — needs test |
| 8 | mode | src/commands/mode.ts | 443 | Admin | NO — needs test |
| 9 | club-stats | src/commands/club-stats.ts | 138 | Utility | NO — needs test |
| 10 | club-admin | src/commands/club-admin.ts | 373 | Admin | NO — needs test |
| 11 | farming | src/commands/farming.ts | 251 | Utility | NO — needs test |

## Excluded (Chunk 5+ scope — CRITICAL commands)
- chat.ts (109 lines) — depends on llm-fallback, chat-shared, modes, persona
- remember.ts (132 lines) — data-mutating, depends on database, memory
- forget.ts (83 lines) — data-mutating, depends on database, memory
- consent.ts (116 lines) — data-mutating, depends on database, memory
- snail.ts (221 lines) — complex vision + approval flow

## Excluded (already tested)
- club-analyze.ts — tested (Chunk 3)
- club-analyze-context.ts — tested (Chunk 3)
- club-push.ts — tested (Chunk 3)
- club-staging.ts (service) — tested
- roster-ocr.ts (service) — tested
- logger.ts (lib) — tested
- errorHandler.ts (lib) — tested

## Excluded (not a slash command)
- health.ts — legacy prefix command, not registered

## Total Items
- CHUNK4_ITEMS_TOTAL: 11
- CHUNK4_ITEMS_PREDONE: 0
- CHUNK4_ITEMS_TODO: 11
