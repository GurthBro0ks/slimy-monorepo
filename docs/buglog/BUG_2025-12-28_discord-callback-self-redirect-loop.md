# BUG: discord-callback-self-redirect-loop (2025-12-28)

## Symptom / Context
- Chrome: `ERR_TOO_MANY_REDIRECTS` on `https://admin.slimyai.xyz/api/auth/callback?code=REDACTED&state=REDACTED`
- DevTools Network: repeated `302` responses where `Location` points back to the same callback URL (self-redirect loop).
- `/api/auth/discord/authorize-url?debug=1` shows `x-slimy-oauth-redirect-uri: https://admin.slimyai.xyz/api/auth/callback` (redirect URI mismatch already addressed).

## Suspected Cause (initial)
- Callback handler likely redirects to `DISCORD_REDIRECT_URI` after success, but `DISCORD_REDIRECT_URI` is the callback URL itself (Discord requirement), producing a loop.

## Root Cause (confirmed)
- `admin.slimyai.xyz` Caddy routes `GET /api/auth/callback` to **admin-api** (it only forwards `/api/auth/discord/*` to admin-ui).
- `apps/admin-api/src/routes/auth.js` `GET /api/auth/callback` treated non-internal callers as “legacy” and did:
  - `return res.redirect(302, `${CANONICAL_CALLBACK_URL}${qs}`);`
  - where `CANONICAL_CALLBACK_URL` is `https://admin.slimyai.xyz/api/auth/callback`
- Net effect: browser hits `/api/auth/callback?code=...&state=...` → 302 Location points to the **same URL** → infinite 302 loop.

## Patch Summary
- `admin-api` callback no longer bounces canonical `admin.slimyai.xyz` callers back to the same callback URL; it proceeds with OAuth instead (prevents 302 loops).
- Added `ADMIN_UI_POST_LOGIN_REDIRECT` (safe relative path) and loop-guards to prevent post-login redirects back into OAuth callback routes.
- Added `GET /api/auth/callback?debug=1` JSON (no tokens/cookies; loopback redacted in production).

## Plan
1. Locate the callback handlers and any alias routes for `/api/auth/callback`.
2. Identify the exact line(s) that generate a redirect back to the callback route.
3. Fix by separating “OAuth callback URL” (`DISCORD_REDIRECT_URI`) from “post-login destination” (`ADMIN_UI_POST_LOGIN_REDIRECT`).
4. Add loop guard + `?debug=1` JSON output for the callback.
5. Add a regression test ensuring callback never redirects to itself.
6. Run lint/test/build for `apps/admin-ui` and record evidence.

## Files Changed
- `apps/admin-api/src/routes/auth.js`
- `apps/admin-api/src/routes/auth-callback-loop.test.js`
- `apps/admin-api/src/config.js`
- `apps/admin-api/src/lib/auth/post-login-redirect.test.js`
- `apps/admin-api/src/lib/config/index.js`
- `apps/admin-ui/pages/api/auth/discord/authorize-url.js`
- `apps/admin-ui/pages/api/auth/callback.js`
- `apps/admin-ui/tests/oauth-post-login-redirect-tripwire.test.js`
- `apps/admin-ui/tests/oauth-tripwire.test.js`
- `apps/admin-ui/package.json`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `infra/docker/docker-compose.slimy-nuc2.yml`
- `.env.docker.example`
- `apps/admin-api/.env.example`
- `apps/admin-api/README.md`
- `docs/DEV_SANITY_CHECK.md`
- `docs/docker-setup.md`
- `CONTINUITY.md`
- `docs/buglog/BUG_2025-12-28_discord-callback-self-redirect-loop.md`

## Commands Run (with outputs)
- `pnpm -C apps/admin-ui lint`
  - Output (snippet):
    - `apps/admin-ui/lib/tasks.js` → `error  'EventSource' is not defined  no-undef`
- `pnpm -C apps/admin-ui test`
  - Output (snippet):
    - `[PASS] authorize-url canonical redirect_uri`
    - `=== All oauth tripwires passed ===`
    - `[PASS] oauth post-login redirect tripwires`
- `pnpm -C apps/admin-ui build`
  - Output (snippet):
    - `✓ Compiled successfully`
    - `✓ Finalizing page optimization`
- `pnpm -C apps/admin-api test`
  - Output (snippet):
    - `Test Suites: 12 skipped, 20 passed, 20 of 32 total`
    - `Tests: 12 skipped, 88 passed, 100 total`
    - Note: Jest prints a pre-existing warning: `A worker process has failed to exit gracefully...`

## Verification Evidence (redacted)
- Regression test: `apps/admin-api/src/routes/auth-callback-loop.test.js`
  - Asserts `GET /api/auth/callback?...` on canonical admin origin returns a 3xx with `Location` **not** containing `/api/auth/callback`.
  - Confirms `GET /api/auth/callback?debug=1` returns JSON and does not redirect.
- Debug endpoint (no secrets): `GET /api/auth/callback?debug=1` returns:
  - `redirectUri` (OAuth callback used for token exchange)
  - `postLoginRedirect` (final computed destination; loop-guarded)
  - `note: "no redirect performed in debug mode"`

## Manual Verification Steps (prod)
- Visit `https://admin.slimyai.xyz/api/auth/discord/authorize-url?debug=1` and confirm `redirectUri` matches the Discord app setting.
- Complete OAuth once and confirm:
  - Callback hits once (single 302 away from `/api/auth/callback?...`), then lands on the post-login destination (default `/guilds`).
  - DevTools Network shows no repeated 302s back to the callback URL.

---

## Closeout Follow-ups (2025-12-31)

### Plan
1. **Commit Hygiene**: Commit `be53075` is already pushed to `origin/nuc2/verify-role-b33e616` (ahead 36). Do NOT amend; will make a follow-up commit with accurate scope.
2. **Production Guardrails**: Confirm `ADMIN_UI_POST_LOGIN_REDIRECT` is set in production runtime (docker-compose files already default to `/guilds`). Verify no external-domain redirects are possible.
3. **Lightweight Monitoring**: Add structured log line to `/api/auth/callback` success path that includes:
   - Request origin (redacted in prod if loopback)
   - Final redirect target (redacted in prod if loopback)
   - Boolean flags: `callbackLoopGuardTriggered`, `loopbackGuardTriggered`
4. **EventSource Fix**: Already applied SSR-safe `getEventSource()` helper to `apps/admin-ui/lib/tasks.js` (previous session).

### Execution

#### A) Commit Hygiene Decision
- **Status**: Cannot amend (already pushed to remote)
- **Action**: This commit will include monitoring + closeout docs with accurate conventional commit scope

#### B) Production Env Var Confirmation
- `docker-compose.yml` line 41/149: `ADMIN_UI_POST_LOGIN_REDIRECT: ${ADMIN_UI_POST_LOGIN_REDIRECT:-/guilds}`
- `infra/docker/docker-compose.slimy-nuc2.yml` line 46/89: `ADMIN_UI_POST_LOGIN_REDIRECT: /guilds`
- **Verified**: Safe internal path, no external-domain redirects possible

#### C) Monitoring Addition
- Added structured log to `apps/admin-api/src/routes/auth.js` callback success path
- Emits no secrets; loopback origins/URLs redacted in production

### Verification Outputs

```
$ pnpm -C apps/admin-ui lint
✖ 8 problems (0 errors, 8 warnings)
# Pre-existing @typescript-eslint/no-explicit-any warnings in DebugDock.tsx

$ pnpm -C apps/admin-ui test
[PASS] normalizeOrigin tests
[PASS] isLocalhostHostname tests
[PASS] firstHeader tests
[PASS] withForwardedPortIfMissing tests
[PASS] isAllowedOrigin tests (dev mode)
[PASS] isAllowedOrigin tests (production mode)
[PASS] getPublicOrigin tests
=== All oauth-origin tests passed ===
[PASS] authorize-url canonical redirect_uri
[PASS] no legacy auth/proxy references in client bundle
=== All oauth tripwires passed ===
[PASS] auth callback proxy tripwires
[PASS] oauth post-login redirect tripwires

$ pnpm -C apps/admin-ui build
✓ Compiled successfully
✓ Generating static pages (22/22)

$ pnpm --filter @slimy/admin-api test -- src/routes/auth-callback-loop.test.js src/lib/auth/post-login-redirect.test.js
PASS src/lib/auth/post-login-redirect.test.js (3 tests)
PASS src/routes/auth-callback-loop.test.js (3 tests)
Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
```

### Commit
- Scope: `fix(auth): add callback monitoring + closeout docs`
- Files: `apps/admin-api/src/routes/auth.js`, `apps/admin-ui/lib/tasks.js`, `docs/buglog/BUG_2025-12-28_discord-callback-self-redirect-loop.md`
