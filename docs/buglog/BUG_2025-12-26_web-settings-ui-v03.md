# Buglog: Web Settings UI v0.3

Date: 2025-12-26

## Goal
- Add `apps/web` pages wired to the same central Settings + Memory endpoints/contracts used by bot/admin-ui.
- Pages:
  - `/settings` (UserSettings JSON editor + optional panels)
  - `/club/[guildId]/settings` (GuildSettings JSON editor + optional panels)

## Constraints (followed)
- Canonical state: `CONTINUITY.md`
- Repo rules: `AGENTS.md`
- Nearest rules for touched web files: `apps/web/AGENTS.md`
- UI debug/status strip required on pages changed/added.
- No `localhost`/`127.0.0.1` leaks into client-visible output.
- Avoid touching `apps/web/app/chat` (unless explicitly required).

## Start State
- Start HEAD: `acd78a7`

## Plan
1) Discovery: confirm App Router vs Pages Router; locate existing settings UI; confirm env/proxy strategy.
2) Implement minimal settings pages using central endpoints and shared contracts.
3) Add deterministic verify script for web UI v0.3.
4) Run verify scripts and record PASS evidence.
5) Commit.

## Key decisions
- Web pages call admin-api using same-origin `/api/...` via `apps/web/next.config.js` rewrites (avoids hardcoding hostnames in client code).
- Client-side login redirects use `/api/auth/login` (relative) to avoid baking `NEXT_PUBLIC_ADMIN_API_BASE` values into client bundles.

## Done checklist
- [x] `/settings` exists and edits `UserSettings` via admin-api
- [x] `/club/[guildId]/settings` exists and edits `GuildSettings` via admin-api
- [x] Debug/status strip on both pages
- [x] Optional: changes feed panel works (cursor endpoint)
- [x] Optional: memory viewer works (read-only)
- [x] `scripts/verify/web-settings-ui-v03.sh` added and PASS
- [x] `scripts/verify/no-localhost-in-client-sources.sh` PASS
- [x] Buglog includes commands + evidence

## Commit
- `a63f9b1` — `feat(web): settings UI wired to central settings v0.3`

## Commands run (with outputs)
- Discovery
  - `git rev-parse --short HEAD` → `acd78a7`
  - `ls apps/web/app` → App Router present (`apps/web/app/...`), existing `/settings` route existed.
  - `rg -n "admin-api-client|UserSettings|GuildSettings|settings" apps/web -S` → existing `@slimy/admin-api-client` dependency present.
  - `cat apps/web/next.config.js` → `/api/*` rewrites proxy to `admin-api:3080` (server-side), so browser fetches can stay relative (`/api/...`).

- Build/package maintenance
  - `pnpm --filter @slimy/admin-api-client build` → PASS
  - `pnpm --filter @slimy/web install` → PASS (linked `apps/web/node_modules/@slimy/contracts`)

- Verify (pre-container)
  - `bash scripts/verify/compose-config-valid.sh` → `PASS: docker compose config is valid (services: db, admin-api, web, admin-ui, bot)`
  - `bash scripts/verify/compose-ports-available.sh || true` →
    - `FAIL: port 3000 is already in use (unknown)`
    - `FAIL: port 3001 is already in use (unknown)`
    - `FAIL: port 3080 is already in use (unknown)`

- Verify (core)
  - `bash scripts/verify/agents-md-present.sh` → `[PASS] required AGENTS.md + CONTINUITY.md files present (9)`
  - `bash scripts/verify/continuity-ledger-present.sh` → `[PASS] CONTINUITY.md present + headings OK`
  - `bash scripts/verify/no-localhost-in-client-sources.sh` → `[PASS] no loopback/localhost found in scanned sources`
  - `bash scripts/verify/web-settings-ui-v03.sh` → `[PASS] web settings UI v0.3 checks passed`

## Files changed
- `apps/web/app/settings/page.tsx`
- `apps/web/app/club/[guildId]/settings/page.tsx`
- `apps/web/lib/api/central-settings-client.ts`
- `apps/web/lib/auth/context.tsx`
- `apps/web/components/auth/protected-route.tsx`
- `apps/web/app/status/page.tsx`
- `apps/web/package.json`
- `packages/admin-api-client/src/index.ts`
- `packages/admin-api-client/dist/index.js`
- `scripts/verify/web-settings-ui-v03.sh`
- `pnpm-lock.yaml`
- `CONTINUITY.md`
