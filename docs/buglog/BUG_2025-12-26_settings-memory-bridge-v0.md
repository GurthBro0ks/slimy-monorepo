# BUGLOG: Shared Settings + Memory Bridge v0

- Date: 2025-12-26
- Slug: settings-memory-bridge-v0
- HEAD (start): 3b43798

## Scope
- Add canonical contracts for `UserSettings`, `GuildSettings`, and `MemoryRecord` (schemas + defaults + guardrails).
- Add admin-api persistence + endpoints using those contracts.
- Add thin client helpers for bot + web/admin-ui to call admin-api (no hardcoded localhost).
- Add regression check (lightweight verify script).
- Update `CONTINUITY.md` and add arch doc.

## Plan
- Discovery scan: locate existing settings/memory code + Prisma usage.
- Add `packages/contracts` (zod schemas, defaults, guardrails).
- Implement admin-api models + endpoints and validate via contracts.
- Add `packages/admin-api-client` thin helpers.
- Add `scripts/verify/settings-memory-bridge-v0.sh` regression check and wire to CI (if lightweight).
- Document in `docs/arch/SETTINGS_AND_MEMORY.md`, update `CONTINUITY.md`, commit.

## Files Changed
- `.gitignore`
- `CONTINUITY.md`
- `.github/workflows/ci.yml`
- `apps/admin-api/AGENTS.md`
- `apps/admin-api/package.json`
- `apps/admin-api/prisma/schema.prisma`
- `apps/admin-api/prisma/migrations/20251226124000_add_memory_records/migration.sql`
- `apps/admin-api/src/routes/auth.js`
- `apps/admin-api/src/routes/guilds.js`
- `apps/admin-api/src/routes/index.js`
- `apps/admin-api/src/routes/me.js`
- `apps/admin-api/src/routes/settings-v0.js`
- `apps/admin-api/src/routes/memory-v0.js`
- `apps/admin-api/src/services/central-settings.js`
- `apps/admin-api/tests/settings-memory-v0.test.js`
- `apps/admin-ui/AGENTS.md`
- `apps/admin-ui/package.json`
- `apps/bot/AGENTS.md`
- `apps/bot/package.json`
- `apps/web/AGENTS.md`
- `apps/web/package.json`
- `docs/arch/SETTINGS_AND_MEMORY.md`
- `docs/buglog/BUG_2025-12-26_settings-memory-bridge-v0.md`
- `package.json`
- `packages/AGENTS.md`
- `packages/contracts/*`
- `packages/admin-api-client/*`
- `pnpm-lock.yaml`
- `scripts/verify/settings-memory-bridge-v0.sh`

## Commands Run (with outputs)
- `git rev-parse --short HEAD`
  - `3b43798`
- `ls -la packages`
  - Existing packages: `shared-auth`, `shared-config`, `shared-db`, `shared-snail`, `shared-codes` (no shared settings/memory contracts yet).
- `find packages -maxdepth 2 -type d -print | sort`
  - Confirms no `packages/contracts` yet.
- `rg -n "UserSettings|GuildSettings|settings|memory" packages apps/admin-api apps/bot apps/web apps/admin-ui -S || true`
  - `apps/admin-api/prisma/schema.prisma` already has `UserSettings` + `GuildSettings` models (central settings tables).
  - Existing admin-api endpoints include `/api/me/settings` and `/api/guilds/:guildId/settings` (central settings), plus legacy file-based `src/routes/guild-settings.js`.
  - No existing shared contracts package; no `MemoryRecord` persistence found.
- `rg -n "prisma|schema\\.prisma" apps/admin-api -S || true`
  - Prisma is in use; schema at `apps/admin-api/prisma/schema.prisma`; migrations exist under `apps/admin-api/prisma/migrations/`.
- `rg -n "settings|memory" apps/admin-api/src -S || true`
  - `apps/admin-api/src/services/central-settings.js` provides JS defaults/merge helpers today.
- `pnpm -w install --lockfile-only`
  - Updated `pnpm-lock.yaml` for new workspace packages/deps.
- `pnpm -w install`
  - Linked workspace deps (added `zod` at workspace root so `packages/contracts` can compile + run at runtime).
- `pnpm -w install --force`
  - Re-linked workspace node_modules after adding new packages (no functional code changes).
- `pnpm --filter @slimy/contracts run build`
  - Emits `packages/contracts/dist/*` (CJS) for admin-api runtime.
- `pnpm --filter @slimy/admin-api-client run build`
  - Emits `packages/admin-api-client/dist/*` (ESM) for app consumption.
- `pnpm --filter @slimy/admin-api run prisma:generate`
  - Generated Prisma client with new `MemoryRecord` model.
- `bash scripts/verify/settings-memory-bridge-v0.sh`
  - `PASS` (runs Jest subset: `settings-memory-v0.test.js`).
- `bash scripts/verify/continuity-ledger-present.sh`
  - `PASS`
- `bash scripts/verify/agents-md-present.sh`
  - `PASS`

## Verification Evidence
- `scripts/verify/settings-memory-bridge-v0.sh` output ends with:
  - `Test Suites: 1 passed`
  - `Tests: 3 passed`
  - `[PASS] settings+memory v0 regression test passed`
- Continuity + AGENTS checks pass locally:
  - `bash scripts/verify/continuity-ledger-present.sh` => PASS
  - `bash scripts/verify/agents-md-present.sh` => PASS
