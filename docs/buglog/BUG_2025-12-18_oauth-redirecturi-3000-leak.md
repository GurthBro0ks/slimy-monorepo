# BUG 2025-12-18 — oauth-redirecturi-3000-leak

## Summary

- Symptom: Starting admin OAuth from `http://localhost:3001` intermittently produces a Discord authorize URL with:
  - Bad: `redirect_uri=http://localhost:3000/api/admin-api/api/auth/callback` (Discord rejects: “Invalid OAuth2 redirect_uri”)
- Expected:
  - Good: `redirect_uri=http://localhost:3001/api/auth/discord/callback`

## Services / Ports

- admin-ui (Next.js Pages Router): `http://localhost:3001`
- admin-api (Express): `http://localhost:3080`
- web (Next.js): `http://localhost:3000`

## File-Mod Plan (before edits)

1. Ensure the admin-ui splash/login button uses only `GET /api/auth/discord/authorize-url` (no client-built Discord URL).
2. Ensure `pages/api/auth/discord/authorize-url.js` computes `origin` from request headers robustly (honor `x-forwarded-*`, including port).
3. (If any legacy entrypoints exist on admin-ui) redirect them to the canonical `authorize-url` endpoint to avoid confusion/cached links.
4. Keep a small debug/status block on the splash page showing `origin`, computed `redirectUri`, and the endpoint the button hits (no secrets).

## Evidence (NUC2)

### admin-ui splash HTML contains the canonical entrypoint

- `GET http://localhost:3001/` contains:
  - `href="/api/auth/discord/authorize-url"`
- No `localhost:3000` or `/api/admin-api/api/auth/callback` strings were present in the first ~4KB of HTML.

### /api/auth/discord/authorize-url response has correct redirect_uri

- `GET http://localhost:3001/api/auth/discord/authorize-url` returns:
  - `HTTP/1.1 302 Found`
  - `Set-Cookie: oauth_state=<redacted>; Path=/; HttpOnly; SameSite=Lax`
  - `Set-Cookie: oauth_return_to=<redacted>; Path=/; HttpOnly; SameSite=Lax`
  - `Set-Cookie: oauth_redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback; Path=/; HttpOnly; SameSite=Lax`
  - `Location: https://discord.com/oauth2/authorize?...&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback...&state=<redacted>`

### Code search (admin-ui)

- No matches for `localhost:3000`, `/api/admin-api/api/auth/callback`, or `/api/admin-api/api/auth/login` within `apps/admin-ui` sources (expected after the canonical entrypoint change).

## Fix

### 1) Canonical server entrypoint (cache-proof)

- Splash page login link: `GET /api/auth/discord/authorize-url` (server sets cookies and redirects to Discord).
- Added a compatibility shim so old bookmarks/cached links to `GET /api/admin-api/api/auth/login` (on admin-ui) are redirected to the canonical entrypoint.

### 2) Origin computation guardrail

- `x-forwarded-port` may be present but can reflect an internal runtime port (e.g. `3000` inside the container), so we only append the forwarded port when the host header does not already specify a port (never override an existing port).

## Verification (NUC2, after rebuild)

### Splash page has no localhost:3000 leak

- `curl -sS http://localhost:3001/ | grep -Eo "localhost:3000|api/admin-api/api/auth/callback|/api/auth/discord/authorize-url" | sort -u`
  - Output: `/api/auth/discord/authorize-url`

### Canonical entrypoint returns correct redirect_uri

- `curl -sS -D- -o /dev/null http://localhost:3001/api/auth/discord/authorize-url | sed -n '1,20p'`
  - `HTTP/1.1 302 Found`
  - `Set-Cookie: oauth_*` present (values redacted)
  - `Cache-Control: no-store`
  - `Location: https://discord.com/oauth2/authorize?...redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback...`

### Legacy admin-ui entrypoint redirects to canonical entrypoint

- `curl -sS -D- -o /dev/null "http://localhost:3001/api/admin-api/api/auth/login?returnTo=%2Fdashboard" | sed -n '1,20p'`
  - `HTTP/1.1 302 Found`
  - `Location: /api/auth/discord/authorize-url?returnTo=%2Fdashboard`
