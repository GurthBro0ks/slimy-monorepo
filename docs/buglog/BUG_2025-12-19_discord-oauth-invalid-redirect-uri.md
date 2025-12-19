# BUG: Discord OAuth Invalid Redirect URI

## Metadata
- **Date:** 2025-12-19
- **Status:** Resolved (Code robust; Ops action required)
- **Severity:** High (Blocker for login)
- **DRI:** Gemini

## Symptom
User reports "Invalid OAuth2 redirect_uri" from Discord.
Network traffic shows `redirect_uri` parameter sent to Discord includes `localhost:3001` or `localhost:3010`.

## Investigation Log

### Baseline Evidence
- `curl` confirms `admin-ui` generates dynamic `redirect_uri` based on `Host` header.
- `localhost:3001` -> `http://localhost:3001/api/auth/discord/callback`
- `localhost:3010` -> `http://localhost:3010/api/auth/discord/callback`
- `admin-api` correctly uses `oauth_redirect_uri` cookie for token exchange, ensuring match.

### Root Cause Analysis
**Discord Developer Portal Configuration Mismatch.**
The application correctly generates dynamic redirect URIs to support local dev and tunnels (e.g. ngrok).
However, Discord rejects these URIs because they are not listed in the "Redirects" list in the Discord Developer Portal.
Specifically, `http://localhost:3001/api/auth/discord/callback` (and/or tunnel equivalents) is missing.

## Fix Plan
1.  **Code (Implemented):** Added logging to `apps/admin-ui/pages/api/auth/discord/authorize-url.js` to print the generated `redirect_uri` to stdout (in non-production mode) and warn if it differs from `NEXT_PUBLIC_DISCORD_REDIRECT_URI`.
2.  **Ops (Required):** Update Discord Developer Portal > Application > OAuth2 > Redirects to include:
    - `http://localhost:3001/api/auth/discord/callback`
    - `http://localhost:3010/api/auth/discord/callback` (if using tunnel)
    - Any other production domains.

## Verification
- Verified code change via `docker compose build admin-ui` and `curl`.
- Confirmed logic handles `Host` headers correctly.
- Confirmed `admin-api` logic is robust.

ready to move on