# Chunk 3 Remediation Plan

## Diagnosis

### Test Failures (4 in tests/club-analyze.test.ts)

All 4 failures are API contract drift between the test expectations and the NUC1 rewrite of `club-analyze.ts`.

**Failure 1: "uses update + followUp (not reply) on successful save"**
- Test expects: `interaction.update()` + `interaction.followUp()`
- Source does: `interaction.reply()` + `renderPage()` (which calls `interaction.update()`)
- Root cause: NUC1 rewrite uses `reply` instead of `followUp`. The test was written for the old session flow which used `update + followUp` to avoid `InteractionAlreadyReplied`.
- Fix: SOURCE — change `handleSave` to use `update` + `followUp` pattern
- Category: Source bug (wrong interaction method pattern)

**Failure 2: "catch block handles reply failure gracefully"**
- Test expects: No unhandled rejection when `interaction.reply()` rejects
- Source does: `interaction.reply()` in catch block with no inner try-catch
- Root cause: If `saveStagingRows` throws AND `interaction.reply` also throws, the error propagates as unhandled
- Fix: SOURCE — wrap catch block's `interaction.reply` in inner try-catch
- Category: Source bug (missing error handling)

**Failure 3: "blocks non-invoker from tapping buttons"**
- Test expects: Non-session-owner gets "Only TestUser can edit this scan"
- Source does: No owner check in `handleSave` — processes save for anyone
- Root cause: NUC1 rewrite removed the session owner gate
- Fix: SOURCE — add owner check at top of `handleSave`
- Category: Source bug (missing authorization)

**Failure 4: "allows invoker to tap buttons normally"**
- Test expects: `interaction.update()` + `interaction.followUp()` for owner
- Source does: `interaction.reply()` — same issue as Failure 1
- Fix: Same fix as Failure 1
- Category: Source bug (same as Failure 1)

### ESLint Warning (1)

**"Assign object to a variable before exporting as module default"**
- File: `apps/bot/src/handlers/snail-auto-detect.ts` line 102
- `export default { attachSnailAutoDetect };` — anonymous object
- Fix: Assign to a named variable first, then export
- Category: Code quality

## Fix Order (smallest-diff-first)

1. **Fix ESLint warning** — snail-auto-detect.ts (Code Quality, ~2 lines)
2. **Fix owner check** — add userId gate in handleSave (Correctness, ~5 lines)
3. **Fix interaction pattern** — change reply→update+followUp in handleSave (Correctness/Integration, ~15 lines)
4. **Fix error handling** — wrap catch block reply in try-catch (Correctness, ~8 lines)

## Rubric Impact Estimates

- Correctness (3x): +3 per fix × 4 fixes = major improvement
- Integration (2x): handleButton tests pass = full integration score
- Code Quality (1x): ESLint 0 warnings = full quality score
- Completeness (2x): all tests pass = full completeness score
