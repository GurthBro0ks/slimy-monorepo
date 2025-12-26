# BUGLOG: Settings Sync Events v0.2 (Change Events + Audit Trail)

## Context / Goal
- Repo: `/opt/slimy/slimy-monorepo`
- Start HEAD: `f365806`
- Goal: Add durable settings change events + cursor endpoint, and consume changes in bot + admin-ui without logic drift.
- Non-negotiables:
  - No `localhost`/`127.0.0.1` leaks into client-visible code/config.
  - Access control prevents cross-user/cross-guild reads/writes.
  - Keep changes deterministic/CI-safe; no host port checks in CI.

## Plan
1) Discovery scan (routes, prisma, client usage, scripts)
2) Add shared contracts for `SettingsChangeEvent` + allowlists
3) Add Prisma model + migration in admin-api
4) Write events on settings updates + add changes cursor endpoint
5) Update `@slimy/admin-api-client` helper
6) Bot + admin-ui consume changes on-demand (store per-scope cursor in memory/UI state)
7) Add Jest regression tests + verify script; wire deterministic check into CI
8) Update docs + `CONTINUITY.md`; commit

## Files changed
- `.github/workflows/ci.yml`
- `CONTINUITY.md`
- `apps/admin-api/prisma/schema.prisma`
- `apps/admin-api/prisma/migrations/20251226203000_add_settings_change_events/migration.sql`
- `apps/admin-api/src/routes/index.js`
- `apps/admin-api/src/routes/settings-v0.js`
- `apps/admin-api/src/routes/settings-changes-v0.js`
- `apps/admin-api/tests/settings-memory-v0.test.js`
- `apps/admin-api/tests/settings-sync-events-v02.test.js`
- `apps/admin-ui/pages/settings.js`
- `apps/admin-ui/pages/club/[guildId]/settings.js`
- `apps/bot/src/lib/adminApi.ts`
- `apps/bot/src/lib/settingsSync.ts`
- `apps/bot/src/commands/settings.ts`
- `packages/contracts/src/settings.ts`
- `packages/contracts/dist/settings.js`
- `packages/contracts/dist/settings.d.ts`
- `packages/contracts/dist/memory.d.ts`
- `packages/admin-api-client/src/index.ts`
- `packages/admin-api-client/dist/index.js`
- `packages/admin-api-client/dist/index.d.ts`
- `packages/admin-api-client/package.json`
- `docs/arch/SETTINGS_AND_MEMORY.md`
- `scripts/verify/settings-sync-events-v02.sh`
- `docs/buglog/BUG_2025-12-26_settings-sync-events-v02.md`

## Commands run (with outputs)
- `git rev-parse --short HEAD` -> `f365806`
- `rg -n "settings-v0|memory-v0|central-settings|UserSettings|GuildSettings" apps/admin-api/src -S`
  - Routes: `apps/admin-api/src/routes/settings-v0.js`, `apps/admin-api/src/routes/memory-v0.js`
  - Router hub: `apps/admin-api/src/routes/index.js`
  - Auth-ish central settings touches: `apps/admin-api/src/routes/auth.js`, `apps/admin-api/src/routes/me.js`, `apps/admin-api/src/routes/guilds.js`
  - Shared defaults: `apps/admin-api/src/services/central-settings.js`
- `cat apps/admin-api/prisma/schema.prisma | rg -n "UserSettings|GuildSettings|MemoryRecord" -n`
  - `model UserSettings` / `model GuildSettings` / `model MemoryRecord` present
- `rg -n "admin-api-client" apps/bot apps/admin-ui apps/web packages -S`
  - Bot uses `@slimy/admin-api-client`: `apps/bot/src/lib/adminApi.ts`, `apps/bot/src/index.ts`
  - Admin UI uses `@slimy/admin-api-client`: `apps/admin-ui/pages/settings.js`, `apps/admin-ui/pages/club/[guildId]/settings.js`
  - `packages/admin-api-client` is workspace package
- `cat apps/admin-api/package.json`
  - Prisma scripts: `"prisma:generate": "prisma generate"` (migrations are applied via `prisma migrate deploy` in docker)
- `rg -n "prisma migrate" -S`
  - `scripts/dev/migrate-admin-api-db.sh` uses `pnpm -s prisma migrate deploy`
- `find apps packages scripts docs -maxdepth 2 -name AGENTS.md -print | sort`
  - `apps/admin-api/AGENTS.md`
  - `apps/admin-ui/AGENTS.md`
  - `apps/bot/AGENTS.md`
  - `apps/web/AGENTS.md`
  - `docs/AGENTS.md`
  - `packages/AGENTS.md`
  - `scripts/AGENTS.md`
- `pnpm -w install`
  - OK (peer dep warnings present; no blocking errors)
- `bash scripts/verify/agents-md-present.sh`
  - `[PASS] required AGENTS.md + CONTINUITY.md files present (9)`
- `bash scripts/verify/continuity-ledger-present.sh`
  - `[PASS] CONTINUITY.md present + headings OK`
- `bash scripts/verify/settings-memory-bridge-v0.sh`
  - `[PASS] settings+memory v0 regression test passed` (8 tests)
- `bash scripts/verify/settings-sync-clients-v01.sh`
  - `[PASS] settings sync clients v0.1 checks passed`
- `bash scripts/verify/settings-sync-events-v02.sh`
  - `[PASS] settings sync events v0.2 regression test passed` (7 tests)
- `bash scripts/verify/no-localhost-in-client-sources.sh`
  - `[PASS] no loopback/localhost found in scanned sources`
- NOTE: During implementation, `packages/admin-api-client` initially attempted to import `@slimy/contracts` directly, but `pnpm --filter @slimy/admin-api-client build` could not resolve it (missing local `node_modules`); switched to importing `packages/contracts/dist` via a stable relative path so builds remain deterministic.

## Verification evidence
- Jest: `apps/admin-api/tests/settings-memory-v0.test.js` passes (8 tests)
- Jest: `apps/admin-api/tests/settings-sync-events-v02.test.js` passes (7 tests)
- Deterministic scripts PASS:
  - `scripts/verify/settings-sync-clients-v01.sh`
  - `scripts/verify/settings-sync-events-v02.sh`
  - `scripts/verify/no-localhost-in-client-sources.sh`
