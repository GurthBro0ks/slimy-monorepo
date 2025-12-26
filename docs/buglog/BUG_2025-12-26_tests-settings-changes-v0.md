# Buglog: Tests for `apps/admin-api/src/routes/settings-changes-v0.js`

Date: 2025-12-26

## Context / Goal
- Add deterministic Jest coverage for the settings change cursor endpoint (`/api/settings/changes-v0`) implemented in `apps/admin-api/src/routes/settings-changes-v0.js`.
- Ensure security regression coverage: auth required + cross-user / cross-guild forbidden.
- CI-safe only: no Docker, no ports, no sleeps.

## Start State
- Start HEAD: `8dbe912` (from `git rev-parse --short HEAD`)
- TARGET_FILE: `apps/admin-api/src/routes/settings-changes-v0.js`
- WHY_THIS_FILE: Most relevant route added/changed in HEAD; exposes authz + cursor semantics and benefits from extra deterministic coverage.

## Constraints followed
- NEAREST_AGENTS: `apps/admin-api/AGENTS.md`
- OVERRIDES_SUMMARY:
  - admin-api is canonical API surface for settings/memory (contracts shared via `packages/`).
  - Settings + Memory v0 must validate payloads with `@slimy/contracts` schemas.
  - Settings auto-init is required (GET creates defaults if missing).
  - Memory guardrails required (size limit + secret-like key denylist).
  - Auth/cookie changes require targeted test/curl verification + buglog evidence.
  - Prisma/schema changes require migration generation + verification.
  - Avoid storing raw chat transcripts by default (structured summaries/state unless explicitly required).

## Plan
1) Inspect target route and existing tests/harness.
2) Extend existing Jest suite to cover cursor/limit validation and ordering semantics.
3) Run focused admin-api tests + existing verify scripts (deterministic).
4) Commit the test coverage.
5) Optional upgrades: move cursor limit constants into `@slimy/contracts` and add a focused verify script.

## Files Changed
- `apps/admin-api/tests/settings-sync-events-v02.test.js`
- `apps/admin-api/src/routes/settings-changes-v0.js`
- `packages/contracts/src/settings.ts`
- `packages/contracts/dist/settings.js`
- `packages/contracts/dist/settings.d.ts`
- `scripts/verify/tests-settings-changes-v0.sh`

## Commands Run (with outputs)

### Target selection / discovery
```bash
git show --name-only --pretty='' HEAD
```
Key candidates in `HEAD` included:
- `apps/admin-api/src/routes/settings-changes-v0.js` (selected)
- `apps/admin-api/src/routes/settings-v0.js`
- `packages/contracts/src/settings.ts`

### Tests
```bash
pnpm --filter @slimy/admin-api test -- settings-sync-events-v02.test.js
```
Output (snippet):
```text
PASS tests/settings-sync-events-v02.test.js
Tests:       13 passed, 13 total
Time:        ~1.4 s
```

### Contracts build (for exported constants)
```bash
pnpm --filter @slimy/contracts build
```

### Verify scripts
```bash
bash scripts/verify/agents-md-present.sh
bash scripts/verify/continuity-ledger-present.sh
bash scripts/verify/tests-settings-changes-v0.sh
bash scripts/verify/settings-sync-events-v02.sh
```
Output (snippet):
```text
[PASS] required AGENTS.md + CONTINUITY.md files present (9)
[PASS] CONTINUITY.md present + headings OK
[PASS] settings-changes-v0 tests passed
[PASS] settings sync events v0.2 regression test passed
```

## Verification Evidence
- `pnpm --filter @slimy/admin-api test -- settings-sync-events-v02.test.js` PASS (13/13)
- `bash scripts/verify/tests-settings-changes-v0.sh` PASS
- `bash scripts/verify/agents-md-present.sh` PASS
- `bash scripts/verify/continuity-ledger-present.sh` PASS
- `bash scripts/verify/settings-sync-events-v02.sh` PASS

## Commits
- `c0a0ddc` — `test(admin-api): add coverage for settings-changes-v0`
- `eb160e5` — `chore(settings): centralize changes cursor limits`
- Focused verify script: `scripts/verify/tests-settings-changes-v0.sh`
