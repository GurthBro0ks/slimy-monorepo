# BUG 2025-12-18 — oauth-post-login-redirect-wrong-origin

Host: slimy-nuc2
Repo: /opt/slimy/slimy-monorepo
Timestamp: Thu Dec 18 02:05:41 PM UTC 2025

## Symptom
- Discord OAuth succeeds (authorize screen appears; session cookie is set), but after completing OAuth the browser lands on the **web** origin (`http://localhost:3000/...`) instead of the **admin-ui** origin (`http://localhost:3001/...`).

## Services / Ports
- admin-ui (Next.js Pages Router): `http://localhost:3001`
- web (Next.js): `http://localhost:3000`
- admin-api (Express): `http://localhost:3080`

## Expected
- After successful OAuth callback + session issuance, redirect to `http://localhost:3001/<returnPath>` (default `/guilds`), not `http://localhost:3000`.

## Notes
- OAuth redirect_uri used for Discord authorize is already correct:
  - `http://localhost:3001/api/auth/discord/callback`
- Therefore the final post-login redirect selection is choosing a web/client origin (e.g. `CLIENT_URL`) instead of the admin-ui origin.

## Diagnosis
- admin-api callback handler (`GET /api/auth/callback`) previously used `config.ui.successRedirect` (derived from `CLIENT_URL`, default `http://localhost:3000`) and `getRequestOrigin(req)` to compute the post-login redirect, which can point at the wrong origin when the callback request is proxied.

## Fix
- admin-api now chooses post-login redirect target using this priority:
  1) Origin from `oauth_redirect_uri` cookie (set by admin-ui authorize endpoint) → take `.origin`
  2) `x-forwarded-proto` + `x-forwarded-host`
  3) Fallback to `CLIENT_URL` (`config.clientUrl`)
- Return path is from `oauth_return_to` (sanitized), default `/guilds`.
- admin-ui callback proxy now forwards `x-forwarded-host`, `x-forwarded-proto`, `x-forwarded-port` to admin-api.

## Tests (no secrets)
Command:
```bash
pnpm --filter @slimy/admin-api test -- post-login-redirect
```

Output:
```
PASS src/lib/auth/post-login-redirect.test.js
  resolvePostLoginRedirectUrl
    ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to
    ✓ falls back to x-forwarded origin when cookie missing
    ✓ falls back to CLIENT_URL when cookie and forwarded origin missing
```

## Manual Checklist (WORK PC)
- [ ] Open `http://localhost:3001` and click “LOGIN WITH DISCORD”.
- [ ] Complete Discord OAuth; confirm browser lands on `http://localhost:3001/guilds` (or your `returnTo` path).
- [ ] Confirm browser does NOT land on `http://localhost:3000`.
- [ ] Confirm `/api/admin-api/api/auth/me` returns authenticated JSON (no cookie values logged).
