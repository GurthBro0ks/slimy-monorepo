# BUGLOG: Admin domain UI + OAuth + routes cleanup (2025-12-21)

## Goal
Make Admin UI usable from public domains (no tunnels), while keeping localhost dev working:
- `admin.slimyai.xyz` serves **Admin UI** (not admin-api root).
- Discord OAuth `redirect_uri` uses the **public origin** when accessed via the public domain.
- Prod CORS reflects the correct origin for admin-ui ↔ admin-api.
- Remove confusing duplicate UI paths:
  - `/guilds` = login + select guild only
  - `/club/<guildId>` = club home (what `/guilds/<guildId>` did)
  - `/snail` = personal snail (login-gated, not guild-scoped)
  - `/snail/<guildId>` = guild-scoped snail tools (requires active guild + role)
- Disable “Add Bot to Another Server”.
- Keep debug/status area visible on touched pages.

## Baseline evidence (outside-in)

### DNS + current routing
```bash
dig +short admin.slimyai.xyz
```
Output:
```text
68.179.170.248
```

```bash
curl -sS -I https://admin.slimyai.xyz/ | sed -n '1,25p'
```
Key output:
```text
HTTP/2 404
content-type: application/json; charset=utf-8
via: 1.1 Caddy
```

```bash
curl -sS -I https://admin.slimyai.xyz/login | sed -n '1,25p'
```
Key output:
```text
HTTP/2 404
content-type: application/json; charset=utf-8
via: 1.1 Caddy
```

```bash
curl -sS -I https://admin.slimyai.xyz/api/health | sed -n '1,25p'
```
Key output:
```text
HTTP/2 200
content-type: application/json; charset=utf-8
via: 1.1 Caddy
```

### SSH attempt (blocked)
```bash
ssh nuc2
```
Output:
```text
ssh: Could not resolve hostname nuc2: Temporary failure in name resolution
```

Host port probe:
```bash
nc -vz -w 3 68.179.170.248 22
nc -vz -w 3 68.179.170.248 4422
```
Key output:
```text
port 22: Connection refused
port 4422: succeeded
```

SSH (keyscan + auth):
```bash
ssh-keyscan -p 4422 68.179.170.248 >> ~/.ssh/known_hosts
ssh -p 4422 -o BatchMode=yes slimy@68.179.170.248 'hostname'
```
Key output:
```text
Permission denied (publickey,password).
```

## Root cause
1) Production `admin.slimyai.xyz` was only reliably serving admin-api (root `/` -> JSON 404), not the admin-ui app.
2) The intended production stack on nuc2 did not include an `admin-ui` service (compose), so even a correct Caddy route would not have had a UI upstream.
3) OAuth redirect origin behavior depends on correct upstream request host/proto + explicit production env; this needed to be enforced for domain-mode.

## Fixes implemented (repo)

### 1) Production routing: `admin.slimyai.xyz` → admin-ui, keep `/api/health` → admin-api
- Updated `infra/docker/Caddyfile.slimy-nuc2`:
  - `/api/health` reverse-proxies to `127.0.0.1:3080`
  - everything else reverse-proxies to `127.0.0.1:3001` (admin-ui)
  - adds response header `X-Slimy-Upstream: admin-ui` on UI responses
  - explicitly forwards `Host` and `X-Forwarded-Port` upstream to preserve origin behavior

Validation:
```bash
docker run --rm -v "$PWD/infra/docker/Caddyfile.slimy-nuc2:/etc/caddy/Caddyfile:ro" caddy:2 \
  caddy validate --config /etc/caddy/Caddyfile
```
Key output:
```text
Valid configuration
```

### 2) Deployable nuc2 compose: add admin-ui service + domain-mode env
- Updated `infra/docker/docker-compose.slimy-nuc2.yml`:
  - adds `admin-ui` service (port `3001:3000`)
  - sets domain-mode env:
    - `ADMIN_UI_ORIGIN=https://admin.slimyai.xyz`
    - `NEXT_PUBLIC_DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/discord/callback`
    - `ALLOW_LOCALHOST_OAUTH=0`
  - wires `caddy` `depends_on` to include `admin-ui`

### 3) OAuth redirect origin helper already in-place; prod env enforced
- `apps/admin-ui/lib/oauth-origin.js` derives a safe public origin from request headers and an allowlist.
- `apps/admin-ui/pages/api/auth/discord/authorize-url.js` now generates redirect URI only via:
  - `redirectUri = ${getPublicOrigin(req)}/api/auth/discord/callback`

Live CORS reflection check (already correct on current prod API):
```bash
curl -sS -D- -o /dev/null -H 'Origin: https://admin.slimyai.xyz' https://admin.slimyai.xyz/api/health \
  | tr -d "\r" | rg -i 'access-control-allow-origin|vary: origin'
```
Key output:
```text
access-control-allow-origin: https://admin.slimyai.xyz
vary: Origin
```

## UI route cleanup + nav changes (admin-ui)

### New canonical routes
- `/guilds` is now *only* the guild picker (login-gated).
- `/club/<guildId>` is the club home (moved from `/guilds/<guildId>`).
- `/snail` is personal snail (login-gated, shows active guild indicator only).
- `/snail/<guildId>` is guild-scoped snail tools (requires active guild selection + role).
- Legacy `/guilds/<guildId>/*` now redirects to `/club/<guildId>/*`.

### Add-bot disabled
- “Add Bot to Another Server” and per-guild “Invite Bot” are now rendered disabled (no navigation/OAuth).

## Tests / builds / smoke

### Tests
```bash
pnpm -w --filter @slimy/admin-api test
```
Result (key):
```text
PASS: admin-api (jest)
PASS: admin-ui (oauth-origin test)
NOTE: `pnpm -w --filter ... test` also runs the workspace root `test` script, which triggers `pnpm -r run test` (so you’ll see bot/web/shared packages run too).
```

```bash
pnpm --filter @slimy/admin-ui test
```
Result (key):
```text
=== All oauth-origin tests passed ===
```

### Admin UI build
Note: `pnpm -w --filter @slimy/admin-ui build` currently also triggers root `pnpm -r run build` (root package is in scope with `-w`), which can race and fail with a transient Next.js `.next` cleanup `ENOENT`.

Successful build command (scoped only):
```bash
pnpm --filter @slimy/admin-ui build
```

Observed failure (workspace + filter):
```bash
pnpm -w --filter @slimy/admin-ui build
```
Key output:
```text
Error: ENOENT: no such file or directory, rename '.../apps/admin-ui/.next/...'
ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL
```

### Stability gate
```bash
pnpm stability:gate
pnpm stability:gate --full
```
Key results:
```text
PASS: OAuth redirect checks (localhost mode)
PASS: admin-ui /guilds and /snail behavioral probes
PASS: docker smoke baseline (bridge endpoints + auth-gated endpoints)
```

Reports (local temp files):
- `/tmp/STABILITY_REPORT_2025-12-21_01-46-57_admin-oauth-guildgate.md`
- `/tmp/STABILITY_REPORT_2025-12-21_01-48-09_admin-oauth-guildgate.md`

## Manual verification checklist (domain mode; pending deploy)
Blocked from SSHing to the edge host from this environment, so production deployment + live verification must be performed by an operator with host access.

Once deployed (Caddy + admin-ui service), verify:
- `curl -sS -I https://admin.slimyai.xyz/ | sed -n '1,20p'` → 200 HTML + `X-Slimy-Upstream: admin-ui`
- `curl -sS -I https://admin.slimyai.xyz/login | sed -n '1,20p'` → 200 HTML
- `curl -sS -I https://admin.slimyai.xyz/api/health | sed -n '1,25p'` → 200 JSON
- `curl -sS -D- -o /dev/null https://admin.slimyai.xyz/api/auth/discord/authorize-url | tr -d '\r' | rg -i 'Location:'`
  - contains `redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback`

## Files changed (high-signal)
- Production infra: `infra/docker/Caddyfile.slimy-nuc2`, `infra/docker/docker-compose.slimy-nuc2.yml`, `apps/web/Caddyfile.template`
- Admin UI: `apps/admin-ui/pages/guilds/index.js`, `apps/admin-ui/pages/club/[guildId]/*`, `apps/admin-ui/pages/guilds/[guildId]/[[...rest]].js`, `apps/admin-ui/components/Layout.js`, `apps/admin-ui/lib/session.js`

## Closeout
ready to move on
