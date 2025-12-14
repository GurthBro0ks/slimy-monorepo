# BUG: dashboard-auth-flow-finalize (2025-12-13)

## Context
- System: LOCAL laptop
- Detected repo path: `/home/mint/Desktop/slimy-monorepo`
- `git rev-parse --short HEAD`: `b302887`
- Architecture rules: `docs/AI_RULES.md`

## Goal
Make `/dashboard` the deterministic post-login landing:
- Logged out: `/dashboard` → redirect to `/status?returnTo=/dashboard`
- Login: `/status` → Discord → callback → lands back on `/dashboard`
- Logged in: `/dashboard` loads and shows real user data (not “Unknown”), no console errors
- Host mismatch (`localhost` vs `127.0.0.1`) must not break cookies/state/returnTo

## Symptom (as reported)
- `/dashboard` sometimes shows auth error, “Unknown”, or loops/lands wrong after OAuth.
- Historically: host mismatch issues (`localhost` vs `127`) caused cookie/state splitting.

## Current flow inventory
### Admin UI login entry
- `apps/admin-ui/pages/status.jsx`:
  - Login redirects browser to: `/api/admin-api/api/auth/login?returnTo=%2Fdashboard`
  - Logout calls: `POST /api/admin-api/api/auth/logout`

### Admin UI dashboard SSR auth probe
- `apps/admin-ui/pages/dashboard.jsx`:
  - `getServerSideProps` calls: `GET {proto}://{host}/api/admin-api/api/auth/me`
  - Forwards cookies via `cookie` header
  - On `401`: redirects to `/status?returnTo=%2Fdashboard`

### Admin API returnTo + redirect selection
- `apps/admin-api/src/routes/auth.js`:
  - `/api/auth/login`:
    - sets `oauth_state` cookie
    - optionally sets `oauth_return_to` cookie (validated / allowlisted)
  - `/api/auth/callback`:
    - validates state cookie
    - sets auth cookie
    - redirects to `returnTo || {origin}/dashboard || config.ui.successRedirect`

### Admin UI catch-all proxy
- `apps/admin-ui/pages/api/admin-api/[...path].js`
  - Proxies `/api/admin-api/api/...` to `ADMIN_API_INTERNAL_URL`
  - Forwards `cookie`, `x-forwarded-host`, `x-forwarded-proto`
  - Forwards upstream `location` and `set-cookie`

## Plan
1. Verify where returnTo is stored + validated:
   - `apps/admin-ui/pages/status.jsx`
   - `apps/admin-api/src/routes/auth.js` (`normalizeReturnTo`, `oauth_return_to`)
2. Verify where redirects are selected:
   - `apps/admin-api/src/routes/auth.js` (`/api/auth/callback`)
   - `apps/admin-ui/pages/dashboard.jsx` SSR redirect on `401`
3. Ensure proxy correctness for OAuth:
   - Confirm `Set-Cookie` forwarding handles multiple cookies reliably (auth cookie + oauth_state clear + oauth_return_to clear)
   - Confirm `Location` forwarding preserves redirects to `/dashboard`
4. Add a deterministic smoke signal:
   - Existing: `/dashboard` returns redirect when logged out
   - Add: `/dashboard` returns `200` with a synthetic valid auth cookie

## Expected URL transitions after fix (manual)
- Logged out:
  - `GET http://localhost:3001/dashboard` → `307` to `/status?returnTo=%2Fdashboard`
- Login:
  - `http://localhost:3001/status` click Login →
  - `302` → `https://discord.com/oauth2/authorize?...redirect_uri=http://localhost:3001/api/admin-api/api/auth/callback...`
  - Discord → `302` back to `http://localhost:3001/api/admin-api/api/auth/callback?code=...&state=...`
  - callback → `302` to `http://localhost:3001/dashboard`

## Evidence (to be filled during manual run)
- Exact URL transitions observed: TODO
- DevTools Network (status codes for `/dashboard` and `/api/admin-api/api/auth/me`): TODO
- `docker compose logs --tail 200 admin-api` around callback: TODO

## Implemented hardening (non-manual)
### 1) Ensure admin-ui proxy forwards multiple Set-Cookie headers reliably
`apps/admin-ui/pages/api/admin-api/[...path].js` now attempts to split a folded `set-cookie` header into individual cookies when `getSetCookie()` is unavailable.

This specifically protects the OAuth callback flow where admin-api sets multiple cookies:
- auth cookie (`slimy_admin_token`)
- clears `oauth_state`
- clears `oauth_return_to`

### 2) Smoke test: deterministic signals
`scripts/smoke/docker-smoke.sh` now includes:
- logged-out `/dashboard` accepts redirect (existing)
- **synthetic-auth** `/dashboard` must be `200` (new)

## Verification (automated)
- `pnpm smoke:docker`: PASS (includes synthetic-auth dashboard check)
