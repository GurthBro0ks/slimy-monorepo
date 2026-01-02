# BUGLOG — Active-Guild 503 + Guilds/Chat Cascade (2026-01-02)

## Symptom / Context
- Live domain: `https://admin.slimyai.xyz`
- Admin panel issues reported:
  - `POST /api/auth/active-guild` returns `503 Service Unavailable` (in-browser)
  - `/api/guilds` hangs/pending or fails (`server_error`)
  - UI shows guilds `UNAVAILABLE` + React minified errors (`#425/#423`)
  - Chat connects then loops `connected → connecting` (disconnect immediately)

## Plan
1. Capture baseline (no changes).
2. Identify who emits `503` (Caddy vs admin-ui vs admin-api) via headers + logs.
3. Fix `POST /api/auth/active-guild` `503` (smallest safe change).
4. Fix `/api/guilds` hanging (timeouts + graceful fallback).
5. Fix chat connect/disconnect loop (after auth + guilds are stable).
6. Add minimal UI guards to prevent render cascades.

## Baseline Snapshot (NO CHANGES YET)

### Repo
Command:
- `git rev-parse HEAD`

Output:
```
3e6acb9f9bc61653154d35f3d36a09534d73a01c
```

### Runtime (docker compose)
Command:
- `docker compose -f infra/docker/docker-compose.slimy-nuc2.yml ps`

Output:
```
NAME                           IMAGE                  COMMAND                  SERVICE        CREATED             STATUS                       PORTS
fc742048355e_slimy-admin-api   slimy-nuc2-admin-api   "docker-entrypoint.s…"   admin-api      About an hour ago   Up About an hour (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-admin-ui                 slimy-nuc2-admin-ui    "docker-entrypoint.s…"   admin-ui       19 seconds ago      Up 18 seconds (healthy)      0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-db                       mysql:8                "docker-entrypoint.s…"   slimy-db       2 weeks ago         Up 7 days (healthy)          0.0.0.0:3306->3306/tcp, :::3306->3306/tcp, 33060/tcp
slimy-loopback1455             python:3-alpine        "python3 -m http.ser…"   loopback1455   2 weeks ago         Up 7 days (healthy)          0.0.0.0:1455->1455/tcp, :::1455->1455/tcp
```

### External checks (curl)
Notes:
- Header outputs below have `Set-Cookie` values redacted.

Command:
- `curl -sS -D- https://admin.slimyai.xyz/api/health -o /dev/null`

Output:
```
HTTP/2 200
content-type: application/json; charset=utf-8
via: 1.1 Caddy
```

Command:
- `time curl -sS -D- https://admin.slimyai.xyz/api/guilds -o /dev/null`

Output:
```
HTTP/2 401
content-type: application/json; charset=utf-8
via: 1.1 Caddy

real	0.105
```

Command:
- `curl -sS -D- -H 'content-type: application/json' -d '{"guildId":"1176605506912141444"}' https://admin.slimyai.xyz/api/auth/active-guild -o /dev/null`

Output:
```
HTTP/2 401
content-type: application/json; charset=utf-8
via: 1.1 Caddy
```

### Proxy logs (Caddy)
Command:
- `journalctl -u caddy -n 200 --no-pager`

Output (snippets; sensitive values redacted):
```
... "uri":"/socket.io/?EIO=4&transport=websocket" ... "status":502 ... "malformed HTTP status code \"Server\"" ...
... "uri":"/socket.io/?EIO=4&transport=polling&t=1767366892" ... "status":502 ... "read: connection reset by peer" ...
```

### Container logs
Command:
- `docker logs --tail 200 admin-ui || true`

Output:
```
Error response from daemon: No such container: admin-ui
```

Command:
- `docker logs --tail 200 admin-api || true`

Output:
```
Error response from daemon: No such container: admin-api
```

Command:
- `docker logs --tail 200 slimy-admin-ui`

Output (snippets):
```
Next.js ...
✓ Starting...
✓ Ready in ...
```

Command:
- `docker logs --tail 200 fc742048355e_slimy-admin-api`

Output (snippets):
```
... "method":"POST","path":"/api/auth/active-guild" ... "msg":"Incoming request"
... "method":"GET","path":"/api/guilds" ... "statusCode":401 ...
```

## Repro Notes (UNCONFIRMED)
- The baseline curl checks above are unauthenticated and return quickly (`401`).
- The reported `503`/hangs appear to require an authenticated browser session and/or a specific client request path.

## Step 1 — Identify who returns the 503
Finding:
- `503` is emitted by `admin-api` (not Caddy), from `POST /api/auth/active-guild`.

Evidence (from container logs; redacted):
Command:
- `docker logs fc742048355e_slimy-admin-api | rg -n 'statusCode\":503|discord_user_guilds_failed|server_error' | tail -n 50`

Output (snippets):
```
... [guilds] failed to fetch guilds with bot status { code: 'discord_user_guilds_failed:429' }
... "method":"POST","path":"/api/auth/active-guild" ... "statusCode":503 ...
```

Working hypothesis:
- `admin-ui` loops calls to `/api/guilds` + `/api/auth/active-guild`, triggering Discord rate limits (`429`).
- `admin-api` previously mapped Discord non-200 to `503`, which causes the UI to retry/spam (cascade).

## Step 2 — Fix `/api/auth/active-guild` 503 mapping + add fallback
Change summary (smallest safe change):
- Add a short timeout to Discord `GET /users/@me/guilds`.
- Map Discord `401/403` to `401 discord_token_invalid` (prompt re-auth, not `503`).
- Map Discord `429` to:
  - `429 discord_rate_limited` when no DB fallback exists
  - `200 ok` (allow selection) when the user already has a `userGuild` DB record for that guild.
- Keep “botInstalled” check best-effort (never blocks selection).

Files changed:
- `apps/admin-api/src/routes/auth.js`
- `apps/admin-api/tests/auth/active-guild.test.js`

Commands run:
- `pnpm -C apps/admin-api test -- tests/auth/active-guild*.test.js`

Output:
```
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

## Step 3 — Fix `/api/guilds` pending/hanging + `server_error`
Finding:
- `GET /api/guilds` can become slow and/or return `500 server_error` when Discord is rate-limiting (`429`) or when the bot membership checks cause long waits.

Change summary (smallest safe change):
- Add short Discord fetch timeouts in `discord-shared-guilds`.
- Avoid per-guild bot membership checks for non-manageable guilds (reduces Discord API load).
- Do not retry `429` during guild-list bot membership checks (keeps request fast).
- Map Discord failures surfaced as `err.status`:
  - `401/403` → `401 discord_token_invalid`
  - `429` → `429 discord_rate_limited`

Files changed:
- `apps/admin-api/src/services/discord-shared-guilds.js`
- `apps/admin-api/src/routes/guilds.js`
- `apps/admin-api/tests/guilds-list-discord-error-mapping.test.js`

Commands run:
- `pnpm -C apps/admin-api test -- "tests/guilds-list-.*\\.test\\.js"`

Output:
```
Test Suites: 2 passed, 2 total
Tests:       3 passed, 3 total
```

## Step 4 — Chat connect/disconnect loop (server-side stabilization)
Hypothesis:
- Socket.IO auth uses the session-store guild list; when it’s empty/missing, non-admins get `no_guild_context` and are disconnected.
- During Discord rate limits or session-store issues, this can cause a connect → disconnect loop in the UI.

Change summary (smallest safe change):
- Add a DB fallback in the Socket.IO auth middleware: if session-store has no guilds, hydrate guild ids from DB via `getUserGuilds` (same strategy used in HTTP auth middleware).

Files changed:
- `apps/admin-api/src/socket.js`

## Deployment / Verification (host)
Commands run:
- `docker compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d --build admin-api`
- `docker compose -f infra/docker/docker-compose.slimy-nuc2.yml ps`
- `curl -sS -D- https://admin.slimyai.xyz/api/health -o /dev/null`
- `curl -sS -i -H 'Origin: https://admin.slimyai.xyz' "https://admin.slimyai.xyz/socket.io/?EIO=4&transport=polling&t=$(date +%s)" | head -n 25`

Evidence (snippets):
```
slimy-admin-api ... Up ... (healthy)
```

```
HTTP/2 200
...
0{"sid":"REDACTED","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}
```

## Step 5 — Stop client retry cascades (minimal)
Change summary (smallest safe change):
- Extend `active-guild` sync backoff to include `429`, `503`, and network `"error"` statuses (prevents tight retry loops when Discord/admin-api is degraded).

Files changed:
- `apps/admin-ui/lib/active-guild.js`

Commands run:
- `pnpm -C apps/admin-ui test`

Output (snippets):
```
[PASS] authorize-url canonical redirect_uri
[PASS] no legacy auth/proxy references in client bundle
[PASS] auth callback proxy tripwires
[PASS] oauth post-login redirect tripwires
```
