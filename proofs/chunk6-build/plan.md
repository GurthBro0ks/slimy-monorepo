# Chunk 6 Build Plan

## Order: Pure/internal first, external API last

### Phase 1: Deferred Bug Fixes (2 items)

1. **Fix memory.ts clearChannelModes bug**
   - In `patchChannelModes`, when `operation === "replace"` and `modeList` is empty, set all mode keys to `false` on the entry
   - Add test: clearChannelModes sets all modes to false
   
2. **Document image-intent.ts import-time behavior**
   - Already works correctly with test setup. Document the design choice.
   - No code change needed.

### Phase 2: Pure Function Tests (no external deps)

3. **club-store.ts** — test `canonicalize`, `stripDiscordEmoji`, `stripSquareTags`, `stripColonedEmoji`, `toNumber`, `computePct`
4. **club-stats-service.ts** — test `formatNumber`, `formatDelta`, `buildCsv`, `normalizeTop`
5. **club-corrections.ts** — test stub behavior (returns stub values when DB not configured)
6. **persona.ts** — test `getPersona` with mock JSON file
7. **mode-store.ts** — test `configToModes`, `formatModeState`, `cacheKey`, `cloneStore`, `safeJsonParse`, `mapTargetColumns`, `rowToEntry`
8. **openai.ts** — test client structure, `isConfigured`, error on missing key
9. **llm-fallback.ts** — test `extractSystem`, `hasConfiguredProvider`, `callWithFallback` with mocked providers
10. **snail-vision.ts** — test `normalizeStatValue`, `stripCodeFence`, `_clampConfidence`, `formatSnailAnalysis`
11. **club-vision.ts** — test `stripCodeFence`, `clampConfidence`, `reconcileDigits`, `shouldRetry`
12. **images.ts** — test `isGLMImageModel`
13. **health-server.ts** — test `getBotStats`, `recordBotError`
14. **club-analyze-flow.ts** — test session store, `cleanExpiredSessions`, `getSession`, pending context sessions, `buildPageEmbed`, `buildNavigationRow`

### Phase 3: Mock-Dependent Tests

15. **mcp-client.ts** — mock fetch, test `callTool`, `healthCheck`
16. **database.ts** — mock pool, test query/execute wrappers
17. **snail-stats.ts** — mock database, test `runSnailStats`
18. **auto-image.ts** — mock image generation, test flow
19. **xlsx-export.ts** — mock DB, test export generation

### Phase 4: Handler/Command Tests

20. **mention.ts** — mock client, test mention handler
21. **snail-auto-detect.ts** — mock client, test auto-detect handler
22. **chat.ts, consent.ts, forget.ts, health.ts, remember.ts, snail.ts** — command tests with DB/LLM mocks

### Mock Strategy

- **External APIs**: Mock `globalThis.fetch` in test setup
- **Database**: Mock `database` module's methods
- **Discord.js**: Mock Client, Interaction, Message types
- **Env vars**: Set in `beforeEach`, restore in `afterEach`
- **File system**: Use temp directories for persona/memory tests

### Regression Guard

After EACH item:
- `pnpm --filter @slimy/bot build` must pass
- `pnpm exec eslint apps/bot/src/` must have 0 errors
- `pnpm --filter @slimy/bot test` must pass all tests (no regressions)
