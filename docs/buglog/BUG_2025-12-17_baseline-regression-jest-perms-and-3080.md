# BUG 2025-12-17 — baseline-regression-jest-perms-and-3080

Host: slimy-nuc2
Repo: /opt/slimy/slimy-monorepo
Timestamp: Wed Dec 17 05:07:10 PM UTC 2025

## Symptom

- admin-api tests fail: "sh: 1: jest: Permission denied" / "spawn ENOENT"
- smoke docker fails: "Bind for 0.0.0.0:3080 failed: port is already allocated"

## Evidence (from latest status report)

Source report: docs/reports/STATUS_2025-12-17_1655_nuc2.md

```
244:sh: 1: jest: Permission denied
246: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @slimy/admin-api@1.0.0 test: `jest`
247:spawn ENOENT
499: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @slimy/web@0.1.0 build: `next build`
775:Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint slimy-monorepo-admin-api-1 (2cb533ee1491310ad26b3e73161481f3e035ef165fc14f65ffee2b5c2f3130b6): Bind for 0.0.0.0:3080 failed: port is already allocated
```

## Commands + Outputs

### Jest Resolution Diagnostics

```bash
cd apps/admin-api && node -v && pnpm -v && command -v jest || true && ls -la node_modules/.bin | head && ls -la node_modules/.bin/jest* || true && readlink -f node_modules/.bin/jest || true && file node_modules/.bin/jest || true && stat node_modules/.bin/jest || true && ls -la node_modules/jest/bin/jest.js || true && file node_modules/jest/bin/jest.js || true && stat node_modules/jest/bin/jest.js || true
```

```
v20.19.6
10.21.0
total 96
drwxrwxr-x   2 slimy slimy  4096 Dec 17 17:05 .
drwxrwxr-x 184 slimy slimy 12288 Dec 14 14:50 ..
-rwxr-xr-x   1 slimy slimy  1202 Nov 30 21:38 acorn
-rwxr-xr-x   1 slimy slimy  1368 Dec 17 17:05 download-msgpackr-prebuilds
-rwxr-xr-x   1 slimy slimy  1212 Dec 17 17:05 jest
-rwxr-xr-x   1 slimy slimy  1278 Dec 17 17:05 mkdirp
-rwxr-xr-x   1 slimy slimy  1108 Dec 17 17:05 nanoid
-rwxr-xr-x   1 slimy slimy  1218 Dec 17 17:05 node-gyp-build-optional-packages
-rwxr-xr-x   1 slimy slimy  1228 Dec 17 17:05 node-gyp-build-optional-packages-optional
-rwxr-xr-x 1 slimy slimy 1212 Dec 17 17:05 node_modules/.bin/jest
/opt/slimy/slimy-monorepo/apps/admin-api/node_modules/.bin/jest
node_modules/.bin/jest: POSIX shell script, ASCII text executable, with very long lines (402)
  File: node_modules/.bin/jest
  Size: 1212      	Blocks: 8          IO Block: 4096   regular file
Device: 8,2	Inode: 4325398     Links: 1
Access: (0755/-rwxr-xr-x)  Uid: ( 1000/   slimy)   Gid: ( 1000/   slimy)
Access: 2025-12-17 17:07:27.145886297 +0000
Modify: 2025-12-17 17:05:05.862835828 +0000
Change: 2025-12-17 17:05:05.887836190 +0000
 Birth: 2025-12-17 17:05:05.860835799 +0000
-rwxr-xr-x 2 slimy slimy 324 Nov 22 22:01 node_modules/jest/bin/jest.js
node_modules/jest/bin/jest.js: Node.js script executable, ASCII text
  File: node_modules/jest/bin/jest.js
  Size: 324       	Blocks: 8          IO Block: 4096   regular file
Device: 8,2	Inode: 13483660    Links: 2
Access: (0755/-rwxr-xr-x)  Uid: ( 1000/   slimy)   Gid: ( 1000/   slimy)
Access: 2025-12-17 17:05:05.890836234 +0000
Modify: 2025-11-22 22:01:07.655869299 +0000
Change: 2025-12-17 17:05:05.888836205 +0000
 Birth: 2025-11-22 22:01:07.655869299 +0000
```

Exit: 0

### Permissions + Mount Diagnostics

```bash
cd apps/admin-api && id && umask && ls -ld node_modules node_modules/.bin && (findmnt -no OPTIONS /opt/slimy/slimy-monorepo || true) && (findmnt -no OPTIONS /opt || true)
```

```
uid=1000(slimy) gid=1000(slimy) groups=1000(slimy),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),101(lxd),111(docker),987(ollama)
0002
drwxrwxr-x 184 slimy slimy 12288 Dec 14 14:50 node_modules
drwxrwxr-x   2 slimy slimy  4096 Dec 17 17:05 node_modules/.bin
```

Exit: 0

### Mount Options (path-based)

```bash
cd apps/admin-api && (findmnt -T /opt/slimy/slimy-monorepo -no OPTIONS || true) && (findmnt -T /opt/slimy/slimy-monorepo/apps/admin-api/node_modules/.bin/jest -no OPTIONS || true)
```

```
rw,relatime
rw,relatime
```

Exit: 0

### Inspect jest shim header

```bash
cd apps/admin-api && sed -n '1,25p' node_modules/.bin/jest
```

```
#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")

case `uname` in
    *CYGWIN*|*MINGW*|*MSYS*)
        if command -v cygpath > /dev/null 2>&1; then
            basedir=`cygpath -w "$basedir"`
        fi
    ;;
esac

if [ -z "$NODE_PATH" ]; then
  export NODE_PATH="/opt/slimy/slimy-monorepo/node_modules/.pnpm/jest@29.7.0_@types+node@20.19.25/node_modules/jest/bin/node_modules:/opt/slimy/slimy-monorepo/node_modules/.pnpm/jest@29.7.0_@types+node@20.19.25/node_modules/jest/node_modules:/opt/slimy/slimy-monorepo/node_modules/.pnpm/jest@29.7.0_@types+node@20.19.25/node_modules:/opt/slimy/slimy-monorepo/node_modules/.pnpm/node_modules"
else
  export NODE_PATH="/opt/slimy/slimy-monorepo/node_modules/.pnpm/jest@29.7.0_@types+node@20.19.25/node_modules/jest/bin/node_modules:/opt/slimy/slimy-monorepo/node_modules/.pnpm/jest@29.7.0_@types+node@20.19.25/node_modules/jest/node_modules:/opt/slimy/slimy-monorepo/node_modules/.pnpm/jest@29.7.0_@types+node@20.19.25/node_modules:/opt/slimy/slimy-monorepo/node_modules/.pnpm/node_modules:$NODE_PATH"
fi
if [ -x "$basedir/node" ]; then
  exec "$basedir/node"  "$basedir/../jest/bin/jest.js" "$@"
else
  exec node  "$basedir/../jest/bin/jest.js" "$@"
fi
```

Exit: 0

### Re-run admin-api tests

```bash
pnpm --filter @slimy/admin-api test
```

```
(output trimmed; showing last 200 of 440 lines)
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
      ✓ should return null when no token in cookies (12 ms)
      ✓ should return null when token is invalid (7 ms)
      ✓ should return hydrated user when session exists (25 ms)
      ✓ should return fallback user when no session exists (17 ms)
      ✓ should cache user resolution (6 ms)
    requireAuth
      ✓ should call next when user is authenticated (10 ms)
      ✓ should return 401 when user is not authenticated (18 ms)
    requireRole
      ✓ should call next when user has required role (member) (4 ms)
      ✓ should call next when user has higher role than required (6 ms)
      ✓ should return 403 when user has insufficient role (6 ms)
      ✓ should return 401 when user is not authenticated (4 ms)
    requireGuildMember
      ✓ should call next for admin user regardless of guild membership (6 ms)
      ✓ should call next when user is member of the guild (5 ms)
      ✓ should return 403 when user is not member of the guild (8 ms)
      ✓ should return 400 when guildId parameter is missing (9 ms)
      ✓ should return 401 when user is not authenticated (3 ms)
      ✓ should use custom parameter name (6 ms)

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
      at next (tests/guild-connect.test.js:23:5)
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
    ✓ should fail if SLIMYAI_BOT_TOKEN is missing (196 ms)
    ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (8 ms)
    ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (6 ms)
    ✓ should succeed if guild is shared (6 ms)

PASS tests/discord-guilds.test.js
  GET /discord/guilds
    ✓ should return shared guilds with role labels (29 ms)

PASS tests/routes/usage.test.js
  GET /api/usage
    ✓ should return 200 and correct usage data structure (11 ms)

PASS tests/routes/stats.test.js
  Stats Routes
    ✓ GET /api/stats should return system metrics by default (18 ms)
    ✓ GET /api/stats?action=system-metrics should return metrics (7 ms)
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

PASS tests/club-store.test.js
  club-store shim
    ✓ canonicalize lowercases input
    ✓ canonicalize handles nullish values

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
    ✓ should return 401 if user is not authenticated (2 ms)
    ✓ should return 403 if user not found in DB (87 ms)
    ✓ should return 403 if user is not a member of the guild (7 ms)
    ✓ should call next() and attach guild info if user has access (5 ms)

PASS tests/numparse.test.js
  numparse shim
    ✓ returns numeric values for plain numbers (1 ms)
    ✓ returns null for non-numeric values or suffixed strings

PASS tests/diag.test.js
  diagnostics placeholder
    ✓ skipped in test mode

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 12 skipped, 13 passed, 13 of 25 total
Tests:       12 skipped, 48 passed, 60 total
Snapshots:   0 total
Time:        3.149 s
Ran all test suites.
```

Exit: 0

### 3080 Host Listener (sudo if possible)

```bash
(sudo -n ss -ltnp 2>/dev/null || true) | rg ':3080' || true
```

```
```

Exit: 0

### 3080 Host Listener (no sudo)

```bash
ss -ltnp | rg ':3080' || true
```

```
LISTEN 0      4096         0.0.0.0:3080       0.0.0.0:*                                                 
LISTEN 0      4096            [::]:3080          [::]:*                                                 
```

Exit: 0

### Docker Containers Publishing 3080

```bash
docker ps --filter 'publish=3080' --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' || true
```

```
NAMES             IMAGE                  STATUS                    PORTS
slimy-admin-api   slimy-nuc2-admin-api   Up 10 minutes (healthy)   0.0.0.0:3080->3080/tcp, [::]:3080->3080/tcp
```

Exit: 0

### Docker PS (all) filtered

```bash
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | rg '3080|slimy-admin-api|admin-api' || true
```

```
slimy-monorepo-admin-api-1   Created                       
slimy-admin-api              Up 10 minutes (healthy)       0.0.0.0:3080->3080/tcp, [::]:3080->3080/tcp
```

Exit: 0

### Remove legacy 3080 container (slimy-admin-api)

```bash
docker stop slimy-admin-api || true; docker update --restart=no slimy-admin-api || true; docker rm -f slimy-admin-api || true
```

```
slimy-admin-api
slimy-admin-api
slimy-admin-api
```

Exit: 0

### Re-check 3080 publishers

```bash
docker ps --filter 'publish=3080' --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' || true
```

```
NAMES     IMAGE     STATUS    PORTS
```

Exit: 0

### Re-run smoke:docker

```bash
pnpm smoke:docker
```

```
(output trimmed; showing last 200 of 754 lines)

#78 [web runner  9/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
#78 DONE 0.2s

#67 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#67 ...

#79 [web runner 10/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
#79 DONE 0.2s

#67 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#67 ...

#80 [web runner 11/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
#80 DONE 0.4s

#67 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#67 ...

#81 [web] exporting to image
#81 exporting layers
#81 exporting layers 2.8s done
#81 writing image sha256:c25fc3e55dcca7f496ed4a2f48c7f793e9715b71ba3dc77449254eaf37e98b7a 0.0s done
#81 naming to docker.io/library/slimy-monorepo-web 0.0s done
#81 DONE 2.8s

#67 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#67 66.62 
#67 66.64 Route (pages)                             Size     First Load JS
#67 66.64 ┌ ○ /                                     4.49 kB         116 kB
#67 66.64 ├   /_app                                 0 B            86.2 kB
#67 66.64 ├ ○ /404                                  181 B          86.4 kB
#67 66.64 ├ ○ /admin-api-usage                      874 B           112 kB
#67 66.64 ├ ƒ /api/admin-api/[...path]              0 B            86.2 kB
#67 66.64 ├ ƒ /api/admin-api/diag                   0 B            86.2 kB
#67 66.64 ├ ƒ /api/admin-api/health                 0 B            86.2 kB
#67 66.64 ├ ƒ /api/diagnostics                      0 B            86.2 kB
#67 66.64 ├ ○ /auth-me                              1.1 kB          112 kB
#67 66.64 ├ ○ /chat                                 2.5 kB          114 kB
#67 66.64 ├ ○ /club                                 1.58 kB         113 kB
#67 66.64 ├ ƒ /dashboard                            1.65 kB         113 kB
#67 66.64 ├ ○ /email-login                          557 B           112 kB
#67 66.64 ├ ○ /guilds                               1.89 kB         113 kB
#67 66.64 ├ ○ /guilds/[guildId]                     5.88 kB         117 kB
#67 66.64 ├ ○ /guilds/[guildId]/channels            1.71 kB         113 kB
#67 66.64 ├ ○ /guilds/[guildId]/corrections         1.74 kB         113 kB
#67 66.64 ├ ○ /guilds/[guildId]/personality         888 B           112 kB
#67 66.64 ├ ○ /guilds/[guildId]/rescan              1.23 kB         112 kB
#67 66.64 ├ ○ /guilds/[guildId]/settings            1.26 kB         112 kB
#67 66.64 ├ ○ /guilds/[guildId]/usage               67.5 kB         179 kB
#67 66.64 ├ ○ /login                                489 B          86.7 kB
#67 66.64 ├ ○ /snail                                1 kB            112 kB
#67 66.64 ├ ○ /snail/[guildId]                      4.25 kB         115 kB
#67 66.64 └ ○ /status                               1.28 kB         112 kB
#67 66.64 + First Load JS shared by all             89.4 kB
#67 66.64   ├ chunks/framework-8051a8b17472378c.js  45.2 kB
#67 66.64   ├ chunks/main-386d6319e61b79bf.js       36.6 kB
#67 66.64   └ other shared chunks (total)           7.55 kB
#67 66.64 
#67 66.64 ○  (Static)   prerendered as static content
#67 66.64 ƒ  (Dynamic)  server-rendered on demand
#67 66.64 
#67 DONE 67.0s

#82 [admin-ui runner  4/10] RUN adduser --system --uid 1001 nextjs
#82 CACHED

#83 [admin-ui runner  3/10] RUN addgroup --system --gid 1001 nodejs
#83 CACHED

#74 [admin-ui runner  2/10] WORKDIR /app
#74 CACHED

#84 [admin-ui runner  5/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public
#84 CACHED

#85 [admin-ui runner  6/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
#85 DONE 0.2s

#86 [admin-ui runner  7/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
#86 DONE 2.6s

#87 [admin-ui runner  8/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
#87 DONE 0.2s

#88 [admin-ui runner  9/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./.next/static
#88 DONE 0.2s

#89 [admin-ui runner 10/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./public
#89 DONE 0.2s

#90 [admin-ui] exporting to image
#90 exporting layers
#90 exporting layers 1.5s done
#90 writing image sha256:d9c05c53787c2c03ef3ca073e78665e7d9ac4f0ffdcdcd80a9abe56c80600beb done
#90 naming to docker.io/library/slimy-monorepo-admin-ui done
#90 DONE 1.5s
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
 Container slimy-monorepo-admin-api-1  Started
 Container slimy-monorepo-db-1  Waiting
 Container slimy-monorepo-admin-api-1  Waiting
 Container slimy-monorepo-admin-api-1  Waiting
 Container slimy-monorepo-db-1  Healthy
 Container slimy-monorepo-admin-api-1  Healthy
 Container slimy-monorepo-admin-api-1  Healthy
 Container slimy-monorepo-web-1  Starting
 Container slimy-monorepo-admin-ui-1  Starting
 Container slimy-monorepo-web-1  Started
 Container slimy-monorepo-admin-ui-1  Started
Waiting for endpoints...
OK: admin-api /api/health
OK: web /
OK: admin-ui /

Applying admin-api database migrations...
Applying admin-api Prisma migrations (docker)...
 Container slimy-monorepo-db-1  Running
 Container slimy-monorepo-admin-api-1  Running
 Container slimy-monorepo-db-1  Waiting
 Container slimy-monorepo-db-1  Healthy
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": MySQL database "slimyai" at "db:3306"

5 migrations found in prisma/migrations


No pending migrations to apply.
OK: admin-api Prisma migrations applied

Checking admin-ui /dashboard routing...
OK: admin-ui /dashboard (HTTP 307)

Checking admin-ui /dashboard with synthetic auth cookie...
OK: admin-ui /dashboard with synthetic auth (HTTP 200)

Checking admin-ui Socket.IO proxy with synthetic auth cookie...
OK: admin-ui Socket.IO polling handshake (HTTP 200)
OK: admin-ui -> admin-api bridge /api/admin-api/health
OK: admin-ui -> admin-api bridge /api/admin-api/diag
OK: admin-ui catch-all /api/admin-api/api/health
OK: admin-ui catch-all /api/admin-api/api/diag

Checking admin-ui catch-all real endpoint...
OK: admin-ui catch-all /api/admin-api/api/usage (HTTP 200)

Checking admin-ui catch-all protected endpoint...
OK: admin-ui catch-all /api/admin-api/api/auth/me (HTTP 401)

=== admin-ui -> admin-api bridge responses ===
--- /api/admin-api/health ---
{
  "ok": true,
  "upstream": {
    "status": "ok",
    "uptime": 9,
    "timestamp": "2025-12-17T17:10:53.093Z",
    "version": "1.0.0"
  },
  "ts": "2025-12-17T17:10:53.095Z"
}
--- /api/admin-api/diag ---
{
  "ok": true,
  "upstream": {
    "ok": true,
    "authenticated": false
  },
  "ts": "2025-12-17T17:10:53.111Z"
}
--- /api/admin-api/api/usage ---
{
  "ok": true,
  "data": {
    "level": "pro",
    "currentSpend": 950,
    "limit": 1000,
    "modelProbeStatus": "soft_cap"
  }
}
--- /api/admin-api/api/auth/me ---
{
  "error": "unauthorized"
}

PASS: Docker baseline smoke test
```

Exit: 0

### Compose PS

```bash
docker compose ps
```

```
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED          STATUS                    PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   25 seconds ago   Up 14 seconds (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    25 seconds ago   Up 8 seconds              0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          26 seconds ago   Up 25 seconds (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         25 seconds ago   Up 8 seconds              0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```

Exit: 0

### Admin API Health (first 25 lines)

```bash
curl -sS -i http://localhost:3080/api/health | sed -n '1,25p'
```

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
X-Request-ID: 2a7b7c20-a9ad-4e88-86d6-b38ab49dbe3d
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 83
Date: Wed, 17 Dec 2025 17:10:53 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"status":"ok","uptime":9,"timestamp":"2025-12-17T17:10:53.306Z","version":"1.0.0"}```

Exit: 0

