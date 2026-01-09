# Stability Report: admin oauth + guild gate
- Timestamp: 2025-12-18T18:21:58+00:00
- Repo: /opt/slimy/slimy-monorepo


## git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M scripts/smoke/stability-gate.sh
?? docs/buglog/BUG_2025-12-18_stability-gate-polish-fullmode.md
```


## git rev-parse --abbrev-ref HEAD
```
nuc2/verify-role-b33e616
```


## node -v; pnpm -v
```
v20.19.6
10.21.0
```


## docker compose ps
```
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED        STATUS                  PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   4 hours ago    Up 4 hours (healthy)    0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    3 hours ago    Up 7 seconds            0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          24 hours ago   Up 24 hours (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         24 hours ago   Up 24 hours             0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```


## admin-ui: http://localhost:3001/
```
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "rzt4am97uz2tj"
Content-Type: text/html; charset=utf-8
Content-Length: 3679
Vary: Accept-Encoding
Date: Thu, 18 Dec 2025 18:21:59 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```


## admin-api health: http://localhost:3080/api/health
```
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
X-Request-ID: d90a6f03-77f8-4490-8252-a19b7d2f5d50
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 87
Date: Thu, 18 Dec 2025 18:21:59 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```


## curl -fsS -D- -o /dev/null 'http://localhost:3001/api/auth/discord/authorize-url' | grep -i '^Location:' | grep 'redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback'
```
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=30a630e7cc785e0a2b17d468fa66a099&prompt=consent
```


## C2: Legacy login redirect
```
[PASS] Status 302
```


## ASSERT ABSENT: api/admin-api/api/auth/callback|localhost:3000 in http://localhost:3001/
```
[PASS] Pattern absent: api/admin-api/api/auth/callback|localhost:3000
```


## ASSERT ABSENT: Select a Guild|Choose a guild in http://localhost:3001/snail
```
[PASS] Pattern absent: Select a Guild|Choose a guild
```


## pnpm --filter @slimy/admin-api test
```

> @slimy/admin-api@1.0.0 test /opt/slimy/slimy-monorepo/apps/admin-api
> jest

  console.log
    !!! AUTH LOGIC LOADED v303 (DATA INTEGRITY) !!!

      at Object.log (src/routes/auth.js:12:9)

  console.log
    [auth/me] req.user keys: id,username,role,guilds

      at log (src/routes/auth.js:522:13)

  console.log
    [auth/me] rawUser keys: id,username,role,guilds

      at log (src/routes/auth.js:523:13)

  console.log
    [auth/me] Lookup User ID: test-user-id

      at log (src/routes/auth.js:524:13)

  console.log
    [auth/me] DB User Found: true

      at log (src/routes/auth.js:582:13)

  console.warn
    [auth/me] DB guild lookup failed; returning session-only guilds { error: "Cannot read properties of undefined (reading 'findMany')" }

      603 |         warnings.push("db_guilds_lookup_failed");
      604 |         if (shouldDebugAuth()) {
    > 605 |           console.warn("[auth/me] DB guild lookup failed; returning session-only guilds", {
          |                   ^
      606 |             error: err?.message || String(err),
      607 |           });
      608 |         }

      at warn (src/routes/auth.js:605:19)

  console.log
    [auth/me] req.user keys: id,username,role,guilds

      at log (src/routes/auth.js:522:13)

  console.log
    [auth/me] rawUser keys: id,username,role,guilds

      at log (src/routes/auth.js:523:13)

  console.log
    [auth/me] Lookup User ID: test-user-id

      at log (src/routes/auth.js:524:13)

  console.warn
    [auth/me] DB user lookup failed; returning session-only response { error: 'DB Error' }

      574 |       warnings.push("db_user_lookup_failed");
      575 |       if (shouldDebugAuth()) {
    > 576 |         console.warn("[auth/me] DB user lookup failed; returning session-only response", {
          |                 ^
      577 |           error: err?.message || String(err),
      578 |         });
      579 |       }

      at warn (src/routes/auth.js:576:17)

  console.log
    [auth/me] DB User Found: false

      at log (src/routes/auth.js:582:13)

  console.warn
    [auth/me] Fallback to cookie guilds: 0

      619 |       // But ensure we at least pass the ID
      620 |       const cookieGuilds = Array.isArray(rawUser?.guilds) ? rawUser.guilds : [];
    > 621 |       console.warn("[auth/me] Fallback to cookie guilds:", cookieGuilds.length);
          |               ^
      622 |       sessionGuilds = cookieGuilds.map((g) => ({
      623 |         id: g?.id,
      624 |         roles: g?.roles,

      at warn (src/routes/auth.js:621:15)

PASS tests/auth/me-context.test.js
  GET /api/auth/me Context Hydration
    ✓ should include lastActiveGuild from DB (75 ms)
    ✓ should handle DB errors gracefully (27 ms)

PASS tests/central-settings.test.js
  central settings endpoints
    ✓ GET /api/me/settings auto-creates defaults (56 ms)
    ✓ PATCH /api/me/settings merges updates (25 ms)
    ✓ GET /api/guilds/:guildId/settings requires admin/manager (8 ms)
    ✓ PUT /api/guilds/:guildId/settings allows admin and persists (9 ms)

PASS tests/guilds-connect.test.js
  POST /api/guilds/connect
    ✓ should return 200 when connecting with valid frontend payload (71 ms)
    ✓ should return 200 if guild is ALREADY connected (47 ms)
    ✓ should return 400 if guild ID is missing (9 ms)
  guildService.connectGuild
    ✓ upserts owner by discord id and links guild to the owner (5 ms)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: token verification failed { error: 'jwt malformed' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:21:13)

PASS tests/guilds-read.test.js
  GET /api/guilds/:guildId
    ✓ should return guild details for authenticated user (43 ms)
    ✓ should return 404 for non-existent guild (6 ms)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:21:13)

  console.error
    [guilds/connect] Missing SLIMYAI_BOT_TOKEN

      233 |       const SLIMYAI_BOT_TOKEN = getSlimyBotToken();
      234 |       if (!SLIMYAI_BOT_TOKEN) {
    > 235 |         console.error("[guilds/connect] Missing SLIMYAI_BOT_TOKEN");
          |                 ^
      236 |         return res.status(500).json({ error: "MISSING_SLIMYAI_BOT_TOKEN" });
      237 |       }
      238 |

      at error (src/routes/guilds.js:235:17)
      at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
      at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
      at next (tests/guild-connect.test.js:24:5)
      at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
      at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
      at next (tests/guild-connect.test.js:11:5)
      at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
      at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
      at Route.dispatch (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:119:3)
      at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
      at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:284:15
      at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
      at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
      at next (tests/guild-connect.test.js:11:5)
      at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
      at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
      at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
      at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
      at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
      at Function.handle (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:175:3)
      at router (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:47:12)
      at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
      at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
      at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
      at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
      at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
      at ../../node_modules/.pnpm/body-parser@1.20.4/node_modules/body-parser/lib/read.js:137:5
      at invokeCallback (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:238:16)
      at done (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:227:7)
      at IncomingMessage.onEnd (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:287:7)

  console.warn
    [admin-api] guild membership check failed {
      userId: 'test-member',
      guildId: 'different-guild-456',
      guildIds: [ 'guild-123' ]
    }

      375 |     if (!guild) {
      376 |       if (shouldDebugAuth()) {
    > 377 |         console.warn("[admin-api] guild membership check failed", {
          |                 ^
      378 |           userId: user.id,
      379 |           guildId: guildIdStr,
      380 |           guildIds: guilds.map((g) => String(g?.id)).slice(0, 25),

      at warn (src/middleware/auth.js:377:17)
      at Object.<anonymous> (tests/auth/auth-middleware.test.js:183:7)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:21:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:21:13)

PASS tests/guild-connect.test.js
  POST /guilds/connect
    ✓ should fail if SLIMYAI_BOT_TOKEN is missing (115 ms)
    ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (8 ms)
    ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (7 ms)
    ✓ should succeed if guild is shared (7 ms)

PASS tests/auth/auth-middleware.test.js
  Auth Middleware
    resolveUser
      ✓ should return null when no token in cookies (153 ms)
      ✓ should return null when token is invalid (7 ms)
      ✓ should return hydrated user when session exists (8 ms)
      ✓ should return fallback user when no session exists (7 ms)
      ✓ should cache user resolution (6 ms)
    requireAuth
      ✓ should call next when user is authenticated (6 ms)
      ✓ should return 401 when user is not authenticated (4 ms)
    requireRole
      ✓ should call next when user has required role (member) (20 ms)
      ✓ should call next when user has higher role than required (6 ms)
      ✓ should return 403 when user has insufficient role (7 ms)
      ✓ should return 401 when user is not authenticated (4 ms)
    requireGuildMember
      ✓ should call next for admin user regardless of guild membership (6 ms)
      ✓ should call next when user is member of the guild (7 ms)
      ✓ should return 403 when user is not member of the guild (21 ms)
      ✓ should return 400 when guildId parameter is missing (5 ms)
      ✓ should return 401 when user is not authenticated (8 ms)
      ✓ should use custom parameter name (28 ms)

PASS tests/discord-guilds.test.js
  GET /discord/guilds
    ✓ should return shared guilds with role labels (32 ms)

PASS tests/routes/usage.test.js
  GET /api/usage
    ✓ should return 200 and correct usage data structure (9 ms)

PASS tests/routes/stats.test.js
  Stats Routes
    ✓ GET /api/stats should return system metrics by default (14 ms)
    ✓ GET /api/stats?action=system-metrics should return metrics (8 ms)
    ✓ GET /api/stats/events/stream should set SSE headers (2 ms)

PASS src/lib/auth/post-login-redirect.test.js
  resolvePostLoginRedirectUrl
    ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to (2 ms)
    ✓ falls back to x-forwarded origin when cookie missing (1 ms)
    ✓ falls back to CLIENT_URL when cookie and forwarded origin missing (1 ms)

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
    ✓ should return 403 if user not found in DB (64 ms)
    ✓ should return 403 if user is not a member of the guild (8 ms)
    ✓ should call next() and attach guild info if user has access (5 ms)

PASS tests/club-store.test.js
  club-store shim
    ✓ canonicalize lowercases input (1 ms)
    ✓ canonicalize handles nullish values (1 ms)

PASS tests/numparse.test.js
  numparse shim
    ✓ returns numeric values for plain numbers (1 ms)
    ✓ returns null for non-numeric values or suffixed strings (1 ms)

PASS tests/diag.test.js
  diagnostics placeholder
    ✓ skipped in test mode (1 ms)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 12 skipped, 14 passed, 14 of 26 total
Tests:       12 skipped, 51 passed, 63 total
Snapshots:   0 total
Time:        3.586 s
Ran all test suites.
```


## pnpm --filter @slimy/admin-ui build
```

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
├ ○ /chat                                 2.78 kB         115 kB
├ ○ /club                                 1.92 kB         114 kB
├ ƒ /dashboard                            1.65 kB         113 kB
├ ○ /email-login                          557 B           112 kB
├ ○ /guilds                               1.91 kB         114 kB
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

```


## pnpm smoke:docker
```

> slimy-monorepo@ smoke:docker /opt/slimy/slimy-monorepo
> bash scripts/smoke/docker-smoke.sh

 Container slimy-monorepo-admin-ui-1  Stopping
 Container slimy-monorepo-web-1  Stopping
 Container slimy-monorepo-admin-ui-1  Stopped
 Container slimy-monorepo-admin-ui-1  Removing
 Container slimy-monorepo-admin-ui-1  Removed
 Container slimy-monorepo-web-1  Stopped
 Container slimy-monorepo-web-1  Removing
 Container slimy-monorepo-web-1  Removed
 Container slimy-monorepo-admin-api-1  Stopping
 Container slimy-monorepo-admin-api-1  Stopped
 Container slimy-monorepo-admin-api-1  Removing
 Container slimy-monorepo-admin-api-1  Removed
 Container slimy-monorepo-db-1  Stopping
 Container slimy-monorepo-db-1  Stopped
 Container slimy-monorepo-db-1  Removing
 Container slimy-monorepo-db-1  Removed
 Network slimy-monorepo_slimy-network  Removing
 Network slimy-monorepo_slimy-network  Removed
Bringing up baseline stack (db admin-api web admin-ui)...
#0 building with "default" instance using docker driver

#1 [admin-api internal] load build definition from Dockerfile
#1 transferring dockerfile: 3.35kB done
#1 DONE 0.0s

#2 [admin-api internal] load metadata for docker.io/library/node:20-alpine
#2 DONE 0.2s

#3 [admin-api internal] load .dockerignore
#3 transferring context: 2.44kB done
#3 DONE 0.0s

#4 [admin-api base 1/3] FROM docker.io/library/node:20-alpine@sha256:658d0f63e501824d6c23e06d4bb95c71e7d704537c9d9272f488ac03a370d448
#4 resolve docker.io/library/node:20-alpine@sha256:658d0f63e501824d6c23e06d4bb95c71e7d704537c9d9272f488ac03a370d448 0.0s done
#4 DONE 0.0s

#5 [admin-api internal] load build context
#5 transferring context: 647.23kB 0.1s done
#5 DONE 0.1s

#6 [admin-api deps 6/7] COPY apps/admin-api/vendor/ ./apps/admin-api/vendor/
#6 CACHED

#7 [admin-api runner 12/14] COPY apps/admin-api/src ./apps/admin-api/src
#7 CACHED

#8 [admin-api base 2/3] RUN npm install -g pnpm@latest
#8 CACHED

#9 [admin-api deps 3/7] COPY package.json ./
#9 CACHED

#10 [admin-api base 3/3] WORKDIR /app
#10 CACHED

#11 [admin-api deps 2/7] COPY pnpm-lock.yaml ./
#11 CACHED

#12 [admin-api runner  9/14] COPY --from=deps /app/apps/admin-api/vendor ./apps/admin-api/vendor
#12 CACHED

#13 [admin-api runner  6/14] COPY --from=deps /app/node_modules ./node_modules
#13 CACHED

#14 [admin-api runner 13/14] COPY apps/admin-api/server.js ./apps/admin-api/server.js
#14 CACHED

#15 [admin-api deps 5/7] COPY apps/admin-api/package.json ./apps/admin-api/
#15 CACHED

#16 [admin-api builder 1/2] COPY apps/admin-api/prisma/ ./apps/admin-api/prisma/
#16 CACHED

#17 [admin-api runner  7/14] COPY --from=deps /app/packages ./packages
#17 CACHED

#18 [admin-api builder 2/2] RUN cd apps/admin-api && pnpm prisma:generate
#18 CACHED

#19 [admin-api deps 4/7] COPY packages/ ./packages/
#19 CACHED

#20 [admin-api runner  5/14] COPY --from=deps /app/package.json ./
#20 CACHED

#21 [admin-api deps 1/7] COPY pnpm-workspace.yaml ./
#21 CACHED

#22 [admin-api runner 11/14] COPY apps/admin-api/ ./apps/admin-api/
#22 CACHED

#23 [admin-api runner  8/14] COPY --from=deps /app/apps/admin-api/node_modules ./apps/admin-api/node_modules
#23 CACHED

#24 [admin-api deps 7/7] RUN pnpm install --frozen-lockfile --filter @slimy/admin-api...
#24 CACHED

#25 [admin-api runner 10/14] COPY --from=builder /app/apps/admin-api/node_modules/.prisma ./apps/admin-api/node_modules/.prisma
#25 CACHED

#26 [admin-api runner  4/14] COPY --from=deps /app/pnpm-workspace.yaml ./
#26 CACHED

#27 [admin-api runner 14/14] WORKDIR /app/apps/admin-api
#27 CACHED

#28 [admin-api] exporting to image
#28 exporting layers done
#28 writing image sha256:84ef4e666bc0cd01fb9be86b605ca51087c4cf7ebbf5bb86841f45f9cbbae268 0.0s done
#28 naming to docker.io/library/slimy-monorepo-admin-api 0.0s done
#28 DONE 0.1s

#29 [web internal] load build definition from Dockerfile
#29 transferring dockerfile: 3.38kB done
#29 DONE 0.0s

#30 [admin-ui internal] load build definition from Dockerfile
#30 transferring dockerfile: 3.27kB done
#30 DONE 0.0s

#31 [web internal] load metadata for docker.io/library/node:22-slim
#31 DONE 0.1s

#32 [admin-ui internal] load .dockerignore
#32 transferring context: 2.44kB done
#32 DONE 0.0s

#33 [web internal] load .dockerignore
#33 transferring context: 2.44kB done
#33 DONE 0.1s

#34 [admin-ui base 1/3] FROM docker.io/library/node:22-slim@sha256:773413f36941ce1e4baf74b4a6110c03dcc4f968daffc389d4caef3f01412d2a
#34 DONE 0.0s

#35 [admin-ui internal] load build context
#35 ...

#34 [web base 1/3] FROM docker.io/library/node:22-slim@sha256:773413f36941ce1e4baf74b4a6110c03dcc4f968daffc389d4caef3f01412d2a
#34 DONE 0.0s

#35 [admin-ui internal] load build context
#35 transferring context: 57.44MB 0.7s done
#35 DONE 0.8s

#36 [web internal] load build context
#36 transferring context: 27.31MB 0.9s done
#36 DONE 0.9s

#37 [web deps 1/9] WORKDIR /app
#37 CACHED

#38 [web base 2/3] RUN apt-get update -y && apt-get install -y openssl
#38 CACHED

#39 [web deps 2/9] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#39 CACHED

#40 [web base 3/3] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#40 CACHED

#41 [web deps 3/9] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#41 CACHED

#42 [web deps 10/10] RUN pnpm install --frozen-lockfile --prod=false
#42 CACHED

#43 [web deps  3/10] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#43 CACHED

#44 [web deps  6/10] COPY apps/admin-api/package.json ./apps/admin-api/
#44 CACHED

#45 [web deps  4/10] COPY apps/web/package.json ./apps/web/
#45 CACHED

#46 [web deps  9/10] COPY apps/bot/package.json ./apps/bot/
#46 CACHED

#47 [web deps  5/10] COPY apps/web/prisma ./apps/web/prisma
#47 CACHED

#48 [web builder  4/11] COPY apps/web ./apps/web
#48 CACHED

#49 [web deps  7/10] COPY apps/admin-api/vendor ./apps/admin-api/vendor
#49 CACHED

#50 [web builder  5/11] COPY packages ./packages
#50 CACHED

#51 [web builder  3/11] COPY --from=deps /app/node_modules ./node_modules
#51 CACHED

#52 [web deps  8/10] COPY apps/admin-ui/package.json ./apps/admin-ui/
#52 CACHED

#53 [web builder  6/11] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#53 CACHED

#38 [admin-ui base 2/3] RUN apt-get update -y && apt-get install -y openssl
#38 CACHED

#40 [admin-ui base 3/3] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#40 CACHED

#37 [admin-ui deps 1/9] WORKDIR /app
#37 CACHED

#39 [admin-ui deps 2/9] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#39 CACHED

#41 [admin-ui deps 3/9] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#41 CACHED

#54 [web builder  7/11] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#54 ...

#55 [admin-ui deps 4/9] COPY apps/admin-ui/package.json ./apps/admin-ui/
#55 DONE 0.6s

#56 [admin-ui deps 5/9] COPY apps/admin-api/package.json ./apps/admin-api/
#56 DONE 0.1s

#57 [admin-ui deps 6/9] COPY apps/admin-api/vendor ./apps/admin-api/vendor
#57 DONE 0.1s

#54 [web builder  7/11] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#54 ...

#58 [admin-ui deps 7/9] COPY apps/web/package.json ./apps/web/
#58 DONE 0.1s

#59 [admin-ui deps 8/9] COPY apps/bot/package.json ./apps/bot/
#59 DONE 0.1s

#60 [admin-ui deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#60 1.048 Scope: all 5 workspace projects
#60 1.227 Lockfile is up to date, resolution step is skipped
#60 1.378 Progress: resolved 1, reused 0, downloaded 0, added 0
#60 1.596 Packages: +1471
#60 1.596 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
#60 2.381 Progress: resolved 1471, reused 0, downloaded 0, added 0
#60 2.824 
#60 2.824    ╭───────────────────────────────────────────────╮
#60 2.824    │                                               │
#60 2.824    │     Update available! 10.22.0 → 10.26.0.      │
#60 2.824    │     Changelog: https://pnpm.io/v/10.26.0      │
#60 2.824    │   To update, run: corepack use pnpm@10.26.0   │
#60 2.824    │                                               │
#60 2.824    ╰───────────────────────────────────────────────╯
#60 2.824 
#60 3.382 Progress: resolved 1471, reused 1, downloaded 14, added 14
#60 4.384 Progress: resolved 1471, reused 1, downloaded 136, added 132
#60 5.384 Progress: resolved 1471, reused 1, downloaded 200, added 189
#60 6.388 Progress: resolved 1471, reused 1, downloaded 257, added 238
#60 7.388 Progress: resolved 1471, reused 1, downloaded 294, added 289
#60 ...

#54 [web builder  7/11] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#54 8.717 Scope: all 7 workspace projects
#54 8.717 Lockfile is up to date, resolution step is skipped
#54 8.717 Already up to date
#54 8.717 
#54 8.717 ╭ Warning ─────────────────────────────────────────────────────────────────────╮
#54 8.717 │                                                                              │
#54 8.717 │   Ignored build scripts: msgpackr-extract.                                   │
#54 8.717 │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
#54 8.717 │   to run scripts.                                                            │
#54 8.717 │                                                                              │
#54 8.717 ╰──────────────────────────────────────────────────────────────────────────────╯
#54 8.717 
#54 8.717 . prepare$ husky
#54 8.717 . prepare: .git can't be found
#54 8.717 . prepare: Done
#54 8.717 Done in 8.3s using pnpm v10.22.0
#54 ...

#60 [admin-ui deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#60 8.388 Progress: resolved 1471, reused 1, downloaded 341, added 317
#60 9.389 Progress: resolved 1471, reused 1, downloaded 406, added 346
#60 10.39 Progress: resolved 1471, reused 1, downloaded 471, added 380
#60 11.39 Progress: resolved 1471, reused 1, downloaded 513, added 452
#60 12.39 Progress: resolved 1471, reused 1, downloaded 540, added 458
#60 13.39 Progress: resolved 1471, reused 1, downloaded 594, added 521
#60 14.39 Progress: resolved 1471, reused 1, downloaded 640, added 587
#60 15.39 Progress: resolved 1471, reused 1, downloaded 716, added 722
#60 16.39 Progress: resolved 1471, reused 1, downloaded 784, added 779
#60 17.39 Progress: resolved 1471, reused 1, downloaded 799, added 787
#60 18.39 Progress: resolved 1471, reused 1, downloaded 848, added 854
#60 19.39 Progress: resolved 1471, reused 1, downloaded 873, added 862
#60 20.48 Progress: resolved 1471, reused 1, downloaded 874, added 862
#60 ...

#54 [web builder  7/11] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#54 DONE 21.4s

#61 [web builder  8/11] RUN pnpm --filter @slimy/web run db:generate
#61 1.467 
#61 1.467 > @slimy/web@0.1.0 db:generate /app/apps/web
#61 1.467 > prisma generate
#61 1.467 
#61 3.745 Environment variables loaded from .env
#61 3.748 Prisma schema loaded from prisma/schema.prisma
#61 ...

#60 [admin-ui deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#60 21.49 Progress: resolved 1471, reused 1, downloaded 903, added 896
#60 22.49 Progress: resolved 1471, reused 1, downloaded 965, added 970
#60 23.49 Progress: resolved 1471, reused 1, downloaded 989, added 996
#60 24.50 Progress: resolved 1471, reused 1, downloaded 1002, added 997
#60 25.50 Progress: resolved 1471, reused 1, downloaded 1027, added 1030
#60 26.50 Progress: resolved 1471, reused 1, downloaded 1038, added 1033
#60 27.50 Progress: resolved 1471, reused 1, downloaded 1043, added 1037
#60 28.50 Progress: resolved 1471, reused 1, downloaded 1053, added 1038
#60 29.50 Progress: resolved 1471, reused 1, downloaded 1060, added 1041
#60 30.50 Progress: resolved 1471, reused 1, downloaded 1132, added 1091
#60 31.50 Progress: resolved 1471, reused 1, downloaded 1177, added 1169
#60 32.50 Progress: resolved 1471, reused 1, downloaded 1209, added 1185
#60 ...

#61 [web builder  8/11] RUN pnpm --filter @slimy/web run db:generate
#61 12.85 
#61 12.85 ✔ Generated Prisma Client (v6.19.0) to ./../../node_modules/.pnpm/@prisma+client@6.19.0_prisma@6.19.0_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client in 2.99s
#61 12.85 
#61 12.85 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
#61 12.85 
#61 12.85 Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate
#61 12.85 
#61 ...

#60 [admin-ui deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#60 33.50 Progress: resolved 1471, reused 1, downloaded 1281, added 1237
#60 34.50 Progress: resolved 1471, reused 1, downloaded 1345, added 1308
#60 35.51 Progress: resolved 1471, reused 1, downloaded 1401, added 1360
#60 36.52 Progress: resolved 1471, reused 1, downloaded 1462, added 1447
#60 36.67 Progress: resolved 1471, reused 1, downloaded 1462, added 1471, done
#60 38.93 .../node_modules/@prisma/engines postinstall$ node scripts/postinstall.js
#60 38.98 .../sharp@0.33.5/node_modules/sharp install$ node install/check
#60 38.98 .../esbuild@0.25.12/node_modules/esbuild postinstall$ node install.js
#60 39.01 .../esbuild@0.27.1/node_modules/esbuild postinstall$ node install.js
#60 39.08 .../esbuild@0.21.5/node_modules/esbuild postinstall$ node install.js
#60 40.49 .../esbuild@0.21.5/node_modules/esbuild postinstall: Done
#60 40.67 .../node_modules/unrs-resolver postinstall$ napi-postinstall unrs-resolver 1.11.1 check
#60 40.76 .../node_modules/unrs-resolver postinstall: Done
#60 40.78 .../sharp@0.34.5/node_modules/sharp install$ node install/check.js || npm run build
#60 40.83 .../esbuild@0.25.12/node_modules/esbuild postinstall: Done
#60 40.89 .../sharp@0.33.5/node_modules/sharp install: Done
#60 40.90 .../sharp@0.34.5/node_modules/sharp install: Done
#60 41.15 .../esbuild@0.27.1/node_modules/esbuild postinstall: Done
#60 44.90 .../node_modules/@prisma/engines postinstall: Done
#60 45.28 .../node_modules/prisma preinstall$ node scripts/preinstall-entry.js
#60 45.36 .../node_modules/prisma preinstall: Done
#60 46.31 .../node_modules/@prisma/client postinstall$ node scripts/postinstall.js
#60 70.98 .../node_modules/@prisma/client postinstall: prisma:warn We could not find your Prisma schema in the default locations (see: https://pris.ly/d/prisma-schema-location).
#60 70.98 .../node_modules/@prisma/client postinstall: If you have a Prisma schema file in a custom path, you will need to run
#60 70.98 .../node_modules/@prisma/client postinstall: `prisma generate --schema=./path/to/your/schema.prisma` to generate Prisma Client.
#60 70.98 .../node_modules/@prisma/client postinstall: If you do not have a Prisma schema file yet, you can ignore this message.
#60 71.00 .../node_modules/@prisma/client postinstall: Done
#60 72.45 
#60 72.45 devDependencies:
#60 72.45 + @eslint/js 9.39.1
#60 72.45 + eslint 9.39.1
#60 72.45 + eslint-plugin-deprecation 3.0.0
#60 72.45 + glob 13.0.0
#60 72.45 + husky 9.1.7
#60 72.45 + lint-staged 16.2.7
#60 72.45 + tsx 4.21.0
#60 72.45 + typescript 5.9.3
#60 72.45 + typescript-eslint 8.48.1
#60 72.45 + vitest 4.0.15
#60 72.45 
#60 72.45 ╭ Warning ─────────────────────────────────────────────────────────────────────╮
#60 72.45 │                                                                              │
#60 72.45 │   Ignored build scripts: msgpackr-extract.                                   │
#60 72.45 │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
#60 72.45 │   to run scripts.                                                            │
#60 72.45 │                                                                              │
#60 72.45 ╰──────────────────────────────────────────────────────────────────────────────╯
#60 72.45 
#60 72.58 . prepare$ husky
#60 72.73 . prepare: .git can't be found
#60 72.73 . prepare: Done
#60 72.77 Done in 1m 12.4s using pnpm v10.22.0
#60 ...

#61 [web builder  8/11] RUN pnpm --filter @slimy/web run db:generate
#61 DONE 58.4s

#60 [admin-ui deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#60 DONE 79.0s

#62 [web builder  9/11] COPY apps/web/tailwind.config.ts ./apps/web/
#62 DONE 0.2s

#63 [web builder 10/11] COPY apps/web/postcss.config.mjs ./apps/web/
#63 DONE 0.1s

#64 [web builder 11/11] RUN pnpm --filter @slimy/web build
#64 0.795 
#64 0.795 > @slimy/web@0.1.0 build /app/apps/web
#64 0.795 > next build
#64 0.795 
#64 1.118 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#64 1.643  ⚠ `eslint` configuration in next.config.js is no longer supported. See more info here: https://nextjs.org/docs/app/api-reference/cli/next#next-lint-options
#64 1.653  ⚠ Invalid next.config.js options detected: 
#64 1.653  ⚠     Unrecognized key(s) in object: 'eslint'
#64 1.653  ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
#64 3.343 Attention: Next.js now collects completely anonymous telemetry regarding usage.
#64 3.343 This information is used to shape Next.js' roadmap and prioritize features.
#64 3.343 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
#64 3.343 https://nextjs.org/telemetry
#64 3.344 
#64 3.356    ▲ Next.js 16.0.1 (Turbopack)
#64 3.356    - Environments: .env.local, .env
#64 3.356 
#64 3.401  ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
#64 3.460    Creating an optimized production build ...
#64 3.666 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#64 22.66 Turbopack build encountered 1 warnings:
#64 22.66 [externals]/@prisma/client
#64 22.66 unexpected export *
#64 22.66 export * used with module [externals]/@prisma/client [external] (@prisma/client, cjs) which is a CommonJS module with exports only available at runtime
#64 22.66 List all export names manually (`export { a, b, c } from "...") or rewrite the module to ESM, to avoid the additional runtime code.`
#64 22.66 
#64 22.66 Import trace:
#64 22.66   external:
#64 22.66     [externals]/@prisma/client [external]
#64 22.66     ./apps/web/lib/repositories/club-analytics.repository.ts [App Route]
#64 22.66     ./apps/web/app/api/club/analyze/route.ts [App Route]
#64 22.66 
#64 22.66 
#64 22.79  ✓ Compiled successfully in 18.9s
#64 ...

#39 [web deps 2/9] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#39 CACHED

#64 [web builder 11/11] RUN pnpm --filter @slimy/web build
#64 22.83    Skipping validation of types
#64 ...

#65 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#65 ...

#64 [web builder 11/11] RUN pnpm --filter @slimy/web build
#64 23.25    Collecting page data ...
#64 23.82 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#64 23.82 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#64 23.85 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#64 24.48  ⚠ Using edge runtime on a page currently disables static generation for that page
#64 25.06    Generating static pages (0/45) ...
#64 25.29 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#64 25.30 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#64 26.08    Generating static pages (11/45) 
#64 26.23    Generating static pages (22/45) 
#64 26.51 [AdminApiClient] admin-api unavailable (ECONNREFUSED 127.0.0.1:3080)
#64 26.57 Failed to load doc: undefined Error: ENOENT: no such file or directory, open '/app/apps/web/content/docs/undefined.mdx'
#64 26.57     at p (.next/server/chunks/ssr/[root-of-the-server]__da54a6b7._.js:1:53953)
#64 26.57     at stringify (<anonymous>) {
#64 26.57   errno: -2,
#64 26.57   code: 'ENOENT',
#64 26.57   syscall: 'open',
#64 26.57   path: '/app/apps/web/content/docs/undefined.mdx'
#64 26.57 }
#64 26.60 Failed to load doc: undefined Error: ENOENT: no such file or directory, open '/app/apps/web/content/docs/undefined.mdx'
#64 26.60     at p (.next/server/chunks/ssr/[root-of-the-server]__da54a6b7._.js:1:53953)
#64 26.60     at stringify (<anonymous>) {
#64 26.60   errno: -2,
#64 26.60   code: 'ENOENT',
#64 26.60   syscall: 'open',
#64 26.60   path: '/app/apps/web/content/docs/undefined.mdx'
#64 26.60 }
#64 26.61 Failed to load doc: undefined Error: ENOENT: no such file or directory, open '/app/apps/web/content/docs/undefined.mdx'
#64 26.61     at p (.next/server/chunks/ssr/[root-of-the-server]__da54a6b7._.js:1:53953)
#64 26.61     at stringify (<anonymous>) {
#64 26.61   errno: -2,
#64 26.61   code: 'ENOENT',
#64 26.61   syscall: 'open',
#64 26.61   path: '/app/apps/web/content/docs/undefined.mdx'
#64 26.61 }
#64 26.74    Generating static pages (33/45) 
#64 33.53  ✓ Generating static pages (45/45) in 8.5s
#64 33.93    Finalizing page optimization ...
#64 58.99 
#64 58.99 Route (app)                            Revalidate  Expire
#64 58.99 ┌ ○ /
#64 58.99 ├ ○ /_not-found
#64 58.99 ├ ○ /admin/flags
#64 58.99 ├ ○ /analytics
#64 58.99 ├ ƒ /api/admin-api/diag
#64 58.99 ├ ƒ /api/admin-api/health
#64 58.99 ├ ƒ /api/auth/discord.bak/callback
#64 58.99 ├ ƒ /api/auth/discord.bak/login
#64 58.99 ├ ƒ /api/auth/logout
#64 58.99 ├ ƒ /api/auth/me
#64 58.99 ├ ƒ /api/chat/bot
#64 58.99 ├ ƒ /api/chat/conversations
#64 58.99 ├ ƒ /api/chat/message
#64 58.99 ├ ƒ /api/chat/messages
#64 58.99 ├ ƒ /api/chat/users
#64 58.99 ├ ƒ /api/club/analyze
#64 58.99 ├ ƒ /api/club/export
#64 58.99 ├ ƒ /api/club/latest
#64 58.99 ├ ƒ /api/club/rescan
#64 58.99 ├ ƒ /api/club/sheet
#64 58.99 ├ ƒ /api/club/upload
#64 58.99 ├ ƒ /api/codes
#64 58.99 ├ ƒ /api/codes/health
#64 58.99 ├ ƒ /api/codes/report
#64 58.99 ├ ƒ /api/diag
#64 58.99 ├ ƒ /api/discord/guilds
#64 58.99 ├ ƒ /api/guilds/[id]
#64 58.99 ├ ƒ /api/guilds/[id]/flags
#64 58.99 ├ ƒ /api/guilds/[id]/members
#64 58.99 ├ ƒ /api/guilds/[id]/members/[userId]
#64 58.99 ├ ƒ /api/guilds/[id]/members/bulk
#64 58.99 ├ ƒ /api/guilds/[id]/settings
#64 58.99 ├ ○ /api/health                                1m      1y
#64 58.99 ├ ƒ /api/local-codes
#64 58.99 ├ ƒ /api/og/stats
#64 58.99 ├ ƒ /api/screenshot
#64 58.99 ├ ○ /api/snail/history                         1m      1y
#64 58.99 ├ ƒ /api/stats
#64 58.99 ├ ƒ /api/stats/events/stream
#64 58.99 ├ ○ /api/usage                                30s      1y
#64 58.99 ├ ƒ /api/user/preferences
#64 58.99 ├ ƒ /api/web-vitals
#64 58.99 ├ ƒ /auth/discord/callback
#64 58.99 ├ ○ /chat
#64 58.99 ├ ○ /club
#64 58.99 ├ ○ /dashboard
#64 58.99 ├ ○ /docs
#64 58.99 ├ ● /docs/[slug]
#64 58.99 │ ├ /docs/getting-started
#64 58.99 │ ├ /docs/snail-tools
#64 58.99 │ └ /docs/club-analytics
#64 58.99 ├ ○ /features
#64 58.99 ├ ○ /guilds
#64 58.99 ├ ƒ /public-stats/[guildId]
#64 58.99 ├ ○ /settings
#64 58.99 ├ ○ /snail
#64 58.99 ├ ○ /snail/codes
#64 58.99 ├ ○ /status
#64 58.99 └ ○ /usage
#64 58.99 
#64 58.99 
#64 58.99 ƒ Proxy (Middleware)
#64 58.99 
#64 58.99 ○  (Static)   prerendered as static content
#64 58.99 ●  (SSG)      prerendered as static HTML (uses generateStaticParams)
#64 58.99 ƒ  (Dynamic)  server-rendered on demand
#64 58.99 
#64 59.06 
#64 59.06 > @slimy/web@0.1.0 postbuild /app/apps/web
#64 59.06 > tsx scripts/postbuild-validate.ts && tsx scripts/check-bundle-size.ts
#64 59.06 
#64 60.45 
#64 60.45 📋 Post-build validation:
#64 60.45 ✅ All checks passed
#64 61.41 📦 Analyzing bundle sizes...
#64 61.41 
#64 61.41 Configuration:
#64 61.41   Max initial bundle: 1000KB
#64 61.41   Max route chunk: 500KB
#64 61.41   Max total bundle: 3000KB
#64 61.41   Warn threshold: 80%
#64 61.41 
#64 61.42 📊 Bundle Size Summary:
#64 61.42   Initial bundle: 0KB
#64 61.42   Total bundles: 0
#64 61.42   Largest chunk: 0KB
#64 61.42 
#64 61.42 ✅ Bundle size checks passed!
#64 61.42 
#64 DONE 68.7s

#65 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#65 ...

#66 [web runner  4/11] RUN addgroup --system --gid 1001 nodejs
#66 CACHED

#67 [web runner  2/10] WORKDIR /app
#67 CACHED

#68 [web runner  3/11] RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
#68 CACHED

#69 [web runner  5/11] RUN adduser --system --uid 1001 nextjs
#69 CACHED

#70 [web runner  6/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
#70 CACHED

#71 [web runner  7/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone/apps/web ./apps/web/
#71 DONE 1.1s

#65 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#65 ...

#72 [web runner  8/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone/node_modules ./node_modules
#72 DONE 8.1s

#65 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#65 ...

#73 [web runner  9/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
#73 DONE 0.3s

#65 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#65 ...

#74 [web runner 10/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
#74 DONE 0.2s

#65 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#65 ...

#75 [web runner 11/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
#75 DONE 0.4s

#65 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#65 ...

#76 [web] exporting to image
#76 exporting layers
#76 exporting layers 2.5s done
#76 writing image sha256:41da46add9f83ff1b79a781fff52bdad3fa8de124c4ba8bf97f5157318466f64 done
#76 naming to docker.io/library/slimy-monorepo-web 0.0s done
#76 DONE 2.6s

#65 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#65 DONE 122.6s

#77 [admin-ui builder 4/8] COPY apps/admin-ui ./apps/admin-ui
#77 DONE 1.7s

#78 [admin-ui builder 5/8] COPY packages ./packages
#78 DONE 1.9s

#79 [admin-ui builder 6/8] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#79 DONE 1.2s

#80 [admin-ui builder 7/8] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#80 5.675 Scope: all 7 workspace projects
#80 5.675 Lockfile is up to date, resolution step is skipped
#80 5.675 Already up to date
#80 5.675 
#80 5.675 ╭ Warning ─────────────────────────────────────────────────────────────────────╮
#80 5.675 │                                                                              │
#80 5.675 │   Ignored build scripts: msgpackr-extract.                                   │
#80 5.675 │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
#80 5.675 │   to run scripts.                                                            │
#80 5.675 │                                                                              │
#80 5.675 ╰──────────────────────────────────────────────────────────────────────────────╯
#80 5.675 
#80 5.675 . prepare$ husky
#80 5.675 . prepare: .git can't be found
#80 5.675 . prepare: Done
#80 5.675 Done in 4.6s using pnpm v10.22.0
#80 DONE 6.0s

#81 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#81 1.125 
#81 1.125 > @slimy/admin-ui@ build /app/apps/admin-ui
#81 1.125 > next build
#81 1.125 
#81 1.998 Attention: Next.js now collects completely anonymous telemetry regarding usage.
#81 1.998 This information is used to shape Next.js' roadmap and prioritize features.
#81 1.998 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
#81 1.998 https://nextjs.org/telemetry
#81 1.998 
#81 2.144   ▲ Next.js 14.2.5
#81 2.144   - Environments: .env.local
#81 2.144 
#81 2.144    Linting and checking validity of types ...
#81 7.765    Creating an optimized production build ...
#81 31.37  ✓ Compiled successfully
#81 31.37    Collecting page data ...
#81 32.64    Generating static pages (0/20) ...
#81 32.94    Generating static pages (5/20) 
#81 33.12    Generating static pages (10/20) 
#81 33.21    Generating static pages (15/20) 
#81 33.25  ✓ Generating static pages (20/20)
#81 35.17    Finalizing page optimization ...
#81 35.17    Collecting build traces ...
#81 59.77 
#81 59.80 Route (pages)                             Size     First Load JS
#81 59.80 ┌ ○ /                                     5.09 kB         117 kB
#81 59.80 ├   /_app                                 0 B            86.2 kB
#81 59.80 ├ ○ /404                                  181 B          86.4 kB
#81 59.80 ├ ○ /admin-api-usage                      874 B           113 kB
#81 59.80 ├ ƒ /api/admin-api/[...path]              0 B            86.2 kB
#81 59.80 ├ ƒ /api/admin-api/api/auth/login         0 B            86.2 kB
#81 59.80 ├ ƒ /api/admin-api/diag                   0 B            86.2 kB
#81 59.80 ├ ƒ /api/admin-api/health                 0 B            86.2 kB
#81 59.80 ├ ƒ /api/auth/discord/authorize-url       0 B            86.2 kB
#81 59.80 ├ ƒ /api/auth/discord/callback            0 B            86.2 kB
#81 59.80 ├ ƒ /api/diagnostics                      0 B            86.2 kB
#81 59.80 ├ ○ /auth-me                              1.08 kB         113 kB
#81 59.80 ├ ○ /chat                                 2.78 kB         115 kB
#81 59.80 ├ ○ /club                                 1.92 kB         114 kB
#81 59.80 ├ ƒ /dashboard                            1.65 kB         113 kB
#81 59.80 ├ ○ /email-login                          557 B           112 kB
#81 59.80 ├ ○ /guilds                               1.91 kB         114 kB
#81 59.80 ├ ○ /guilds/[guildId]                     5.88 kB         118 kB
#81 59.80 ├ ○ /guilds/[guildId]/channels            1.71 kB         113 kB
#81 59.80 ├ ○ /guilds/[guildId]/corrections         1.74 kB         113 kB
#81 59.80 ├ ○ /guilds/[guildId]/personality         888 B           113 kB
#81 59.80 ├ ○ /guilds/[guildId]/rescan              1.23 kB         113 kB
#81 59.80 ├ ○ /guilds/[guildId]/settings            1.26 kB         113 kB
#81 59.80 ├ ○ /guilds/[guildId]/usage               67.5 kB         179 kB
#81 59.80 ├ ○ /login                                479 B          86.7 kB
#81 59.80 ├ ○ /snail                                664 B           112 kB
#81 59.80 ├ ○ /snail/[guildId]                      4.45 kB         116 kB
#81 59.80 └ ○ /status                               1.26 kB         113 kB
#81 59.80 + First Load JS shared by all             89.4 kB
#81 59.80   ├ chunks/framework-8051a8b17472378c.js  45.2 kB
#81 59.80   ├ chunks/main-386d6319e61b79bf.js       36.6 kB
#81 59.80   └ other shared chunks (total)           7.55 kB
#81 59.80 
#81 59.80 ○  (Static)   prerendered as static content
#81 59.80 ƒ  (Dynamic)  server-rendered on demand
#81 59.80 
#81 DONE 60.2s

#67 [admin-ui runner  2/10] WORKDIR /app
#67 CACHED

#82 [admin-ui runner  3/10] RUN addgroup --system --gid 1001 nodejs
#82 CACHED

#83 [admin-ui runner  4/10] RUN adduser --system --uid 1001 nextjs
#83 CACHED

#84 [admin-ui runner  5/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public
#84 CACHED

#85 [admin-ui runner  6/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
#85 DONE 0.4s

#86 [admin-ui runner  7/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
#86 DONE 3.5s

#87 [admin-ui runner  8/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
#87 DONE 0.1s

#88 [admin-ui runner  9/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./.next/static
#88 DONE 0.1s

#89 [admin-ui runner 10/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./public
#89 DONE 0.1s

#90 [admin-ui] exporting to image
#90 exporting layers
#90 exporting layers 0.8s done
#90 writing image sha256:fe43bd9b05ed31b5db8a138b4d5b55f5f753fa7065faa4455d8635dbb745812d 0.0s done
#90 naming to docker.io/library/slimy-monorepo-admin-ui 0.0s done
#90 DONE 0.9s
 Network slimy-monorepo_slimy-network  Creating
 Network slimy-monorepo_slimy-network  Created
 Container slimy-monorepo-db-1  Creating
 Container slimy-monorepo-db-1  Created
 Container slimy-monorepo-admin-api-1  Creating
 Container slimy-monorepo-admin-api-1  Created
 Container slimy-monorepo-web-1  Creating
 Container slimy-monorepo-admin-ui-1  Creating
 Container slimy-monorepo-web-1  Created
 Container slimy-monorepo-admin-ui-1  Created
 Container slimy-monorepo-db-1  Starting
 Container slimy-monorepo-db-1  Started
 Container slimy-monorepo-db-1  Waiting
 Container slimy-monorepo-db-1  Healthy
 Container slimy-monorepo-admin-api-1  Starting
Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint slimy-monorepo-admin-api-1 (a8c0c9542c97f0d021fe0edd6c52e03b1d505741cbad9db0f55cb5d459543b0e): Bind for 0.0.0.0:3080 failed: port is already allocated
 ELIFECYCLE  Command failed with exit code 1.
