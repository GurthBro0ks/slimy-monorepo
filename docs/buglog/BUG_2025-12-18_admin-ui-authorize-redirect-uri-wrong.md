# BUG 2025-12-18 — admin-ui-authorize-redirect-uri-wrong

Host: slimy-nuc2
Repo: /opt/slimy/slimy-monorepo
Timestamp: Thu Dec 18 11:35:33 AM UTC 2025

## Symptom
- Discord OAuth shows: `Invalid OAuth2 redirect_uri`

## Observed vs Intended
- Observed `redirect_uri` (from user report):
  - `http://localhost:3000/api/admin-api/api/auth/callback`
- Intended `redirect_uri`:
  - `http://localhost:3001/api/auth/discord/callback`

## Evidence (WORK PC paste)
- Copied link redirect_uri (paste ONLY the decoded redirect_uri value here; no `state`):
  - TODO

## Investigation (NUC2)
- `rg` results and relevant lines: TODO

## Fix
- Ensure admin-ui constructs the Discord authorize URL using:
  - `client_id = NEXT_PUBLIC_DISCORD_CLIENT_ID`
  - `redirect_uri = ${window.location.origin}/api/auth/discord/callback` (preferred for port/tunnel friendliness)

