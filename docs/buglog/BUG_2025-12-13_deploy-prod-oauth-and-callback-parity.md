# BUG_2025-12-13_deploy-prod-oauth-and-callback-parity

## Symptom
- Production (NUC2) Discord OAuth can fail with `Invalid OAuth2 redirect_uri`, callback `400`, or unstable `/auth/me` due to host/cookie mismatch.

## Root Cause
- NUC2 was serving traffic from the repo-root `docker-compose.yml` stack (`slimy-monorepo-*`) which used repo `.env` defaults (localhost redirect + placeholder Discord client ID), while the intended production stack (`infra/docker/docker-compose.slimy-nuc2.yml` + `/opt/slimy/secrets/.env.admin.production`) was not running `web`/`admin-api` due to port conflicts.

## Plan
- Confirm the *actual* public Admin UI hostname users hit (e.g. `https://admin.slimyai.xyz` vs `https://panel.slimyai.xyz`).
- Align Discord Developer Portal redirect URIs with runtime `DISCORD_REDIRECT_URI`.
- Ensure Caddy routes/proxies match the deployed Admin UI + admin-api paths.
- Rebuild/restart Docker stack and verify via real browser OAuth + `/auth/me` 200.

## Changes
- Deployment: stopped repo-root compose stack and brought up `infra/docker/docker-compose.slimy-nuc2.yml` so production env + Caddy routing are in effect.

## Verification
- `curl -i https://admin.slimyai.xyz/api/health` returns `200`.
- `curl -i https://admin.slimyai.xyz/api/diag` returns `200` (unauthenticated payload).
- `curl -i https://admin.slimyai.xyz/api/auth/login` returns `302` with:
  - `client_id=1431075878586290377`
  - `redirect_uri=https://admin.slimyai.xyz/api/auth/callback`
  - `Set-Cookie: oauth_state=...; Domain=.slimyai.xyz; Secure; SameSite=Lax`
- `curl -i https://slimyai.xyz/` returns `200` (Caddy → web OK).
- `curl -i https://slimyai.xyz/api/auth/me` returns `401` (unauthenticated, not `500`).
- `curl -i https://slimyai.xyz/api/auth/login` returns `302` to Discord with `redirect_uri=https://admin.slimyai.xyz/api/auth/callback`.

Browser OAuth round-trip still required (see final section).

---

## Manual Browser Verification (REQUIRED)

1. In Discord Developer Portal → OAuth2 → Redirects:
   - Ensure this exact redirect is present: `https://admin.slimyai.xyz/api/auth/callback`
   - (Optional local/dev) `http://localhost:3001/api/admin-api/api/auth/callback` if still used locally

2. Real browser round-trip (record exact URL transitions):
   - Start at `https://slimyai.xyz/` (or the actual UI entrypoint you use)
   - Trigger Login (should navigate to `https://admin.slimyai.xyz/api/auth/login` at some point)
   - Discord authorize → callback hits `https://admin.slimyai.xyz/api/auth/callback?...`
   - Confirm final landing is `https://slimyai.xyz/dashboard`

3. DevTools Network checks (record in this log):
   - `/dashboard` status code (should be `200`)
   - `/api/auth/me` status code (must be `200`, not `401/500`)

4. During the callback test, capture:
   - `docker compose -f infra/docker/docker-compose.slimy-nuc2.yml logs --tail 200 admin-api`
   - Confirm callback success and `/api/auth/me` is `200`

---

## Initialize (Flight Recorder)

### Git
- Branch: `main`
- Last commit: `64b824c`
- Status: `## main...origin/main`

### Docker Compose env (auth-relevant)
From `docker-compose.yml`:
- `DISCORD_CLIENT_ID`: `${DISCORD_CLIENT_ID}`
- `DISCORD_CLIENT_SECRET`: `${DISCORD_CLIENT_SECRET}`
- `DISCORD_REDIRECT_URI`: `${DISCORD_REDIRECT_URI:-http://localhost:3000/api/auth/callback}`
- `DISCORD_OAUTH_SCOPES`: `${DISCORD_OAUTH_SCOPES:-identify guilds}`
- `DISCORD_BOT_TOKEN`: `${DISCORD_BOT_TOKEN}`
- `SESSION_SECRET`: `${SESSION_SECRET:-change_this_session_secret_minimum_32_chars}`
- `SESSION_COOKIE_DOMAIN`: `${SESSION_COOKIE_DOMAIN:-.localhost}`
- `COOKIE_DOMAIN`: `${COOKIE_DOMAIN:-.localhost}`
- `CORS_ORIGIN`: `${CORS_ORIGIN:-http://localhost:3000}`
- `CLIENT_URL`: `${CLIENT_URL:-http://localhost:3000}`

From `.env` (present values; secrets redacted by repo defaults):
- `DISCORD_BOT_TOKEN=disabled`
- `DISCORD_CLIENT_ID=123456789012345678`
- `DISCORD_CLIENT_SECRET=disabled`

From `infra/docker/docker-compose.slimy-nuc2.yml` (intended NUC2 stack):
- `admin-api` uses `env_file: /opt/slimy/secrets/.env.admin.production` (contains production Discord + cookie settings)
- `admin-api` sets `TRUST_PROXY="1"` and `CORS_ORIGIN=https://admin.slimyai.xyz`

From `/opt/slimy/secrets/.env.admin.production` (redacted):
- `COOKIE_DOMAIN=.slimyai.xyz`
- `DISCORD_CLIENT_ID=1431075878586290377`
- `DISCORD_CLIENT_SECRET=[REDACTED]`
- `DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/callback`
- `CLIENT_URL=https://slimyai.xyz`
- `SESSION_SECRET=[REDACTED]`
- `DISCORD_BOT_TOKEN=[REDACTED]`

### Caddy routing (NUC2)
From `infra/docker/Caddyfile.slimy-nuc2`:
- `slimyai.xyz`, `www.slimyai.xyz` → web on `127.0.0.1:3000`, admin-api on `127.0.0.1:3080` (via `@admin_api_slime` for `/api/*` excluding whitelisted web routes)
- `login.slimyai.xyz` / `panel.slimyai.xyz` / `chat.slimyai.xyz` → same pattern (web `3000`, admin-api `3080`)
- `admin.slimyai.xyz` → reverse proxy directly to `127.0.0.1:3080`

Notes:
- This Caddyfile does **not** currently expose the Next.js `admin-ui` service (Compose maps it to host `3001`), and it does **not** define a `/api/admin-api/*` proxy path at the edge; that proxy path is expected to be handled by the Next.js admin-ui API route when the Admin UI is the public host.

### Current running containers (NUC2)
Observed two compose stacks running concurrently:
- `slimy-monorepo-*` (repo-root `docker-compose.yml`) running `web` on `:3000`, `admin-ui` on `:3001`, `admin-api` on `:3080`
- `slimy-nuc2` (infra compose) currently only running `caddy` + `slimy-db` + `loopback1455` (no `slimy-web` / `slimy-admin-api`), consistent with port conflicts.

Evidence (current auth response from the *running* `admin-api` on `127.0.0.1:3080`):
- `/api/auth/login` returns `redirect_uri=http://localhost:3000/api/auth/callback`
- `Set-Cookie oauth_state` uses `Domain=.localhost`
- `client_id=123456789012345678` (matches repo `.env`, not production secrets)

### Deploy actions taken
- Stopped the repo-root stack: `docker compose -f docker-compose.yml down`
- Started the intended NUC2 stack: `docker compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d --build`

### Production host decision (to verify in browser)
- Admin API public host (per Caddy + secrets): `https://admin.slimyai.xyz`
- Production Discord redirect URI (must be in Discord Developer Portal): `https://admin.slimyai.xyz/api/auth/callback`
- Post-login landing (per `CLIENT_URL` in production env): `https://slimyai.xyz/dashboard`
