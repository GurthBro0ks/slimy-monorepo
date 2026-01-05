# BUGLOG: discord-oauth-redirect-uri (2025-12-28)

## Symptom / Context
- Discord OAuth fails with: **Invalid OAuth2 redirect_uri**.
- Known bad `redirect_uri` observed: `http://localhost:3080/api/admin-api/api/auth/callback`
- Goal: ensure the `redirect_uri` used in the Discord authorize URL matches the Discord app’s whitelisted Redirect URLs and is constructed correctly (no duplicate `/api`, no `/api/admin-api` proxy prefix).

## Plan
1) Locate where the Discord authorize URL is generated in repo (`discord.com/oauth2/authorize`, `redirect_uri=`, `/api/auth/callback`, `OAUTH`, `DISCORD_*`).
2) Identify why `/api/admin-api` is being prepended (proxy base URL misuse).
3) Add a single source-of-truth env var `DISCORD_REDIRECT_URI` and use it directly when building the authorize URL.
4) Add temporary debug/status output (no secrets) showing computed `redirect_uri` (and derived authorize URL with `client_id` redacted).
5) Update docs/env examples.
6) Verify via lint/build/tests + manual inspection of authorize URL query.

## Files Changed
- `apps/admin-ui/pages/api/auth/discord/authorize-url.js` (use `DISCORD_REDIRECT_URI`, add debug output)
- `apps/admin-ui/pages/api/auth/callback.js` (alias callback route)
- `apps/admin-ui/tests/oauth-tripwire.test.js` (tripwire updated for env-based redirect URI)
- `apps/admin-api/src/routes/auth.js` (canonical callback now `/api/auth/callback`)
- `apps/admin-api/src/config.js` (default redirect URI now `/api/auth/callback`)
- `apps/admin-api/src/lib/config/index.js` (default redirect URI now `/api/auth/callback`)
- `apps/admin-api/src/lib/auth/post-login-redirect.test.js` (update cookie redirect URI example)
- `docker-compose.yml` (default `DISCORD_REDIRECT_URI` + pass through to admin-ui)
- `docker-compose.dev.yml` (dev `DISCORD_REDIRECT_URI` and pass through to admin-ui)
- `infra/docker/docker-compose.slimy-nuc2.yml` (prod `DISCORD_REDIRECT_URI` and admin-ui env)
- `.env.docker.example` (example redirect URI)
- `docs/DEV_SANITY_CHECK.md` (example redirect URI)
- `docs/docker-setup.md` (example redirect URI)

## Commands Run (outputs)
- Search:
  - `rg -n "discord.com/oauth2/authorize|redirect_uri=|/api/auth/callback|DISCORD_REDIRECT" -S .`
  - Found primary generator: `apps/admin-ui/pages/api/auth/discord/authorize-url.js`
  - Found legacy bad examples: `.env.docker.example`, `docs/DEV_SANITY_CHECK.md`, `docs/docker-setup.md`
- Tests:
  - `pnpm -C apps/admin-api test` → PASS (Jest; 19 suites passed, 12 skipped)
  - `pnpm -C apps/admin-ui test` → PASS
  - `pnpm -C apps/admin-ui build`
    - First run hit an intermittent Next trace error (`ENOENT ... .next/server/pages/_app.js.nft.json`); fixed by cleaning `apps/admin-ui/.next`.
    - Commands:
      - `rm -rf apps/admin-ui/.next`
      - `pnpm -C apps/admin-ui build`
    - After cleaning, build PASS and route list includes `ƒ /api/auth/callback`.

## Why the bad redirect happened
- The repo had legacy/env examples pointing `DISCORD_REDIRECT_URI` at `/api/admin-api/api/auth/callback` (proxy-prefixed path).
- `apps/admin-ui` previously did **not** use `DISCORD_REDIRECT_URI` when building the authorize URL; it derived the callback path independently, which made it easy for stacks/proxies to drift and produce a non-whitelisted `redirect_uri`.

## Verification Evidence
- Admin UI authorize URL now uses the configured `DISCORD_REDIRECT_URI` directly.
  - Debug: `GET /api/auth/discord/authorize-url?debug=1` returns JSON with:
    - `redirectUri` (computed)
    - `authorizeUrl` with `client_id=REDACTED`
- Callback route exists at `/api/auth/callback` (admin-ui) and forwards to admin-api `/api/auth/callback` internally.
- Manual verification:
  - Visit `https://admin.slimyai.xyz/api/auth/discord/authorize-url?debug=1` (or local equivalent) and confirm:
    - `redirectUri` equals the configured `DISCORD_REDIRECT_URI` exactly
    - `authorizeUrl` contains `redirect_uri=` matching that value (URL-encoded)
