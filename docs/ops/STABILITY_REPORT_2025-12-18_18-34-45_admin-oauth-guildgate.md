# Stability Report: admin oauth + guild gate
- Timestamp: 2025-12-18T18:34:45+00:00
- Repo: /opt/slimy/slimy-monorepo


## git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M scripts/smoke/docker-smoke.sh
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
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED          STATUS                    PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   37 seconds ago   Up 25 seconds (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    37 seconds ago   Up 19 seconds             0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          38 seconds ago   Up 36 seconds (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         37 seconds ago   Up 19 seconds             0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```


## admin-ui: http://localhost:3001/
```
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "17u5x25vyqj2tj"
Content-Type: text/html; charset=utf-8
Content-Length: 3679
Vary: Accept-Encoding
Date: Thu, 18 Dec 2025 18:34:46 GMT
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
X-Request-ID: 81f81f61-4722-40a2-bde2-2fcffabedd2e
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 84
Date: Thu, 18 Dec 2025 18:34:46 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```


## curl -fsS -D- -o /dev/null 'http://localhost:3001/api/auth/discord/authorize-url' | grep -i '^Location:' | grep 'redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback'
```
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=ab4d7e500e23b20f48c2f48e8683661b&prompt=consent
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

PASS tests/central-settings.test.js
  central settings endpoints
    ✓ GET /api/me/settings auto-creates defaults (41 ms)
    ✓ PATCH /api/me/settings merges updates (21 ms)
    ✓ GET /api/guilds/:guildId/settings requires admin/manager (8 ms)
    ✓ PUT /api/guilds/:guildId/settings allows admin and persists (8 ms)

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
    ✓ should include lastActiveGuild from DB (78 ms)
    ✓ should handle DB errors gracefully (26 ms)

PASS tests/guilds-connect.test.js
  POST /api/guilds/connect
    ✓ should return 200 when connecting with valid frontend payload (66 ms)
    ✓ should return 200 if guild is ALREADY connected (56 ms)
    ✓ should return 400 if guild ID is missing (8 ms)
  guildService.connectGuild
    ✓ upserts owner by discord id and links guild to the owner (4 ms)

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
      ✓ should return null when no token in cookies (17 ms)
      ✓ should return null when token is invalid (6 ms)
      ✓ should return hydrated user when session exists (6 ms)
      ✓ should return fallback user when no session exists (4 ms)
      ✓ should cache user resolution (4 ms)
    requireAuth
      ✓ should call next when user is authenticated (5 ms)
      ✓ should return 401 when user is not authenticated (4 ms)
    requireRole
      ✓ should call next when user has required role (member) (6 ms)
      ✓ should call next when user has higher role than required (5 ms)
      ✓ should return 403 when user has insufficient role (7 ms)
      ✓ should return 401 when user is not authenticated (9 ms)
    requireGuildMember
      ✓ should call next for admin user regardless of guild membership (6 ms)
      ✓ should call next when user is member of the guild (5 ms)
      ✓ should return 403 when user is not member of the guild (24 ms)
      ✓ should return 400 when guildId parameter is missing (14 ms)
      ✓ should return 401 when user is not authenticated (3 ms)
      ✓ should use custom parameter name (5 ms)

PASS tests/guilds-read.test.js
  GET /api/guilds/:guildId
    ✓ should return guild details for authenticated user (23 ms)
    ✓ should return 404 for non-existent guild (11 ms)

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

PASS tests/guild-connect.test.js
  POST /guilds/connect
    ✓ should fail if SLIMYAI_BOT_TOKEN is missing (206 ms)
    ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (7 ms)
    ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (6 ms)
    ✓ should succeed if guild is shared (6 ms)

PASS tests/discord-guilds.test.js
  GET /discord/guilds
    ✓ should return shared guilds with role labels (64 ms)

PASS tests/routes/stats.test.js
  Stats Routes
    ✓ GET /api/stats should return system metrics by default (9 ms)
    ✓ GET /api/stats?action=system-metrics should return metrics (7 ms)
    ✓ GET /api/stats/events/stream should set SSE headers (2 ms)

PASS tests/routes/usage.test.js
  GET /api/usage
    ✓ should return 200 and correct usage data structure (7 ms)

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
    ✓ should return 400 if guildId is missing (2 ms)
    ✓ should return 401 if user is not authenticated (1 ms)
    ✓ should return 403 if user not found in DB (15 ms)
    ✓ should return 403 if user is not a member of the guild (4 ms)
    ✓ should call next() and attach guild info if user has access (3 ms)

PASS tests/numparse.test.js
  numparse shim
    ✓ returns numeric values for plain numbers (1 ms)
    ✓ returns null for non-numeric values or suffixed strings (5 ms)

PASS tests/club-store.test.js
  club-store shim
    ✓ canonicalize lowercases input (1 ms)
    ✓ canonicalize handles nullish values (1 ms)

PASS src/lib/auth/post-login-redirect.test.js
  resolvePostLoginRedirectUrl
    ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to (1 ms)
    ✓ falls back to x-forwarded origin when cookie missing
    ✓ falls back to CLIENT_URL when cookie and forwarded origin missing

PASS tests/diag.test.js
  diagnostics placeholder
    ✓ skipped in test mode (5 ms)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 12 skipped, 14 passed, 14 of 26 total
Tests:       12 skipped, 51 passed, 63 total
Snapshots:   0 total
Time:        3.065 s
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

 Container slimy-monorepo-web-1  Stopping
 Container slimy-monorepo-admin-ui-1  Stopping
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
#2 DONE 0.4s

#3 [admin-api internal] load .dockerignore
#3 transferring context: 2.44kB done
#3 DONE 0.0s

#4 [admin-api internal] load build context
#4 DONE 0.0s

#5 [admin-api base 1/3] FROM docker.io/library/node:20-alpine@sha256:658d0f63e501824d6c23e06d4bb95c71e7d704537c9d9272f488ac03a370d448
#5 resolve docker.io/library/node:20-alpine@sha256:658d0f63e501824d6c23e06d4bb95c71e7d704537c9d9272f488ac03a370d448 0.1s done
#5 DONE 0.1s

#4 [admin-api internal] load build context
#4 transferring context: 647.23kB 0.1s done
#4 DONE 0.2s

#6 [admin-api runner 11/14] COPY apps/admin-api/ ./apps/admin-api/
#6 CACHED

#7 [admin-api runner  7/14] COPY --from=deps /app/packages ./packages
#7 CACHED

#8 [admin-api deps 1/7] COPY pnpm-workspace.yaml ./
#8 CACHED

#9 [admin-api runner  8/14] COPY --from=deps /app/apps/admin-api/node_modules ./apps/admin-api/node_modules
#9 CACHED

#10 [admin-api runner 10/14] COPY --from=builder /app/apps/admin-api/node_modules/.prisma ./apps/admin-api/node_modules/.prisma
#10 CACHED

#11 [admin-api deps 4/7] COPY packages/ ./packages/
#11 CACHED

#12 [admin-api builder 2/2] RUN cd apps/admin-api && pnpm prisma:generate
#12 CACHED

#13 [admin-api runner  6/14] COPY --from=deps /app/node_modules ./node_modules
#13 CACHED

#14 [admin-api deps 2/7] COPY pnpm-lock.yaml ./
#14 CACHED

#15 [admin-api base 2/3] RUN npm install -g pnpm@latest
#15 CACHED

#16 [admin-api runner  4/14] COPY --from=deps /app/pnpm-workspace.yaml ./
#16 CACHED

#17 [admin-api deps 6/7] COPY apps/admin-api/vendor/ ./apps/admin-api/vendor/
#17 CACHED

#18 [admin-api builder 1/2] COPY apps/admin-api/prisma/ ./apps/admin-api/prisma/
#18 CACHED

#19 [admin-api deps 7/7] RUN pnpm install --frozen-lockfile --filter @slimy/admin-api...
#19 CACHED

#20 [admin-api deps 3/7] COPY package.json ./
#20 CACHED

#21 [admin-api runner 12/14] COPY apps/admin-api/src ./apps/admin-api/src
#21 CACHED

#22 [admin-api runner  5/14] COPY --from=deps /app/package.json ./
#22 CACHED

#23 [admin-api runner  9/14] COPY --from=deps /app/apps/admin-api/vendor ./apps/admin-api/vendor
#23 CACHED

#24 [admin-api base 3/3] WORKDIR /app
#24 CACHED

#25 [admin-api runner 13/14] COPY apps/admin-api/server.js ./apps/admin-api/server.js
#25 CACHED

#26 [admin-api deps 5/7] COPY apps/admin-api/package.json ./apps/admin-api/
#26 CACHED

#27 [admin-api runner 14/14] WORKDIR /app/apps/admin-api
#27 CACHED

#28 [admin-api] exporting to image
#28 exporting layers done
#28 writing image sha256:84ef4e666bc0cd01fb9be86b605ca51087c4cf7ebbf5bb86841f45f9cbbae268 0.1s done
#28 naming to docker.io/library/slimy-monorepo-admin-api
#28 naming to docker.io/library/slimy-monorepo-admin-api done
#28 DONE 0.1s

#29 [web internal] load build definition from Dockerfile
#29 transferring dockerfile: 3.38kB done
#29 DONE 0.0s

#30 [admin-ui internal] load build definition from Dockerfile
#30 transferring dockerfile: 3.27kB done
#30 DONE 0.0s

#31 [web internal] load metadata for docker.io/library/node:22-slim
#31 DONE 0.1s

#32 [web internal] load .dockerignore
#32 transferring context: 2.44kB done
#32 DONE 0.0s

#33 [admin-ui internal] load .dockerignore
#33 transferring context: 2.44kB done
#33 DONE 0.1s

#34 [admin-ui base 1/3] FROM docker.io/library/node:22-slim@sha256:773413f36941ce1e4baf74b4a6110c03dcc4f968daffc389d4caef3f01412d2a
#34 DONE 0.0s

#35 [admin-ui internal] load build context
#35 transferring context: 56.52MB 1.2s done
#35 DONE 1.3s

#36 [web internal] load build context
#36 transferring context: 39.05MB 1.4s done
#36 DONE 1.5s

#37 [admin-ui deps 6/9] COPY apps/admin-api/vendor ./apps/admin-api/vendor
#37 CACHED

#38 [admin-ui deps 5/9] COPY apps/admin-api/package.json ./apps/admin-api/
#38 CACHED

#39 [admin-ui deps 7/9] COPY apps/web/package.json ./apps/web/
#39 CACHED

#40 [admin-ui base 3/3] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#40 CACHED

#41 [admin-ui deps  2/10] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#41 CACHED

#42 [admin-ui deps 8/9] COPY apps/bot/package.json ./apps/bot/
#42 CACHED

#43 [admin-ui deps 4/9] COPY apps/admin-ui/package.json ./apps/admin-ui/
#43 CACHED

#44 [admin-ui deps 3/9] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#44 CACHED

#45 [admin-ui base 2/3] RUN apt-get update -y && apt-get install -y openssl
#45 CACHED

#46 [admin-ui deps  1/10] WORKDIR /app
#46 CACHED

#47 [admin-ui deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#47 CACHED

#48 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#48 CACHED

#49 [web deps  8/10] COPY apps/admin-ui/package.json ./apps/admin-ui/
#49 CACHED

#50 [web deps 10/10] RUN pnpm install --frozen-lockfile --prod=false
#50 CACHED

#51 [web deps  9/10] COPY apps/bot/package.json ./apps/bot/
#51 CACHED

#52 [web deps  6/10] COPY apps/admin-api/package.json ./apps/admin-api/
#52 CACHED

#53 [web deps  3/10] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#53 CACHED

#54 [web deps  7/10] COPY apps/admin-api/vendor ./apps/admin-api/vendor
#54 CACHED

#55 [web deps  4/10] COPY apps/web/package.json ./apps/web/
#55 CACHED

#56 [web deps  5/10] COPY apps/web/prisma ./apps/web/prisma
#56 CACHED

#57 [web builder  3/11] COPY --from=deps /app/node_modules ./node_modules
#57 CACHED

#40 [web base 3/3] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#40 CACHED

#45 [web base 2/3] RUN apt-get update -y && apt-get install -y openssl
#45 CACHED

#46 [web deps  1/10] WORKDIR /app
#46 CACHED

#41 [web deps  2/10] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#41 CACHED

#58 [admin-ui builder 4/8] COPY apps/admin-ui ./apps/admin-ui
#58 DONE 6.7s

#59 [web builder  4/11] COPY apps/web ./apps/web
#59 DONE 6.8s

#60 [web builder  5/11] COPY packages ./packages
#60 ...

#61 [admin-ui builder 5/8] COPY packages ./packages
#61 DONE 1.4s

#60 [web builder  5/11] COPY packages ./packages
#60 DONE 1.4s

#62 [web builder  6/11] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#62 ...

#63 [admin-ui builder 6/8] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#63 DONE 1.5s

#62 [web builder  6/11] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#62 DONE 1.5s

#64 [web builder  7/11] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#64 ...

#65 [admin-ui builder 7/8] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#65 5.141 Scope: all 7 workspace projects
#65 5.141 Lockfile is up to date, resolution step is skipped
#65 5.141 Already up to date
#65 5.141 
#65 5.141 ╭ Warning ─────────────────────────────────────────────────────────────────────╮
#65 5.141 │                                                                              │
#65 5.141 │   Ignored build scripts: msgpackr-extract.                                   │
#65 5.141 │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
#65 5.141 │   to run scripts.                                                            │
#65 5.141 │                                                                              │
#65 5.141 ╰──────────────────────────────────────────────────────────────────────────────╯
#65 5.141 
#65 5.141 . prepare$ husky
#65 5.141 . prepare: .git can't be found
#65 5.141 . prepare: Done
#65 5.141 Done in 4.6s using pnpm v10.22.0
#65 DONE 8.5s

#64 [web builder  7/11] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#64 8.548 Scope: all 7 workspace projects
#64 8.548 Lockfile is up to date, resolution step is skipped
#64 8.548 Already up to date
#64 8.548 
#64 8.548 ╭ Warning ─────────────────────────────────────────────────────────────────────╮
#64 8.548 │                                                                              │
#64 8.548 │   Ignored build scripts: msgpackr-extract.                                   │
#64 8.548 │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
#64 8.548 │   to run scripts.                                                            │
#64 8.548 │                                                                              │
#64 8.548 ╰──────────────────────────────────────────────────────────────────────────────╯
#64 8.548 
#64 8.548 . prepare$ husky
#64 8.548 . prepare: .git can't be found
#64 8.548 . prepare: Done
#64 8.548 Done in 8s using pnpm v10.22.0
#64 DONE 8.7s

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 1.116 
#66 1.116 > @slimy/admin-ui@ build /app/apps/admin-ui
#66 1.116 > next build
#66 1.116 
#66 2.465 Attention: Next.js now collects completely anonymous telemetry regarding usage.
#66 2.465 This information is used to shape Next.js' roadmap and prioritize features.
#66 2.465 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
#66 2.465 https://nextjs.org/telemetry
#66 2.465 
#66 2.563   ▲ Next.js 14.2.5
#66 2.563   - Environments: .env.local
#66 2.563 
#66 2.564    Linting and checking validity of types ...
#66 ...

#67 [web builder  8/11] RUN pnpm --filter @slimy/web run db:generate
#67 1.104 
#67 1.104 > @slimy/web@0.1.0 db:generate /app/apps/web
#67 1.104 > prisma generate
#67 1.104 
#67 2.496 Environment variables loaded from .env
#67 2.498 Prisma schema loaded from prisma/schema.prisma
#67 7.032 
#67 7.032 ✔ Generated Prisma Client (v6.19.0) to ./../../node_modules/.pnpm/@prisma+client@6.19.0_prisma@6.19.0_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client in 1.24s
#67 7.032 
#67 7.032 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
#67 7.032 
#67 7.032 Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate
#67 7.032 
#67 DONE 7.2s

#68 [web builder  9/11] COPY apps/web/tailwind.config.ts ./apps/web/
#68 DONE 0.1s

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 ...

#69 [web builder 10/11] COPY apps/web/postcss.config.mjs ./apps/web/
#69 DONE 0.1s

#70 [web builder 11/11] RUN pnpm --filter @slimy/web build
#70 1.051 
#70 1.051 > @slimy/web@0.1.0 build /app/apps/web
#70 1.051 > next build
#70 1.051 
#70 1.590 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#70 2.330  ⚠ `eslint` configuration in next.config.js is no longer supported. See more info here: https://nextjs.org/docs/app/api-reference/cli/next#next-lint-options
#70 2.341  ⚠ Invalid next.config.js options detected: 
#70 2.341  ⚠     Unrecognized key(s) in object: 'eslint'
#70 2.342  ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
#70 6.296 Attention: Next.js now collects completely anonymous telemetry regarding usage.
#70 6.296 This information is used to shape Next.js' roadmap and prioritize features.
#70 6.296 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
#70 6.296 https://nextjs.org/telemetry
#70 6.297 
#70 6.332    ▲ Next.js 16.0.1 (Turbopack)
#70 6.333    - Environments: .env.local, .env
#70 6.333 
#70 6.409  ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
#70 6.524    Creating an optimized production build ...
#70 6.834 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#70 ...

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 9.540    Creating an optimized production build ...
#66 37.79  ✓ Compiled successfully
#66 37.79    Collecting page data ...
#66 41.27    Generating static pages (0/20) ...
#66 42.16    Generating static pages (5/20) 
#66 42.63    Generating static pages (10/20) 
#66 42.88    Generating static pages (15/20) 
#66 43.07  ✓ Generating static pages (20/20)
#66 47.17    Finalizing page optimization ...
#66 47.17    Collecting build traces ...
#66 ...

#70 [web builder 11/11] RUN pnpm --filter @slimy/web build
#70 41.17 Turbopack build encountered 1 warnings:
#70 41.17 [externals]/@prisma/client
#70 41.17 unexpected export *
#70 41.17 export * used with module [externals]/@prisma/client [external] (@prisma/client, cjs) which is a CommonJS module with exports only available at runtime
#70 41.17 List all export names manually (`export { a, b, c } from "...") or rewrite the module to ESM, to avoid the additional runtime code.`
#70 41.17 
#70 41.17 Import trace:
#70 41.17   external:
#70 41.17     [externals]/@prisma/client [external]
#70 41.17     ./apps/web/lib/repositories/club-analytics.repository.ts [App Route]
#70 41.17     ./apps/web/app/api/club/analyze/route.ts [App Route]
#70 41.17 
#70 41.17 
#70 41.19  ✓ Compiled successfully in 34.0s
#70 41.23    Skipping validation of types
#70 41.90    Collecting page data ...
#70 42.52 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#70 42.88 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#70 42.88 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#70 43.74  ⚠ Using edge runtime on a page currently disables static generation for that page
#70 44.52    Generating static pages (0/45) ...
#70 44.83 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#70 44.84 [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
#70 45.86    Generating static pages (11/45) 
#70 46.32    Generating static pages (22/45) 
#70 46.76 [AdminApiClient] admin-api unavailable (ECONNREFUSED 127.0.0.1:3080)
#70 46.90 Failed to load doc: undefined Error: ENOENT: no such file or directory, open '/app/apps/web/content/docs/undefined.mdx'
#70 46.90     at p (.next/server/chunks/ssr/[root-of-the-server]__da54a6b7._.js:1:53953)
#70 46.90     at stringify (<anonymous>) {
#70 46.90   errno: -2,
#70 46.90   code: 'ENOENT',
#70 46.90   syscall: 'open',
#70 46.90   path: '/app/apps/web/content/docs/undefined.mdx'
#70 46.90 }
#70 46.96 Failed to load doc: undefined Error: ENOENT: no such file or directory, open '/app/apps/web/content/docs/undefined.mdx'
#70 46.96     at p (.next/server/chunks/ssr/[root-of-the-server]__da54a6b7._.js:1:53953)
#70 46.96     at stringify (<anonymous>) {
#70 46.96   errno: -2,
#70 46.96   code: 'ENOENT',
#70 46.96   syscall: 'open',
#70 46.96   path: '/app/apps/web/content/docs/undefined.mdx'
#70 46.96 }
#70 46.98 Failed to load doc: undefined Error: ENOENT: no such file or directory, open '/app/apps/web/content/docs/undefined.mdx'
#70 46.98     at p (.next/server/chunks/ssr/[root-of-the-server]__da54a6b7._.js:1:53953)
#70 46.98     at stringify (<anonymous>) {
#70 46.98   errno: -2,
#70 46.98   code: 'ENOENT',
#70 46.98   syscall: 'open',
#70 46.98   path: '/app/apps/web/content/docs/undefined.mdx'
#70 46.98 }
#70 47.17    Generating static pages (33/45) 
#70 53.78  ✓ Generating static pages (45/45) in 9.3s
#70 53.81    Finalizing page optimization ...
#70 62.02 
#70 62.02 Route (app)                            Revalidate  Expire
#70 62.02 ┌ ○ /
#70 62.02 ├ ○ /_not-found
#70 62.02 ├ ○ /admin/flags
#70 62.02 ├ ○ /analytics
#70 62.02 ├ ƒ /api/admin-api/diag
#70 62.02 ├ ƒ /api/admin-api/health
#70 62.02 ├ ƒ /api/auth/discord.bak/callback
#70 62.02 ├ ƒ /api/auth/discord.bak/login
#70 62.02 ├ ƒ /api/auth/logout
#70 62.02 ├ ƒ /api/auth/me
#70 62.02 ├ ƒ /api/chat/bot
#70 62.02 ├ ƒ /api/chat/conversations
#70 62.02 ├ ƒ /api/chat/message
#70 62.02 ├ ƒ /api/chat/messages
#70 62.02 ├ ƒ /api/chat/users
#70 62.02 ├ ƒ /api/club/analyze
#70 62.02 ├ ƒ /api/club/export
#70 62.02 ├ ƒ /api/club/latest
#70 62.02 ├ ƒ /api/club/rescan
#70 62.02 ├ ƒ /api/club/sheet
#70 62.02 ├ ƒ /api/club/upload
#70 62.02 ├ ƒ /api/codes
#70 62.02 ├ ƒ /api/codes/health
#70 62.02 ├ ƒ /api/codes/report
#70 62.02 ├ ƒ /api/diag
#70 62.02 ├ ƒ /api/discord/guilds
#70 62.02 ├ ƒ /api/guilds/[id]
#70 62.02 ├ ƒ /api/guilds/[id]/flags
#70 62.02 ├ ƒ /api/guilds/[id]/members
#70 62.02 ├ ƒ /api/guilds/[id]/members/[userId]
#70 62.02 ├ ƒ /api/guilds/[id]/members/bulk
#70 62.02 ├ ƒ /api/guilds/[id]/settings
#70 62.02 ├ ○ /api/health                                1m      1y
#70 62.02 ├ ƒ /api/local-codes
#70 62.02 ├ ƒ /api/og/stats
#70 62.02 ├ ƒ /api/screenshot
#70 62.02 ├ ○ /api/snail/history                         1m      1y
#70 62.02 ├ ƒ /api/stats
#70 62.02 ├ ƒ /api/stats/events/stream
#70 62.02 ├ ○ /api/usage                                30s      1y
#70 62.02 ├ ƒ /api/user/preferences
#70 62.02 ├ ƒ /api/web-vitals
#70 62.02 ├ ƒ /auth/discord/callback
#70 62.02 ├ ○ /chat
#70 62.02 ├ ○ /club
#70 62.02 ├ ○ /dashboard
#70 62.02 ├ ○ /docs
#70 62.02 ├ ● /docs/[slug]
#70 62.02 │ ├ /docs/getting-started
#70 62.02 │ ├ /docs/snail-tools
#70 62.02 │ └ /docs/club-analytics
#70 62.02 ├ ○ /features
#70 62.02 ├ ○ /guilds
#70 62.02 ├ ƒ /public-stats/[guildId]
#70 62.02 ├ ○ /settings
#70 62.02 ├ ○ /snail
#70 62.02 ├ ○ /snail/codes
#70 62.02 ├ ○ /status
#70 62.02 └ ○ /usage
#70 62.02 
#70 62.02 
#70 62.02 ƒ Proxy (Middleware)
#70 62.02 
#70 62.03 ○  (Static)   prerendered as static content
#70 62.03 ●  (SSG)      prerendered as static HTML (uses generateStaticParams)
#70 62.03 ƒ  (Dynamic)  server-rendered on demand
#70 62.03 
#70 62.07 
#70 62.07 > @slimy/web@0.1.0 postbuild /app/apps/web
#70 62.07 > tsx scripts/postbuild-validate.ts && tsx scripts/check-bundle-size.ts
#70 62.07 
#70 63.35 
#70 63.35 📋 Post-build validation:
#70 63.35 ✅ All checks passed
#70 64.01 📦 Analyzing bundle sizes...
#70 64.01 
#70 64.01 Configuration:
#70 64.01   Max initial bundle: 1000KB
#70 64.01   Max route chunk: 500KB
#70 64.01   Max total bundle: 3000KB
#70 64.01   Warn threshold: 80%
#70 64.01 
#70 64.01 📊 Bundle Size Summary:
#70 64.01   Initial bundle: 0KB
#70 64.01   Total bundles: 0
#70 64.01   Largest chunk: 0KB
#70 64.01 
#70 64.01 ✅ Bundle size checks passed!
#70 64.01 
#70 DONE 64.5s

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 75.17 
#66 75.17 Route (pages)                             Size     First Load JS
#66 75.17 ┌ ○ /                                     5.09 kB         117 kB
#66 75.17 ├   /_app                                 0 B            86.2 kB
#66 75.17 ├ ○ /404                                  181 B          86.4 kB
#66 75.17 ├ ○ /admin-api-usage                      874 B           113 kB
#66 75.17 ├ ƒ /api/admin-api/[...path]              0 B            86.2 kB
#66 75.17 ├ ƒ /api/admin-api/api/auth/login         0 B            86.2 kB
#66 75.17 ├ ƒ /api/admin-api/diag                   0 B            86.2 kB
#66 75.17 ├ ƒ /api/admin-api/health                 0 B            86.2 kB
#66 75.17 ├ ƒ /api/auth/discord/authorize-url       0 B            86.2 kB
#66 75.17 ├ ƒ /api/auth/discord/callback            0 B            86.2 kB
#66 75.17 ├ ƒ /api/diagnostics                      0 B            86.2 kB
#66 75.17 ├ ○ /auth-me (439 ms)                     1.08 kB         113 kB
#66 75.17 ├ ○ /chat                                 2.78 kB         115 kB
#66 75.17 ├ ○ /club                                 1.92 kB         114 kB
#66 75.17 ├ ƒ /dashboard                            1.65 kB         113 kB
#66 75.17 ├ ○ /email-login (370 ms)                 557 B           112 kB
#66 75.17 ├ ○ /guilds                               1.91 kB         114 kB
#66 75.17 ├ ○ /guilds/[guildId]                     5.88 kB         118 kB
#66 75.17 ├ ○ /guilds/[guildId]/channels            1.71 kB         113 kB
#66 75.17 ├ ○ /guilds/[guildId]/corrections         1.74 kB         113 kB
#66 75.17 ├ ○ /guilds/[guildId]/personality         888 B           113 kB
#66 75.17 ├ ○ /guilds/[guildId]/rescan              1.23 kB         113 kB
#66 75.17 ├ ○ /guilds/[guildId]/settings            1.26 kB         113 kB
#66 75.17 ├ ○ /guilds/[guildId]/usage               67.5 kB         179 kB
#66 75.17 ├ ○ /login                                479 B          86.7 kB
#66 75.17 ├ ○ /snail                                664 B           112 kB
#66 75.17 ├ ○ /snail/[guildId]                      4.45 kB         116 kB
#66 75.17 └ ○ /status                               1.26 kB         113 kB
#66 75.17 + First Load JS shared by all             89.4 kB
#66 75.17   ├ chunks/framework-8051a8b17472378c.js  45.2 kB
#66 75.17   ├ chunks/main-386d6319e61b79bf.js       36.6 kB
#66 75.17   └ other shared chunks (total)           7.55 kB
#66 75.17 
#66 75.17 ○  (Static)   prerendered as static content
#66 75.17 ƒ  (Dynamic)  server-rendered on demand
#66 75.17 
#66 ...

#71 [web runner  2/11] WORKDIR /app
#71 CACHED

#72 [web runner  5/11] RUN adduser --system --uid 1001 nextjs
#72 CACHED

#73 [web runner  3/11] RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
#73 CACHED

#74 [web runner  4/11] RUN addgroup --system --gid 1001 nodejs
#74 CACHED

#75 [web runner  6/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
#75 CACHED

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 DONE 76.1s

#76 [web runner  7/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone/apps/web ./apps/web/
#76 DONE 0.7s

#71 [admin-ui runner  2/11] WORKDIR /app
#71 CACHED

#77 [admin-ui runner  3/10] RUN addgroup --system --gid 1001 nodejs
#77 CACHED

#78 [admin-ui runner  4/10] RUN adduser --system --uid 1001 nextjs
#78 CACHED

#79 [admin-ui runner  5/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public
#79 CACHED

#80 [admin-ui runner  6/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
#80 ...

#81 [web runner  8/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone/node_modules ./node_modules
#81 DONE 5.1s

#80 [admin-ui runner  6/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
#80 DONE 5.0s

#82 [admin-ui runner  7/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
#82 ...

#83 [web runner  9/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
#83 DONE 2.1s

#82 [admin-ui runner  7/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
#82 DONE 2.0s

#84 [admin-ui runner  8/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
#84 ...

#85 [web runner 10/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
#85 DONE 6.3s

#84 [admin-ui runner  8/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
#84 DONE 6.3s

#86 [admin-ui runner  9/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./.next/static
#86 DONE 0.6s

#87 [web runner 11/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
#87 DONE 0.7s

#88 [web] exporting to image
#88 exporting layers
#88 ...

#89 [admin-ui runner 10/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./public
#89 DONE 0.3s

#90 [admin-ui] exporting to image
#90 exporting layers 1.0s done
#90 writing image sha256:ed7e16711fe40115126d17cd2e9bf11c75ad504a7bd57bc8764951613a1d0e28
#90 writing image sha256:ed7e16711fe40115126d17cd2e9bf11c75ad504a7bd57bc8764951613a1d0e28 done
#90 naming to docker.io/library/slimy-monorepo-admin-ui 0.0s done
#90 DONE 1.0s

#88 [web] exporting to image
#88 exporting layers 1.8s done
#88 writing image sha256:21efd51e3ace9e874279ccb0603dc1212062b550148ffd4bc7a936838122eb4a done
#88 naming to docker.io/library/slimy-monorepo-web 0.0s done
#88 DONE 1.8s
 Network slimy-monorepo_slimy-network  Creating
 Network slimy-monorepo_slimy-network  Created
 Container slimy-monorepo-db-1  Creating
 Container slimy-monorepo-db-1  Created
 Container slimy-monorepo-admin-api-1  Creating
 Container slimy-monorepo-admin-api-1  Created
 Container slimy-monorepo-admin-ui-1  Creating
 Container slimy-monorepo-web-1  Creating
 Container slimy-monorepo-admin-ui-1  Created
 Container slimy-monorepo-web-1  Created
 Container slimy-monorepo-db-1  Starting
 Container slimy-monorepo-db-1  Started
 Container slimy-monorepo-db-1  Waiting
 Container slimy-monorepo-db-1  Healthy
 Container slimy-monorepo-admin-api-1  Starting
Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint slimy-monorepo-admin-api-1 (0aa3978d01b402323643c91abbed6d54c93004e5b265893b45c35d9323ac71c5): Bind for 0.0.0.0:3080 failed: port is already allocated
 ELIFECYCLE  Command failed with exit code 1.
