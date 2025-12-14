# BUGLOG: oauth-callback-400-host-cookie-parity

- Date: 2025-12-14
- Repo: `~/Desktop/slimy-monorepo` (fallback: `/opt/slimy/slimy-monorepo`)
- Components: Next.js `admin-ui` (pages router) + Express `admin-api` + Docker

## Symptom

- After completing Discord login, browser lands on HTTP 400.
- Suspected cause: host mismatch (`localhost` vs `127.0.0.1`) and cookie/state set on one host but validated on the other; cookie/state/returnTo lost across proxy (`admin-ui` → `admin-api`).

## Evidence (to capture)

### Preflight (CLI curl)

- `GET http://localhost:3001/api/admin-api/api/auth/login?returnTo=%2Fdashboard` → `302` with `redirect_uri=http://localhost:3001/api/admin-api/api/auth/callback`
- `GET http://127.0.0.1:3001/api/admin-api/api/auth/login?returnTo=%2Fdashboard` → `302` with `redirect_uri=http://127.0.0.1:3001/api/admin-api/api/auth/callback`
- `Set-Cookie` observed from `/api/auth/login` via proxy: `oauth_state`, `oauth_return_to`, `oauth_redirect_uri` (3 distinct headers)
- Negative-path sanity: `GET /api/auth/callback?code=bad_code&state=<valid_state_cookie>` → `302` to `/?error=token_exchange_failed` (Discord returns `400 invalid_grant` for the fake code; admin-api does not emit 400)

### Callback URL (exact)

- `REPLACE_WITH_EXACT_CALLBACK_URL`

### HTTP 400 response (exact)

- Status: `400`
- Body:
  - `REPLACE_WITH_400_BODY`

### DevTools Network (from browser)

- `/api/auth/login` → `REPLACE_WITH_STATUS_CODE` (redirect chain summary: `REPLACE_WITH_NOTES`)
- `/api/auth/callback` → `REPLACE_WITH_STATUS_CODE` (response/redirect summary: `REPLACE_WITH_NOTES`)

### admin-api logs during login/callback

- Command: `docker compose logs --tail 200 admin-api`
- Output (paste):
  - Observed entries include `/api/auth/login` `302` and `/api/auth/callback` `302`, plus (expected) Discord token exchange failure for the synthetic bad code:
    - `{"error": "invalid_grant", "error_description": "Invalid \"code\" in request."}`

## Hypothesis

- `redirect_uri` or callback host differs from the host that set `oauth_state` cookie.
- Proxy is not forwarding `x-forwarded-proto` and host consistently.
- Proxy is not preserving multiple `Set-Cookie` headers (state/returnTo/session).

## Fix Plan (to be updated)

1. Inspect `apps/admin-api/src/routes/auth.js` (login/callback cookies + redirect_uri)
2. Inspect `apps/admin-ui/pages/api/admin-api/[...path].js` (proxy headers + cookie passthrough)
3. Patch for host/cookie parity + safe returnTo + Set-Cookie preservation
4. Verify with `pnpm smoke:docker` + manual OAuth round-trip

## Implemented Changes

- admin-api: `redirect_uri` host is normalized to the current request origin for localhost/127; additionally, `oauth_redirect_uri` is stored on `/login` and reused on `/callback` so the token exchange uses the exact same `redirect_uri` string.
- admin-api: `returnTo` is now **relative-path only** (`/dashboard` etc); it’s stored as a path in `oauth_return_to` and expanded against the callback request origin.
- admin-ui proxy: forwards `x-forwarded-host` and `x-forwarded-proto` using existing forwarded headers when present (so outer proxies don’t lose host/proto), and keeps multiple `Set-Cookie` headers intact.

## Verification (must show success)

### Automated

- `pnpm smoke:docker`: `PASS` (2025-12-14)

### Manual

- `/status` → Login → Discord → `/api/auth/callback` → `/dashboard`: `PENDING`
- `/api/admin-api/api/auth/me` after login returns `200`: `PENDING`
- Notes (hosts used, cookies observed, any redirects):
  - `PENDING`
