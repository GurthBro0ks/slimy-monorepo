# BUG: Discord OAuth redirect_uri leaks localhost:3080 (/api/admin-api)

## Metadata
- **Date:** 2025-12-21
- **Status:** Resolved (hardened redirects + origin guard)
- **Severity:** High (login blocker)
- **Systems:** `admin-ui`, `admin-api`, edge/proxy routing

## Symptom
Discord returns `400 Invalid OAuth2 redirect_uri`.

## Evidence (Flight Recorder)
- Reported by DevTools: `redirect_uri` becomes `http://localhost:3080/api/admin-api/api/auth/callback`.
- Known-good endpoints (prod):
  - `https://admin.slimyai.xyz/api/auth/discord/authorize-url` -> `redirect_uri=https://admin.slimyai.xyz/api/auth/discord/callback`
  - `https://admin.slimyai.xyz/api/auth/login` -> `redirect_uri=https://admin.slimyai.xyz/api/auth/discord/callback`

## Repro Commands (must log outputs)
### localhost:3080
```bash
curl -sS -D- -o /dev/null http://localhost:3080/api/auth/login | tr -d '\r' | rg -i '^(HTTP/|location:)'
```
Output:
```text
HTTP/1.1 302 Found
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=...&prompt=consent
```

### prod admin.slimyai.xyz
```bash
curl -sS -D- -o /dev/null https://admin.slimyai.xyz/api/auth/login | tr -d '\r' | rg -i '^(HTTP/|location:)'
```
Output:
```text
HTTP/2 302
location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=...&prompt=consent
```

### localhost:3001 (admin-ui authorize-url)
```bash
curl -sS -D- -o /dev/null http://localhost:3001/api/auth/discord/authorize-url | tr -d '\r' | rg -i '^(HTTP/|location:)'
```
Output:
```text
HTTP/1.1 302 Found
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=...&prompt=consent
```

## Root Cause (TBD)
- `admin-ui` `GET /api/auth/discord/authorize-url` derives redirect origin from request headers (localhost in dev), ignoring canonical env settings.
- A separate report indicates some path produced `http://localhost:3080/api/admin-api/api/auth/callback` (likely via a proxy prefix + origin reflection); hardening should prevent both localhost origins and `/api/admin-api` leakage.

## Fix (TBD)
- UI: login button should always use relative `GET /api/auth/discord/authorize-url`.
- API safety net: `admin-api` should 302 legacy endpoints to canonical admin-ui endpoints.

## Verification (TBD)
- `curl` should never observe `redirect_uri` containing `localhost:3080` or `/api/admin-api`.

## UI Offender (found)
- Admin UI login button: `apps/admin-ui/pages/index.js` uses `href="/api/auth/discord/authorize-url"` (correct).
- Offender generator: `apps/admin-ui/pages/api/auth/discord/authorize-url.js` derives origin from request headers via `apps/admin-ui/lib/oauth-origin.js`, allowing localhost in dev; this can leak non-canonical redirect URIs.

## Fix Implemented (repo)
- Hardened `apps/admin-ui/lib/oauth-origin.js` to never allow `localhost:3080` as an OAuth public origin (even when localhost is otherwise allowed).
- Removed client-side construction of Discord authorize URLs from `apps/admin-ui/pages/index.js` (login continues to use `href="/api/auth/discord/authorize-url"`).
- Added `admin-api` safety nets in `apps/admin-api/src/routes/auth.js`:
  - `GET /api/auth/login` → `302 https://admin.slimyai.xyz/api/auth/discord/authorize-url`
  - `GET /api/auth/callback` → `302 https://admin.slimyai.xyz/api/auth/discord/callback` (query string preserved)
  - Internal admin-ui→admin-api callback proxy sets `x-slimy-internal-auth-callback: 1` to keep token exchange working.

## Verification (post-fix)
### Local (docker compose)
```bash
curl -sS -D- -o /dev/null http://localhost:3080/api/auth/login | tr -d '\r' | rg -i '^(HTTP/|location:)'
```
Output:
```text
HTTP/1.1 302 Found
Location: https://admin.slimyai.xyz/api/auth/discord/authorize-url
```

```bash
curl -sS -D- -o /dev/null 'http://localhost:3080/api/auth/callback?code=TEST_CODE&state=TEST_STATE' | tr -d '\r' | rg -i '^(HTTP/|location:)'
```
Output:
```text
HTTP/1.1 302 Found
Location: https://admin.slimyai.xyz/api/auth/discord/callback?code=TEST_CODE&state=TEST_STATE
```

```bash
curl -sS -D- -o /dev/null -H 'x-forwarded-host: localhost:3080' -H 'x-forwarded-proto: http' http://localhost:3001/api/auth/discord/authorize-url | tr -d '\r' | rg -i '^(HTTP/|location:)'
```
Output:
```text
HTTP/1.1 302 Found
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=...&prompt=consent
```

### Prod baseline (unchanged by local patch)
```bash
curl -sS -D- -o /dev/null https://admin.slimyai.xyz/api/auth/discord/authorize-url | tr -d '\r' | rg -i '^(HTTP/|location:)'
```
Output:
```text
HTTP/2 302
location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=...&prompt=consent
```
