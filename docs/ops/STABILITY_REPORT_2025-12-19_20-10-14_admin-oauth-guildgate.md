# Stability Report: admin oauth + guild gate
- Timestamp: 2025-12-19T20:10:14+00:00
- Repo: /opt/slimy/slimy-monorepo


## git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
?? GEMINI.md
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
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED              STATUS                 PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   4 hours ago          Up 4 hours (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    About a minute ago   Up About a minute      0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          4 hours ago          Up 4 hours (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         25 minutes ago       Up 25 minutes          0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```


## admin-ui: http://localhost:3001/
```
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "cqgv7m74aw2vn"
Content-Type: text/html; charset=utf-8
Content-Length: 3755
Vary: Accept-Encoding
Date: Fri, 19 Dec 2025 20:10:15 GMT
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
X-Request-ID: aaee3cb9-9c20-4101-b338-47d7a4508e7b
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 87
Date: Fri, 19 Dec 2025 20:10:15 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```


## curl -fsS -D- -o /dev/null 'http://localhost:3001/api/auth/discord/authorize-url' | grep -i '^Location:' | grep 'redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback'
```
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=fece81636e89eeabe2972f9b966f4f67&prompt=consent
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
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

  console.log
    [auth/me] req.user keys: id,username,role,guilds

      at log (src/routes/auth.js:532:13)

  console.log
    [auth/me] rawUser keys: id,username,role,guilds

      at log (src/routes/auth.js:533:13)

PASS tests/auth/active-guild.cookie.test.js
  POST /api/auth/active-guild cookie
    ✓ sets slimy_admin_active_guild_id on success (296 ms)
    ✓ does not set cookie when bot not installed (21 ms)

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

      at warn (src/routes/auth.js:675:19)

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

      at warn (src/routes/auth.js:646:17)

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

      at warn (src/routes/auth.js:691:15)

PASS tests/auth/me-context.test.js
  GET /api/auth/me Context Hydration
    ✓ should include lastActiveGuild from DB (322 ms)
    ✓ should handle DB errors gracefully (56 ms)

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
    ✓ should fail if SLIMYAI_BOT_TOKEN is missing (288 ms)
    ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (25 ms)
    ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (23 ms)
    ✓ should succeed if guild is shared (17 ms)

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

  console.error
    [auth/active-guild] Bot membership check failed: Discord API error

      797 |       botInstalled = await botInstalledInGuild(normalizedGuildId, botToken);
      798 |     } catch (err) {
    > 799 |       console.error("[auth/active-guild] Bot membership check failed:", err?.message || err);
          |               ^
      800 |       return res.status(503).json({
      801 |         ok: false,
      802 |         error: "bot_membership_unverifiable",

      at error (src/routes/auth.js:799:15)

  console.error
    [auth/active-guild] SLIMYAI_BOT_TOKEN not configured

      785 |     const botToken = getSlimyBotToken();
      786 |     if (!botToken) {
    > 787 |       console.error("[auth/active-guild] SLIMYAI_BOT_TOKEN not configured");
          |               ^
      788 |       return res.status(503).json({
      789 |         ok: false,
      790 |         error: "bot_token_missing",

      at error (src/routes/auth.js:787:15)
      at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
      at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
      at Route.dispatch (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:119:3)
      at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
      at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:284:15
      at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
      at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
      at Function.handle (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:175:3)
      at router (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:47:12)
      at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
      at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
      at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
      at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
      at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
      at next (tests/auth/active-guild.test.js:43:7)
      at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
      at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
      at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
      at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
      at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
      at cookieParser (../../node_modules/.pnpm/cookie-parser@1.4.7/node_modules/cookie-parser/index.js:57:14)
      at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
      at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
      at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
      at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
      at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
      at ../../node_modules/.pnpm/body-parser@1.20.4/node_modules/body-parser/lib/read.js:137:5
      at invokeCallback (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:238:16)
      at done (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:227:7)
      at IncomingMessage.onEnd (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:287:7)

PASS tests/auth/active-guild.test.js
  POST /api/auth/active-guild
    ✓ rejects guilds where bot is not installed (O(1) check) (28 ms)
    ✓ returns 503 when bot membership check fails (36 ms)
    ✓ returns 503 when bot token is missing (44 ms)
    ✓ succeeds when bot is installed in guild (23 ms)
    ✓ returns role for primary guild based on policy logic (35 ms)
    ✓ normalizes guildId to string (13 ms)

PASS tests/central-settings.test.js
  central settings endpoints
    ✓ GET /api/me/settings auto-creates defaults (19 ms)
    ✓ PATCH /api/me/settings merges updates (48 ms)
    ✓ GET /api/guilds/:guildId/settings requires admin/manager (16 ms)
    ✓ PUT /api/guilds/:guildId/settings allows admin and persists (21 ms)

PASS tests/guilds-connect.test.js
  POST /api/guilds/connect
    ✓ should return 200 when connecting with valid frontend payload (76 ms)
    ✓ should return 200 if guild is ALREADY connected (73 ms)
    ✓ should return 400 if guild ID is missing (16 ms)
  guildService.connectGuild
    ✓ upserts owner by discord id and links guild to the owner (10 ms)

PASS tests/discord-guilds.test.js
  GET /discord/guilds
    ✓ should return shared guilds with role labels (66 ms)

PASS tests/routes/usage.test.js
  GET /api/usage
    ✓ should return 200 and correct usage data structure (50 ms)

PASS tests/guilds-read.test.js
  GET /api/guilds/:guildId
    ✓ should return guild details for authenticated user (55 ms)
    ✓ should return 404 for non-existent guild (15 ms)

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
    [admin-api] readAuth: token verification failed { error: 'jwt malformed' }

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
    [admin-api] readAuth: token verification failed { error: 'jwt malformed' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.log
    [requireGuildAccess] Checking access for user discord-user-id to guild guild-123

      at log (src/middleware/rbac.js:33:13)

  console.info
    [admin-api] readAuth: token verification failed { error: 'jwt malformed' }

      at info (src/middleware/auth.js:22:13)

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

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

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

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: token verification failed { error: 'jwt malformed' }

      at info (src/middleware/auth.js:22:13)

PASS tests/routes/stats.test.js
  Stats Routes
    ✓ GET /api/stats should return system metrics by default (29 ms)
    ✓ GET /api/stats?action=system-metrics should return metrics (25 ms)
    ✓ GET /api/stats/events/stream should set SSE headers (11 ms)

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
    [admin-api] readAuth: token verification failed { error: 'jwt malformed' }

      at info (src/middleware/auth.js:22:13)

  console.log
    [requireGuildAccess] Checking access for user discord-user-id to guild guild-123

      at log (src/middleware/rbac.js:33:13)

PASS tests/middleware/rbac.test.js
  requireGuildAccess Middleware
    ✓ should return 400 if guildId is missing (2 ms)
    ✓ should return 401 if user is not authenticated (7 ms)
    ✓ should return 403 if user not found in DB (53 ms)
    ✓ should return 403 if user is not a member of the guild (23 ms)
    ✓ should call next() and attach guild info if user has access (51 ms)

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
    [admin-api] readAuth: token verification failed { error: 'jwt malformed' }

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
    [admin-api] readAuth: token verification failed { error: 'jwt malformed' }

      at info (src/middleware/auth.js:22:13)

PASS tests/club-store.test.js
  club-store shim
    ✓ canonicalize lowercases input (1 ms)
    ✓ canonicalize handles nullish values (2 ms)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: token verification failed { error: 'jwt malformed' }

      at info (src/middleware/auth.js:22:13)

FAIL tests/auth/auth-middleware.test.js
  Auth Middleware
    resolveUser
      ✓ should return null when no token in cookies (31 ms)
      ✓ should return null when token is invalid (12 ms)
      ✕ should return hydrated user when session exists (7 ms)
      ✕ should return fallback user when no session exists (34 ms)
      ✓ should cache user resolution (11 ms)
    requireAuth
      ✕ should call next when user is authenticated (29 ms)
      ✓ should return 401 when user is not authenticated (26 ms)
    requireRole
      ✕ should call next when user has required role (member) (25 ms)
      ✕ should call next when user has higher role than required (17 ms)
      ✕ should return 403 when user has insufficient role (19 ms)
      ✓ should return 401 when user is not authenticated (17 ms)
    requireGuildMember
      ✕ should call next for admin user regardless of guild membership (17 ms)
      ✕ should call next when user is member of the guild (15 ms)
      ✕ should return 403 when user is not member of the guild (12 ms)
      ✕ should return 400 when guildId parameter is missing (34 ms)
      ✓ should return 401 when user is not authenticated (10 ms)
      ✕ should use custom parameter name (15 ms)

  ● Auth Middleware › resolveUser › should return hydrated user when session exists

    expect(received).toMatchObject(expected)

    Matcher error: received value must be a non-null object

    Received has value: null

      42 |
      43 |       const result = await resolveUser(mockReq);
    > 44 |       expect(result).toMatchObject({
         |                      ^
      45 |         id: expect.any(String),
      46 |         sub: expect.any(String),
      47 |         username: expect.any(String),

      at Object.toMatchObject (tests/auth/auth-middleware.test.js:44:22)

  ● Auth Middleware › resolveUser › should return fallback user when no session exists

    expect(received).toMatchObject(expected)

    Matcher error: received value must be a non-null object

    Received has value: null

      68 |       require("../../lib/session-store").getSession = originalGetSession;
      69 |
    > 70 |       expect(result).toMatchObject({
         |                      ^
      71 |         id: expect.any(String),
      72 |         sub: expect.any(String),
      73 |         username: expect.any(String),

      at Object.toMatchObject (tests/auth/auth-middleware.test.js:70:22)

  ● Auth Middleware › requireAuth › should call next when user is authenticated

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

       95 |       await requireAuth(mockReq, mockRes, mockNext);
       96 |
    >  97 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
       98 |       expect(mockReq.user).toBeDefined();
       99 |       expect(mockReq.session).toBeDefined();
      100 |     });

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:97:24)

  ● Auth Middleware › requireRole › should call next when user has required role (member)

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      122 |       await requireMemberRole(mockReq, mockRes, mockNext);
      123 |
    > 124 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
      125 |       expect(mockReq.user).toBeDefined();
      126 |     });
      127 |

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:124:24)

  ● Auth Middleware › requireRole › should call next when user has higher role than required

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      131 |       await requireMemberRole(mockReq, mockRes, mockNext);
      132 |
    > 133 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
      134 |     });
      135 |
      136 |     test("should return 403 when user has insufficient role", async () => {

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:133:24)

  ● Auth Middleware › requireRole › should return 403 when user has insufficient role

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 403
    Received: 401

    Number of calls: 1

      140 |
      141 |       expect(mockNext).not.toHaveBeenCalled();
    > 142 |       expect(mockRes.status).toHaveBeenCalledWith(403);
          |                              ^
      143 |       expect(mockRes.json).toHaveBeenCalledWith({
      144 |         ok: false,
      145 |         code: "FORBIDDEN",

      at Object.toHaveBeenCalledWith (tests/auth/auth-middleware.test.js:142:30)

  ● Auth Middleware › requireGuildMember › should call next for admin user regardless of guild membership

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      165 |       await middleware(mockReq, mockRes, mockNext);
      166 |
    > 167 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
      168 |     });
      169 |
      170 |     test("should call next when user is member of the guild", async () => {

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:167:24)

  ● Auth Middleware › requireGuildMember › should call next when user is member of the guild

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      174 |       await middleware(mockReq, mockRes, mockNext);
      175 |
    > 176 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
      177 |     });
      178 |
      179 |     test("should return 403 when user is not member of the guild", async () => {

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:176:24)

  ● Auth Middleware › requireGuildMember › should return 403 when user is not member of the guild

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 403
    Received: 401

    Number of calls: 1

      184 |
      185 |       expect(mockNext).not.toHaveBeenCalled();
    > 186 |       expect(mockRes.status).toHaveBeenCalledWith(403);
          |                              ^
      187 |       expect(mockRes.json).toHaveBeenCalledWith({
      188 |         ok: false,
      189 |         code: "FORBIDDEN",

      at Object.toHaveBeenCalledWith (tests/auth/auth-middleware.test.js:186:30)

  ● Auth Middleware › requireGuildMember › should return 400 when guildId parameter is missing

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 400
    Received: 401

    Number of calls: 1

      198 |
      199 |       expect(mockNext).not.toHaveBeenCalled();
    > 200 |       expect(mockRes.status).toHaveBeenCalledWith(400);
          |                              ^
      201 |       expect(mockRes.json).toHaveBeenCalledWith({
      202 |         ok: false,
      203 |         code: "BAD_REQUEST",

      at Object.toHaveBeenCalledWith (tests/auth/auth-middleware.test.js:200:30)

  ● Auth Middleware › requireGuildMember › should use custom parameter name

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      222 |       await customMiddleware(mockReq, mockRes, mockNext);
      223 |
    > 224 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
      225 |     });
      226 |   });
      227 | });

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:224:24)

PASS tests/numparse.test.js
  numparse shim
    ✓ returns numeric values for plain numbers (1 ms)
    ✓ returns null for non-numeric values or suffixed strings (1 ms)

PASS tests/diag.test.js
  diagnostics placeholder
    ✓ skipped in test mode (7 ms)

PASS src/lib/auth/post-login-redirect.test.js
  resolvePostLoginRedirectUrl
    ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to (1 ms)
    ✓ falls back to x-forwarded origin when cookie missing (1 ms)
    ✓ falls back to CLIENT_URL when cookie and forwarded origin missing (1 ms)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Summary of all failing tests
FAIL tests/auth/auth-middleware.test.js
  ● Auth Middleware › resolveUser › should return hydrated user when session exists

    expect(received).toMatchObject(expected)

    Matcher error: received value must be a non-null object

    Received has value: null

      42 |
      43 |       const result = await resolveUser(mockReq);
    > 44 |       expect(result).toMatchObject({
         |                      ^
      45 |         id: expect.any(String),
      46 |         sub: expect.any(String),
      47 |         username: expect.any(String),

      at Object.toMatchObject (tests/auth/auth-middleware.test.js:44:22)

  ● Auth Middleware › resolveUser › should return fallback user when no session exists

    expect(received).toMatchObject(expected)

    Matcher error: received value must be a non-null object

    Received has value: null

      68 |       require("../../lib/session-store").getSession = originalGetSession;
      69 |
    > 70 |       expect(result).toMatchObject({
         |                      ^
      71 |         id: expect.any(String),
      72 |         sub: expect.any(String),
      73 |         username: expect.any(String),

      at Object.toMatchObject (tests/auth/auth-middleware.test.js:70:22)

  ● Auth Middleware › requireAuth › should call next when user is authenticated

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

       95 |       await requireAuth(mockReq, mockRes, mockNext);
       96 |
    >  97 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
       98 |       expect(mockReq.user).toBeDefined();
       99 |       expect(mockReq.session).toBeDefined();
      100 |     });

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:97:24)

  ● Auth Middleware › requireRole › should call next when user has required role (member)

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      122 |       await requireMemberRole(mockReq, mockRes, mockNext);
      123 |
    > 124 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
      125 |       expect(mockReq.user).toBeDefined();
      126 |     });
      127 |

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:124:24)

  ● Auth Middleware › requireRole › should call next when user has higher role than required

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      131 |       await requireMemberRole(mockReq, mockRes, mockNext);
      132 |
    > 133 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
      134 |     });
      135 |
      136 |     test("should return 403 when user has insufficient role", async () => {

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:133:24)

  ● Auth Middleware › requireRole › should return 403 when user has insufficient role

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 403
    Received: 401

    Number of calls: 1

      140 |
      141 |       expect(mockNext).not.toHaveBeenCalled();
    > 142 |       expect(mockRes.status).toHaveBeenCalledWith(403);
          |                              ^
      143 |       expect(mockRes.json).toHaveBeenCalledWith({
      144 |         ok: false,
      145 |         code: "FORBIDDEN",

      at Object.toHaveBeenCalledWith (tests/auth/auth-middleware.test.js:142:30)

  ● Auth Middleware › requireGuildMember › should call next for admin user regardless of guild membership

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      165 |       await middleware(mockReq, mockRes, mockNext);
      166 |
    > 167 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
      168 |     });
      169 |
      170 |     test("should call next when user is member of the guild", async () => {

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:167:24)

  ● Auth Middleware › requireGuildMember › should call next when user is member of the guild

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      174 |       await middleware(mockReq, mockRes, mockNext);
      175 |
    > 176 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
      177 |     });
      178 |
      179 |     test("should return 403 when user is not member of the guild", async () => {

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:176:24)

  ● Auth Middleware › requireGuildMember › should return 403 when user is not member of the guild

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 403
    Received: 401

    Number of calls: 1

      184 |
      185 |       expect(mockNext).not.toHaveBeenCalled();
    > 186 |       expect(mockRes.status).toHaveBeenCalledWith(403);
          |                              ^
      187 |       expect(mockRes.json).toHaveBeenCalledWith({
      188 |         ok: false,
      189 |         code: "FORBIDDEN",

      at Object.toHaveBeenCalledWith (tests/auth/auth-middleware.test.js:186:30)

  ● Auth Middleware › requireGuildMember › should return 400 when guildId parameter is missing

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 400
    Received: 401

    Number of calls: 1

      198 |
      199 |       expect(mockNext).not.toHaveBeenCalled();
    > 200 |       expect(mockRes.status).toHaveBeenCalledWith(400);
          |                              ^
      201 |       expect(mockRes.json).toHaveBeenCalledWith({
      202 |         ok: false,
      203 |         code: "BAD_REQUEST",

      at Object.toHaveBeenCalledWith (tests/auth/auth-middleware.test.js:200:30)

  ● Auth Middleware › requireGuildMember › should use custom parameter name

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      222 |       await customMiddleware(mockReq, mockRes, mockNext);
      223 |
    > 224 |       expect(mockNext).toHaveBeenCalled();
          |                        ^
      225 |     });
      226 |   });
      227 | });

      at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:224:24)


Test Suites: 1 failed, 12 skipped, 15 passed, 16 of 28 total
Tests:       11 failed, 12 skipped, 48 passed, 71 total
Snapshots:   0 total
Time:        9.952 s
Ran all test suites.
/opt/slimy/slimy-monorepo/apps/admin-api:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @slimy/admin-api@1.0.0 test: `jest`
Exit status 1
