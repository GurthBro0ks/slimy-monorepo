# BUG 2025-12-18 — admin-ui-authorize-uses-wrong-redirect-uri

Host: slimy-nuc2
Repo: /opt/slimy/slimy-monorepo
Timestamp: Thu Dec 18 11:35:33 AM UTC 2025

## Symptom
- Discord OAuth rejects the authorize request with: `Invalid OAuth2 redirect_uri`
- The authorize URL contains:
  - `redirect_uri=http://localhost:3000/api/admin-api/api/auth/callback` (bad)

## Intended
- `redirect_uri=http://localhost:3001/api/auth/discord/callback`

## Evidence (WORK PC paste)
- Copied link redirect_uri (paste ONLY the decoded redirect_uri value here; no `state`):
  - TODO

## Locate authorize-link generator (NUC2)

Command:
```bash
rg -n "oauth2/authorize|redirect_uri=|api/admin-api/api/auth/callback|localhost:3000|LOGIN WITH DISCORD|DISCORD_CLIENT_ID|NEXT_PUBLIC_DISCORD" apps/admin-ui -S
```

Results:
- `apps/admin-ui/pages/index.js`:
  - `href="/api/admin-api/api/auth/login?returnTo=%2Fdashboard"`
- `apps/admin-ui/pages/login.js`:
  - `window.location.href = "/api/admin-api/api/auth/login?returnTo=%2Fdashboard";`
- `apps/admin-ui/pages/status.jsx`:
  - `window.location.href = "/api/admin-api/api/auth/login?returnTo=%2Fdashboard";`
- `apps/admin-ui/pages/auth-me.jsx`:
  - `window.location.href = "/api/admin-api/api/auth/login?returnTo=%2Fdashboard";`

Notes:
- admin-ui delegates Discord authorize URL construction to admin-api (`GET /api/auth/login`) via the admin-ui proxy route (`/api/admin-api/...`).

## Fix plan
- Build the Discord authorize URL from admin-ui using:
  - `redirect_uri = ${window.location.origin}/api/auth/discord/callback`
  - `client_id = NEXT_PUBLIC_DISCORD_CLIENT_ID`
  - `scope = identify guilds`
  - `state = random` (stored in `oauth_state` cookie for admin-api verification)

## Implementation
- URL generator + cookie issuer:
  - `apps/admin-ui/pages/api/auth/discord/authorize-url.js`
- Login button now uses the computed Discord authorize URL as its `href` (copy-link shows `redirect_uri=`):
  - `apps/admin-ui/pages/index.js`

## NUC2 sanity check (no state logged)
```bash
curl -sS "http://localhost:3001/api/auth/discord/authorize-url?returnTo=%2Fdashboard&redirectUri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback" | jq -r '.redirectUri'
```

Expected:
- `http://localhost:3001/api/auth/discord/callback`
