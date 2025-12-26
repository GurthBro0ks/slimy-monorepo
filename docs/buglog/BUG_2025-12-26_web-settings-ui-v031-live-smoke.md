# BUGLOG — Web Settings UI v0.31 Live Smoke + UX

## Context / Goal
- Repo: `/opt/slimy/slimy-monorepo`
- Date: 2025-12-26
- Goal:
  - Live-smoke the compose stack for web settings UI (`/settings`, `/club/[guildId]/settings`)
  - Add a small “Basic Settings” panel above the JSON editor (keep JSON editor as advanced)
- Constraints followed:
  - Read `CONTINUITY.md`, `AGENTS.md`, `apps/web/AGENTS.md`, `docs/AGENTS.md`
  - UI debug/status strip stays present on pages changed
  - No `localhost`/`127.0.0.1` in client-visible output or `NEXT_PUBLIC_*`
  - Avoid touching `apps/web/app/chat` (no `/chat` changes)
  - CI-safe verification only (no port-occupancy checks in CI)

## Starting state
- HEAD (start): `4713a35`

## Plan
1) Preflight: `scripts/verify/compose-config-valid.sh` + local port availability check (not CI).
2) Bring up compose stack; confirm containers healthy; inspect logs.
3) Live smoke via `curl` (headers only) for `/settings` and `/club/.../settings`.
4) UX v0.31: add “Basic Settings” panel above JSON editor for a few contract-backed fields.
5) Run deterministic verify scripts; record PASS evidence.
6) Commit.

## Commands run (with outputs)
### Preflight
- `bash scripts/verify/compose-config-valid.sh`
  - `PASS: docker compose config is valid (services: db, admin-api, web, admin-ui, bot)`
- `bash scripts/verify/compose-ports-available.sh`
  - `FAIL: port 3000 is already in use (unknown)`
  - `FAIL: port 3001 is already in use (unknown)`
  - `FAIL: port 3080 is already in use (unknown)`
- Identify offenders:
  - `docker ps --format '{{.Names}}\t{{.Ports}}' | rg -n '3000|3001|3080'`
    - `slimy-web    0.0.0.0:3000->3000/tcp`
    - `slimy-admin-ui 0.0.0.0:3001->3000/tcp`
    - `slimy-admin-api 0.0.0.0:3080->3080/tcp`
- Mitigation (no stops): run this repo’s compose with alternate host ports:
  - `WEB_PORT=13000 ADMIN_UI_PORT=13001 ADMIN_API_PORT=13080 ...`

### Compose up
- `WEB_PORT=13000 ADMIN_UI_PORT=13001 ADMIN_API_PORT=13080 docker compose up -d --build db admin-api web admin-ui bot`
  - Result: db/admin-api/web/admin-ui started successfully (bot restart noted below).
- `docker compose ps`
  - `admin-api` → `0.0.0.0:13080->3080/tcp` (healthy)
  - `web` → `0.0.0.0:13000->3000/tcp`
  - `admin-ui` → `0.0.0.0:13001->3000/tcp`
  - `bot` → restarting (`ERR_MODULE_NOT_FOUND`, see logs)
- `docker compose logs --tail 120 admin-api web`
  - `admin-api` healthcheck OK
  - `web` boot OK
- `docker compose logs --tail 80 bot`
  - `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'discord.js' imported from /app/dist/index.js`
  - NOTE: This appears to be a bot Docker/runtime packaging issue (not addressed in this v0.31 web/UI pass).

### Live smoke (curl)
- Prod (headers-only):
  - `curl -sSIk https://slimyai.xyz/settings | rg -n 'HTTP/|location:'` → `HTTP/2 200`
  - `curl -sSIk https://slimyai.xyz/club/000000000000000000/settings | rg -n 'HTTP/|location:'` → `HTTP/2 200`
  - `curl -sSIk https://admin.slimyai.xyz/api/health | rg -n 'HTTP/|location:'` → `HTTP/2 200`
- Local compose (headers-only):
  - `curl -sSIk http://127.0.0.1:13000/settings | rg -n 'HTTP/|location:'` → `HTTP/1.1 200 OK`
  - `curl -sSIk http://127.0.0.1:13000/club/000000000000000000/settings | rg -n 'HTTP/|location:'` → `HTTP/1.1 200 OK`

### Verify
- `bash scripts/verify/agents-md-present.sh`
  - `[PASS] required AGENTS.md + CONTINUITY.md files present (9)`
- `bash scripts/verify/continuity-ledger-present.sh`
  - `[PASS] CONTINUITY.md present + headings OK`
- `bash scripts/verify/no-localhost-in-client-sources.sh`
  - `[PASS] no loopback/localhost found in scanned sources`
- `bash scripts/verify/web-settings-ui-v03.sh`
  - `[PASS] web settings UI v0.3 checks passed`

## UX changes (v0.31)
- Added a “Basic Settings (v0.31)” panel above the JSON editor on both web settings pages.
- Controls are contract-backed (`@slimy/contracts`) and update the JSON editor (JSON remains the advanced/source-of-truth view).
- User settings: theme, chat markdown, profanity filter, snail avatarId/vibe/loreFlags.
- Guild settings: widget enabled, bot enabled, admin/global channel IDs.

## Manual browser checklist (UNCONFIRMED)
- Log in via Discord; verify `/settings` loads/saves and panels behave.
- Verify `/club/<guildId>/settings` loads/saves and panels behave.

## Files changed
- `apps/web/app/settings/page.tsx`
- `apps/web/app/club/[guildId]/settings/page.tsx`
- `CONTINUITY.md`
- `docs/buglog/BUG_2025-12-26_web-settings-ui-v031-live-smoke.md`

## Verification evidence
- `bash scripts/verify/web-settings-ui-v03.sh` → `[PASS] web settings UI v0.3 checks passed`
- Local compose up succeeded without port bind errors by using `WEB_PORT/ADMIN_UI_PORT/ADMIN_API_PORT` overrides.

## Commit
- Commit created: `feat(web): live-smoke notes + small settings UI v0.31`
- `git status --porcelain=v1` → clean
