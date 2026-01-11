# Stability Report: admin oauth + guild gate
- Timestamp: 2025-12-21T01:44:14+00:00
- Repo: /opt/slimy/slimy-monorepo


## git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616 [ahead 1]
M  apps/admin-ui/components/GuildActionsMobile.jsx
M  apps/admin-ui/components/Layout.js
M  apps/admin-ui/lib/active-guild.js
M  apps/admin-ui/lib/session.js
R  apps/admin-ui/pages/guilds/[guildId]/channels.js -> apps/admin-ui/pages/club/[guildId]/channels.js
R  apps/admin-ui/pages/guilds/[guildId]/corrections.js -> apps/admin-ui/pages/club/[guildId]/corrections.js
R  apps/admin-ui/pages/guilds/[guildId]/index.js -> apps/admin-ui/pages/club/[guildId]/index.js
R  apps/admin-ui/pages/guilds/[guildId]/personality.js -> apps/admin-ui/pages/club/[guildId]/personality.js
R  apps/admin-ui/pages/guilds/[guildId]/rescan.js -> apps/admin-ui/pages/club/[guildId]/rescan.js
R  apps/admin-ui/pages/guilds/[guildId]/settings.js -> apps/admin-ui/pages/club/[guildId]/settings.js
R  apps/admin-ui/pages/guilds/[guildId]/usage.js -> apps/admin-ui/pages/club/[guildId]/usage.js
M  apps/admin-ui/pages/club/index.js
A  apps/admin-ui/pages/guilds/[guildId]/[[...rest]].js
M  apps/admin-ui/pages/guilds/index.js
M  apps/admin-ui/pages/snail/[guildId]/index.js
M  apps/admin-ui/pages/snail/index.js
A  docs/buglog/BUG_2025-12-21_admin-domain-ui-oauth-and-routes.md
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
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   15 minutes ago   Up 15 minutes (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    15 minutes ago   Up 14 minutes             0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          15 minutes ago   Up 15 minutes (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         15 minutes ago   Up 14 minutes             0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```


## admin-ui: http://localhost:3001/
```
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "lfu7gelkcg329"
Content-Type: text/html; charset=utf-8
Content-Length: 3993
Vary: Accept-Encoding
Date: Sun, 21 Dec 2025 01:44:15 GMT
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
X-Request-ID: 12edf7a5-911c-42b7-9777-389ce766803a
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 85
Date: Sun, 21 Dec 2025 01:44:15 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```


## curl -fsS -D- -o /dev/null 'http://localhost:3001/api/auth/discord/authorize-url' | grep -i '^Location:' | grep 'redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback'
```
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=057de22bfc873d2c94347343e7c02f08&prompt=consent
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
    ✓ should include lastActiveGuild from DB (134 ms)
    ✓ should handle DB errors gracefully (49 ms)

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
    ✓ should fail if SLIMYAI_BOT_TOKEN is missing (295 ms)
    ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (21 ms)
    ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (8 ms)
    ✓ should succeed if guild is shared (7 ms)

PASS tests/guilds-connect.test.js
  POST /api/guilds/connect
    ✓ should return 200 when connecting with valid frontend payload (118 ms)
    ✓ should return 200 if guild is ALREADY connected (66 ms)
    ✓ should return 400 if guild ID is missing (24 ms)
  guildService.connectGuild
    ✓ upserts owner by discord id and links guild to the owner (13 ms)

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

PASS tests/auth/active-guild.cookie.test.js
  POST /api/auth/active-guild cookie
    ✓ sets slimy_admin_active_guild_id on success (132 ms)
    ✓ does not set cookie when bot not installed (8 ms)

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

PASS tests/guilds-read.test.js
  GET /api/guilds/:guildId
    ✓ should return guild details for authenticated user (67 ms)
    ✓ should return 404 for non-existent guild (36 ms)

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

PASS tests/central-settings.test.js
  central settings endpoints
    ✓ GET /api/me/settings auto-creates defaults (61 ms)
    ✓ PATCH /api/me/settings merges updates (43 ms)
    ✓ GET /api/guilds/:guildId/settings requires admin/manager (30 ms)
    ✓ PUT /api/guilds/:guildId/settings allows admin and persists (9 ms)

PASS tests/auth/active-guild.test.js
  POST /api/auth/active-guild
    ✓ rejects guilds where bot is not installed (O(1) check) (40 ms)
    ✓ returns 503 when bot membership check fails (10 ms)
    ✓ returns 503 when bot token is missing (31 ms)
    ✓ succeeds when bot is installed in guild (8 ms)
    ✓ returns role for primary guild based on policy logic (9 ms)
    ✓ normalizes guildId to string (8 ms)

PASS tests/routes/stats.test.js
  Stats Routes
    ✓ GET /api/stats should return system metrics by default (9 ms)
    ✓ GET /api/stats?action=system-metrics should return metrics (6 ms)
    ✓ GET /api/stats/events/stream should set SSE headers (2 ms)

PASS tests/discord-guilds.test.js
  GET /discord/guilds
    ✓ should return shared guilds with role labels (53 ms)

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

  console.log
    [requireGuildAccess] Checking access for user discord-user-id to guild guild-123

      at log (src/middleware/rbac.js:33:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

  console.info
    [admin-api] readAuth: user hydrated { userId: 'test-admin' }

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

  console.log
    [requireGuildAccess] Checking access for user discord-user-id to guild guild-123

      at log (src/middleware/rbac.js:33:13)

  console.info
    [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }

      at info (src/middleware/auth.js:22:13)

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
    ✓ should return 400 if guildId is missing (5 ms)
    ✓ should return 401 if user is not authenticated (2 ms)
    ✓ should return 403 if user not found in DB (33 ms)
    ✓ should return 403 if user is not a member of the guild (6 ms)
    ✓ should call next() and attach guild info if user has access (4 ms)

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
      ✓ should return null when no token in cookies (219 ms)
      ✓ should return null when token is invalid (8 ms)
      ✓ should return hydrated user when session exists (14 ms)
      ✓ should return fallback user when no session exists (7 ms)
      ✓ should cache user resolution (9 ms)
    requireAuth
      ✓ should call next when user is authenticated (11 ms)
      ✓ should return 401 when user is not authenticated (25 ms)
    requireRole
      ✓ should call next when user has required role (member) (13 ms)
      ✓ should call next when user has higher role than required (6 ms)
      ✓ should return 403 when user has insufficient role (19 ms)
      ✓ should return 401 when user is not authenticated (4 ms)
    requireGuildMember
      ✓ should call next for admin user regardless of guild membership (12 ms)
      ✓ should call next when user is member of the guild (4 ms)
      ✓ should return 403 when user is not member of the guild (9 ms)
      ✓ should return 400 when guildId parameter is missing (6 ms)
      ✓ should return 401 when user is not authenticated (7 ms)
      ✓ should use custom parameter name (5 ms)

PASS src/lib/auth/post-login-redirect.test.js
  resolvePostLoginRedirectUrl
    ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to (2 ms)
    ✓ falls back to x-forwarded origin when cookie missing (1 ms)
    ✓ falls back to CLIENT_URL when cookie and forwarded origin missing (1 ms)

PASS tests/routes/usage.test.js
  GET /api/usage
    ✓ should return 200 and correct usage data structure (26 ms)

PASS tests/club-store.test.js
  club-store shim
    ✓ canonicalize lowercases input (2 ms)
    ✓ canonicalize handles nullish values (1 ms)

PASS tests/diag.test.js
  diagnostics placeholder
    ✓ skipped in test mode (1 ms)

PASS tests/numparse.test.js
  numparse shim
    ✓ returns numeric values for plain numbers (2 ms)
    ✓ returns null for non-numeric values or suffixed strings (1 ms)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 12 skipped, 16 passed, 16 of 28 total
Tests:       12 skipped, 59 passed, 71 total
Snapshots:   0 total
Time:        4.841 s, estimated 7 s
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
   Generating static pages (0/21) ...
   Generating static pages (5/21) 
   Generating static pages (10/21) 
   Generating static pages (15/21) 
 ✓ Generating static pages (21/21)
   Finalizing page optimization ...
   Collecting build traces ...

Route (pages)                             Size     First Load JS
┌ ○ /                                     5.09 kB         119 kB
├   /_app                                 0 B            86.5 kB
├ ○ /404                                  181 B          86.7 kB
├ ○ /admin-api-usage                      876 B           114 kB
├ ƒ /api/admin-api/[...path]              0 B            86.5 kB
├ ƒ /api/admin-api/api/auth/login         0 B            86.5 kB
├ ƒ /api/admin-api/diag                   0 B            86.5 kB
├ ƒ /api/admin-api/health                 0 B            86.5 kB
├ ƒ /api/auth/discord/authorize-url       0 B            86.5 kB
├ ƒ /api/auth/discord/callback            0 B            86.5 kB
├ ƒ /api/diagnostics                      0 B            86.5 kB
├ ○ /auth-me                              1.08 kB         115 kB
├ ○ /chat                                 2.82 kB         116 kB
├ ○ /club                                 492 B           114 kB
├ ○ /club/[guildId]                       5.82 kB         119 kB
├ ○ /club/[guildId]/channels              1.71 kB         115 kB
├ ○ /club/[guildId]/corrections           1.75 kB         115 kB
├ ○ /club/[guildId]/personality           892 B           114 kB
├ ○ /club/[guildId]/rescan                1.23 kB         115 kB
├ ○ /club/[guildId]/settings              1.26 kB         115 kB
├ ○ /club/[guildId]/usage                 67.5 kB         181 kB
├ ƒ /dashboard                            1.66 kB         115 kB
├ ○ /email-login                          560 B           114 kB
├ ○ /guilds                               2.17 kB         116 kB
├ ○ /guilds/[guildId]/[[...rest]]         526 B           114 kB
├ ○ /login                                781 B          89.8 kB
├ ○ /snail                                769 B           114 kB
├ ○ /snail/[guildId]                      4.3 kB          118 kB
└ ○ /status                               1.26 kB         115 kB
+ First Load JS shared by all             89.7 kB
  ├ chunks/framework-8051a8b17472378c.js  45.2 kB
  ├ chunks/main-386d6319e61b79bf.js       36.6 kB
  └ other shared chunks (total)           7.83 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

```


## git diff --name-only
```
```


## git diff --cached --name-only || true
```
apps/admin-ui/components/GuildActionsMobile.jsx
apps/admin-ui/components/Layout.js
apps/admin-ui/lib/active-guild.js
apps/admin-ui/lib/session.js
apps/admin-ui/pages/club/[guildId]/channels.js
apps/admin-ui/pages/club/[guildId]/corrections.js
apps/admin-ui/pages/club/[guildId]/index.js
apps/admin-ui/pages/club/[guildId]/personality.js
apps/admin-ui/pages/club/[guildId]/rescan.js
apps/admin-ui/pages/club/[guildId]/settings.js
apps/admin-ui/pages/club/[guildId]/usage.js
apps/admin-ui/pages/club/index.js
apps/admin-ui/pages/guilds/[guildId]/[[...rest]].js
apps/admin-ui/pages/guilds/index.js
apps/admin-ui/pages/snail/[guildId]/index.js
apps/admin-ui/pages/snail/index.js
docs/buglog/BUG_2025-12-21_admin-domain-ui-oauth-and-routes.md
```


## git diff --cached --name-only
```
apps/admin-ui/components/GuildActionsMobile.jsx
apps/admin-ui/components/Layout.js
apps/admin-ui/lib/active-guild.js
apps/admin-ui/lib/session.js
apps/admin-ui/pages/club/[guildId]/channels.js
apps/admin-ui/pages/club/[guildId]/corrections.js
apps/admin-ui/pages/club/[guildId]/index.js
apps/admin-ui/pages/club/[guildId]/personality.js
apps/admin-ui/pages/club/[guildId]/rescan.js
apps/admin-ui/pages/club/[guildId]/settings.js
apps/admin-ui/pages/club/[guildId]/usage.js
apps/admin-ui/pages/club/index.js
apps/admin-ui/pages/guilds/[guildId]/[[...rest]].js
apps/admin-ui/pages/guilds/index.js
apps/admin-ui/pages/snail/[guildId]/index.js
apps/admin-ui/pages/snail/index.js
docs/buglog/BUG_2025-12-21_admin-domain-ui-oauth-and-routes.md
```


## git commit -m 'stability: oauth redirect + guild gate verification'
```
npm warn Unknown env config "verify-deps-before-run". This will stop working in the next major version of npm.
npm warn Unknown env config "npm-globalconfig". This will stop working in the next major version of npm.
npm warn Unknown env config "_jsr-registry". This will stop working in the next major version of npm.
[STARTED] Backing up original state...
[COMPLETED] Backed up original state in git stash (9a62105)
[STARTED] Running tasks for staged files...
[STARTED] package.json — 17 files
[STARTED] *.{ts,tsx,js,jsx} — 16 files
[STARTED] pnpm exec eslint --fix
[FAILED] pnpm exec eslint --fix [FAILED]
[FAILED] pnpm exec eslint --fix [FAILED]
[COMPLETED] Running tasks for staged files...
[STARTED] Applying modifications from tasks...
[SKIPPED] Skipped because of errors from tasks.
[STARTED] Reverting to original state because of errors...
[COMPLETED] Reverting to original state because of errors...
[STARTED] Cleaning up temporary files...
[COMPLETED] Cleaning up temporary files...

✖ pnpm exec eslint --fix:

/opt/slimy/slimy-monorepo/apps/admin-ui/pages/snail/[guildId]/index.js
  280:3  error  'useEffect' is not defined  no-undef
  364:3  error  'useEffect' is not defined  no-undef
  427:3  error  'useEffect' is not defined  no-undef

✖ 3 problems (3 errors, 0 warnings)

husky - pre-commit script failed (code 1)
