# Chunk 6 Scope Inventory — Integration & Polish

## Baseline
- Tests: 343/343 passing (35 test files)
- ESLint: 0 errors, 0 warnings
- Build: clean
- Pre-commit: working

## Scope Items — Untested Source Files

### Tier 1: Pure/Internal (no external API dependencies)

| # | File | Lines | Status | Notes |
|---|------|-------|--------|-------|
| 1 | `src/lib/club-corrections.ts` | 35 | STUB | Already stub, add basic tests |
| 2 | `src/lib/club-store.ts` | 443 | PORTED | Pure functions: `canonicalize`, `stripDiscordEmoji`, `stripSquareTags`, `stripColonedEmoji`. DB functions need mocking |
| 3 | `src/lib/club-stats-service.ts` | 251 | PORTED | Pure functions: `formatNumber`, `formatDelta`, `buildCsv`, `normalizeTop`, `formatTableSide`. Discord embed builder needs mocking |
| 4 | `src/utils/xlsx-export.ts` | 9 | STUB | Stub, just returns null |
| 5 | `src/lib/persona.ts` | 69 | PORTED | Pure: `getPersona` reads JSON file. Testable with fs mock |
| 6 | `src/lib/mode-store.ts` | 579 | PORTED | Pure helpers: `configToModes`, `formatModeState`, `cacheKey`, `rowToEntry`, `mapTargetColumns`, `safeJsonParse`, `cloneStore`. DB functions need mocking |
| 7 | `src/lib/openai.ts` | 70 | PORTED | Pure client wrapper. Testable with fetch mock |
| 8 | `src/lib/memory.ts` (DEFERRED BUG) | 384 | PORTED | Has existing tests. Deferred bug: `clearChannelModes` doesn't actually clear |
| 9 | `src/lib/image-intent.ts` (DEFERRED ISSUE) | 26 | PORTED | Has existing tests. `OPENAI_KEY_MISSING` computed at import time |

### Tier 2: External API (needs careful mocking)

| # | File | Lines | Status | Notes |
|---|------|-------|--------|-------|
| 10 | `src/lib/llm-fallback.ts` | 304 | PORTED | Pure: `extractSystem`, `hasConfiguredProvider`. API: `callOpenAI`, `callGemini`, `callAnthropic`, `callWithFallback` |
| 11 | `src/lib/snail-vision.ts` | 166 | PORTED | Pure: `normalizeStatValue`, `stripCodeFence`, `_clampConfidence`, `formatSnailAnalysis`. API: `analyzeSnailScreenshot` |
| 12 | `src/lib/club-vision.ts` | 431 | PORTED | Pure: `stripCodeFence`, `clampConfidence`, `reconcileDigits`, `shouldRetry`. API: `parseManageMembersImage`, `classifyPage` |
| 13 | `src/lib/mcp-client.ts` | 169 | PORTED | API client. Testable with fetch mock |
| 14 | `src/lib/images.ts` | 201 | PORTED | API: `generateImage`. Pure: `isGLMImageModel` |
| 15 | `src/lib/database.ts` | 713 | PORTED | DB layer. Testable with mock pool |
| 16 | `src/lib/health-server.ts` | 112 | PORTED | Express server. Pure: `getBotStats`, `recordBotError` |
| 17 | `src/lib/auto-image.ts` | 103 | PORTED | Orchestrator. Needs mocking |
| 18 | `src/utils/snail-stats.ts` | 231 | PORTED | Orchestrator. Needs DB mock |
| 19 | `src/services/club-analyze-flow.ts` | 243 | PORTED | Session management + OCR pipeline. Pure: session store, UI builders |

### Tier 3: Handlers (Discord client dependent, integration tests)

| # | File | Lines | Status | Notes |
|---|------|-------|--------|-------|
| 20 | `src/handlers/mention.ts` | 124 | PORTED | Discord event handler. Test with client mock |
| 21 | `src/handlers/snail-auto-detect.ts` | 104 | PORTED | Discord event handler. Test with client mock |

### Tier 4: Commands without tests

| # | File | Lines | Status | Notes |
|---|------|-------|--------|-------|
| 22 | `src/commands/chat.ts` | 109 | PORTED | Needs DB + LLM mock |
| 23 | `src/commands/consent.ts` | 116 | PORTED | Needs DB mock |
| 24 | `src/commands/forget.ts` | 83 | PORTED | Needs DB mock |
| 25 | `src/commands/health.ts` | 85 | PORTED | Simple health check command |
| 26 | `src/commands/remember.ts` | 132 | PORTED | Needs DB mock |
| 27 | `src/commands/snail.ts` | 221 | PORTED | Needs DB + vision mock |
| 28 | `src/lib/xlsx-export.ts` (lib version) | 131 | PORTED | XLSX generation. Needs DB mock |

## External API Dependencies Requiring Mock Strategy

1. **OpenAI / Z.AI API** (`openai.ts`, `llm-fallback.ts`, `club-vision.ts`, `snail-vision.ts`, `images.ts`)
   - Mock: mock `fetch` global or `openai.chat.completions.create`
   
2. **Gemini API** (`llm-fallback.ts`)
   - Mock: mock `fetch` global
   
3. **Anthropic API** (`llm-fallback.ts`)
   - Mock: mock `fetch` global

4. **MySQL** (`database.ts`, `club-store.ts`, `mode-store.ts`, `snail-stats.ts`)
   - Mock: mock `database` module or pool

5. **Google Sheets / MCP** (`mcp-client.ts`)
   - Mock: mock `fetch` global

6. **Discord.js** (handlers, commands, embed builders)
   - Mock: mock discord.js types

## Deferred Issues

1. **memory.ts `clearChannelModes` bug**: The function delegates to `patchChannelModes` with empty modes and `operation: "replace"`. When modes are empty AND operation is "replace", `patchChannelModes` returns the entry's current modes but never sets them to empty. FIX: `patchChannelModes` with `operation === "replace"` should explicitly set all modes to false.

2. **image-intent.ts `OPENAI_KEY_MISSING` at import time**: `const OPENAI_KEY_MISSING = !process.env.OPENAI_API_KEY && !process.env.AI_API_KEY` is computed once at module load. This means test environment must set env vars BEFORE importing. Existing tests handle this by setting env before import. This is a design choice, not a bug.

## Out of Migration Scope

- `src/utils/xlsx-export.ts` (utils version) — deliberate stub, real implementation is in `src/lib/xlsx-export.ts`
- New features not in original JS bot
