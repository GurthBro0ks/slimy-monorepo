# Chunk 5 Build Plan

## Order: simplest/purest first

### Batch 1: Pure functions (no side effects)
1. **numparse.ts** — parsePower: null/undefined, OCR normalization, suffix notation (K/M/B), grouped numbers, unparseable
2. **text-format.ts** — trimForDiscord (limit, under-limit, empty), formatChatDisplay (various combos)
3. **image-intent.ts** — detectImageIntent: triggers, non-triggers, empty string, key-missing
4. **week-anchor.ts** — getWeekId, getLastAnchor, getNextAnchor, formatAnchorDisplay with fixed reference dates
5. **usage-openai.ts** — calculateTokenCost, calculateImageCost, parseWindow, aggregateUsage

### Batch 2: Stateful in-memory modules
6. **metrics.ts** — trackCommand, trackError, getStats, reset (verify state accumulation + stats output)
7. **rate-limiter.ts** — checkCooldown (not limited → limited → expired), global, reset
8. **message-queue.ts** — createQueue, enqueue, concurrency control, order preservation
9. **chat-shared.ts** — autoDetectMode (keyword detection), cleanupOldHistories
10. **modes.ts** — emptyState, combineModes, MODE_KEYS verification

### Batch 3: File-based modules (temp directories)
11. **memory.ts** — consent, memos, channelModes (use tmp dir via SLIMY_MEMORY_DIR/FILE env)
12. **personality-store.ts** — set/clear/get/merge adjustments (mock fs or use temp dir)
13. **personality-engine.ts** — parsePersonalityMarkdown, extractSections, buildPrompt, fallbacks
14. **guild-settings.ts** — extractSheetId, normalizeSheetInput only (pure helpers)

## Integration Points
- numparse.ts is used by club-analyze/vision pipelines
- text-format.ts is used by chat/mention
- week-anchor.ts is used by club-stats
- metrics.ts is used by many commands
- rate-limiter.ts is used by command execution
- modes.ts is used by mode command + chat

## Rules
- Each test file: clean imports, no eslint-disable
- Mock external deps (Discord, DB, fs) only where necessary
- Preserve 176/176 baseline — zero regressions
- No TODO/FIXME stubs
