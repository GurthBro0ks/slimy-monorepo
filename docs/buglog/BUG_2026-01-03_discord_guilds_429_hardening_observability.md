# BUG 2026-01-03 — Discord guilds 429 hardening + observability (Report-Driven v4, Evidence v2)

Assets (v2, canonical):
- `docs/buglog/assets/2026-01-03_discord_guilds_429_hardening_observability_v2/`
  - Browser: `docs/buglog/assets/2026-01-03_discord_guilds_429_hardening_observability_v2/browser/`
  - Curls: `docs/buglog/assets/2026-01-03_discord_guilds_429_hardening_observability_v2/curls/`
  - Reports (snapshots): `docs/buglog/assets/2026-01-03_discord_guilds_429_hardening_observability_v2/reportsoto/`

## Goal / pass conditions
- No request storms on login/navigation (`/guilds` + DebugDock enabled).
- Cache behavior explicit and consistent: in-flight coalescing + cooldown + stale served on 429.
- Diagnostics:
  - Response headers include cache source/stale (and optional age/cooldown).
  - DebugDock “Copy Debug” reflects cache vs network truth (no theatre).
- Repo Health Report detects regressions for the guild endpoints when possible.

## Baseline snapshot (no code changes yet)

### Repo state
```bash
cd /opt/slimy/slimy-monorepo
git rev-parse HEAD
git status --porcelain=v1
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml ps
pnpm report:nuc2
```

Output (excerpt):
```text
HEAD: bd8b192b949a4e6d9a951d2f9839c9fa4ea26ad1
docker compose: admin-api/admin-ui healthy
Written: docs/reports/REPORT_2026-01-03_1807_nuc2.json
Written: docs/reports/REPORT_2026-01-03_1807_nuc2.html
Written: docs/reports/LATEST_nuc2.json
Tests: PASS, Docker: OK, Admin Health: OK, Socket.IO: OK
```

### Curl sanity (unauth OK; record headers)
```bash
curl -i https://admin.slimyai.xyz/api/health | head -n 40
curl -i https://admin.slimyai.xyz/api/guilds | head -n 80
curl -i https://admin.slimyai.xyz/api/discord/guilds | head -n 80
```

Saved outputs:
- `docs/buglog/assets/2026-01-03_discord_guilds_429_hardening_observability_v2/curls/health.head40.txt` (HTTP 200)
- `docs/buglog/assets/2026-01-03_discord_guilds_429_hardening_observability_v2/curls/guilds.head80.txt` (HTTP 401 unauth)
- `docs/buglog/assets/2026-01-03_discord_guilds_429_hardening_observability_v2/curls/discord_guilds.head80.txt` (HTTP 401 unauth)

## Browser evidence (operator-required; do not fabricate)
Required files:
- `docs/buglog/assets/2026-01-03_discord_guilds_429_hardening_observability_v2/browser/auth_baseline_network.png`
- `docs/buglog/assets/2026-01-03_discord_guilds_429_hardening_observability_v2/browser/auth_baseline_console.png`
- `docs/buglog/assets/2026-01-03_discord_guilds_429_hardening_observability_v2/browser/auth_baseline_copydebug.txt` (or `.png`)

## Investigation
- Hot paths (admin-ui):
  - DebugDock triggers `GET /api/discord/guilds` once after auth session is present:
    - `apps/admin-ui/components/debug/DebugDock.tsx:232` (effect) and `apps/admin-ui/components/debug/DebugDock.tsx:238` (fetch).
  - `/guilds` page triggers `GET /api/guilds` (call graph already captured in prior v4 buglog); DebugDock call no longer hides cache/source truth in Copy Debug.
- Shared cache + cooldown (admin-api):
  - Shared cached fetch for Discord `GET /users/@me/guilds` (per userDiscordId):
    - `apps/admin-api/src/services/discord-shared-guilds.js:208` (`fetchUserGuildsCached`)
    - In-flight coalescing: `apps/admin-api/src/services/discord-shared-guilds.js:263` (`entry.inflight`)
    - Cooldown + stale serving on 429: `apps/admin-api/src/services/discord-shared-guilds.js:242` and `apps/admin-api/src/services/discord-shared-guilds.js:287`
  - Shared cached fetch for bot-installed checks `GET /guilds/:id` (per guildId) to avoid duplicate Discord work when `/api/guilds` and `/api/discord/guilds` are both requested:
    - `apps/admin-api/src/services/discord-shared-guilds.js:314` (`botInstalledInGuild`)
- Endpoint observability:
  - `/api/guilds` headers/meta: `apps/admin-api/src/routes/guilds.js:143`
  - `/api/discord/guilds` headers/meta: `apps/admin-api/src/routes/discord.js:38`
- Report regression check:
  - `scripts/report/run.mjs:65` (`curlProbeHeaders`)
  - `scripts/report/run.mjs:269` (`collectHealthChecks` -> `discordGuildsHeaders`)

Notes:
- `X-Slimy-Discord-Source` now uses `discord|cache|stale` (stale indicates cached data served while Discord is rate-limited / cooldown active).
- `REPORT_ADMIN_COOKIE` can be provided to `pnpm report:nuc2` for authenticated header checks; when unset, report expects `401` for those endpoints and marks the check as “Skipped (unauth)”.

## Implementation notes (fill in only if changes made)
- Changes:
  - Cached bot-installed checks (guildId TTL + in-flight coalescing) to reduce redundant Discord bot calls when both `/api/guilds` and `/api/discord/guilds` are hit:
    - `apps/admin-api/src/services/discord-shared-guilds.js`
  - Expanded Discord meta to include cache age/expires/cooldown and made `stale` explicit:
    - `apps/admin-api/src/services/discord-shared-guilds.js`
  - Added response headers for cache age/cooldown (non-breaking):
    - `apps/admin-api/src/routes/guilds.js`
    - `apps/admin-api/src/routes/discord.js`
  - DebugDock now captures and exposes Discord guild meta (headers/JSON meta) in Copy Debug payload + visible status line:
    - `apps/admin-ui/components/debug/DebugDock.tsx`
  - Repo Health Report now probes guild endpoints and records `X-Slimy-Discord-Source`/`X-Slimy-Discord-Stale` (unauth by default; auth optional via `REPORT_ADMIN_COOKIE`):
    - `scripts/report/run.mjs`
- Tests:
  - `pnpm -C apps/admin-api test` (PASS; note: pre-existing “worker failed to exit gracefully” warning)
  - `pnpm -C apps/admin-ui test` (PASS)
- Reports:
  - Baseline: `docs/reports/REPORT_2026-01-03_1807_nuc2.json`, `docs/reports/REPORT_2026-01-03_1807_nuc2.html`
  - Post-change: `docs/reports/REPORT_2026-01-03_1849_nuc2.json`, `docs/reports/REPORT_2026-01-03_1849_nuc2.html`

## Deploy (nuc2)
```bash
cd /opt/slimy/slimy-monorepo
DOCKER_BUILDKIT=0 docker compose -f infra/docker/docker-compose.slimy-nuc2.yml build admin-api admin-ui
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d --no-deps --force-recreate admin-api admin-ui
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml ps
docker inspect -f '{{.State.Health.Status}}' slimy-admin-api
curl -sS https://admin.slimyai.xyz/api/health | head -c 200; echo
```

## Verification
- Automated:
  - `pnpm -C apps/admin-api test` (PASS)
  - `pnpm -C apps/admin-ui test` (PASS)
  - `pnpm report:nuc2` (PASS) → `docs/reports/REPORT_2026-01-03_1849_nuc2.{json,html}`
  - Report includes `Discord guild endpoints (headers)` line; unauth expects `401` unless `REPORT_ADMIN_COOKIE` set.
- Manual (operator-required; do not fabricate):
  - Capture: `auth_baseline_network.png`, `auth_baseline_console.png`, `auth_baseline_copydebug.txt` in:
    - `docs/buglog/assets/2026-01-03_discord_guilds_429_hardening_observability_v2/browser/`
  - PASS criteria (browser truth):
    - Initial load shows ≤1 `GET /api/guilds` and ≤1 `GET /api/discord/guilds` (no bursts).
    - Response headers show `X-Slimy-Discord-Source` (`cache` after first hit) and `X-Slimy-Discord-Stale`.
    - DebugDock Copy Debug includes `discord.guilds.meta` and matches Network headers.

## Verdict
- Automated: PASS (tests + report + deploy healthy)
- Browser evidence: UNCONFIRMED (operator screenshots/copydebug not yet captured for this v2 folder)
