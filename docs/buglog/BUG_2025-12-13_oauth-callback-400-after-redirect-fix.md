# BUG: oauth-callback-400-after-redirect-fix (2025-12-13)

## Context
- Detected repo path: `/home/mint/Desktop/slimy-monorepo` (fallback for `/opt/slimy/slimy-monorepo`)
- `git rev-parse --short HEAD`: `4f310b1`
- Architecture rules: `docs/AI_RULES.md`

## Symptom (as reported)
- Discord login succeeds (QR works), then the callback returns HTTP `400` and user is not authenticated on `/dashboard`.

## Prior Fix Confirmation (redirect_uri)
- Docker effective `DISCORD_REDIRECT_URI` (from `docker compose config`):
  - `http://localhost:3001/api/admin-api/api/auth/callback`
- Admin UI initiates login via:
  - `GET /api/admin-api/api/auth/login?returnTo=/dashboard`

### Source References (for this investigation)
- Admin API login/callback: `apps/admin-api/src/routes/auth.js:73`
- Cookie options (Secure/SameSite/Domain/Path): `apps/admin-api/src/services/token.js:33`
- Admin UI catch-all proxy (cookie + x-forwarded-*): `apps/admin-ui/pages/api/admin-api/[...path].js:15`
- Dashboard SSR auth probe: `apps/admin-ui/pages/dashboard.jsx:18`

## Repro Steps (Clean Session)
1. Clear cookies for `http://localhost:3001` in browser.
2. Start stack: `pnpm smoke:docker` (or `docker compose up`).
3. Open `http://localhost:3001/status` (or `http://localhost:3001/dashboard`).
4. Click **Login** and complete Discord OAuth.
5. Observe failure point: callback responds `400` and does not land authenticated on `/dashboard`.

## Plan (Evidence-Driven)
### Hypothesis 1: `oauth_state` cookie not set / not returned (state mismatch)
- Inspect:
  - `apps/admin-api/src/routes/auth.js` (login/callback state checks)
  - `apps/admin-api/src/services/token.js` (cookie options)
  - `apps/admin-ui/pages/api/admin-api/[...path].js` (proxy Set-Cookie forwarding)
- Expected signal:
  - On callback, server logs show `saved` cookie missing OR `state !== saved`.
  - Browser devtools shows `oauth_state` missing or not sent to callback request.

### Hypothesis 2: localhost vs 127.0.0.1 host mismatch
- Inspect:
  - `apps/admin-api/src/routes/auth.js` (`getRequestOrigin`, returnTo normalization)
  - Docker env + admin-ui links for canonical host
- Expected signal:
  - Login initiated on `http://127.0.0.1:3001` but `redirect_uri` uses `http://localhost:3001/...` (or vice versa).
  - Cookies are host-only, so state cookie is not returned on callback.

### Hypothesis 3: returnTo cookie validation / origin allowlist mismatch
- Inspect:
  - `apps/admin-api/src/config.js` (`ui.origins`, `CLIENT_URL`, redirects)
  - `apps/admin-api/src/routes/auth.js` (`normalizeReturnTo`)
- Expected signal:
  - Callback succeeds but redirects to unexpected origin (e.g. `localhost:3000`) OR drops returnTo and uses default.

### Hypothesis 4: proxy is not forwarding headers needed for origin/proto detection
- Inspect:
  - `apps/admin-ui/pages/api/admin-api/[...path].js` (forwarded headers)
  - `apps/admin-api/src/services/token.js` + `apps/admin-api/src/routes/auth.js` (x-forwarded-* use)
- Expected signal:
  - Cookies set with wrong flags (e.g. `Secure` on HTTP) or origin computed incorrectly.

## Expected Fix Outcome
- OAuth callback request to `http://localhost:3001/api/admin-api/api/auth/callback?...` (or `127.0.0.1` equivalent) returns `302` to `/dashboard` (no `400`).
- Auth cookie is stored for the same host the user is browsing (localhost vs 127).
- `/api/admin-api/api/auth/me` returns `200` in the browser session.

## Pending Inputs (from reporter)
Please paste the exact failure details so we can correlate with logs:
- Full callback URL (with `code=...&state=...`)
- HTTP status + body (the `400` response)
- Whether the browser was on `localhost` or `127.0.0.1`
- `docker compose logs --tail 200 admin-api` around the callback attempt

## Findings (Local Docker)
### 1) Admin API login debug (enabled via `ADMIN_AUTH_DEBUG=1`)
Observed in `docker compose logs admin-api` after hitting:
- `GET http://localhost:3001/api/admin-api/api/auth/login?returnTo=%2Fdashboard`

Log excerpt (non-secret):
- `[auth/login] oauth config { clientId: '1431…0377', redirectUri: 'http://localhost:3001/api/admin-api/api/auth/callback', requestOrigin: 'http://localhost:3001' }`

### 2) Host-split cookies are a likely cause of “state mismatch” and post-login failures
With the new redirect-uri resolution logic, the authorize URL now matches the host you start from:
- Start on `localhost:3001` → authorize URL uses `redirect_uri=http://localhost:3001/api/admin-api/api/auth/callback`
- Start on `127.0.0.1:3001` → authorize URL uses `redirect_uri=http://127.0.0.1:3001/api/admin-api/api/auth/callback`

This prevents the common failure mode where:
- login is initiated on `127.0.0.1` (state cookie set on 127 host),
- but Discord redirects back to `localhost` (cookie not sent),
- causing callback rejection.

## Code Changes (Minimum)
### Admin API: compute `redirect_uri` per request origin for localhost/127
- File: `apps/admin-api/src/routes/auth.js:45`
  - Added `resolveDiscordRedirectUri(req)` to rewrite configured localhost/127 redirect URIs to the *actual* request host/proto.
  - Used the resolved value in both `/api/auth/login` and `/api/auth/callback` so the token exchange matches the authorize request.
  - Added `ADMIN_AUTH_DEBUG` gated logs and more detailed state-mismatch diagnostics.
  - Callback now prefers redirecting to the current origin’s `/dashboard` when safe (`originAllowed`) before falling back to configured `successRedirect`.

### Admin UI: always forward `x-forwarded-proto`
- File: `apps/admin-ui/pages/api/admin-api/[...path].js:45`
  - Ensures Admin API can reliably decide cookie `Secure` and origin behavior behind proxies.

### Docker: plumb `ADMIN_AUTH_DEBUG` (optional)
- File: `docker-compose.yml:34`
- File: `.env.docker.example:24`

## Verification (Partial: Non-interactive)
### 1) `pnpm smoke:docker`
- PASS (2025-12-13)

### 2) Authorize URL host matches the initiating host
`GET /api/admin-api/api/auth/login?returnTo=/dashboard` returns `302` to Discord with:
- Initiated from `http://localhost:3001` → `redirect_uri=http://localhost:3001/api/admin-api/api/auth/callback`
- Initiated from `http://127.0.0.1:3001` → `redirect_uri=http://127.0.0.1:3001/api/admin-api/api/auth/callback`

This is the key reliability fix for state/cookie host-splitting.

### 3) Callback no longer “hard fails” on state issues; it redirects safely
Synthetic callback without cookies:
- `GET http://localhost:3001/api/admin-api/api/auth/callback?code=fake&state=fake`
Result:
- HTTP `302` → `Location: /?error=state_mismatch`
- With `ADMIN_AUTH_DEBUG=1`, admin-api logs show state-mismatch diagnostics including `requestOrigin`.
  - Example log:
    - `[auth/callback] State mismatch detail { requestOrigin: 'http://localhost:3001', hasCode: true, hasState: true, hasSaved: false, statePrefix: 'fake', savedPrefix: null }`

## Verification (Pending: Requires real Discord OAuth)
To declare the bug fully resolved, we still need a real OAuth round-trip in a clean browser session:
1. Open `http://localhost:3001/status`
2. Click Login
3. Complete Discord auth
4. Confirm:
   - Callback responds `302` to `/dashboard` (no `400`)
   - `/dashboard` shows logged-in state
   - `/api/admin-api/api/auth/me` returns `200` in that browser session
