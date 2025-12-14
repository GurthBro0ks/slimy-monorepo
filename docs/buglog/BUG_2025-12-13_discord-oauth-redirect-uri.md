# BUG: discord-oauth-redirect-uri (2025-12-13)

## Context
- Repo: `/opt/slimy/slimy-monorepo` (in this environment: `/home/mint/Desktop/slimy-monorepo`)
- Admin UI: Next.js (Pages Router) on `http://localhost:3001`
- Admin API: Express on `http://localhost:3080` (Docker internal: `http://admin-api:3080`)

## Symptom
- Clicking **Login** sends the browser to Discord and Discord returns:
  - “Invalid OAuth2 redirect_uri” (sometimes “Unknown Application”)
- The Discord authorize URL contains a `redirect_uri` like `http://localhost:3000/api/auth/callback` even though Admin UI runs on `localhost:3001`.
- After login attempts, user does not land back on `/dashboard` authenticated.

## Reproduction Steps
1. Start docker stack (e.g. `pnpm smoke:docker` or `docker compose up`).
2. Open `http://localhost:3001/status`.
3. Click **Login**.
4. Observe Discord error page and inspect the `redirect_uri` query param; it references the wrong host/port (e.g. `localhost:3000`).

## Notes
- Goal: Make the computed Discord OAuth `redirect_uri` match the actual browser-accessible callback URL for Admin UI (`http://localhost:3001/...`) and keep cookie-host affinity working.

## Analysis (Initial)
- Docker defaults currently set `DISCORD_REDIRECT_URI` to `http://localhost:3000/api/auth/callback` (`docker-compose.yml`), which is the wrong host/port for Admin UI (`localhost:3001`).
- Admin API constructs the Discord authorize URL from `config.discord.redirectUri` (which comes from `process.env.DISCORD_REDIRECT_URI`).
- To keep cookies on the Admin UI host, the callback should be routed through Admin UI’s proxy:
  - Browser-visible callback: `http://localhost:3001/api/admin-api/api/auth/callback`
  - Admin UI proxy forwards that to Admin API’s real handler: `GET /api/auth/callback`

## Expected Redirect URIs After Fix
- Local (recommended canonical host):
  - `http://localhost:3001/api/admin-api/api/auth/callback`
- Optional (if you insist on `127.0.0.1`):
  - `http://127.0.0.1:3001/api/admin-api/api/auth/callback`
- Production (current Caddy routing points `admin.slimyai.xyz` directly at admin-api):
  - `https://admin.slimyai.xyz/api/auth/callback`

## File Modification Plan
1. Update Docker env defaults so Admin API uses the correct callback:
   - `docker-compose.yml`: change admin-api `DISCORD_REDIRECT_URI` default to `http://localhost:3001/api/admin-api/api/auth/callback`
   - `.env.docker.example`: update `DISCORD_REDIRECT_URI` accordingly (and document prod pattern)
2. Add a non-secret debug line in Admin API login route to log the computed `redirect_uri` and masked `client_id`.
3. Update docs to explain which redirect URIs must be added in the Discord Developer Portal for local + prod.
4. Verify:
   - `pnpm smoke:docker` passes
   - Manual: clicking Login from `http://localhost:3001/status` produces an authorize URL whose `redirect_uri=` matches `http://localhost:3001/api/admin-api/api/auth/callback`

## Progress Log
- 2025-12-13: Updated docker defaults and docs to use `http://localhost:3001/api/admin-api/api/auth/callback` for `DISCORD_REDIRECT_URI`.
- 2025-12-13: Added a non-production debug log in `GET /api/auth/login` to print computed `redirectUri` and masked `clientId`.

## Discord Developer Portal Settings
Add these **OAuth2 Redirects** to your Discord application:
- Local (recommended): `http://localhost:3001/api/admin-api/api/auth/callback`
- Local (optional): `http://127.0.0.1:3001/api/admin-api/api/auth/callback`
- Production (current): `https://admin.slimyai.xyz/api/auth/callback`

## Verification
### Smoke
- `pnpm smoke:docker`: PASS (2025-12-13)

### Authorize URL (manual-equivalent via curl)
Request:
- `GET http://127.0.0.1:3001/api/admin-api/api/auth/login?returnTo=%2Fdashboard`

Observed `Location:` header (client_id partially redacted):
- `https://discord.com/oauth2/authorize?client_id=1431…0377&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fadmin-api%2Fapi%2Fauth%2Fcallback&response_type=code&scope=identify+guilds&state=...`

Success metrics:
- Authorize URL now contains `redirect_uri=http://localhost:3001/api/admin-api/api/auth/callback` (correct host/port/path).
- No 500/502 regressions in docker smoke.
