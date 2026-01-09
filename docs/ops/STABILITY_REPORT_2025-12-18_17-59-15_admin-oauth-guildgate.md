# Stability Report: admin oauth + guild gate
- Timestamp: 2025-12-18T17:59:15+00:00
- Repo: /opt/slimy/slimy-monorepo


## git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M scripts/smoke/stability-gate.sh
?? docs/buglog/BUG_2025-12-18_stability-gate-report-hygiene.md
?? scripts/smoke/stability-gate.sh.backup
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
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    2 hours ago    Up 2 hours              0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          24 hours ago   Up 24 hours (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         24 hours ago   Up 24 hours             0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```


## curl -fsS -D- -o /dev/null http://localhost:3001/ | sed -n '1,15p'
```
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "rzt4am97uz2tj"
Content-Type: text/html; charset=utf-8
Content-Length: 3679
Vary: Accept-Encoding
Date: Thu, 18 Dec 2025 17:59:16 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```


## curl -fsS -D- -o /dev/null http://localhost:3080/api/health | sed -n '1,20p'
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
X-Request-ID: b1f49109-9d61-463a-ae76-57d77a286975
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 87
```


## curl -fsS -D- -o /dev/null 'http://localhost:3001/api/auth/discord/authorize-url' | grep -i '^Location:' | grep 'redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback'
```
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=3e3f0c100efc45447a37f46c1926eb74&prompt=consent
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
    ✓ should include lastActiveGuild from DB (86 ms)
    ✓ should handle DB errors gracefully (34 ms)

PASS tests/guilds-connect.test.js
  POST /api/guilds/connect
    ✓ should return 200 when connecting with valid frontend payload (74 ms)
    ✓ should return 200 if guild is ALREADY connected (45 ms)
    ✓ should return 400 if guild ID is missing (6 ms)
  guildService.connectGuild
    ✓ upserts owner by discord id and links guild to the owner (3 ms)

PASS tests/central-settings.test.js
  central settings endpoints
    ✓ GET /api/me/settings auto-creates defaults (47 ms)
    ✓ PATCH /api/me/settings merges updates (25 ms)
    ✓ GET /api/guilds/:guildId/settings requires admin/manager (8 ms)
    ✓ PUT /api/guilds/:guildId/settings allows admin and persists (9 ms)

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

PASS tests/guilds-read.test.js
  GET /api/guilds/:guildId
    ✓ should return guild details for authenticated user (29 ms)
    ✓ should return 404 for non-existent guild (20 ms)

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

PASS tests/guild-connect.test.js
  POST /guilds/connect
    ✓ should fail if SLIMYAI_BOT_TOKEN is missing (221 ms)
    ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (8 ms)
    ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (8 ms)
    ✓ should succeed if guild is shared (6 ms)

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

PASS tests/auth/auth-middleware.test.js
  Auth Middleware
    resolveUser
      ✓ should return null when no token in cookies (107 ms)
      ✓ should return null when token is invalid (9 ms)
      ✓ should return hydrated user when session exists (13 ms)
      ✓ should return fallback user when no session exists (6 ms)
      ✓ should cache user resolution (6 ms)
    requireAuth
      ✓ should call next when user is authenticated (6 ms)
      ✓ should return 401 when user is not authenticated (4 ms)
    requireRole
      ✓ should call next when user has required role (member) (6 ms)
      ✓ should call next when user has higher role than required (22 ms)
      ✓ should return 403 when user has insufficient role (9 ms)
      ✓ should return 401 when user is not authenticated (10 ms)
    requireGuildMember
      ✓ should call next for admin user regardless of guild membership (12 ms)
      ✓ should call next when user is member of the guild (5 ms)
      ✓ should return 403 when user is not member of the guild (9 ms)
      ✓ should return 400 when guildId parameter is missing (5 ms)
      ✓ should return 401 when user is not authenticated (5 ms)
      ✓ should use custom parameter name (5 ms)

PASS tests/routes/usage.test.js
  GET /api/usage
    ✓ should return 200 and correct usage data structure (15 ms)

PASS tests/discord-guilds.test.js
  GET /discord/guilds
    ✓ should return shared guilds with role labels (36 ms)

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

PASS tests/routes/stats.test.js
  Stats Routes
    ✓ GET /api/stats should return system metrics by default (63 ms)
    ✓ GET /api/stats?action=system-metrics should return metrics (36 ms)
    ✓ GET /api/stats/events/stream should set SSE headers (9 ms)

  console.log
    [requireGuildAccess] Checking access for user discord-user-id to guild guild-123

      at log (src/middleware/rbac.js:33:13)

PASS tests/middleware/rbac.test.js
  requireGuildAccess Middleware
    ✓ should return 400 if guildId is missing (2 ms)
    ✓ should return 401 if user is not authenticated (1 ms)
    ✓ should return 403 if user not found in DB (18 ms)
    ✓ should return 403 if user is not a member of the guild (12 ms)
    ✓ should call next() and attach guild info if user has access (8 ms)

PASS tests/numparse.test.js
  numparse shim
    ✓ returns numeric values for plain numbers (1 ms)
    ✓ returns null for non-numeric values or suffixed strings (1 ms)

PASS tests/club-store.test.js
  club-store shim
    ✓ canonicalize lowercases input (1 ms)
    ✓ canonicalize handles nullish values (1 ms)

PASS src/lib/auth/post-login-redirect.test.js
  resolvePostLoginRedirectUrl
    ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to (2 ms)
    ✓ falls back to x-forwarded origin when cookie missing (1 ms)
    ✓ falls back to CLIENT_URL when cookie and forwarded origin missing (1 ms)

PASS tests/diag.test.js
  diagnostics placeholder
    ✓ skipped in test mode (1 ms)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 12 skipped, 14 passed, 14 of 26 total
Tests:       12 skipped, 51 passed, 63 total
Snapshots:   0 total
Time:        3.564 s
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


## git diff --name-only
```
scripts/smoke/stability-gate.sh
```


## git diff --cached --name-only || true
```
```

