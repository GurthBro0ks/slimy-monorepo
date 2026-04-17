# Chunk 5 Scope — Utilities/Helpers

## Baseline
- Tests: 176/176 passing
- ESLint: 0 errors, 0 warnings
- Build: clean
- Pre-commit: working

## Scope Items (14 modules)

### Tier 1: Pure Functions (no external deps, no I/O)
| # | Module | Status | Tests Needed |
|---|--------|--------|--------------|
| 1 | lib/numparse.ts | MISSING | parsePower, normalizeOCR, suffix notation |
| 2 | lib/text-format.ts | MISSING | trimForDiscord, formatChatDisplay |
| 3 | lib/week-anchor.ts | MISSING | getWeekId, getLastAnchor, getNextAnchor, formatAnchorDisplay |
| 4 | lib/image-intent.ts | MISSING | detectImageIntent |
| 5 | lib/rate-limiter.ts | MISSING | checkCooldown, checkGlobalCooldown, resetCooldown |
| 6 | lib/metrics.ts | MISSING | trackCommand, trackError, getStats, reset |
| 7 | lib/message-queue.ts | MISSING | createQueue, enqueue, concurrency |
| 8 | lib/chat-shared.ts | MISSING | autoDetectMode, cleanupOldHistories |
| 9 | lib/usage-openai.ts | MISSING | calculateTokenCost, calculateImageCost, parseWindow, aggregateUsage |

### Tier 2: Stateful but Testable (temp files or in-memory)
| # | Module | Status | Tests Needed |
|---|--------|--------|--------------|
| 10 | lib/memory.ts | MISSING | setConsent/getConsent, memo CRUD, channelModes, sanitizeModes |
| 11 | lib/personality-engine.ts | MISSING | parsePersonalityMarkdown, extractSections, buildPrompt |
| 12 | lib/personality-store.ts | MISSING | setAdjustment, clearAdjustment, loadAdjustments, mergeAdjustments |

### Tier 3: Partially Testable (pure helper functions only)
| # | Module | Status | Tests Needed |
|---|--------|--------|--------------|
| 13 | lib/guild-settings.ts | MISSING | extractSheetId, normalizeSheetInput (pure functions only) |
| 14 | lib/modes.ts | MISSING | emptyState, combineModes, MODE_KEYS constants |

### Excluded (Chunk 6+)
- utils/xlsx-export.ts — stub
- utils/snail-stats.ts — complex DB integration
- lib/llm-fallback.ts — external API calls, test in Chunk 6
- lib/openai.ts — external API
- lib/database.ts — DB connection
- lib/mcp-client.ts — external API
- lib/health-server.ts — HTTP server
- lib/images.ts — external API
- lib/snail-vision.ts — external API
- lib/club-*.ts — already tested via commands
- handlers/mention.ts — complex Discord integration
- handlers/snail-auto-detect.ts — Discord event handler
- services/club-analyze-flow.ts — integration service
