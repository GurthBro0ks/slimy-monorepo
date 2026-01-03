# BUG 2026-01-03 — Discord `/api/discord/guilds` 429 (cache + backoff) — Practical Recos v4

## Symptom / context
- Intermittent “Failed to load guilds” on first login / initial navigation.
- Observed: Discord rate limiting surfaces as HTTP `429 Too Many Requests` on `GET /api/discord/guilds` (sometimes looks like a `/guilds` page failure).
- Refresh typically succeeds (suggests transient 429 / bursty duplicate calls).

## Constraints
- Smallest safe change set only (no refactors).
- Keep DebugDock behavior unchanged (off by default; enable via `localStorage.setItem('slimyDebug','1')`).
- Do not reintroduce unauth realtime (`/socket.io`) attempts.

## Plan
1) Baseline snapshot: git state + `pnpm report:nuc2` artifacts + endpoint sanity.
2) Browser truth: capture proof of the exact endpoint returning 429 (Network row + response body) + Copy Debug payload.
3) Find call graph: server handler + all client call sites; identify duplicate triggers.
4) Implement smallest fix:
   - Server-side: cache + coalesce + Retry-After aware + minimum retry interval.
   - Client-side: handle 429 with non-fatal retry state (optional coalescing helper).
5) Verify: tests + new `pnpm report:nuc2` artifacts + browser after-evidence.

## Baseline snapshot (no code changes in this v4 fix yet)

### A) Repo state
```bash
cd /opt/slimy/slimy-monorepo
git rev-parse HEAD
git status --porcelain=v1
```
Output:
```text
4c80a5b5903ea4f9c270c027dbbe7b22fddb195e
```

```text
M CONTINUITY.md
M apps/admin-ui/components/debug/DebugDock.tsx
M apps/admin-ui/lib/slimy-debug.js
M apps/admin-ui/lib/socket.js
M scripts/report/run.mjs
?? apps/web/app/chat/page.backup-2025-12-28.tsx
?? apps/web/public/slimechat/
?? docs/buglog/BUG_2025-12-28_caddy-502-admin-api-migration-loop.md
?? docs/buglog/BUG_2025-12-28_chat-iframe-wrapper.md
?? docs/buglog/BUG_2025-12-28_discord-invalid-redirect-uri.md
?? docs/buglog/BUG_2025-12-28_discord-oauth-redirect-uri.md
?? docs/buglog/BUG_2025-12-31_admin-guilds-empty_ws-proxy_caddy-2019.md
?? docs/buglog/BUG_2025-12-31_oauth-callback-self-redirect-prod.md
?? docs/buglog/BUG_2025-12-31_post-login-wrong-domain.md
?? docs/buglog/BUG_2026-01-03_discord_guilds_429_cache_backoff.md
?? docs/buglog/BUG_2026-01-03_practical_recos_v3_report_debug_truthgate.md
?? docs/buglog/assets/
?? docs/reports/LATEST_nuc2.json
?? docs/reports/REPORT_2026-01-02_2138_nuc2.html
?? docs/reports/REPORT_2026-01-02_2138_nuc2.json
?? docs/reports/REPORT_2026-01-02_2154_nuc2.html
?? docs/reports/REPORT_2026-01-02_2154_nuc2.json
?? docs/reports/REPORT_2026-01-02_2208_nuc2.html
?? docs/reports/REPORT_2026-01-02_2208_nuc2.json
?? docs/reports/REPORT_2026-01-02_2228_nuc2.html
?? docs/reports/REPORT_2026-01-02_2228_nuc2.json
?? docs/reports/REPORT_2026-01-02_2243_nuc2.html
?? docs/reports/REPORT_2026-01-02_2243_nuc2.json
?? docs/reports/REPORT_2026-01-03_0001_nuc2.html
?? docs/reports/REPORT_2026-01-03_0001_nuc2.json
?? docs/reports/REPORT_2026-01-03_0007_nuc2.html
?? docs/reports/REPORT_2026-01-03_0007_nuc2.json
?? docs/reports/REPORT_2026-01-03_0031_nuc2.html
?? docs/reports/REPORT_2026-01-03_0031_nuc2.json
?? docs/reports/REPORT_2026-01-03_0041_nuc2.html
?? docs/reports/REPORT_2026-01-03_0041_nuc2.json
?? docs/reports/REPORT_2026-01-03_0043_nuc2.html
?? docs/reports/REPORT_2026-01-03_0043_nuc2.json
?? docs/reports/REPORT_2026-01-03_0050_nuc2.html
?? docs/reports/REPORT_2026-01-03_0050_nuc2.json
?? docs/reports/REPORT_2026-01-03_0124_nuc2.html
?? docs/reports/REPORT_2026-01-03_0124_nuc2.json
?? docs/reports/REPORT_2026-01-03_1056_nuc2.html
?? docs/reports/REPORT_2026-01-03_1056_nuc2.json
?? docs/reports/REPORT_2026-01-03_1304_nuc2.html
?? docs/reports/REPORT_2026-01-03_1304_nuc2.json
?? docs/reports/vendor/
```

### B) Repo Health Report
```bash
pnpm report:nuc2
```
Artifacts:
- `docs/reports/REPORT_2026-01-03_1304_nuc2.json`
- `docs/reports/REPORT_2026-01-03_1304_nuc2.html`
- `docs/reports/LATEST_nuc2.json`

Output (excerpt):
```text
Timestamp: 2026-01-03_1304
Host: nuc2
Dirty: true
Tests: PASS
Docker: OK
Admin Health: OK
Socket.IO: OK
```

### C) Endpoint sanity (no auth)
```bash
curl -sS https://admin.slimyai.xyz/api/health | head -c 500; echo
curl -sS https://admin.slimyai.xyz/api/diag | head -c 500; echo
```
Output:
```json
{"status":"ok","uptime":54245,"timestamp":"2026-01-03T13:04:09.254Z","version":"1.0.0"}
```

```json
{"ok":true,"authenticated":false}
```

## Browser evidence (STOP condition gate)
Operator evidence (provided externally; place files here and reference them below):
- `docs/buglog/assets/2026-01-03_discord_guilds_429_cache_backoff/browser/auth_guilds_network.png`
- `docs/buglog/assets/2026-01-03_discord_guilds_429_cache_backoff/browser/auth_guilds_console.png`
- `docs/buglog/assets/2026-01-03_discord_guilds_429_cache_backoff/browser/auth_guilds_copydebug.txt`

### Required assets
Folder:
- `docs/buglog/assets/2026-01-03_discord_guilds_429_cache_backoff/browser/`

Files:
- `unauth_network.png`
- `unauth_console.png`
- `unauth_copydebug.txt`
- `auth_guilds_network.png` (must show the `429` request row)
- `auth_guilds_console.png`
- `auth_guilds_copydebug.txt`

### Baseline admin stack + unauth curl proof
```bash
cd /opt/slimy/slimy-monorepo
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml ps
curl -sS -i https://admin.slimyai.xyz/api/health | head -n 40
curl -sS -i https://admin.slimyai.xyz/api/guilds | head -n 60
curl -sS -i https://admin.slimyai.xyz/api/discord/guilds | head -n 60
```

Output (excerpt):
```text
NAME                 IMAGE                  SERVICE        STATUS
slimy-admin-api      slimy-nuc2-admin-api   admin-api      Up (healthy)
slimy-admin-ui       slimy-nuc2-admin-ui    admin-ui       Up (healthy)
```

```text
HTTP/2 200
...
{"status":"ok","uptime":61175,"timestamp":"2026-01-03T14:59:38.933Z","version":"1.0.0"}
```

```text
HTTP/2 401
...
{"ok":false,"code":"UNAUTHORIZED","message":"Authentication required"}
```

## Investigation (call graph)

### A) Server handler
```bash
rg -n "api/discord/guilds|discord/guilds" apps/admin-api/src
```
Findings:
- `apps/admin-api/src/routes/discord.js` exposes `GET /api/discord/guilds` and calls `getSharedGuildsForUser()` → `fetchUserGuilds()` (no 429 backoff/caching today).
- `apps/admin-api/src/routes/guilds.js` exposes `GET /api/guilds` (used by the `/guilds` page) and maps `err.status === 429` to `{ error: "discord_rate_limited" }`.
- `apps/admin-api/src/services/discord-shared-guilds.js`:
  - `fetchUserGuilds()` calls `GET https://discord.com/api/v10/users/@me/guilds` (no retry/backoff; throws with `err.status = res.status`).
  - `getAllUserGuildsWithBotStatus()` calls `fetchUserGuilds()` + per-guild bot checks (burst potential).

### B) Client call sites
```bash
rg -n "api/discord/guilds|discord/guilds" apps/admin-ui
```
Findings:
- `/guilds` page (`apps/admin-ui/pages/guilds/index.js`) fetches `GET /api/guilds` (not `/api/discord/guilds`).
- DebugDock (`apps/admin-ui/components/debug/DebugDock.tsx`) additionally fetches `GET /api/discord/guilds` when enabled (can add load during troubleshooting).

## Fix notes (pending evidence gate)
- Implemented smallest safe backend fix:
  - Shared in-memory cache for `GET /users/@me/guilds` keyed by `userDiscordId` (used by both `/api/guilds` and `/api/discord/guilds`).
  - Coalesced in-flight requests per user key.
  - On Discord 429:
    - If cache exists: serve cached/stale guild list with `meta.discordRateLimited=true`.
    - If no cache: propagate `429` (`discord_rate_limited`) and set `Retry-After` when known.
    - Enforced a minimum 10s cooldown per user to prevent retry storms.
  - Primed the cache during OAuth callback using the already-fetched `/users/@me/guilds` payload (prevents immediate post-login “call Discord again” behavior).
  - Added response headers on guild endpoints for observability:
    - `X-Slimy-Discord-Source: cache|discord`
    - `X-Slimy-Discord-Stale: 0|1`
    - `X-Slimy-Discord-RetryAfterMs: <n>` (when available)

## Files changed
- `apps/admin-api/src/services/discord-shared-guilds.js`
- `apps/admin-api/src/routes/auth.js`
- `apps/admin-api/src/routes/guilds.js`
- `apps/admin-api/src/routes/discord.js`
- `apps/admin-api/tests/discord-user-guilds-cache.test.js`
- `docs/buglog/BUG_2026-01-03_discord_guilds_429_cache_backoff.md`
- `docs/buglog/assets/2026-01-03_discord_guilds_429_cache_backoff/browser/README.md`

## Commands run (with outputs)
```bash
cd /opt/slimy/slimy-monorepo
pnpm -C apps/admin-api test
pnpm -C apps/admin-ui test
pnpm report:nuc2
DOCKER_BUILDKIT=0 docker compose -f infra/docker/docker-compose.slimy-nuc2.yml build admin-api
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d --no-deps --force-recreate admin-api
docker inspect -f '{{.State.Health.Status}}' slimy-admin-api
curl -sS https://admin.slimyai.xyz/api/health | head -c 200; echo
```

Output (excerpt):
```text
apps/admin-api: PASS (jest)
apps/admin-ui: PASS (tripwire tests)
pnpm report:nuc2: Tests PASS, Docker OK, Admin Health OK, Socket.IO OK
Written: docs/reports/REPORT_2026-01-03_1512_nuc2.json
Written: docs/reports/REPORT_2026-01-03_1512_nuc2.html
Written: docs/reports/LATEST_nuc2.json
slimy-admin-api: healthy
{"status":"ok","uptime":9,"timestamp":"2026-01-03T15:24:26.337Z","version":"1.0.0"}
```

## Verification evidence
- Post-change report artifacts:
  - `docs/reports/REPORT_2026-01-03_1512_nuc2.json`
  - `docs/reports/REPORT_2026-01-03_1512_nuc2.html`
  - `docs/reports/LATEST_nuc2.json`
- Unit proof that `/api/guilds` + `/api/discord/guilds` share one cached Discord user-guild fetch:
  - `apps/admin-api/tests/discord-user-guilds-cache.test.js`

## Commit
- `d0443cc` — `fix(discord): cache guilds + respect 429 backoff to prevent /guilds load failures`
