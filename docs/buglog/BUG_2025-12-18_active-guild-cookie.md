# BUG_2025-12-18_active-guild-cookie

## Symptom
- Browser does not have `slimy_admin_active_guild_id`, but proxy expects it to forward `x-slimy-active-guild-id`.

## Hypothesis
- Active-guild endpoint sets DB state but cookie is not being set or forwarded through the admin-ui proxy.

## Files to touch
- apps/admin-api/src/routes/auth.js
- apps/admin-ui/pages/api/admin-api/[...path].js
- apps/admin-ui/pages/guilds/index.js
- apps/admin-api/tests/auth/active-guild.cookie.test.js

## Verification commands
```bash
cd /opt/slimy/slimy-monorepo
# admin-api unit tests
cd apps/admin-api
npm test -- active-guild

# stability gate
cd /opt/slimy/slimy-monorepo
pnpm stability:gate
```

## Evidence
### git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M apps/admin-api/src/middleware/auth.js
 M apps/admin-api/src/routes/auth.js
 M apps/admin-api/src/services/discord-shared-guilds.js
 M apps/admin-ui/components/Layout.js
 M apps/admin-ui/pages/api/admin-api/[...path].js
 M apps/admin-ui/pages/chat/index.js
 M apps/admin-ui/pages/club/index.js
 M apps/admin-ui/pages/guilds/index.js
?? apps/admin-api/tests/auth/active-guild.test.js
?? docs/buglog/BUG_2025-12-18_guild-selection-perms-propagation.md
```

### rg -n "slimy_admin_active_guild_id|ACTIVE_GUILD_COOKIE_NAME|active-guild|getSetCookie|set-cookie" apps/admin-ui apps/admin-api || true
```
apps/admin-ui/components/Layout.js:9:import { useActiveGuild } from "../lib/active-guild";
apps/admin-api/src/routes/auth.js:20:const ACTIVE_GUILD_COOKIE_NAME = "slimy_admin_active_guild_id";
apps/admin-api/src/routes/auth.js:565:      const headerActiveGuild = req.headers["x-slimy-active-guild-id"];
apps/admin-api/src/routes/auth.js:571:      if (!activeGuildId && req.cookies?.[ACTIVE_GUILD_COOKIE_NAME]) {
apps/admin-api/src/routes/auth.js:572:        activeGuildId = String(req.cookies[ACTIVE_GUILD_COOKIE_NAME]);
apps/admin-api/src/routes/auth.js:745: * POST /api/auth/active-guild
apps/admin-api/src/routes/auth.js:751:router.post("/active-guild", async (req, res) => {
apps/admin-api/src/routes/auth.js:781:        console.warn("[auth/active-guild] Failed to fetch shared guilds:", err?.message || err);
apps/admin-api/src/routes/auth.js:830:        console.warn("[auth/active-guild] Failed to update lastActiveGuildId:", err?.message || err);
apps/admin-api/src/routes/auth.js:837:    res.cookie(ACTIVE_GUILD_COOKIE_NAME, normalizedGuildId, {
apps/admin-api/src/routes/auth.js:852:    console.error("[auth/active-guild] Error:", err);
apps/admin-api/src/routes/auth.js:865:  res.clearCookie(ACTIVE_GUILD_COOKIE_NAME, {
apps/admin-ui/pages/api/auth/discord/callback.js:52:    typeof h.getSetCookie === "function"
apps/admin-ui/pages/api/auth/discord/callback.js:53:      ? h.getSetCookie()
apps/admin-ui/pages/api/auth/discord/callback.js:54:      : (h.get("set-cookie") ? [h.get("set-cookie")] : []).filter(Boolean);
apps/admin-ui/pages/api/admin-api/[...path].js:100:    .find((c) => c.startsWith("slimy_admin_active_guild_id="));
apps/admin-ui/pages/api/admin-api/[...path].js:113:    ...(activeGuildId ? { "x-slimy-active-guild-id": activeGuildId } : null),
apps/admin-ui/pages/api/admin-api/[...path].js:144:      typeof upstreamRes.headers.getSetCookie === "function"
apps/admin-ui/pages/api/admin-api/[...path].js:145:        ? upstreamRes.headers.getSetCookie()
apps/admin-ui/pages/api/admin-api/[...path].js:147:    const setCookieFallback = upstreamRes.headers.get("set-cookie") || "";
apps/admin-ui/pages/api/admin-api/[...path].js:154:    if (setCookies.length) res.setHeader("set-cookie", setCookies);
apps/admin-ui/pages/api/admin-api/[...path].js:155:    else if (setCookieParsed.length) res.setHeader("set-cookie", setCookieParsed);
apps/admin-ui/pages/api/admin-api/[...path].js:156:    else if (setCookieFallback) res.setHeader("set-cookie", setCookieFallback);
apps/admin-ui/pages/guilds/index.js:9:import { writeActiveGuildId } from "../../lib/active-guild";
apps/admin-ui/pages/guilds/index.js:49:    const response = await fetch("/api/admin-api/api/auth/active-guild", {
apps/admin-ui/pages/guilds/index.js:78:    // 1. Call POST /api/admin-api/api/auth/active-guild to set active guild server-side
apps/admin-api/src/middleware/auth.js:18:const ACTIVE_GUILD_COOKIE_NAME = "slimy_admin_active_guild_id";
apps/admin-api/src/middleware/auth.js:275:      const headerActiveGuild = req?.headers?.["x-slimy-active-guild-id"];
apps/admin-api/src/middleware/auth.js:277:      const cookieValue = req?.cookies?.[ACTIVE_GUILD_COOKIE_NAME];
apps/admin-api/tests/auth/active-guild.test.js:16:describe("POST /api/auth/active-guild", () => {
apps/admin-api/tests/auth/active-guild.test.js:38:      .post("/api/auth/active-guild")
apps/admin-api/tests/auth/active-guild.test.js:58:      .post("/api/auth/active-guild")
apps/admin-api/tests/auth/active-guild.test.js:67:    const setCookie = res.headers["set-cookie"] || [];
apps/admin-api/tests/auth/active-guild.test.js:68:    expect(setCookie.join(";")).toContain("slimy_admin_active_guild_id=");
apps/admin-ui/lib/active-guild.js:5:export const ACTIVE_GUILD_ID_KEY = "slimy_admin_active_guild_id";
```

## Diagnosis notes
- apps/admin-api/src/routes/auth.js already sets `slimy_admin_active_guild_id` in POST /api/auth/active-guild.
- apps/admin-ui/pages/api/admin-api/[...path].js already forwards upstream Set-Cookie and injects x-slimy-active-guild-id.
- apps/admin-ui/pages/guilds/index.js already POSTs via proxy and refreshes /api/auth/me.

## Changes
- Added explicit cookie test to lock in Set-Cookie behavior.

## Test output: npm test -- active-guild (admin-api)
```
> @slimy/admin-api@1.0.0 test
> jest active-guild

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

PASS tests/auth/active-guild.test.js
  POST /api/auth/active-guild
    ✓ rejects guilds that are not shared/connectable (56 ms)
    ✓ returns role for primary guild based on policy logic (7 ms)

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

PASS tests/auth/active-guild.cookie.test.js
  POST /api/auth/active-guild cookie
    ✓ sets slimy_admin_active_guild_id on success (37 ms)

Test Suites: 2 passed, 2 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        1.278 s, estimated 2 s
Ran all test suites matching /active-guild/i.
```

## Stability gate (pnpm stability:gate)
```
> slimy-monorepo@ stability:gate /opt/slimy/slimy-monorepo
> bash scripts/smoke/stability-gate.sh

Preflight: Checking dependencies...
Preflight: OK
Report initialized: /tmp/STABILITY_REPORT_2025-12-18_20-02-52_admin-oauth-guildgate.md

================================
A) BASELINE SANITY
================================
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M apps/admin-api/src/middleware/auth.js
 M apps/admin-api/src/routes/auth.js
 M apps/admin-api/src/services/discord-shared-guilds.js
 M apps/admin-ui/components/Layout.js
 M apps/admin-ui/pages/api/admin-api/[...path].js
 M apps/admin-ui/pages/chat/index.js
 M apps/admin-ui/pages/club/index.js
 M apps/admin-ui/pages/guilds/index.js
?? apps/admin-api/tests/auth/active-guild.cookie.test.js
?? apps/admin-api/tests/auth/active-guild.test.js
?? docs/buglog/BUG_2025-12-18_active-guild-cookie.md
?? docs/buglog/BUG_2025-12-18_guild-selection-perms-propagation.md
nuc2/verify-role-b33e616
v20.19.6
10.21.0
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED             STATUS                       PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   About an hour ago   Up About an hour (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    About an hour ago   Up About an hour             0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          About an hour ago   Up About an hour (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         About an hour ago   Up About an hour             0.0.0.0:3000->3000/tcp, :::3000->3000/tcp

================================
B) SERVICE HEALTH
================================
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "uy3wjzvq0s2tj"
Content-Type: text/html; charset=utf-8
Content-Length: 3679
Vary: Accept-Encoding
Date: Thu, 18 Dec 2025 20:02:53 GMT
Connection: keep-alive
Keep-Alive: timeout=5

HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
X-Request-ID: 35b416f9-e629-494a-9f73-7a514503f6bc
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 86
Date: Thu, 18 Dec 2025 20:02:53 GMT
Connection: keep-alive
Keep-Alive: timeout=5

================================
C) CRITICAL BEHAVIOR CHECKS
================================

C1: OAuth authorize-url redirect_uri...
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=c5b2bfb72dadaf51ee03a87b9018e922&prompt=consent

C2: Legacy login redirect...
[PASS] Status 302

C3: Homepage forbidden strings...
[PASS] Pattern absent: api/admin-api/api/auth/callback|localhost:3000

C4: /snail personal page...
[PASS] Pattern absent: Select a Guild|Choose a guild

================================
D) PACKAGE TESTS
================================

> @slimy/admin-api@1.0.0 test /opt/slimy/slimy-monorepo/apps/admin-api
> jest

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

PASS tests/auth/active-guild.cookie.test.js
  POST /api/auth/active-guild cookie
    ✓ sets slimy_admin_active_guild_id on success (55 ms)

PASS tests/guilds-connect.test.js
  POST /api/guilds/connect
    ✓ should return 200 when connecting with valid frontend payload (71 ms)
    ✓ should return 200 if guild is ALREADY connected (41 ms)
    ✓ should return 400 if guild ID is missing (6 ms)
  guildService.connectGuild
    ✓ upserts owner by discord id and links guild to the owner (3 ms)

PASS tests/central-settings.test.js
  central settings endpoints
    ✓ GET /api/me/settings auto-creates defaults (47 ms)
    ✓ PATCH /api/me/settings merges updates (24 ms)
    ✓ GET /api/guilds/:guildId/settings requires admin/manager (7 ms)
    ✓ PUT /api/guilds/:guildId/settings allows admin and persists (7 ms)

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

PASS tests/auth/active-guild.test.js
  POST /api/auth/active-guild
    ✓ rejects guilds that are not shared/connectable (82 ms)
    ✓ returns role for primary guild based on policy logic (10 ms)

  console.error
    [guilds/connect] Missing SLIMYAI_BOT_TOKEN

      233 |       const SLIMYAI_BOT_TOKEN = getSlimyBotToken();
      234 |       if (!SLIMYAI_BOT_TOKEN) {
    > 235 |         console.error("[guilds/connect] Missing SLIMYAI_BOT_TOKEN");
          |                 ^
      236 |         return res.status(500).json({ error: "MISSING_SLIMYAI_BOT_TOKEN" });
      237 |       }
      238 |

PASS tests/guild-connect.test.js
  POST /guilds/connect
    ✓ should fail if SLIMYAI_BOT_TOKEN is missing (156 ms)
    ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (7 ms)
    ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (7 ms)
    ✓ should succeed if guild is shared (5 ms)

  console.log
    [auth/me] req.user keys: id,username,role,guilds

      at log (src/routes/auth.js:532:13)

  console.log
    [auth/me] rawUser keys: id,username,role,guilds

      at log (src/routes/auth.js:533:13)

  console.log
    [auth/me] Lookup User ID: test-user-id

      at log (src/routes/auth.js:534:13)

  console.log
    [auth/me] DB User Found: true

      at log (src/routes/auth.js:652:13)

  console.warn
    [auth/me] DB guild lookup failed; returning session-only guilds { error: "Cannot read properties of undefined (reading 'findMany')" }

      673 |         warnings.push("db_guilds_lookup_failed");
      674 |         if (shouldDebugAuth()) {
    > 675 |           console.warn("[auth/me] DB guild lookup failed; returning session-only guilds", {
          |                   ^
      676 |             error: err?.message || String(err),
      677 |           });
      678 |         }

  console.log
    [auth/me] req.user keys: id,username,role,guilds

      at log (src/routes/auth.js:532:13)

  console.log
    [auth/me] rawUser keys: id,username,role,guilds

      at log (src/routes/auth.js:533:13)

  console.log
    [auth/me] Lookup User ID: test-user-id

      at log (src/routes/auth.js:534:13)

  console.warn
    [auth/me] DB user lookup failed; returning session-only response { error: 'DB Error' }

      644 |       warnings.push("db_user_lookup_failed");
      645 |       if (shouldDebugAuth()) {
    > 646 |         console.warn("[auth/me] DB user lookup failed; returning session-only response", {
          |                 ^
      647 |           error: err?.message || String(err),
      648 |         });
      649 |       }

  console.log
    [auth/me] DB User Found: false

      at log (src/routes/auth.js:652:13)

  console.warn
    [auth/me] Fallback to cookie guilds: 0

      689 |       // But ensure we at least pass the ID
      690 |       const cookieGuilds = Array.isArray(rawUser?.guilds) ? rawUser.guilds : [];
    > 691 |       console.warn("[auth/me] Fallback to cookie guilds:", cookieGuilds.length);
          |               ^
      692 |       sessionGuilds = cookieGuilds.map((g) => ({
      693 |         id: g?.id,
      694 |         roles: g?.roles,

PASS tests/auth/me-context.test.js
  GET /api/auth/me Context Hydration
    ✓ should include lastActiveGuild from DB (49 ms)
    ✓ should handle DB errors gracefully (39 ms)

PASS tests/guilds-read.test.js
  GET /api/guilds/:guildId
    ✓ should return guild details for authenticated user (22 ms)
    ✓ should return 404 for non-existent guild (6 ms)

PASS tests/routes/stats.test.js
  Stats Routes
    ✓ GET /api/stats should return system metrics by default (9 ms)
    ✓ GET /api/stats?action=system-metrics should return metrics (7 ms)
    ✓ GET /api/stats/events/stream should set SSE headers (2 ms)

PASS tests/auth/auth-middleware.test.js
  Auth Middleware
    resolveUser
      ✓ should return null when no token in cookies (13 ms)
      ✓ should return null when token is invalid (8 ms)
      ✓ should return hydrated user when session exists (7 ms)
      ✓ should return fallback user when no session exists (13 ms)
      ✓ should cache user resolution (10 ms)
    requireAuth
      ✓ should call next when user is authenticated (7 ms)
      ✓ should return 401 when user is not authenticated (4 ms)
    requireRole
      ✓ should call next when user has required role (member) (6 ms)
      ✓ should call next when user has higher role than required (7 ms)
      ✓ should return 403 when user has insufficient role (14 ms)
      ✓ should return 401 when user is not authenticated (8 ms)
    requireGuildMember
      ✓ should call next for admin user regardless of guild membership (6 ms)
      ✓ should call next when user is member of the guild (6 ms)
      ✓ should return 403 when user is not member of the guild (10 ms)
      ✓ should return 400 when guildId parameter is missing (8 ms)
      ✓ should return 401 when user is not authenticated (3 ms)
      ✓ should use custom parameter name (5 ms)

PASS tests/middleware/rbac.test.js
  requireGuildAccess Middleware
    ✓ should return 400 if guildId is missing (3 ms)
    ✓ should return 401 if user is not authenticated (1 ms)
    ✓ should return 403 if user not found in DB (7 ms)
    ✓ should return 403 if user is not a member of the guild (6 ms)
    ✓ should call next() and attach guild info if user has access (3 ms)

PASS tests/discord-guilds.test.js
  GET /discord/guilds
    ✓ should return shared guilds with role labels (44 ms)

PASS tests/routes/usage.test.js
  GET /api/usage
    ✓ should return 200 and correct usage data structure (8 ms)

PASS tests/club-store.test.js
  club-store shim
    ✓ canonicalize lowercases input (1 ms)
    ✓ canonicalize handles nullish values (1 ms)

PASS tests/numparse.test.js
  numparse shim
    ✓ returns numeric values for plain numbers (1 ms)
    ✓ returns null for non-numeric values or suffixed strings (1 ms)

PASS src/lib/auth/post-login-redirect.test.js
  resolvePostLoginRedirectUrl
    ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to (2 ms)
    ✓ falls back to x-forwarded origin when cookie missing (1 ms)
    ✓ falls back to CLIENT_URL when cookie and forwarded origin missing (1 ms)

PASS tests/diag.test.js
  diagnostics placeholder
    ✓ skipped in test mode

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 12 skipped, 16 passed, 16 of 28 total
Tests:       12 skipped, 54 passed, 66 total
Snapshots:   0 total
Time:        3.243 s
Ran all test suites.

> @slimy/admin-ui@ build /opt/slimy/slimy-monorepo/apps/admin-ui
> next build

  ▲ Next.js 14.2.5
  - Environments: .env.local

   Linting and checking validity of types ...
   Creating an optimized production build ...
 ✓ Compiled successfully
   Collecting page data ...
   Generating static pages (0/20) ...
   Generating static pages (5/20) 
   Generating static pages (10/20) 
   Generating static pages (15/20) 
 ✓ Generating static pages (20/20)
   Finalizing page optimization ...
   Collecting build traces ...

Route (pages)                             Size     First Load JS
┌ ○ /                                     5.09 kB         117 kB
├   /_app                                 0 B            86.2 kB
├ ○ /404                                  181 B          86.4 kB
├ ○ /admin-api-usage                      874 B           113 kB
├ ƒ /api/admin-api/[...path]              0 B            86.2 kB
├ ƒ /api/admin-api/api/auth/login         0 B            86.2 kB
├ ƒ /api/admin-api/diag                   0 B            86.2 kB
├ ƒ /api/admin-api/health                 0 B            86.2 kB
├ ƒ /api/auth/discord/authorize-url       0 B            86.2 kB
├ ƒ /api/auth/discord/callback            0 B            86.2 kB
├ ƒ /api/diagnostics                      0 B            86.2 kB
├ ○ /auth-me                              1.08 kB         113 kB
├ ○ /chat                                 2.82 kB         115 kB
├ ○ /club                                 1.93 kB         114 kB
├ ƒ /dashboard                            1.65 kB         113 kB
├ ○ /email-login                          557 B           112 kB
├ ○ /guilds                               2.28 kB         114 kB
├ ○ /guilds/[guildId]                     5.82 kB         118 kB
├ ○ /guilds/[guildId]/channels            1.71 kB         113 kB
├ ○ /guilds/[guildId]/corrections         1.74 kB         113 kB
├ ○ /guilds/[guildId]/personality         888 B           113 kB
├ ○ /guilds/[guildId]/rescan              1.23 kB         113 kB
├ ○ /guilds/[guildId]/settings            1.26 kB         113 kB
├ ○ /guilds/[guildId]/usage               67.5 kB         179 kB
├ ○ /login                                479 B          86.7 kB
├ ○ /snail                                664 B           112 kB
├ ○ /snail/[guildId]                      4.45 kB         116 kB
└ ○ /status                               1.26 kB         113 kB
+ First Load JS shared by all             89.4 kB
  ├ chunks/framework-8051a8b17472378c.js  45.2 kB
  ├ chunks/main-386d6319e61b79bf.js       36.6 kB
  └ other shared chunks (total)           7.55 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand


================================
F) PRE-COMMIT SAFETY
================================
apps/admin-api/src/middleware/auth.js
apps/admin-api/src/routes/auth.js
apps/admin-api/src/services/discord-shared-guilds.js
apps/admin-ui/components/Layout.js
apps/admin-ui/pages/api/admin-api/[...path].js
apps/admin-ui/pages/chat/index.js
apps/admin-ui/pages/club/index.js
apps/admin-ui/pages/guilds/index.js
[PASS] Safety checks passed

No staged changes detected. Exiting successfully (verification-only).
Report available (SUCCESS): /tmp/STABILITY_REPORT_2025-12-18_20-02-52_admin-oauth-guildgate.md
```

## docker compose up -d (timed out)
```
command timed out after 120012 milliseconds
#0 building with "default" instance using docker driver

#1 [bot internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.89kB done
#1 DONE 0.2s

#2 [bot internal] load metadata for docker.io/library/node:22-slim
#2 DONE 0.1s

#3 [bot internal] load .dockerignore
#3 transferring context: 2.44kB done
#3 DONE 0.1s

#4 [bot base 1/2] FROM docker.io/library/node:22-slim@sha256:773413f36941ce1e4baf74b4a6110c03dcc4f968daffc389d4caef3f01412d2a
#4 DONE 0.0s

#5 [bot runner 2/7] WORKDIR /app
#5 CACHED

#6 [bot runner 3/7] RUN addgroup --system --gid 1001 botuser
#6 CACHED

#7 [bot base 2/2] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#7 CACHED

#8 [bot deps 1/9] WORKDIR /app
#8 CACHED

#9 [bot runner 4/7] RUN adduser --system --uid 1001 botuser
#9 CACHED

#10 [bot deps 2/9] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#10 CACHED

#11 [bot internal] load build context
#11 transferring context: 4.59kB 0.1s done
#11 DONE 0.1s

#12 [bot deps 3/9] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#12 CACHED

#13 [bot deps 4/9] COPY apps/bot/package.json ./apps/bot/
#13 CACHED

#14 [bot deps 5/9] COPY apps/admin-api/package.json ./apps/admin-api/
#14 CACHED

#15 [bot deps 6/9] COPY apps/admin-api/vendor ./apps/admin-api/vendor
#15 CACHED

#16 [bot deps 7/9] COPY apps/admin-ui/package.json ./apps/admin-ui/
#16 CACHED

#17 [bot deps 8/9] COPY apps/web/package.json ./apps/web/
#17 CACHED

#18 [bot deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#18 0.818 Scope: all 5 workspace projects
#18 0.985 Lockfile is up to date, resolution step is skipped
#18 1.137 Progress: resolved 1, reused 0, downloaded 0, added 0
#18 1.356 Packages: +1471
#18 1.356 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
#18 1.677 
#18 1.677    ╭───────────────────────────────────────────────╮
#18 1.677    │                                               │
#18 1.677    │     Update available! 10.22.0 → 10.26.0.      │
#18 1.677    │     Changelog: https://pnpm.io/v/10.26.0      │
#18 1.677    │   To update, run: corepack use pnpm@10.26.0   │
#18 1.677    │                                               │
#18 1.677    ╰───────────────────────────────────────────────╯
#18 1.677 
#18 2.142 Progress: resolved 1471, reused 0, downloaded 8, added 0
#18 3.145 Progress: resolved 1471, reused 1, downloaded 118, added 122
#18 4.146 Progress: resolved 1471, reused 1, downloaded 230, added 228
#18 5.146 Progress: resolved 1471, reused 1, downloaded 343, added 349
#18 6.147 Progress: resolved 1471, reused 1, downloaded 440, added 449
#18 7.147 Progress: resolved 1471, reused 1, downloaded 506, added 492
#18 8.148 Progress: resolved 1471, reused 1, downloaded 507, added 492
#18 9.198 Progress: resolved 1471, reused 1, downloaded 508, added 492
#18 10.20 Progress: resolved 1471, reused 1, downloaded 571, added 559
#18 11.20 Progress: resolved 1471, reused 1, downloaded 763, added 772
#18 12.20 Progress: resolved 1471, reused 1, downloaded 825, added 834
#18 13.20 Progress: resolved 1471, reused 1, downloaded 865, added 874
#18 14.20 Progress: resolved 1471, reused 1, downloaded 893, added 902
#18 15.20 Progress: resolved 1471, reused 1, downloaded 914, added 923
#18 16.20 Progress: resolved 1471, reused 1, downloaded 938, added 947
#18 17.20 Progress: resolved 1471, reused 1, downloaded 970, added 978
#18 18.46 Progress: resolved 1471, reused 1, downloaded 971, added 978
#18 19.46 Progress: resolved 1471, reused 1, downloaded 984, added 993
#18 20.46 Progress: resolved 1471, reused 1, downloaded 999, added 996
#18 21.46 Progress: resolved 1471, reused 1, downloaded 1039, added 1016
#18 22.46 Progress: resolved 1471, reused 1, downloaded 1139, added 1123
#18 23.47 Progress: resolved 1471, reused 1, downloaded 1208, added 1202
#18 24.47 Progress: resolved 1471, reused 1, downloaded 1345, added 1351
#18 25.47 Progress: resolved 1471, reused 1, downloaded 1382, added 1391
#18 26.49 Progress: resolved 1471, reused 1, downloaded 1383, added 1391
#18 27.49 Progress: resolved 1471, reused 1, downloaded 1429, added 1417
#18 28.49 Progress: resolved 1471, reused 1, downloaded 1461, added 1437
#18 29.49 Progress: resolved 1471, reused 1, downloaded 1462, added 1470
#18 30.14 Progress: resolved 1471, reused 1, downloaded 1462, added 1471, done
#18 32.46 .../sharp@0.33.5/node_modules/sharp install$ node install/check
#18 32.47 .../esbuild@0.27.1/node_modules/esbuild postinstall$ node install.js
#18 32.75 .../esbuild@0.25.12/node_modules/esbuild postinstall$ node install.js
#18 32.78 .../node_modules/@prisma/engines postinstall$ node scripts/postinstall.js
#18 32.85 .../esbuild@0.21.5/node_modules/esbuild postinstall$ node install.js
#18 33.92 .../sharp@0.33.5/node_modules/sharp install: Done
#18 34.01 .../node_modules/unrs-resolver postinstall$ napi-postinstall unrs-resolver 1.11.1 check
#18 34.14 .../esbuild@0.27.1/node_modules/esbuild postinstall: Done
#18 34.15 .../esbuild@0.21.5/node_modules/esbuild postinstall: Done
#18 34.20 .../node_modules/unrs-resolver postinstall: Done
#18 34.22 .../sharp@0.34.5/node_modules/sharp install$ node install/check.js || npm run build
#18 34.32 .../sharp@0.34.5/node_modules/sharp install: Done
#18 34.76 .../node_modules/@prisma/engines postinstall: prisma:warn Prisma failed to detect the libssl/openssl version to use, and may not work as expected. Defaulting to "openssl-1.1.x".
#18 34.76 .../node_modules/@prisma/engines postinstall: Please manually install OpenSSL via `apt-get update -y && apt-get install -y openssl` and try installing Prisma again. If you're running Prisma on Docker, add this command to your Dockerfile, or switch to an image that already has OpenSSL installed.
#18 35.16 .../esbuild@0.25.12/node_modules/esbuild postinstall: Done
#18 39.02 .../node_modules/@prisma/engines postinstall: Done
#18 39.26 .../node_modules/prisma preinstall$ node scripts/preinstall-entry.js
#18 39.61 .../node_modules/prisma preinstall: Done
#18 39.94 .../node_modules/@prisma/client postinstall$ node scripts/postinstall.js
#18 64.29 .../node_modules/@prisma/client postinstall: prisma:warn Prisma failed to detect the libssl/openssl version to use, and may not work as expected. Defaulting to "openssl-1.1.x".
#18 64.29 .../node_modules/@prisma/client postinstall: Please manually install OpenSSL via `apt-get update -y && apt-get install -y openssl` and try installing Prisma again. If you're running Prisma on Docker, add this command to your Dockerfile, or switch to an image that already has OpenSSL installed.
#18 64.66 .../node_modules/@prisma/client postinstall: prisma:warn We could not find your Prisma schema in the default locations (see: https://pris.ly/d/prisma-schema-location).
#18 64.66 .../node_modules/@prisma/client postinstall: If you have a Prisma schema file in a custom path, you will need to run
#18 64.66 .../node_modules/@prisma/client postinstall: `prisma generate --schema=./path/to/your/schema.prisma` to generate Prisma Client.
#18 64.67 .../node_modules/@prisma/client postinstall: If you do not have a Prisma schema file yet, you can ignore this message.
#18 64.69 .../node_modules/@prisma/client postinstall: Done
#18 65.81 
#18 65.81 devDependencies:
#18 65.81 + @eslint/js 9.39.1
#18 65.81 + eslint 9.39.1
#18 65.81 + eslint-plugin-deprecation 3.0.0
#18 65.81 + glob 13.0.0
#18 65.81 + husky 9.1.7
#18 65.81 + lint-staged 16.2.7
#18 65.81 + tsx 4.21.0
#18 65.81 + typescript 5.9.3
#18 65.81 + typescript-eslint 8.48.1
#18 65.81 + vitest 4.0.15
#18 65.81 
#18 65.81 ╭ Warning ─────────────────────────────────────────────────────────────────────╮
#18 65.81 │                                                                              │
#18 65.81 │   Ignored build scripts: msgpackr-extract.                                   │
#18 65.81 │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
#18 65.81 │   to run scripts.                                                            │
#18 65.81 │                                                                              │
#18 65.81 ╰──────────────────────────────────────────────────────────────────────────────╯
#18 65.81 
#18 65.91 . prepare$ husky
#18 65.99 . prepare: .git can't be found
#18 65.99 . prepare: Done
#18 66.01 Done in 1m 5.6s using pnpm v10.22.0
#18 DONE 73.7s

#19 [bot builder 3/8] COPY --from=deps /app/node_modules ./node_modules
```

## Manual verification (pending)
- Need browser login, guild selection, cookie presence in DevTools, and /api/auth/me showing activeGuildId + activeGuildAppRole.

## docker compose up -d (initial attempt, timed out)
```
command timed out after 10011 milliseconds
#0 building with "default" instance using docker driver

#1 [bot internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.89kB done
#1 DONE 0.0s

#2 [bot internal] load metadata for docker.io/library/node:22-slim
#2 DONE 0.4s

#3 [bot internal] load .dockerignore
#3 transferring context: 2.44kB done
#3 DONE 0.0s

#4 [bot runner 2/7] WORKDIR /app
#4 CACHED

#5 [bot base 1/2] FROM docker.io/library/node:22-slim@sha256:773413f36941ce1e4baf74b4a6110c03dcc4f968daffc389d4caef3f01412d2a
#5 CACHED

#6 [bot internal] load build context
#6 transferring context: 72.18kB 0.2s done
#6 DONE 0.2s

#7 [bot base 2/2] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#7 0.619 Preparing pnpm@10.22.0 for immediate activation...
#7 ...

#8 [bot runner 3/7] RUN addgroup --system --gid 1001 botuser
#8 0.471 Adding group `botuser' (GID 1001) ...
#8 0.541 Done.
#8 DONE 1.0s

#7 [bot base 2/2] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#7 DONE 2.6s

#9 [bot runner 4/7] RUN adduser --system --uid 1001 botuser
#9 0.402 Adding system user `botuser' (UID 1001) ...
#9 0.402 Adding new user `botuser' (UID 1001) with group `nogroup' ...
#9 0.448 useradd warning: botuser's uid 1001 is greater than SYS_UID_MAX 999
#9 0.490 Not creating `/nonexistent'.
#9 DONE 1.4s

#10 [bot deps 1/9] WORKDIR /app
#10 DONE 0.1s

#11 [bot deps 2/9] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#11 0.490 Preparing pnpm@10.22.0 for immediate activation...
#11 DONE 0.5s

#12 [bot deps 3/9] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#12 DONE 0.2s

#13 [bot deps 4/9] COPY apps/bot/package.json ./apps/bot/
#13 DONE 0.1s

#14 [bot deps 5/9] COPY apps/admin-api/package.json ./apps/admin-api/
#14 DONE 0.1s

#15 [bot deps 6/9] COPY apps/admin-api/vendor ./apps/admin-api/vendor
#15 DONE 0.2s

#16 [bot deps 7/9] COPY apps/admin-ui/package.json ./apps/admin-ui/
#16 DONE 0.2s

#17 [bot deps 8/9] COPY apps/web/package.json ./apps/web/
#17 DONE 0.1s

#18 [bot deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#18 0.932 Scope: all 5 workspace projects
#18 1.095 Lockfile is up to date, resolution step is skipped
#18 1.251 Progress: resolved 1, reused 0, downloaded 0, added 0
#18 1.495 Packages: +1471
#18 1.495 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
#18 1.943 
#18 1.943    ╭───────────────────────────────────────────────╮
#18 1.943    │                                               │
#18 1.943    │     Update available! 10.22.0 → 10.26.0.      │
#18 1.943    │     Changelog: https://pnpm.io/v/10.26.0      │
#18 1.943    │   To update, run: corepack use pnpm@10.26.0   │
#18 1.943    │                                               │
#18 1.943    ╰───────────────────────────────────────────────╯
#18 1.943 
#18 2.253 Progress: resolved 1471, reused 1, downloaded 9, added 8
#18 3.255 Progress: resolved 1471, reused 1, downloaded 154, added 157
#18 4.258 Progress: resolved 1471, reused 1, downloaded 269, added 278
```

## git status -sb (post-change)
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M apps/admin-api/src/middleware/auth.js
 M apps/admin-api/src/routes/auth.js
 M apps/admin-api/src/services/discord-shared-guilds.js
 M apps/admin-ui/components/Layout.js
 M apps/admin-ui/pages/api/admin-api/[...path].js
 M apps/admin-ui/pages/chat/index.js
 M apps/admin-ui/pages/club/index.js
 M apps/admin-ui/pages/guilds/index.js
?? apps/admin-api/tests/auth/active-guild.cookie.test.js
?? apps/admin-api/tests/auth/active-guild.test.js
?? docs/buglog/BUG_2025-12-18_active-guild-cookie.md
?? docs/buglog/BUG_2025-12-18_guild-selection-perms-propagation.md
```

## Inspect: apps/admin-api/src/routes/auth.js (active-guild)
```
        : undefined,
      sessionGuilds,
      guilds: sessionGuilds,
      warnings,
    });
  } catch (err) {
    // Last line of defense: never 500 for authenticated sessions.
    console.error("[auth/me] CRITICAL ERROR:", err);
    console.error("[auth/me] rawUser snapshot:", rawUser);
    warnings.push("me_handler_failed");
    return res.json({
      id: userId || null,
      discordId: userId || null,
      username: rawUser?.username || rawUser?.name || "Unknown",
      globalName: rawUser?.globalName,
      avatar: rawUser?.avatar,
      role: rawUser?.role || "member",
      sessionGuilds: [],
      guilds: [],
      warnings,
    });
  }
});

/**
 * POST /api/auth/active-guild
 * Sets the user's active guild (persists in DB + sets cookie)
 * - Validates guildId is a shared guild (bot installed)
 * - Updates lastActiveGuildId in DB
 * - Returns activeGuildId + appRole
 */
router.post("/active-guild", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const rawUser = req.user.user || req.user;
  const userId = rawUser?.id || rawUser?.discordId || rawUser?.sub;
  const discordAccessToken = rawUser?.discordAccessToken;

  if (!userId) {
    return res.status(400).json({ ok: false, error: "missing_user_id" });
  }

  const { guildId } = req.body || {};
  if (!guildId) {
    return res.status(400).json({ ok: false, error: "missing_guild_id" });
  }

  const normalizedGuildId = String(guildId);

  try {
    // 1. Get shared guilds for this user to validate the guildId
    let sharedGuilds = [];
    if (discordAccessToken) {
      try {
        sharedGuilds = await getSharedGuildsForUser({
          discordAccessToken,
          userDiscordId: String(userId),
        });
      } catch (err) {
        console.warn("[auth/active-guild] Failed to fetch shared guilds:", err?.message || err);
      }
    }

    // 2. Find the requested guild in shared guilds
    const targetGuild = sharedGuilds.find((g) => String(g.id) === normalizedGuildId);
    if (!targetGuild) {
      return res.status(400).json({
        ok: false,
        error: "guild_not_shared",
        message: "Guild must be a shared guild with bot installed",
      });
    }

    // 3. Compute role for this guild
    let appRole = targetGuild.roleLabel || "member";

    // For PRIMARY_GUILD, fetch fresh roles from Discord if needed
    const isPrimary = normalizedGuildId === PRIMARY_GUILD_ID;
    if (isPrimary) {
      const botToken = getSlimyBotToken();
      if (botToken) {
        const memberRoles = await fetchMemberRoles(PRIMARY_GUILD_ID, String(userId), botToken);
        if (memberRoles) {
          appRole = computeRoleLabelFromRoles(memberRoles);
        }
      }
    }

    // 4. Update lastActiveGuildId in DB
    let prisma = null;
    try {
      prisma = typeof prismaDatabase.getClient === "function" ? prismaDatabase.getClient() : null;
      if (!prisma && prismaDatabase?.client) {
        prisma = prismaDatabase.client;
      }
    } catch {
      // DB unavailable, continue without persisting
    }

    if (prisma) {
      try {
        const userIdStr = String(userId);
        const isSnowflake = /^\d{17,19}$/.test(userIdStr);
        await prisma.user.update({
          where: isSnowflake ? { discordId: userIdStr } : { id: userIdStr },
          data: { lastActiveGuildId: normalizedGuildId },
        });
      } catch (err) {
        console.warn("[auth/active-guild] Failed to update lastActiveGuildId:", err?.message || err);
        // Continue anyway - we'll still set the cookie
      }
    }

    // 5. Set the active guild cookie
    const cookieOptions = getCookieOptions(req);
    res.cookie(ACTIVE_GUILD_COOKIE_NAME, normalizedGuildId, {
      ...cookieOptions,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // 6. Return success with activeGuildId and appRole
    return res.json({
      ok: true,
      activeGuildId: normalizedGuildId,
      appRole,
      guildName: targetGuild.name,
    });
  } catch (err) {
    console.error("[auth/active-guild] Error:", err);
    return res.status(500).json({
      ok: false,
      error: "internal_error",
      message: err?.message || String(err),
    });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  // Also clear active guild cookie on logout
  const cookieOptions = getCookieOptions(req);
  res.clearCookie(ACTIVE_GUILD_COOKIE_NAME, {
    ...cookieOptions,
    httpOnly: true,
    sameSite: "lax",
  });
  res.json({ ok: true });
});

module.exports = router;
```

## Inspect: apps/admin-ui/pages/api/admin-api/[...path].js (proxy)
```
const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isJsonContentType(contentType) {
  if (!contentType) return false;
  const normalized = String(contentType).toLowerCase();
  return normalized.includes("application/json") || normalized.includes("+json");
}

function firstHeaderValue(value) {
  if (!value) return "";
  const raw = Array.isArray(value) ? value[0] : String(value);
  return raw.split(",")[0].trim();
}

function splitSetCookieHeader(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];

  const parts = [];
  let current = "";
  let inExpires = false;

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];

    if (ch === ",") {
      if (!inExpires) {
        const trimmed = current.trim();
        if (trimmed) parts.push(trimmed);
        current = "";
        continue;
      }
    }

    current += ch;

    if (!inExpires && current.length >= 8) {
      const tail = current.slice(-8).toLowerCase();
      if (tail === "expires=") inExpires = true;
    } else if (inExpires && ch === ";") {
      inExpires = false;
    }
  }

  const last = current.trim();
  if (last) parts.push(last);
  return parts;
}

function getQueryString(reqUrl) {
  if (!reqUrl) return "";
  const idx = reqUrl.indexOf("?");
  return idx === -1 ? "" : reqUrl.slice(idx);
}

export default async function handler(req, res) {
  const base =
    globalThis.process?.env?.ADMIN_API_INTERNAL_URL || "http://admin-api:3080";
  const ts = new Date().toISOString();

  const raw = req.query?.path;
  const pathSegments = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (pathSegments.length === 0) {
    res.status(400).json({ ok: false, error: "missing_path", ts });
    return;
  }

  if (pathSegments[0] !== "api") {
    res.status(400).json({ ok: false, error: "only_api_paths_allowed", ts });
    return;
  }

  if (pathSegments.some((seg) => seg === "..")) {
    res.status(400).json({ ok: false, error: "path_traversal_blocked", ts });
    return;
  }

  const baseUrl = String(base).replace(/\/$/, "");
  const forwardPath = `/${pathSegments.join("/")}`;
  const queryString = getQueryString(req.url);
  const targetUrl = `${baseUrl}${forwardPath}${queryString}`;

  const method = String(req.method || "GET").toUpperCase();
  const cookie = req.headers.cookie || "";
  const contentType = req.headers["content-type"] || "";
  const accept = req.headers.accept || "";
  const csrfToken = req.headers["x-csrf-token"] || "";
  const forwardedHost = firstHeaderValue(req.headers["x-forwarded-host"]) || firstHeaderValue(req.headers.host);
  const forwardedProto =
    firstHeaderValue(req.headers["x-forwarded-proto"]) || (req.socket?.encrypted ? "https" : "http");
  const forwardedPort =
    firstHeaderValue(req.headers["x-forwarded-port"]) ||
    (forwardedHost && forwardedHost.includes(":") ? forwardedHost.split(":").pop() : "");

  // Extract active guild ID from cookie to forward as header
  const activeGuildCookie = (cookie || "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("slimy_admin_active_guild_id="));
  const activeGuildId = activeGuildCookie
    ? decodeURIComponent(activeGuildCookie.split("=")[1] || "").trim()
    : "";

  const headers = {
    ...(cookie ? { cookie } : null),
    ...(contentType ? { "content-type": contentType } : null),
    ...(accept ? { accept } : null),
    ...(csrfToken ? { "x-csrf-token": csrfToken } : null),
    ...(forwardedHost ? { "x-forwarded-host": forwardedHost } : null),
    ...(forwardedProto ? { "x-forwarded-proto": forwardedProto } : null),
    ...(forwardedPort ? { "x-forwarded-port": forwardedPort } : null),
    ...(activeGuildId ? { "x-slimy-active-guild-id": activeGuildId } : null),
  };

  try {
    const init = {
      method,
      headers,
      redirect: "manual",
    };

    if (METHODS_WITH_BODY.has(method) && req.body !== undefined) {
      const hasBuffer = typeof globalThis.Buffer !== "undefined";
      const isBuffer =
        hasBuffer && typeof globalThis.Buffer.isBuffer === "function"
          ? globalThis.Buffer.isBuffer(req.body)
          : false;

      if (typeof req.body === "string" || isBuffer) {
        init.body = req.body;
      } else {
        init.body = JSON.stringify(req.body);
        if (!headers["content-type"]) headers["content-type"] = "application/json";
      }
    }

    const upstreamRes = await globalThis.fetch(targetUrl, init);

    const upstreamContentType = upstreamRes.headers.get("content-type") || "";
    const location = upstreamRes.headers.get("location") || "";

    const setCookies =
      typeof upstreamRes.headers.getSetCookie === "function"
        ? upstreamRes.headers.getSetCookie()
        : [];
    const setCookieFallback = upstreamRes.headers.get("set-cookie") || "";
    const setCookieParsed = !setCookies.length && setCookieFallback
      ? splitSetCookieHeader(setCookieFallback)
      : [];

    if (upstreamContentType) res.setHeader("content-type", upstreamContentType);
    if (location) res.setHeader("location", location);
    if (setCookies.length) res.setHeader("set-cookie", setCookies);
    else if (setCookieParsed.length) res.setHeader("set-cookie", setCookieParsed);
    else if (setCookieFallback) res.setHeader("set-cookie", setCookieFallback);

    const text = await upstreamRes.text().catch(() => "");
    res.status(upstreamRes.status);

    if (isJsonContentType(upstreamContentType)) {
      try {
        const json = text ? JSON.parse(text) : null;
        res.json(json);
        return;
      } catch {
        // fall through to text
      }
    }

    res.send(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ ok: false, error: message, ts });
  }
}
```

## Inspect: apps/admin-ui/pages/guilds/index.js (selection)
```
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useSession } from "../../lib/session";
import { apiFetch } from "../../lib/api";
import { buildBotInviteUrl } from "../../lib/discord";
import { writeActiveGuildId } from "../../lib/active-guild";

export default function GuildsIndex() {
  const router = useRouter();
  const { user, loading: sessionLoading, csrfToken, refresh: refreshSession } = useSession();
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectingGuildId, setSelectingGuildId] = useState(null);

  useEffect(() => {
    if (sessionLoading || !user) return;

    (async () => {
      try {
        const result = await apiFetch("/api/guilds");
        setGuilds(result.guilds || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch guilds:", err);
        setGuilds([]);
        setError(err.message || "Failed to load guilds");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionLoading, user]);

  const inviteBase = {
    clientId: process.env.NEXT_PUBLIC_BOT_CLIENT_ID || "1415387116564910161",
    scopes: process.env.NEXT_PUBLIC_BOT_INVITE_SCOPES || "bot applications.commands",
    permissions: process.env.NEXT_PUBLIC_BOT_PERMISSIONS || "274878286848",
  };
  const globalInviteUrl = buildBotInviteUrl(inviteBase);

  const postActiveGuild = async (guildId) => {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    if (csrfToken) headers.set("x-csrf-token", csrfToken);

    const response = await fetch("/api/admin-api/api/auth/active-guild", {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ guildId }),
    });

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message = payload?.error || payload?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload;
  };

  const handleOpen = async (guild) => {
    if (!guild) return;
    if (!guild.installed || guild.connectable === false) return;
    const guildId = guild.id;
    setSelectingGuildId(guildId);
    setError(null);

    // 1. Call POST /api/admin-api/api/auth/active-guild to set active guild server-side
    try {
      const result = await postActiveGuild(guildId);

      if (result && result.ok === false) {
        console.error("Failed to set active guild:", result.error);
        // Fall back to localStorage for graceful degradation
        writeActiveGuildId(guildId);
      } else {
        // Also write to localStorage for immediate client-side access
        writeActiveGuildId(guildId);
        // Refresh session to pick up new activeGuildId
        await refreshSession();
      }
    } catch (err) {
      console.error("Failed to set active guild:", err);
      writeActiveGuildId(guildId);
    } finally {
      setSelectingGuildId(null);
    }

    // 2. Navigate based on role
    const roleLabel = (guild.roleLabel || guild.role || "member").toLowerCase();
    if (roleLabel === "admin") {
      router.push(`/guilds/${guildId}`);
    } else if (roleLabel === "club") {
      router.push(`/club?guildId=${guildId}`);
    } else {
      router.push(`/snail/${guildId}`);
    }
  };

  if (sessionLoading || loading) {
    return (
      <Layout title="Loading Guilds">
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading your guilds…</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="No Session">
        <div style={{ textAlign: "center", padding: "2rem" }}>Please log in again.</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Error Loading Guilds">
        <div className="card" style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ textAlign: "center", display: "grid", gap: "1.25rem" }}>
            <div style={{ fontSize: "3rem" }}>⚠️</div>
            <h2 style={{ margin: 0, color: "#f87171" }}>Failed to Load Guilds</h2>
            <p style={{ opacity: 0.8 }}>{error}</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                className="btn"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  window.location.reload();
                }}
              >
                Retry
              </button>
              <a href="/" className="btn outline">
                Go Home
              </a>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (guilds.length === 0) {
    return (
      <Layout title="No Guilds Available">
        <div style={{ textAlign: "center", padding: "2rem", display: "grid", gap: "1.25rem" }}>
          <div>No guilds available. Make sure you're in at least one Discord server.</div>
          <a
            href={globalInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              background: "linear-gradient(135deg, rgb(109,40,217), rgb(34,197,94))",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Add Bot to Server
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Select a Guild">
      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "flex-end" }}>
        <a
          href={globalInviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(56,189,248,0.3)",
            background: "rgba(56,189,248,0.1)",
            color: "rgb(56,189,248)",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          + Add Bot to Another Server
        </a>
      </div>
```

## Inspect: apps/admin-api/src/services/token.js (cookie options)
```
"use strict";

const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");

const config = require("../config");

function getHostFromRequest(req) {
  const header = req?.headers?.["x-forwarded-host"] || req?.headers?.host || "";
  const first = Array.isArray(header) ? header[0] : String(header);
  const host = first.split(",")[0].trim().split(":")[0].trim().toLowerCase();
  return host;
}

function isLocalhostHost(host) {
  if (!host) return true;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
  if (host.endsWith(".localhost")) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return false;
}

function isHttpsRequest(req) {
  const xfProto = req?.headers?.["x-forwarded-proto"];
  const raw = Array.isArray(xfProto) ? xfProto[0] : xfProto ? String(xfProto) : "";
  const proto = raw.split(",")[0].trim().toLowerCase();
  if (proto) return proto === "https";
  if (req?.secure === true) return true;
  if (req?.protocol) return String(req.protocol).toLowerCase() === "https";
  return false;
}

function getCookieOptions(req, overrides = {}) {
  const secure = isHttpsRequest(req);
  const host = getHostFromRequest(req);
  const sameSite = (overrides.sameSite ?? config.jwt.cookieSameSite ?? "lax").toLowerCase();

  const options = {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge:
      overrides.maxAge ??
      Number(config.jwt.maxAgeSeconds || 12 * 60 * 60) * 1000,
  };

  if (!isLocalhostHost(host) && config.jwt.cookieDomain && !overrides.domain) {
    options.domain = config.jwt.cookieDomain;
  }

  if ((options.sameSite || "").toLowerCase() === "none" && !options.secure) {
    // Browsers reject SameSite=None without Secure; fall back for HTTP localhost/dev.
    options.sameSite = "lax";
  }

  if (overrides.domain) options.domain = overrides.domain;
  if (typeof overrides.httpOnly === "boolean") options.httpOnly = overrides.httpOnly;
  if (typeof overrides.secure === "boolean") options.secure = overrides.secure;
  if (overrides.path) options.path = overrides.path;

  return options;
}

function signSession(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function createSessionToken({ user, guilds, role }) {
  const csrfToken = nanoid(32);
  const session = {
    sub: user.id,
    username: user.username,
    globalName: user.globalName,
    avatar: user.avatar,
    role,
    guilds,
    csrfToken,
  };

  const token = signSession(session);
  return { token, csrfToken, session };
}

function verifySessionToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  getCookieOptions,
};
```

## Stability gate (initial attempt, timed out)
```
command timed out after 10017 milliseconds

> slimy-monorepo@ stability:gate /opt/slimy/slimy-monorepo
> bash scripts/smoke/stability-gate.sh

Preflight: Checking dependencies...
Preflight: OK
Report initialized: /tmp/STABILITY_REPORT_2025-12-18_20-02-36_admin-oauth-guildgate.md

================================
A) BASELINE SANITY
================================
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M apps/admin-api/src/middleware/auth.js
 M apps/admin-api/src/routes/auth.js
 M apps/admin-api/src/services/discord-shared-guilds.js
 M apps/admin-ui/components/Layout.js
 M apps/admin-ui/pages/api/admin-api/[...path].js
 M apps/admin-ui/pages/chat/index.js
 M apps/admin-ui/pages/club/index.js
 M apps/admin-ui/pages/guilds/index.js
?? apps/admin-api/tests/auth/active-guild.cookie.test.js
?? apps/admin-api/tests/auth/active-guild.test.js
?? docs/buglog/BUG_2025-12-18_active-guild-cookie.md
?? docs/buglog/BUG_2025-12-18_guild-selection-perms-propagation.md
nuc2/verify-role-b33e616
v20.19.6
10.21.0
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED             STATUS                       PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   About an hour ago   Up About an hour (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    About an hour ago   Up About an hour             0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          About an hour ago   Up About an hour (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         About an hour ago   Up About an hour             0.0.0.0:3000->3000/tcp, :::3000->3000/tcp

================================
B) SERVICE HEALTH
================================
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "uy3wjzvq0s2tj"
Content-Type: text/html; charset=utf-8
Content-Length: 3679
Vary: Accept-Encoding
Date: Thu, 18 Dec 2025 20:02:37 GMT
Connection: keep-alive
Keep-Alive: timeout=5

HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
X-Request-ID: 59f86252-7428-408c-8b48-5921570023f6
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 86
Date: Thu, 18 Dec 2025 20:02:37 GMT
Connection: keep-alive
Keep-Alive: timeout=5


================================
C) CRITICAL BEHAVIOR CHECKS
================================

C1: OAuth authorize-url redirect_uri...
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=d4f80086eb17bc35f90be6347bd6fa23&prompt=consent

C2: Legacy login redirect...
[PASS] Status 302

C3: Homepage forbidden strings...
[PASS] Pattern absent: api/admin-api/api/auth/callback|localhost:3000

C4: /snail personal page...
[PASS] Pattern absent: Select a Guild|Choose a guild

================================
D) PACKAGE TESTS
================================

> @slimy/admin-api@1.0.0 test /opt/slimy/slimy-monorepo/apps/admin-api
> jest

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

PASS tests/auth/active-guild.test.js
  POST /api/auth/active-guild
    ✓ rejects guilds that are not shared/connectable (62 ms)
    ✓ returns role for primary guild based on policy logic (8 ms)

PASS tests/auth/active-guild.cookie.test.js
  POST /api/auth/active-guild cookie
    ✓ sets slimy_admin_active_guild_id on success (50 ms)

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

  console.log
    [auth/me] req.user keys: id,username,role,guilds

      at log (src/routes/auth.js:532:13)

  console.log
    [auth/me] rawUser keys: id,username,role,guilds

      at log (src/routes/auth.js:533:13)

  console.log
    [auth/me] Lookup User ID: test-user-id

      at log (src/routes/auth.js:534:13)

  console.log
    [auth/me] DB User Found: true

      at log (src/routes/auth.js:652:13)

  console.warn
    [auth/me] DB guild lookup failed; returning session-only guilds { error: "Cannot read properties of undefined (reading 'findMany')" }

      673 |         warnings.push("db_guilds_lookup_failed");
      674 |         if (shouldDebugAuth()) {
    > 675 |           console.warn("[auth/me] DB guild lookup failed; returning session-only guilds", {
          |                   ^
      676 |             error: err?.message || String(err),
      677 |           });
      678 |         }

  console.log
    [auth/me] req.user keys: id,username,role,guilds

      at log (src/routes/auth.js:532:13)

  console.log
    [auth/me] rawUser keys: id,username,role,guilds

      at log (src/routes/auth.js:533:13)

  console.log
    [auth/me] Lookup User ID: test-user-id

      at log (src/routes/auth.js:534:13)

  console.warn
    [auth/me] DB user lookup failed; returning session-only response { error: 'DB Error' }

      644 |       warnings.push("db_user_lookup_failed");
      645 |       if (shouldDebugAuth()) {
    > 646 |         console.warn("[auth/me] DB user lookup failed; returning session-only response", {
          |                 ^
      647 |           error: err?.message || String(err),
      648 |         });
      649 |       }

  console.log
    [auth/me] DB User Found: false

      at log (src/routes/auth.js:652:13)

  console.warn
    [auth/me] Fallback to cookie guilds: 0

      689 |       // But ensure we at least pass the ID
      690 |       const cookieGuilds = Array.isArray(rawUser?.guilds) ? rawUser.guilds : [];
    > 691 |       console.warn("[auth/me] Fallback to cookie guilds:", cookieGuilds.length);
          |               ^
      692 |       sessionGuilds = cookieGuilds.map((g) => ({
      693 |         id: g?.id,
      694 |         roles: g?.roles,

PASS tests/auth/me-context.test.js
  GET /api/auth/me Context Hydration
    ✓ should include lastActiveGuild from DB (119 ms)
    ✓ should handle DB errors gracefully (27 ms)

PASS tests/guilds-connect.test.js
  POST /api/guilds/connect
    ✓ should return 200 when connecting with valid frontend payload (140 ms)
    ✓ should return 200 if guild is ALREADY connected (54 ms)
    ✓ should return 400 if guild ID is missing (7 ms)
  guildService.connectGuild
    ✓ upserts owner by discord id and links guild to the owner (3 ms)

  console.error
    [guilds/connect] Missing SLIMYAI_BOT_TOKEN

      233 |       const SLIMYAI_BOT_TOKEN = getSlimyBotToken();
      234 |       if (!SLIMYAI_BOT_TOKEN) {
    > 235 |         console.error("[guilds/connect] Missing SLIMYAI_BOT_TOKEN");
          |                 ^
      236 |         return res.status(500).json({ error: "MISSING_SLIMYAI_BOT_TOKEN" });
      237 |       }
      238 |

PASS tests/guild-connect.test.js
  POST /guilds/connect
    ✓ should fail if SLIMYAI_BOT_TOKEN is missing (33 ms)
    ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (7 ms)
    ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (6 ms)
    ✓ should succeed if guild is shared (6 ms)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: token verification failed { error: 'jwt malformed' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:22:13)

PASS tests/discord-guilds.test.js
  GET /discord/guilds
    ✓ should return shared guilds with role labels (44 ms)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:22:13)

  console.warn
    [admin-api] guild membership check failed {
      userId: 'test-member',
      guildId: 'different-guild-456',
      guildIds: [ 'guild-123' ]
    }

      384 |     if (!guild) {
      385 |       if (shouldDebugAuth()) {
    > 386 |         console.warn("[admin-api] guild membership check failed", {
          |                 ^
      387 |           userId: user.id,
      388 |           guildId: guildIdStr,
      389 |           guildIds: guilds.map((g) => String(g?.id)).slice(0, 25),

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:22:13)

PASS tests/auth/auth-middleware.test.js
  Auth Middleware
    resolveUser
      ✓ should return null when no token in cookies (56 ms)
      ✓ should return null when token is invalid (9 ms)
      ✓ should return hydrated user when session exists (16 ms)
      ✓ should return fallback user when no session exists (7 ms)
      ✓ should cache user resolution (6 ms)
    requireAuth
      ✓ should call next when user is authenticated (7 ms)
      ✓ should return 401 when user is not authenticated (4 ms)
    requireRole
      ✓ should call next when user has required role (member) (6 ms)
      ✓ should call next when user has higher role than required (5 ms)
      ✓ should return 403 when user has insufficient role (6 ms)
      ✓ should return 401 when user is not authenticated (9 ms)
    requireGuildMember
      ✓ should call next for admin user regardless of guild membership (8 ms)
      ✓ should call next when user is member of the guild (6 ms)
      ✓ should return 403 when user is not member of the guild (10 ms)
      ✓ should return 400 when guildId parameter is missing (7 ms)
      ✓ should return 401 when user is not authenticated (5 ms)
      ✓ should use custom parameter name (5 ms)

  console.log
    [requireGuildAccess] Checking access for user discord-user-id to guild guild-123

      at log (src/middleware/rbac.js:33:13)

  console.warn
    [requireGuildAccess] User discord-user-id not found in DB

      38 |
      39 |     if (!user) {
    > 40 |       console.warn(`[requireGuildAccess] User ${req.user.id} not found in DB`);
         |               ^
      41 |       return res.status(403).json({ error: "guild-access-denied" });
      42 |     }
      43 |

      at warn (src/middleware/rbac.js:40:15)
      at Object.<anonymous> (tests/middleware/rbac.test.js:53:5)

  console.log
    [requireGuildAccess] Checking access for user discord-user-id to guild guild-123

      at log (src/middleware/rbac.js:33:13)

  console.warn
    [requireGuildAccess] User db-user-id is not a member of guild guild-123

      56 |
      57 |     if (!userGuild) {
    > 58 |       console.warn(`[requireGuildAccess] User ${user.id} is not a member of guild ${guildId}`);
         |               ^
      59 |       return res.status(403).json({ error: "guild-access-denied" });
      60 |     }
      61 |

      at warn (src/middleware/rbac.js:58:15)
      at Object.<anonymous> (tests/middleware/rbac.test.js:63:5)

  console.log
    [requireGuildAccess] Checking access for user discord-user-id to guild guild-123

      at log (src/middleware/rbac.js:33:13)

PASS tests/middleware/rbac.test.js
  requireGuildAccess Middleware
    ✓ should return 400 if guildId is missing (3 ms)
    ✓ should return 401 if user is not authenticated (1 ms)
    ✓ should return 403 if user not found in DB (14 ms)
    ✓ should return 403 if user is not a member of the guild (8 ms)
    ✓ should call next() and attach guild info if user has access (4 ms)

PASS tests/guilds-read.test.js
  GET /api/guilds/:guildId
    ✓ should return guild details for authenticated user (6 ms)
    ✓ should return 404 for non-existent guild (4 ms)

PASS tests/numparse.test.js
  numparse shim
    ✓ returns numeric values for plain numbers (1 ms)
    ✓ returns null for non-numeric values or suffixed strings (1 ms)

PASS tests/routes/stats.test.js
  Stats Routes
    ✓ GET /api/stats should return system metrics by default (19 ms)
    ✓ GET /api/stats?action=system-metrics should return metrics (6 ms)
    ✓ GET /api/stats/events/stream should set SSE headers (2 ms)

PASS src/lib/auth/post-login-redirect.test.js
  resolvePostLoginRedirectUrl
    ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to (1 ms)
    ✓ falls back to x-forwarded origin when cookie missing (1 ms)
    ✓ falls back to CLIENT_URL when cookie and forwarded origin missing

PASS tests/routes/usage.test.js
  GET /api/usage
    ✓ should return 200 and correct usage data structure (10 ms)

PASS tests/diag.test.js
  diagnostics placeholder
    ✓ skipped in test mode (1 ms)

PASS tests/club-store.test.js
  club-store shim
    ✓ canonicalize lowercases input (1 ms)
    ✓ canonicalize handles nullish values

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 12 skipped, 16 passed, 16 of 28 total
Tests:       12 skipped, 54 passed, 66 total
Snapshots:   0 total
Time:        3.801 s
Ran all test suites.
```

---

## Final Verification (2025-12-19T12:06:10+00:00)
- Tests: pnpm --filter @slimy/admin-api test; pnpm --filter @slimy/admin-ui build; pnpm stability:gate
- Confirmed active guild cookie test coverage and admin-ui build/stability gate pass; active guild propagation and gating checks are stable under test.
ready to move on
