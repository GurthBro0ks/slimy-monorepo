# Stability Report: admin oauth + guild gate
- Timestamp: 2025-12-19T20:13:36+00:00
- Repo: /opt/slimy/slimy-monorepo


## git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M apps/admin-api/tests/auth/auth-middleware.test.js
 M scripts/smoke/stability-gate.sh
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
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED          STATUS                 PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   4 hours ago      Up 4 hours (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    4 minutes ago    Up 4 minutes           0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          4 hours ago      Up 4 hours (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         28 minutes ago   Up 28 minutes          0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```


## admin-ui: http://localhost:3001/
```
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "cqgv7m74aw2vn"
Content-Type: text/html; charset=utf-8
Content-Length: 3755
Vary: Accept-Encoding
Date: Fri, 19 Dec 2025 20:13:37 GMT
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
X-Request-ID: 469d8658-ebcf-48c6-920a-0945972210d1
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 87
Date: Fri, 19 Dec 2025 20:13:37 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```


## curl -fsS -D- -o /dev/null 'http://localhost:3001/api/auth/discord/authorize-url' | grep -i '^Location:' | grep 'redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback'
```
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=82c81258c23e008eb193c0798405f342&prompt=consent
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


## NODE_ENV=test pnpm --filter @slimy/admin-api test
```

> @slimy/admin-api@1.0.0 test /opt/slimy/slimy-monorepo/apps/admin-api
> jest

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

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
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-user' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-admin' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

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

      at warn (src/middleware/auth.js:386:17)
      at Object.<anonymous> (tests/auth/auth-middleware.test.js:183:7)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-member' }

      at info (src/middleware/auth.js:22:13)

PASS tests/auth/auth-middleware.test.js
  Auth Middleware
    resolveUser
      ✓ should return null when no token in cookies (83 ms)
      ✓ should return null when token is invalid (10 ms)
      ✓ should return hydrated user when session exists (11 ms)
      ✓ should return fallback user when no session exists (7 ms)
      ✓ should cache user resolution (5 ms)
    requireAuth
      ✓ should call next when user is authenticated (10 ms)
      ✓ should return 401 when user is not authenticated (3 ms)
    requireRole
      ✓ should call next when user has required role (member) (4 ms)
      ✓ should call next when user has higher role than required (4 ms)
      ✓ should return 403 when user has insufficient role (4 ms)
      ✓ should return 401 when user is not authenticated (3 ms)
    requireGuildMember
      ✓ should call next for admin user regardless of guild membership (4 ms)
      ✓ should call next when user is member of the guild (5 ms)
      ✓ should return 403 when user is not member of the guild (11 ms)
      ✓ should return 400 when guildId parameter is missing (7 ms)
      ✓ should return 401 when user is not authenticated (4 ms)
      ✓ should use custom parameter name (5 ms)

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

      at warn (src/routes/auth.js:675:19)

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

PASS tests/guild-connect.test.js
  POST /guilds/connect
    ✓ should fail if SLIMYAI_BOT_TOKEN is missing (146 ms)
    ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (8 ms)
    ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (5 ms)
    ✓ should succeed if guild is shared (5 ms)

PASS tests/auth/me-context.test.js
  GET /api/auth/me Context Hydration
    ✓ should include lastActiveGuild from DB (75 ms)
    ✓ should handle DB errors gracefully (27 ms)

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

PASS tests/guilds-connect.test.js
  POST /api/guilds/connect
    ✓ should return 200 when connecting with valid frontend payload (37 ms)
    ✓ should return 200 if guild is ALREADY connected (110 ms)
    ✓ should return 400 if guild ID is missing (12 ms)
  guildService.connectGuild
    ✓ upserts owner by discord id and links guild to the owner (3 ms)

PASS tests/auth/active-guild.cookie.test.js
  POST /api/auth/active-guild cookie
    ✓ sets slimy_admin_active_guild_id on success (152 ms)
    ✓ does not set cookie when bot not installed (7 ms)

PASS tests/central-settings.test.js
  central settings endpoints
    ✓ GET /api/me/settings auto-creates defaults (30 ms)
    ✓ PATCH /api/me/settings merges updates (57 ms)
    ✓ GET /api/guilds/:guildId/settings requires admin/manager (15 ms)
    ✓ PUT /api/guilds/:guildId/settings allows admin and persists (8 ms)

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

PASS tests/discord-guilds.test.js
  GET /discord/guilds
    ✓ should return shared guilds with role labels (34 ms)

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
    ✓ rejects guilds where bot is not installed (O(1) check) (12 ms)
    ✓ returns 503 when bot membership check fails (8 ms)
    ✓ returns 503 when bot token is missing (28 ms)
    ✓ succeeds when bot is installed in guild (8 ms)
    ✓ returns role for primary guild based on policy logic (7 ms)
    ✓ normalizes guildId to string (6 ms)

PASS tests/guilds-read.test.js
  GET /api/guilds/:guildId
    ✓ should return guild details for authenticated user (9 ms)
    ✓ should return 404 for non-existent guild (5 ms)

PASS tests/routes/stats.test.js
  Stats Routes
    ✓ GET /api/stats should return system metrics by default (8 ms)
    ✓ GET /api/stats?action=system-metrics should return metrics (10 ms)
    ✓ GET /api/stats/events/stream should set SSE headers (2 ms)

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
    ✓ should return 403 if user not found in DB (8 ms)
    ✓ should return 403 if user is not a member of the guild (8 ms)
    ✓ should call next() and attach guild info if user has access (3 ms)

PASS tests/routes/usage.test.js
  GET /api/usage
    ✓ should return 200 and correct usage data structure (24 ms)

PASS src/lib/auth/post-login-redirect.test.js
  resolvePostLoginRedirectUrl
    ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to (2 ms)
    ✓ falls back to x-forwarded origin when cookie missing (1 ms)
    ✓ falls back to CLIENT_URL when cookie and forwarded origin missing

PASS tests/numparse.test.js
  numparse shim
    ✓ returns numeric values for plain numbers (1 ms)
    ✓ returns null for non-numeric values or suffixed strings (1 ms)

PASS tests/diag.test.js
  diagnostics placeholder
    ✓ skipped in test mode (1 ms)

PASS tests/club-store.test.js
  club-store shim
    ✓ canonicalize lowercases input (1 ms)
    ✓ canonicalize handles nullish values

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 12 skipped, 16 passed, 16 of 28 total
Tests:       12 skipped, 59 passed, 71 total
Snapshots:   0 total
Time:        3.621 s
Ran all test suites.
```


## pnpm --filter @slimy/admin-ui build
```

> @slimy/admin-ui@ build /opt/slimy/slimy-monorepo/apps/admin-ui
> next build

 ⚠ You are using a non-standard "NODE_ENV" value in your environment. This creates inconsistencies in the project and is strongly advised against. Read more: https://nextjs.org/docs/messages/non-standard-node-env
  ▲ Next.js 14.2.5
  - Environments: .env.local

   Linting and checking validity of types ...
   Creating an optimized production build ...
 ✓ Compiled successfully
   Collecting page data ...
   Generating static pages (0/20) ...
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at m (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/chat.js:1:1559)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/chat". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at m (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/chat.js:1:1559)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at b (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/909.js:1:1773)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5785:7)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)

Error occurred prerendering page "/email-login". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at b (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/909.js:1:1773)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5785:7)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at u (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/club.js:1:1458)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/club". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at u (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/club.js:1:1458)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at h (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/channels.js:1:1345)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/guilds/[guildId]/channels". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at h (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/channels.js:1:1345)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at o (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/corrections.js:1:5046)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/guilds/[guildId]/corrections". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at o (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/corrections.js:1:5046)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
   Generating static pages (5/20) 
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at y (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId].js:1:13578)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/guilds/[guildId]". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at y (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId].js:1:13578)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/personality.js:1:1351)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/guilds/[guildId]/personality". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/personality.js:1:1351)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at o (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/rescan.js:1:2902)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/guilds/[guildId]/rescan". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at o (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/rescan.js:1:2902)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at c (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/settings.js:1:1276)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/guilds/[guildId]/settings". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at c (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/settings.js:1:1276)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at b (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/909.js:1:1773)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5785:7)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)

Error occurred prerendering page "/auth-me". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at b (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/909.js:1:1773)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5785:7)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
   Generating static pages (10/20) 
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds.js:1:1568)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/guilds". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds.js:1:1568)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at x (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/login.js:1:564)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/login". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at x (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/login.js:1:564)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at g (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/usage.js:1:1576)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/guilds/[guildId]/usage". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at g (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/guilds/[guildId]/usage.js:1:1576)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at b (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/909.js:1:1773)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5785:7)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)

Error occurred prerendering page "/". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at b (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/909.js:1:1773)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5785:7)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/snail/[guildId].js:1:1796)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/snail/[guildId]". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/snail/[guildId].js:1:1796)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
   Generating static pages (15/20) 
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at d (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/snail.js:1:1232)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/snail". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at d (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/snail.js:1:1232)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at b (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/909.js:1:1773)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5785:7)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)

Error occurred prerendering page "/admin-api-usage". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at b (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/909.js:1:1773)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5785:7)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at b (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/909.js:1:1773)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5785:7)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)

Error occurred prerendering page "/status". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at b (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/909.js:1:1773)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5785:7)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at a (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/_app.js:1:1136)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/500". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at a (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/_app.js:1:1136)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at a (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/_app.js:1:1136)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)

Error occurred prerendering page "/404". Read more: https://nextjs.org/docs/messages/prerender-error

Error: NextRouter was not mounted. https://nextjs.org/docs/messages/next-router-not-mounted
    at p (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/chunks/704.js:1:14481)
    at a (/opt/slimy/slimy-monorepo/apps/admin-ui/.next/server/pages/_app.js:1:1136)
    at renderWithHooks (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5658:16)
    at renderIndeterminateComponent (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5731:15)
    at renderElement (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:5946:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6104:11)
    at renderNodeDestructive (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6076:14)
    at renderNode (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6259:12)
    at renderChildrenArray (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6211:7)
    at renderNodeDestructiveImpl (/opt/slimy/slimy-monorepo/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js:6141:7)
 ✓ Generating static pages (20/20)

> Export encountered errors on following paths:
	/
	/_error: /404
	/_error: /500
	/admin-api-usage
	/auth-me
	/chat
	/club
	/email-login
	/guilds
	/guilds/[guildId]
	/guilds/[guildId]/channels
	/guilds/[guildId]/corrections
	/guilds/[guildId]/personality
	/guilds/[guildId]/rescan
	/guilds/[guildId]/settings
	/guilds/[guildId]/usage
	/login
	/snail
	/snail/[guildId]
	/status
/opt/slimy/slimy-monorepo/apps/admin-ui:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @slimy/admin-ui@ build: `next build`
Exit status 1
