# BUG 2025-12-18 — oauth-state-mismatch-cookie-forwarding

Host: slimy-nuc2
Repo: /opt/slimy/slimy-monorepo
Timestamp: Thu Dec 18 10:17:50 AM UTC 2025

## Context
- admin-ui OAuth callback route: `/api/auth/discord/callback` (Next.js Pages API route)
- Upstream verifier: admin-api `/api/auth/callback`

## Symptom
- Login loop: Discord OAuth completes, then browser returns to splash page.
- Callback response: `302` with `Location=/?error=state_mismatch`
- Response `Set-Cookie` clears (no values kept) for:
  - `oauth_state`
  - `oauth_return_to`
  - `oauth_redirect_uri`

## Hypothesis
- admin-ui callback proxy does not forward browser `Cookie` header to admin-api.
- admin-api cannot see `oauth_state` cookie during verification, so it returns `state_mismatch` and clears the oauth cookies.

## Fix
- Forward `cookie: req.headers.cookie || ""` from admin-ui callback route to admin-api.
