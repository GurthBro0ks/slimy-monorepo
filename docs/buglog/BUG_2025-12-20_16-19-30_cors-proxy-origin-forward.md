# CORS + Proxy Origin Forwarding
- Timestamp: 2025-12-20T16:19:30+00:00
- Repo: /opt/slimy/slimy-monorepo
- Branch: nuc2/verify-role-b33e616

## Symptom
- Proxy forwards cookies but not Origin; admin-api CORS reflection may be misleading/inconsistent.

## Plan
1) Add Origin/Referer forwarding in admin-ui proxy.
2) Verify CORS reflection directly to admin-api and through proxy.
3) Run tests/build.
4) Commit/push only intended files.


## git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M apps/admin-api/src/app.js
 M apps/admin-api/tests/auth/auth-middleware.test.js
 M apps/admin-ui/lib/session.js
 M apps/admin-ui/package.json
 M apps/admin-ui/pages/api/auth/discord/authorize-url.js
 M apps/admin-ui/pages/guilds/index.js
 M apps/web/Caddyfile.template
 M docker-compose.yml
 M infra/docker/Caddyfile.slimy-nuc2
 M scripts/smoke/stability-gate.sh
?? apps/admin-ui/lib/settings-tabs.js
?? apps/admin-ui/pages/settings.js
?? apps/admin-ui/tests/
?? docs/buglog/BUG_2025-12-20_16-19-30_cors-proxy-origin-forward.md
?? docs/buglog/BUG_2025-12-20_admin-domain-oauth-redirect-uri.md
?? docs/buglog/BUG_2025-12-20_settings-tabs-gated-guild.md
?? docs/ops/REPORT_2025-12-20_15-59-44_cors-proxy-audit.md
?? docs/reports/REPORT_2025-12-19_admin-subdomain-structure.md
```


## git diff --stat
```
 apps/admin-api/src/app.js                          | 35 +++++++++++++++---
 apps/admin-api/tests/auth/auth-middleware.test.js  | 24 ++++++-------
 apps/admin-ui/lib/session.js                       |  1 +
 apps/admin-ui/package.json                         |  2 +-
 .../pages/api/auth/discord/authorize-url.js        | 41 ++++++++++++++--------
 apps/admin-ui/pages/guilds/index.js                | 17 ++++++++-
 apps/web/Caddyfile.template                        | 11 ++----
 docker-compose.yml                                 |  2 ++
 infra/docker/Caddyfile.slimy-nuc2                  |  5 ++-
 scripts/smoke/stability-gate.sh                    |  2 +-
 10 files changed, 98 insertions(+), 42 deletions(-)
```


## nl -ba apps/admin-ui/pages/api/admin-api/'[...path]'.js | sed -n '70,170p'
```
    70	  const ts = new Date().toISOString();
    71	
    72	  const raw = req.query?.path;
    73	  const pathSegments = Array.isArray(raw) ? raw : raw ? [raw] : [];
    74	
    75	  if (pathSegments.length === 0) {
    76	    res.status(400).json({ ok: false, error: "missing_path", ts });
    77	    return;
    78	  }
    79	
    80	  if (pathSegments[0] !== "api") {
    81	    res.status(400).json({ ok: false, error: "only_api_paths_allowed", ts });
    82	    return;
    83	  }
    84	
    85	  if (pathSegments.some((seg) => seg === "..")) {
    86	    res.status(400).json({ ok: false, error: "path_traversal_blocked", ts });
    87	    return;
    88	  }
    89	
    90	  const baseUrl = String(base).replace(/\/$/, "");
    91	  const forwardPath = `/${pathSegments.join("/")}`;
    92	  const queryString = getQueryString(req.url);
    93	  const targetUrl = `${baseUrl}${forwardPath}${queryString}`;
    94	
    95	  const method = String(req.method || "GET").toUpperCase();
    96	  const cookie = req.headers.cookie || "";
    97	  const contentType = req.headers["content-type"] || "";
    98	  const accept = req.headers.accept || "";
    99	  const csrfToken = req.headers["x-csrf-token"] || "";
   100	  const forwardedHost = firstHeaderValue(req.headers["x-forwarded-host"]) || firstHeaderValue(req.headers.host);
   101	  const forwardedProto =
   102	    firstHeaderValue(req.headers["x-forwarded-proto"]) || (req.socket?.encrypted ? "https" : "http");
   103	  const forwardedPort =
   104	    firstHeaderValue(req.headers["x-forwarded-port"]) ||
   105	    (forwardedHost && forwardedHost.includes(":") ? forwardedHost.split(":").pop() : "");
   106	
   107	  // Extract active guild ID from cookie to forward as header
   108	  const activeGuildCookie = (cookie || "")
   109	    .split(";")
   110	    .map((c) => c.trim())
   111	    .find((c) => c.startsWith("slimy_admin_active_guild_id="));
   112	  const activeGuildId = activeGuildCookie
   113	    ? decodeURIComponent(activeGuildCookie.split("=")[1] || "").trim()
   114	    : "";
   115	
   116	  const headers = {
   117	    ...(cookie ? { cookie } : null),
   118	    ...(contentType ? { "content-type": contentType } : null),
   119	    ...(accept ? { accept } : null),
   120	    ...(csrfToken ? { "x-csrf-token": csrfToken } : null),
   121	    ...(forwardedHost ? { "x-forwarded-host": forwardedHost } : null),
   122	    ...(forwardedProto ? { "x-forwarded-proto": forwardedProto } : null),
   123	    ...(forwardedPort ? { "x-forwarded-port": forwardedPort } : null),
   124	    ...(activeGuildId ? { "x-slimy-active-guild-id": activeGuildId } : null),
   125	  };
   126	
   127	  const cookieNames = extractCookieNames(cookie);
   128	  res.setHeader("x-slimy-proxy-has-cookie", cookie ? "1" : "0");
   129	  res.setHeader("x-slimy-proxy-cookie-names", cookieNames.join(","));
   130	
   131	  try {
   132	    const init = {
   133	      method,
   134	      headers,
   135	      redirect: "manual",
   136	    };
   137	
   138	    if (METHODS_WITH_BODY.has(method) && req.body !== undefined) {
   139	      const hasBuffer = typeof globalThis.Buffer !== "undefined";
   140	      const isBuffer =
   141	        hasBuffer && typeof globalThis.Buffer.isBuffer === "function"
   142	          ? globalThis.Buffer.isBuffer(req.body)
   143	          : false;
   144	
   145	      if (typeof req.body === "string" || isBuffer) {
   146	        init.body = req.body;
   147	      } else {
   148	        init.body = JSON.stringify(req.body);
   149	        if (!headers["content-type"]) headers["content-type"] = "application/json";
   150	      }
   151	    }
   152	
   153	    const upstreamRes = await globalThis.fetch(targetUrl, init);
   154	
   155	    const upstreamContentType = upstreamRes.headers.get("content-type") || "";
   156	    const location = upstreamRes.headers.get("location") || "";
   157	
   158	    const setCookies =
   159	      typeof upstreamRes.headers.getSetCookie === "function"
   160	        ? upstreamRes.headers.getSetCookie()
   161	        : [];
   162	    const setCookieFallback = upstreamRes.headers.get("set-cookie") || "";
   163	    const setCookieParsed = !setCookies.length && setCookieFallback
   164	      ? splitSetCookieHeader(setCookieFallback)
   165	      : [];
   166	
   167	    if (upstreamContentType) res.setHeader("content-type", upstreamContentType);
   168	    if (location) res.setHeader("location", location);
   169	    if (setCookies.length) res.setHeader("set-cookie", setCookies);
   170	    else if (setCookieParsed.length) res.setHeader("set-cookie", setCookieParsed);
```


## git diff -- apps/admin-ui/pages/api/admin-api/'[...path]'.js | sed -n '1,220p'
```
diff --git a/apps/admin-ui/pages/api/admin-api/[...path].js b/apps/admin-ui/pages/api/admin-api/[...path].js
index 9024163..4a70948 100644
--- a/apps/admin-ui/pages/api/admin-api/[...path].js
+++ b/apps/admin-ui/pages/api/admin-api/[...path].js
@@ -96,6 +96,8 @@ export default async function handler(req, res) {
   const cookie = req.headers.cookie || "";
   const contentType = req.headers["content-type"] || "";
   const accept = req.headers.accept || "";
+  const origin = req.headers.origin || "";
+  const referer = req.headers.referer || "";
   const csrfToken = req.headers["x-csrf-token"] || "";
   const forwardedHost = firstHeaderValue(req.headers["x-forwarded-host"]) || firstHeaderValue(req.headers.host);
   const forwardedProto =
@@ -117,6 +119,8 @@ export default async function handler(req, res) {
     ...(cookie ? { cookie } : null),
     ...(contentType ? { "content-type": contentType } : null),
     ...(accept ? { accept } : null),
+    ...(origin ? { origin } : null),
+    ...(referer ? { referer } : null),
     ...(csrfToken ? { "x-csrf-token": csrfToken } : null),
     ...(forwardedHost ? { "x-forwarded-host": forwardedHost } : null),
     ...(forwardedProto ? { "x-forwarded-proto": forwardedProto } : null),
```


## docker compose up -d --build admin-api admin-ui
```

## docker compose up -d --build admin-api admin-ui
```

## docker compose up -d --build admin-api admin-ui
```

## docker compose up -d --build --progress plain admin-api admin-ui
```
unknown flag: --progress
--progress is a global compose flag, better use `docker compose --progress xx build ...
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
#5 transferring context: 664.89kB 0.1s done
#5 DONE 0.2s

#6 [admin-api deps 6/7] COPY apps/admin-api/vendor/ ./apps/admin-api/vendor/
#6 CACHED

#7 [admin-api deps 7/7] RUN pnpm install --frozen-lockfile --filter @slimy/admin-api...
#7 CACHED

#8 [admin-api deps 5/7] COPY apps/admin-api/package.json ./apps/admin-api/
#8 CACHED

#9 [admin-api deps 4/7] COPY packages/ ./packages/
#9 CACHED

#10 [admin-api builder 2/2] RUN cd apps/admin-api && pnpm prisma:generate
#10 CACHED

#11 [admin-api base 3/3] WORKDIR /app
#11 CACHED

#12 [admin-api runner 12/14] COPY apps/admin-api/src ./apps/admin-api/src
#12 CACHED

#13 [admin-api runner  9/14] COPY --from=deps /app/apps/admin-api/vendor ./apps/admin-api/vendor
#13 CACHED

#14 [admin-api runner 13/14] COPY apps/admin-api/server.js ./apps/admin-api/server.js
#14 CACHED

#15 [admin-api runner  6/14] COPY --from=deps /app/node_modules ./node_modules
#15 CACHED

#16 [admin-api runner  4/14] COPY --from=deps /app/pnpm-workspace.yaml ./
#16 CACHED

#17 [admin-api deps 3/7] COPY package.json ./
#17 CACHED

#18 [admin-api runner  5/14] COPY --from=deps /app/package.json ./
#18 CACHED

#19 [admin-api deps 1/7] COPY pnpm-workspace.yaml ./
#19 CACHED

#20 [admin-api runner 11/14] COPY apps/admin-api/ ./apps/admin-api/
#20 CACHED

#21 [admin-api base 2/3] RUN npm install -g pnpm@latest
#21 CACHED

#22 [admin-api runner  7/14] COPY --from=deps /app/packages ./packages
#22 CACHED

#23 [admin-api runner 10/14] COPY --from=builder /app/apps/admin-api/node_modules/.prisma ./apps/admin-api/node_modules/.prisma
#23 CACHED

#24 [admin-api runner  8/14] COPY --from=deps /app/apps/admin-api/node_modules ./apps/admin-api/node_modules
#24 CACHED

#25 [admin-api builder 1/2] COPY apps/admin-api/prisma/ ./apps/admin-api/prisma/
#25 CACHED

#26 [admin-api deps 2/7] COPY pnpm-lock.yaml ./
#26 CACHED

#27 [admin-api runner 14/14] WORKDIR /app/apps/admin-api
#27 CACHED

#28 [admin-api] exporting to image
#28 exporting layers done
#28 writing image sha256:494a54b788a5690022d0a6998031e8f8c44603877e1a7c71bb600f94a8416ae2 done
#28 naming to docker.io/library/slimy-monorepo-admin-api done
#28 DONE 0.0s

#29 [admin-ui internal] load build definition from Dockerfile
#29 transferring dockerfile: 3.27kB done
#29 DONE 0.0s

#30 [admin-ui internal] load metadata for docker.io/library/node:22-slim
#30 DONE 0.1s

#31 [admin-ui internal] load .dockerignore
#31 transferring context: 2.44kB done
#31 DONE 0.0s

#32 [admin-ui base 1/3] FROM docker.io/library/node:22-slim@sha256:773413f36941ce1e4baf74b4a6110c03dcc4f968daffc389d4caef3f01412d2a
#32 DONE 0.0s

#33 [admin-ui internal] load build context
#33 transferring context: 49.88MB 0.5s done
#33 DONE 0.5s

#34 [admin-ui base 3/3] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#34 CACHED

#35 [admin-ui deps 7/9] COPY apps/web/package.json ./apps/web/
#35 CACHED

#36 [admin-ui deps 8/9] COPY apps/bot/package.json ./apps/bot/
#36 CACHED

#37 [admin-ui base 2/3] RUN apt-get update -y && apt-get install -y openssl
#37 CACHED

#38 [admin-ui deps 6/9] COPY apps/admin-api/vendor ./apps/admin-api/vendor
#38 CACHED

#39 [admin-ui deps 4/9] COPY apps/admin-ui/package.json ./apps/admin-ui/
#39 CACHED

#40 [admin-ui deps 3/9] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#40 CACHED

#41 [admin-ui deps 1/9] WORKDIR /app
#41 CACHED

#42 [admin-ui deps 2/9] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#42 CACHED

#43 [admin-ui deps 5/9] COPY apps/admin-api/package.json ./apps/admin-api/
#43 CACHED

#44 [admin-ui deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#44 CACHED

#42 [admin-ui deps 2/9] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#42 CACHED

#45 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#45 DONE 95.7s

#46 [admin-ui builder 4/8] COPY apps/admin-ui ./apps/admin-ui
#46 DONE 1.5s

#47 [admin-ui builder 5/8] COPY packages ./packages
#47 DONE 0.2s

#48 [admin-ui builder 6/8] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#48 DONE 0.2s

#49 [admin-ui builder 7/8] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#49 4.483 Scope: all 7 workspace projects
#49 4.483 Lockfile is up to date, resolution step is skipped
#49 4.483 Already up to date
#49 4.483 
#49 4.483 ╭ Warning ─────────────────────────────────────────────────────────────────────╮
#49 4.483 │                                                                              │
#49 4.483 │   Ignored build scripts: msgpackr-extract.                                   │
#49 4.483 │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
#49 4.483 │   to run scripts.                                                            │
#49 4.483 │                                                                              │
#49 4.483 ╰──────────────────────────────────────────────────────────────────────────────╯
#49 4.483 
#49 4.483 . prepare$ husky
#49 4.483 . prepare: .git can't be found
#49 4.483 . prepare: Done
#49 4.483 Done in 4s using pnpm v10.22.0
#49 DONE 4.7s

#50 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#50 0.829 
#50 0.829 > @slimy/admin-ui@ build /app/apps/admin-ui
#50 0.829 > next build
#50 0.829 
#50 1.592 Attention: Next.js now collects completely anonymous telemetry regarding usage.
#50 1.593 This information is used to shape Next.js' roadmap and prioritize features.
#50 1.593 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
#50 1.593 https://nextjs.org/telemetry
#50 1.593 
#50 1.666   ▲ Next.js 14.2.5
#50 1.666   - Environments: .env.local
#50 1.666 
#50 1.667    Linting and checking validity of types ...
#50 4.585    Creating an optimized production build ...
#50 18.82  ✓ Compiled successfully
#50 18.82    Collecting page data ...
#50 20.09    Generating static pages (0/21) ...
#50 20.36    Generating static pages (5/21) 
#50 20.58    Generating static pages (10/21) 
#50 20.61    Generating static pages (15/21) 
#50 20.71  ✓ Generating static pages (21/21)
#50 23.05    Finalizing page optimization ...
#50 23.05    Collecting build traces ...
#50 50.22 
#50 50.23 Route (pages)                             Size     First Load JS
#50 50.23 ┌ ○ /                                     5.09 kB         118 kB
#50 50.23 ├   /_app                                 0 B            86.5 kB
#50 50.23 ├ ○ /404                                  181 B          86.7 kB
#50 50.23 ├ ○ /admin-api-usage                      876 B           114 kB
#50 50.23 ├ ƒ /api/admin-api/[...path]              0 B            86.5 kB
#50 50.23 ├ ƒ /api/admin-api/api/auth/login         0 B            86.5 kB
#50 50.23 ├ ƒ /api/admin-api/diag                   0 B            86.5 kB
#50 50.23 ├ ƒ /api/admin-api/health                 0 B            86.5 kB
#50 50.23 ├ ƒ /api/auth/discord/authorize-url       0 B            86.5 kB
#50 50.23 ├ ƒ /api/auth/discord/callback            0 B            86.5 kB
#50 50.23 ├ ƒ /api/diagnostics                      0 B            86.5 kB
#50 50.23 ├ ○ /auth-me                              1.08 kB         114 kB
#50 50.23 ├ ○ /chat                                 2.82 kB         116 kB
#50 50.23 ├ ○ /club                                 1.93 kB         115 kB
#50 50.23 ├ ƒ /dashboard                            1.66 kB         115 kB
#50 50.23 ├ ○ /email-login                          560 B           113 kB
#50 50.23 ├ ○ /guilds                               2.49 kB         115 kB
#50 50.23 ├ ○ /guilds/[guildId]                     5.88 kB         119 kB
#50 50.23 ├ ○ /guilds/[guildId]/channels            1.71 kB         115 kB
#50 50.23 ├ ○ /guilds/[guildId]/corrections         1.75 kB         115 kB
#50 50.23 ├ ○ /guilds/[guildId]/personality         890 B           114 kB
#50 50.23 ├ ○ /guilds/[guildId]/rescan              1.23 kB         114 kB
#50 50.23 ├ ○ /guilds/[guildId]/settings            1.26 kB         114 kB
#50 50.23 ├ ○ /guilds/[guildId]/usage               67.5 kB         180 kB
#50 50.23 ├ ○ /login                                781 B          89.8 kB
#50 50.23 ├ ○ /settings                             2.06 kB         115 kB
#50 50.23 ├ ○ /snail                                667 B           114 kB
#50 50.23 ├ ○ /snail/[guildId]                      4.45 kB         117 kB
#50 50.23 └ ○ /status                               1.26 kB         114 kB
#50 50.23 + First Load JS shared by all             89.7 kB
#50 50.23   ├ chunks/framework-8051a8b17472378c.js  45.2 kB
#50 50.23   ├ chunks/main-386d6319e61b79bf.js       36.6 kB
#50 50.23   └ other shared chunks (total)           7.83 kB
#50 50.24 
#50 50.24 ○  (Static)   prerendered as static content
#50 50.24 ƒ  (Dynamic)  server-rendered on demand
#50 50.24 
#50 DONE 50.7s

#51 [admin-ui runner  3/10] RUN addgroup --system --gid 1001 nodejs
#51 CACHED

#52 [admin-ui runner  2/10] WORKDIR /app
#52 CACHED

#53 [admin-ui runner  4/10] RUN adduser --system --uid 1001 nextjs
#53 CACHED

#54 [admin-ui runner  5/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public
#54 CACHED

#55 [admin-ui runner  6/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
#55 DONE 0.2s

#56 [admin-ui runner  7/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
#56 DONE 2.2s

#57 [admin-ui runner  8/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
#57 DONE 0.2s

#58 [admin-ui runner  9/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./.next/static
#58 DONE 0.2s

#59 [admin-ui runner 10/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./public
#59 DONE 0.2s

#60 [admin-ui] exporting to image
#60 exporting layers
#60 exporting layers 1.1s done
#60 writing image sha256:dcc7bf9b73d5d5ab9ff6b3feffd298d84b9cafebab84f4aeb7d42155aed6f147
#60 writing image sha256:dcc7bf9b73d5d5ab9ff6b3feffd298d84b9cafebab84f4aeb7d42155aed6f147 0.0s done
#60 naming to docker.io/library/slimy-monorepo-admin-ui done
#60 DONE 1.1s
admin-api-1  | [admin-api] Entrypoint file: /app/apps/admin-api/server.js
admin-api-1  | [database] Resolving @prisma/client: /app/apps/admin-api/node_modules/.prisma/client/index.js
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:25:51.335Z","pid":1,"hostname":"7e64cac4fbc0","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Configuration validated successfully"}
admin-api-1  | [INFO 2025-12-20T17:25:51.522Z] { env: 'development' } [admin-api] Booting in non-production mode
admin-api-1  | [database] Prisma middleware API unavailable; skipping query instrumentation
admin-api-1  | [database] Connected to MySQL database
admin-api-1  | [INFO 2025-12-20T17:25:51.614Z] [admin-api] Prisma database initialized successfully
admin-api-1  | !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!
admin-api-1  | [INFO 2025-12-20T17:25:53.933Z] { port: 3080, host: '0.0.0.0' } [admin-api] Listening on http://0.0.0.0:3080
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:25:56.209Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"cd8510c0-f05d-44ec-9525-bdbebe483351","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:25:56 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:25:56.213Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"cd8510c0-f05d-44ec-9525-bdbebe483351","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:25:56.231Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"cd8510c0-f05d-44ec-9525-bdbebe483351","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":22,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:25:56.233Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"cd8510c0-f05d-44ec-9525-bdbebe483351","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":20,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "z0codnrtgp2vn"
Content-Type: text/html; charset=utf-8
Content-Length: 3755
Vary: Accept-Encoding
Date: Sat, 20 Dec 2025 17:26:04 GMT
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
X-Request-ID: b1032682-a721-4035-a0a6-5ff8430b43a1
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 84
Date: Sat, 20 Dec 2025 17:26:04 GMT

## curl -sS -I -H 'Origin: http://localhost:3001' http://localhost:3080/api/health | sed -n '1,40p'
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
X-Request-ID: fca7c4f8-13f9-44ff-993c-f1fb4efe88f5
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 84
Date: Sat, 20 Dec 2025 17:26:31 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```


## curl -sS -I -H 'Origin: http://localhost:3001' http://localhost:3001/api/admin-api/api/health | sed -n '1,40p'
```
HTTP/1.1 200 OK
x-slimy-proxy-has-cookie: 0
x-slimy-proxy-cookie-names: 
Content-Type: application/json; charset=utf-8
ETag: "wm6yxsynvh4"
Content-Length: 4
Vary: Accept-Encoding
Date: Sat, 20 Dec 2025 17:26:31 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```

admin-api allow-origin: 
proxy    allow-origin: 
[FAIL] admin-api did not reflect Origin

---
## Starting reproduction + diagnosis
- Timestamp: 2025-12-20T17:35:15+00:00


## docker compose ps
```
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED         STATUS                   PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   9 minutes ago   Up 9 minutes (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    9 minutes ago   Up 9 minutes             0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          25 hours ago    Up 25 hours (healthy)    3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         22 hours ago    Up 22 hours              0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```


## docker compose logs --tail 80 admin-api
```
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:28:57.105Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"52ee0efe-7c5f-4861-8c81-6f6135c18a0b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:29:27.246Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"ae1348e2-6623-4176-a21f-9c11c3162507","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:29:27 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:29:27.247Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"ae1348e2-6623-4176-a21f-9c11c3162507","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:29:27.248Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"ae1348e2-6623-4176-a21f-9c11c3162507","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:29:27.248Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"ae1348e2-6623-4176-a21f-9c11c3162507","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:29:57.374Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"71168043-27b2-4a21-b92c-c561f895b69e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:29:57 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:29:57.374Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"71168043-27b2-4a21-b92c-c561f895b69e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:29:57.375Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"71168043-27b2-4a21-b92c-c561f895b69e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:29:57.375Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"71168043-27b2-4a21-b92c-c561f895b69e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:27.536Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"5f9450d1-a155-4f0c-a28f-11759181622e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:30:27 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:27.537Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"5f9450d1-a155-4f0c-a28f-11759181622e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:27.538Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"5f9450d1-a155-4f0c-a28f-11759181622e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:27.538Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"5f9450d1-a155-4f0c-a28f-11759181622e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:34.064Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"e25e9e2d-b51d-404e-bf0b-92d72a8322f8","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.22.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | [admin-api] /api/diag called { hasUser: false, userId: null }
admin-api-1  | 172.22.0.1 - - [20/Dec/2025:17:30:34 +0000] "GET /api/diag HTTP/1.1" 200 33 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:34.064Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"e25e9e2d-b51d-404e-bf0b-92d72a8322f8","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.22.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:34.068Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"e25e9e2d-b51d-404e-bf0b-92d72a8322f8","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":4,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:34.068Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"e25e9e2d-b51d-404e-bf0b-92d72a8322f8","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":4,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:57.720Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"2801cc46-c0b1-4d71-a0dc-f47960d17a7b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:30:57 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:57.720Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"2801cc46-c0b1-4d71-a0dc-f47960d17a7b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:57.722Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"2801cc46-c0b1-4d71-a0dc-f47960d17a7b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:30:57.722Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"2801cc46-c0b1-4d71-a0dc-f47960d17a7b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:31:27.954Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"22e998f3-cd70-4cf7-831b-9fe1cd649404","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:31:27 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:31:27.954Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"22e998f3-cd70-4cf7-831b-9fe1cd649404","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:31:27.955Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"22e998f3-cd70-4cf7-831b-9fe1cd649404","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:31:27.956Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"22e998f3-cd70-4cf7-831b-9fe1cd649404","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:31:58.124Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"0a9d72d4-7189-4abc-a23c-271fd7a3c023","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:31:58 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:31:58.124Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"0a9d72d4-7189-4abc-a23c-271fd7a3c023","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:31:58.125Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"0a9d72d4-7189-4abc-a23c-271fd7a3c023","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:31:58.126Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"0a9d72d4-7189-4abc-a23c-271fd7a3c023","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:32:28.252Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"2f81c05a-0c54-4346-8f47-aa273d8264ef","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:32:28 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:32:28.253Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"2f81c05a-0c54-4346-8f47-aa273d8264ef","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:32:28.254Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"2f81c05a-0c54-4346-8f47-aa273d8264ef","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:32:28.254Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"2f81c05a-0c54-4346-8f47-aa273d8264ef","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:32:58.371Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"49ea8d9f-07a7-420f-bcab-63a31d136113","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:32:58 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:32:58.372Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"49ea8d9f-07a7-420f-bcab-63a31d136113","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:32:58.372Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"49ea8d9f-07a7-420f-bcab-63a31d136113","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:32:58.373Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"49ea8d9f-07a7-420f-bcab-63a31d136113","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:33:28.522Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"27c271b4-dfe9-490b-a814-59115c50c111","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:33:28 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:33:28.522Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"27c271b4-dfe9-490b-a814-59115c50c111","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:33:28.523Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"27c271b4-dfe9-490b-a814-59115c50c111","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:33:28.523Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"27c271b4-dfe9-490b-a814-59115c50c111","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:33:58.672Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"c6b960b7-9f60-4fb8-9d65-b78518e44cea","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:33:58 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:33:58.672Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"c6b960b7-9f60-4fb8-9d65-b78518e44cea","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:33:58.673Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"c6b960b7-9f60-4fb8-9d65-b78518e44cea","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:33:58.673Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"c6b960b7-9f60-4fb8-9d65-b78518e44cea","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:34:28.827Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"65e5306c-4b7b-4cc4-a46c-2d9525d75b43","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:34:28 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:34:28.827Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"65e5306c-4b7b-4cc4-a46c-2d9525d75b43","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:34:28.828Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"65e5306c-4b7b-4cc4-a46c-2d9525d75b43","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:34:28.828Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"65e5306c-4b7b-4cc4-a46c-2d9525d75b43","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:34:58.981Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"b86a2d41-2083-48a0-92bd-ae2b76faf8f5","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:34:58 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:34:58.981Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"b86a2d41-2083-48a0-92bd-ae2b76faf8f5","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:34:58.982Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"b86a2d41-2083-48a0-92bd-ae2b76faf8f5","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:34:58.982Z","pid":1,"hostname":"7e64cac4fbc0","requestId":"b86a2d41-2083-48a0-92bd-ae2b76faf8f5","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"7e64cac4fbc0","pid":1,"msg":"Request completed"}
```


## docker compose logs --tail 80 admin-ui
```
admin-ui-1  |   ▲ Next.js 14.2.5
admin-ui-1  |   - Local:        http://localhost:3000
admin-ui-1  |   - Network:      http://0.0.0.0:3000
admin-ui-1  | 
admin-ui-1  |  ✓ Starting...
admin-ui-1  |  ✓ Ready in 125ms
```


## docker compose exec admin-api sh -lc 'echo NODE_ENV=; echo CORS_ALLOW_ORIGIN=; echo CORS_ORIGIN=; env | sort | rg -n "NODE_ENV|CORS_" || true'
```
NODE_ENV=
CORS_ALLOW_ORIGIN=
CORS_ORIGIN=
sh: rg: not found
```


## bash -lc 'echo "=== direct admin-api (no Origin) ==="; curl -sS -D- -o /dev/null http://localhost:3080/api/health | rg -in "HTTP/|access-control|vary"'
```
=== direct admin-api (no Origin) ===
1:HTTP/1.1 200 OK
15:Vary: Origin
16:Access-Control-Allow-Credentials: true
```


## bash -lc 'echo "=== direct admin-api (with Origin) ==="; curl -sS -D- -o /dev/null -H "Origin: http://localhost:3001" http://localhost:3080/api/health | rg -in "HTTP/|access-control|vary"'
```
=== direct admin-api (with Origin) ===
1:HTTP/1.1 200 OK
```


## bash -lc 'echo "=== direct admin-api (preflight OPTIONS) ==="; curl -sS -D- -o /dev/null -X OPTIONS -H "Origin: http://localhost:3001" -H "Access-Control-Request-Method: GET" http://localhost:3080/api/health | rg -in "HTTP/|access-control|vary"'
```
=== direct admin-api (preflight OPTIONS) ===
1:HTTP/1.1 200 OK
```


## bash -lc 'echo "=== via admin-ui proxy (with Origin) ==="; curl -sS -D- -o /dev/null -H "Origin: http://localhost:3001" http://localhost:3001/api/admin-api/api/health | rg -in "HTTP/|access-control|vary|x-slimy-proxy"'
```
=== via admin-ui proxy (with Origin) ===
1:HTTP/1.1 200 OK
2:x-slimy-proxy-has-cookie: 0
3:x-slimy-proxy-cookie-names: 
7:Vary: Accept-Encoding
```


## bash -lc 'sed -n "1,140p" apps/admin-api/src/app.js | nl -ba'
```
     1	"use strict";
     2	const express = require("express");
     3	const helmet = require("helmet");
     4	const morgan = require("morgan");
     5	const cors = require("cors");
     6	const cookieParser = require("cookie-parser");
     7	const { readAuth } = require("./middleware/auth");
     8	const requestIdMiddleware = require("./middleware/request-id");
     9	const { requestLogger } = require("./lib/logger");
    10	const { errorHandler, notFoundHandler } = require("./middleware/error-handler");
    11	const routes = require("./routes");
    12	const { UPLOADS_DIR } = require("./services/uploads");
    13	
    14	const app = express();
    15	app.set("trust proxy", 1);
    16	app.disable("etag");
    17	
    18	const DEFAULT_DEV_ORIGINS = [
    19	  "http://localhost:3000",
    20	  "http://localhost:3001",
    21	  "http://127.0.0.1:3000",
    22	  "http://127.0.0.1:3001",
    23	];
    24	const DEFAULT_PROD_ORIGINS = [
    25	  "https://admin.slimyai.xyz",
    26	  "https://slimyai.xyz",
    27	  "https://www.slimyai.xyz",
    28	];
    29	
    30	function parseOriginList(value) {
    31	  return String(value || "")
    32	    .split(",")
    33	    .map((entry) => entry.trim())
    34	    .filter(Boolean);
    35	}
    36	
    37	const rawCorsOrigins = process.env.CORS_ALLOW_ORIGIN || process.env.CORS_ORIGIN || "";
    38	const allowedOrigins = parseOriginList(rawCorsOrigins);
    39	const resolvedCorsOrigins = allowedOrigins.length
    40	  ? allowedOrigins
    41	  : (process.env.NODE_ENV === "production" ? DEFAULT_PROD_ORIGINS : DEFAULT_DEV_ORIGINS);
    42	if (!resolvedCorsOrigins.length) {
    43	  throw new Error("Missing required CORS origins configuration");
    44	}
    45	
    46	app.use(helmet());
    47	app.use(requestIdMiddleware);
    48	app.use(requestLogger);
    49	app.use(express.json({ limit: "1mb" }));
    50	app.use(cookieParser());
    51	app.use(cors({
    52	  origin(origin, callback) {
    53	    if (!origin) return callback(null, true);
    54	    if (resolvedCorsOrigins.includes(origin)) return callback(null, true);
    55	    return callback(null, false);
    56	  },
    57	  credentials: true
    58	}));
    59	app.use(morgan("combined"));
    60	app.use((_, res, next) => {
    61	  res.set("Cache-Control", "no-store");
    62	  next();
    63	});
    64	
    65	// Request logging and ID tracking
    66	app.use(requestLogger);
    67	
    68	// Auth resolution
    69	app.use(readAuth);
    70	
    71	// Routes
    72	app.use("/", routes);
    73	
    74	// Static file serving
    75	app.use(
    76	  "/api/uploads/files",
    77	  express.static(UPLOADS_DIR, {
    78	    setHeaders: (res) => {
    79	      res.set("Cache-Control", "public, max-age=604800, immutable");
    80	    },
    81	  }),
    82	);
    83	
    84	// 404 handler - must come before error handler
    85	app.use(notFoundHandler);
    86	
    87	// Error handler - must be last
    88	app.use(errorHandler);
    89	
    90	module.exports = app;
```


## rg -n "cors\(|origin\(origin|resolvedCorsOrigins|DEFAULT_DEV_ORIGINS|DEFAULT_PROD_ORIGINS" apps/admin-api/src/app.js
```
18:const DEFAULT_DEV_ORIGINS = [
24:const DEFAULT_PROD_ORIGINS = [
39:const resolvedCorsOrigins = allowedOrigins.length
41:  : (process.env.NODE_ENV === "production" ? DEFAULT_PROD_ORIGINS : DEFAULT_DEV_ORIGINS);
42:if (!resolvedCorsOrigins.length) {
51:app.use(cors({
52:  origin(origin, callback) {
54:    if (resolvedCorsOrigins.includes(origin)) return callback(null, true);
```


## rg -n "Access-Control-Allow-Origin|setHeader\(.*allow" -S apps/admin-api/src || true
```
apps/admin-api/src/routes/stats-tracker.js:245:    'Access-Control-Allow-Origin': '*',
```


## docker compose exec admin-api sh -lc 'nl -ba /app/apps/admin-api/src/app.js | sed -n "1,140p"'
```
     1	"use strict";
     2	const express = require("express");
     3	const helmet = require("helmet");
     4	const morgan = require("morgan");
     5	const cors = require("cors");
     6	const cookieParser = require("cookie-parser");
     7	const { readAuth } = require("./middleware/auth");
     8	const requestIdMiddleware = require("./middleware/request-id");
     9	const { requestLogger } = require("./lib/logger");
    10	const { errorHandler, notFoundHandler } = require("./middleware/error-handler");
    11	const routes = require("./routes");
    12	const { UPLOADS_DIR } = require("./services/uploads");
    13	
    14	const app = express();
    15	app.set("trust proxy", 1);
    16	app.disable("etag");
    17	
    18	const DEFAULT_DEV_ORIGINS = [
    19	  "http://localhost:3000",
    20	  "http://localhost:3001",
    21	  "http://127.0.0.1:3000",
    22	  "http://127.0.0.1:3001",
    23	];
    24	const DEFAULT_PROD_ORIGINS = [
    25	  "https://admin.slimyai.xyz",
    26	  "https://slimyai.xyz",
    27	  "https://www.slimyai.xyz",
    28	];
    29	
    30	function parseOriginList(value) {
    31	  return String(value || "")
    32	    .split(",")
    33	    .map((entry) => entry.trim())
    34	    .filter(Boolean);
    35	}
    36	
    37	const rawCorsOrigins = process.env.CORS_ALLOW_ORIGIN || process.env.CORS_ORIGIN || "";
    38	const allowedOrigins = parseOriginList(rawCorsOrigins);
    39	const resolvedCorsOrigins = allowedOrigins.length
    40	  ? allowedOrigins
    41	  : (process.env.NODE_ENV === "production" ? DEFAULT_PROD_ORIGINS : DEFAULT_DEV_ORIGINS);
    42	if (!resolvedCorsOrigins.length) {
    43	  throw new Error("Missing required CORS origins configuration");
    44	}
    45	
    46	app.use(helmet());
    47	app.use(requestIdMiddleware);
    48	app.use(requestLogger);
    49	app.use(express.json({ limit: "1mb" }));
    50	app.use(cookieParser());
    51	app.use(cors({
    52	  origin(origin, callback) {
    53	    if (!origin) return callback(null, true);
    54	    if (resolvedCorsOrigins.includes(origin)) return callback(null, true);
    55	    return callback(null, false);
    56	  },
    57	  credentials: true
    58	}));
    59	app.use(morgan("combined"));
    60	app.use((_, res, next) => {
    61	  res.set("Cache-Control", "no-store");
    62	  next();
    63	});
    64	
    65	// Request logging and ID tracking
    66	app.use(requestLogger);
    67	
    68	// Auth resolution
    69	app.use(readAuth);
    70	
    71	// Routes
    72	app.use("/", routes);
    73	
    74	// Static file serving
    75	app.use(
    76	  "/api/uploads/files",
    77	  express.static(UPLOADS_DIR, {
    78	    setHeaders: (res) => {
    79	      res.set("Cache-Control", "public, max-age=604800, immutable");
    80	    },
    81	  }),
    82	);
    83	
    84	// 404 handler - must come before error handler
    85	app.use(notFoundHandler);
    86	
    87	// Error handler - must be last
    88	app.use(errorHandler);
    89	
    90	module.exports = app;
```


## bash -lc 'curl -sS -v -o /dev/null -H "Origin: http://localhost:3001" http://localhost:3080/api/health 2>&1 | rg -in "^(>|<) (origin:|access-control-|vary:|http/)"'
```
10:> Origin: http://localhost:3001
12:< HTTP/1.1 200 OK
```


## bash -lc 'nl -ba apps/admin-api/server.js | sed -n "1,220p"'
```
     1	"use strict";
     2	
     3	const fs = require("fs");
     4	const path = require("path");
     5	const dotenv = require("dotenv");
     6	
     7	console.log("[admin-api] Entrypoint file:", __filename);
     8	
     9	// Load environment variables BEFORE requiring other modules
    10	function loadEnv() {
    11	  const explicitEnvPath =
    12	    process.env.ADMIN_ENV_FILE || process.env.ENV_FILE || null;
    13	  if (explicitEnvPath && fs.existsSync(explicitEnvPath)) {
    14	    dotenv.config({ path: explicitEnvPath });
    15	  }
    16	
    17	  const envPath = path.join(process.cwd(), ".env.admin");
    18	  if (fs.existsSync(envPath)) {
    19	    dotenv.config({ path: envPath });
    20	  }
    21	
    22	  // Allow fallback to default .env for shared values
    23	  const defaultEnvPath = path.join(process.cwd(), ".env");
    24	  if (fs.existsSync(defaultEnvPath)) {
    25	    dotenv.config({ path: defaultEnvPath });
    26	  }
    27	}
    28	
    29	loadEnv();
    30	
    31	// Map DATABASE_URL (Prisma) to DB_URL (mysql2) if needed
    32	if (!process.env.DB_URL && process.env.DATABASE_URL) {
    33	  process.env.DB_URL = process.env.DATABASE_URL;
    34	}
    35	
    36	const database = require("./lib/database");
    37	const prismaDatabase = require("./src/lib/database");
    38	const { applyDatabaseUrl } = require("./src/utils/apply-db-url");
    39	const logger = require("./lib/logger");
    40	const { initSocket } = require("./src/socket");
    41	
    42	async function start() {
    43	  applyDatabaseUrl(process.env.DB_URL);
    44	
    45	  if (!process.env.JWT_SECRET) {
    46	    throw new Error("JWT_SECRET must be set in .env.admin for admin-api");
    47	  }
    48	
    49	  if (process.env.NODE_ENV !== "production") {
    50	    logger.info({ env: process.env.NODE_ENV }, "[admin-api] Booting in non-production mode");
    51	  }
    52	
    53	  if (!database.isConfigured()) {
    54	    logger.warn("[admin-api] Database not configured; admin API will be read-only");
    55	  } else {
    56	    await database.initialize();
    57	  }
    58	
    59	  // Initialize Prisma database for session management (optional)
    60	  try {
    61	    if (prismaDatabase.isConfigured()) {
    62	      const initialized = await prismaDatabase.initialize();
    63	      if (initialized) {
    64	        logger.info("[admin-api] Prisma database initialized successfully");
    65	      } else {
    66	        logger.warn("[admin-api] Prisma database initialization failed; sessions will not be persisted");
    67	      }
    68	    } else {
    69	      logger.warn("[admin-api] Prisma database not configured; sessions will not be persisted (JWT-only mode)");
    70	    }
    71	  } catch (err) {
    72	    logger.warn("[admin-api] Prisma database initialization error; continuing without session persistence", { error: err.message });
    73	  }
    74	
    75	  const app = require("./src/app");
    76	  const port = Number(process.env.PORT || process.env.ADMIN_API_PORT || 3080);
    77	  const host = process.env.HOST || process.env.ADMIN_API_HOST || "127.0.0.1";
    78	
    79	  const server = app.listen(port, host, () => {
    80	    logger.info({ port, host }, `[admin-api] Listening on http://${host}:${port}`);
    81	  });
    82	
    83	  initSocket(server);
    84	
    85	  process.on("SIGINT", () => {
    86	    logger.info("[admin-api] Caught SIGINT, shutting down");
    87	    server.close(() => {
    88	      Promise.all([
    89	        database.close(),
    90	        prismaDatabase.close()
    91	      ]).finally(() => process.exit(0));
    92	    });
    93	  });
    94	
    95	  process.on("unhandledRejection", (err) => {
    96	    logger.error({ error: err }, "[admin-api] Unhandled rejection");
    97	  });
    98	}
    99	
   100	start().catch((err) => {
   101	  logger.error({ error: err }, "[admin-api] Failed to start");
   102	  console.error(err);
   103	  process.exit(1);
   104	});
```


## docker compose exec admin-api sh -lc 'nl -ba /app/apps/admin-api/server.js | sed -n "1,220p"'
```
     1	"use strict";
     2	
     3	const fs = require("fs");
     4	const path = require("path");
     5	const dotenv = require("dotenv");
     6	
     7	console.log("[admin-api] Entrypoint file:", __filename);
     8	
     9	// Load environment variables BEFORE requiring other modules
    10	function loadEnv() {
    11	  const explicitEnvPath =
    12	    process.env.ADMIN_ENV_FILE || process.env.ENV_FILE || null;
    13	  if (explicitEnvPath && fs.existsSync(explicitEnvPath)) {
    14	    dotenv.config({ path: explicitEnvPath });
    15	  }
    16	
    17	  const envPath = path.join(process.cwd(), ".env.admin");
    18	  if (fs.existsSync(envPath)) {
    19	    dotenv.config({ path: envPath });
    20	  }
    21	
    22	  // Allow fallback to default .env for shared values
    23	  const defaultEnvPath = path.join(process.cwd(), ".env");
    24	  if (fs.existsSync(defaultEnvPath)) {
    25	    dotenv.config({ path: defaultEnvPath });
    26	  }
    27	}
    28	
    29	loadEnv();
    30	
    31	// Map DATABASE_URL (Prisma) to DB_URL (mysql2) if needed
    32	if (!process.env.DB_URL && process.env.DATABASE_URL) {
    33	  process.env.DB_URL = process.env.DATABASE_URL;
    34	}
    35	
    36	const database = require("./lib/database");
    37	const prismaDatabase = require("./src/lib/database");
    38	const { applyDatabaseUrl } = require("./src/utils/apply-db-url");
    39	const logger = require("./lib/logger");
    40	const { initSocket } = require("./src/socket");
    41	
    42	async function start() {
    43	  applyDatabaseUrl(process.env.DB_URL);
    44	
    45	  if (!process.env.JWT_SECRET) {
    46	    throw new Error("JWT_SECRET must be set in .env.admin for admin-api");
    47	  }
    48	
    49	  if (process.env.NODE_ENV !== "production") {
    50	    logger.info({ env: process.env.NODE_ENV }, "[admin-api] Booting in non-production mode");
    51	  }
    52	
    53	  if (!database.isConfigured()) {
    54	    logger.warn("[admin-api] Database not configured; admin API will be read-only");
    55	  } else {
    56	    await database.initialize();
    57	  }
    58	
    59	  // Initialize Prisma database for session management (optional)
    60	  try {
    61	    if (prismaDatabase.isConfigured()) {
    62	      const initialized = await prismaDatabase.initialize();
    63	      if (initialized) {
    64	        logger.info("[admin-api] Prisma database initialized successfully");
    65	      } else {
    66	        logger.warn("[admin-api] Prisma database initialization failed; sessions will not be persisted");
    67	      }
    68	    } else {
    69	      logger.warn("[admin-api] Prisma database not configured; sessions will not be persisted (JWT-only mode)");
    70	    }
    71	  } catch (err) {
    72	    logger.warn("[admin-api] Prisma database initialization error; continuing without session persistence", { error: err.message });
    73	  }
    74	
    75	  const app = require("./src/app");
    76	  const port = Number(process.env.PORT || process.env.ADMIN_API_PORT || 3080);
    77	  const host = process.env.HOST || process.env.ADMIN_API_HOST || "127.0.0.1";
    78	
    79	  const server = app.listen(port, host, () => {
    80	    logger.info({ port, host }, `[admin-api] Listening on http://${host}:${port}`);
    81	  });
    82	
    83	  initSocket(server);
    84	
    85	  process.on("SIGINT", () => {
    86	    logger.info("[admin-api] Caught SIGINT, shutting down");
    87	    server.close(() => {
    88	      Promise.all([
    89	        database.close(),
    90	        prismaDatabase.close()
    91	      ]).finally(() => process.exit(0));
    92	    });
    93	  });
    94	
    95	  process.on("unhandledRejection", (err) => {
    96	    logger.error({ error: err }, "[admin-api] Unhandled rejection");
    97	  });
    98	}
    99	
   100	start().catch((err) => {
   101	  logger.error({ error: err }, "[admin-api] Failed to start");
   102	  console.error(err);
   103	  process.exit(1);
   104	});
```


## git diff -- apps/admin-api/src/app.js | sed -n '1,220p'
```
diff --git a/apps/admin-api/src/app.js b/apps/admin-api/src/app.js
index d44a411..9648220 100644
--- a/apps/admin-api/src/app.js
+++ b/apps/admin-api/src/app.js
@@ -15,9 +15,32 @@ const app = express();
 app.set("trust proxy", 1);
 app.disable("etag");
 
-const CORS_ORIGIN = process.env.CORS_ORIGIN;
-if (!CORS_ORIGIN) {
-  throw new Error("Missing required environment variable: CORS_ORIGIN");
+const DEFAULT_DEV_ORIGINS = [
+  "http://localhost:3000",
+  "http://localhost:3001",
+  "http://127.0.0.1:3000",
+  "http://127.0.0.1:3001",
+];
+const DEFAULT_PROD_ORIGINS = [
+  "https://admin.slimyai.xyz",
+  "https://slimyai.xyz",
+  "https://www.slimyai.xyz",
+];
+
+function parseOriginList(value) {
+  return String(value || "")
+    .split(",")
+    .map((entry) => entry.trim())
+    .filter(Boolean);
+}
+
+const rawCorsOrigins = process.env.CORS_ALLOW_ORIGIN || process.env.CORS_ORIGIN || "";
+const allowedOrigins = parseOriginList(rawCorsOrigins);
+const defaultOrigins =
+  process.env.NODE_ENV === "production" ? DEFAULT_PROD_ORIGINS : DEFAULT_DEV_ORIGINS;
+const resolvedCorsOrigins = Array.from(new Set([...defaultOrigins, ...allowedOrigins]));
+if (!resolvedCorsOrigins.length) {
+  throw new Error("Missing required CORS origins configuration");
 }
 
 app.use(helmet());
@@ -26,7 +49,11 @@ app.use(requestLogger);
 app.use(express.json({ limit: "1mb" }));
 app.use(cookieParser());
 app.use(cors({
-  origin: CORS_ORIGIN,
+  origin(origin, callback) {
+    if (!origin) return callback(null, true);
+    if (resolvedCorsOrigins.includes(origin)) return callback(null, true);
+    return callback(null, false);
+  },
   credentials: true
 }));
 app.use(morgan("combined"));
```


## docker compose build --progress=plain admin-api admin-ui
```
--progress is a global compose flag, better use `docker compose --progress xx build ...
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
#5 transferring context: 664.93kB 0.2s done
#5 DONE 0.2s

#6 [admin-api runner  4/14] COPY --from=deps /app/pnpm-workspace.yaml ./
#6 CACHED

#7 [admin-api deps 1/7] COPY pnpm-workspace.yaml ./
#7 CACHED

#8 [admin-api runner  7/14] COPY --from=deps /app/packages ./packages
#8 CACHED

#9 [admin-api deps 3/7] COPY package.json ./
#9 CACHED

#10 [admin-api runner  8/14] COPY --from=deps /app/apps/admin-api/node_modules ./apps/admin-api/node_modules
#10 CACHED

#11 [admin-api runner  5/14] COPY --from=deps /app/package.json ./
#11 CACHED

#12 [admin-api deps 4/7] COPY packages/ ./packages/
#12 CACHED

#13 [admin-api base 3/3] WORKDIR /app
#13 CACHED

#14 [admin-api runner  6/14] COPY --from=deps /app/node_modules ./node_modules
#14 CACHED

#15 [admin-api builder 1/2] COPY apps/admin-api/prisma/ ./apps/admin-api/prisma/
#15 CACHED

#16 [admin-api runner  9/14] COPY --from=deps /app/apps/admin-api/vendor ./apps/admin-api/vendor
#16 CACHED

#17 [admin-api builder 2/2] RUN cd apps/admin-api && pnpm prisma:generate
#17 CACHED

#18 [admin-api deps 5/7] COPY apps/admin-api/package.json ./apps/admin-api/
#18 CACHED

#19 [admin-api deps 7/7] RUN pnpm install --frozen-lockfile --filter @slimy/admin-api...
#19 CACHED

#20 [admin-api base 2/3] RUN npm install -g pnpm@latest
#20 CACHED

#21 [admin-api deps 6/7] COPY apps/admin-api/vendor/ ./apps/admin-api/vendor/
#21 CACHED

#22 [admin-api deps 2/7] COPY pnpm-lock.yaml ./
#22 CACHED

#23 [admin-api runner 10/14] COPY --from=builder /app/apps/admin-api/node_modules/.prisma ./apps/admin-api/node_modules/.prisma
#23 CACHED

#24 [admin-api runner 11/14] COPY apps/admin-api/ ./apps/admin-api/
#24 DONE 0.2s

#25 [admin-api runner 12/14] COPY apps/admin-api/src ./apps/admin-api/src
#25 DONE 0.2s

#26 [admin-api runner 13/14] COPY apps/admin-api/server.js ./apps/admin-api/server.js
#26 DONE 0.1s

#27 [admin-api runner 14/14] WORKDIR /app/apps/admin-api
#27 DONE 0.1s

#28 [admin-api] exporting to image
#28 exporting layers 0.1s done
#28 writing image sha256:31fd0be8a22a7d7bbceac90b297098dd98c14e3a3843f2233325fd08a88501fc
#28 writing image sha256:31fd0be8a22a7d7bbceac90b297098dd98c14e3a3843f2233325fd08a88501fc 0.0s done
#28 naming to docker.io/library/slimy-monorepo-admin-api done
#28 DONE 0.2s

#29 [admin-ui internal] load build definition from Dockerfile
#29 transferring dockerfile: 3.27kB done
#29 DONE 0.0s

#30 [admin-ui internal] load metadata for docker.io/library/node:22-slim
#30 DONE 0.1s

#31 [admin-ui internal] load .dockerignore
#31 transferring context: 2.44kB done
#31 DONE 0.0s

#32 [admin-ui base 1/3] FROM docker.io/library/node:22-slim@sha256:773413f36941ce1e4baf74b4a6110c03dcc4f968daffc389d4caef3f01412d2a
#32 DONE 0.0s

#33 [admin-ui internal] load build context
#33 transferring context: 49.88MB 0.5s done
#33 DONE 0.5s

#34 [admin-ui deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#34 CACHED

#35 [admin-ui deps 1/9] WORKDIR /app
#35 CACHED

#36 [admin-ui deps 2/9] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#36 CACHED

#37 [admin-ui base 3/3] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#37 CACHED

#38 [admin-ui deps 5/9] COPY apps/admin-api/package.json ./apps/admin-api/
#38 CACHED

#39 [admin-ui deps 7/9] COPY apps/web/package.json ./apps/web/
#39 CACHED

#40 [admin-ui deps 8/9] COPY apps/bot/package.json ./apps/bot/
#40 CACHED

#41 [admin-ui deps 6/9] COPY apps/admin-api/vendor ./apps/admin-api/vendor
#41 CACHED

#42 [admin-ui deps 3/9] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#42 CACHED

#43 [admin-ui base 2/3] RUN apt-get update -y && apt-get install -y openssl
#43 CACHED

#44 [admin-ui deps 4/9] COPY apps/admin-ui/package.json ./apps/admin-ui/
#44 CACHED

#45 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#45 CACHED

#46 [admin-ui builder 4/8] COPY apps/admin-ui ./apps/admin-ui
#46 DONE 1.9s

#47 [admin-ui builder 5/8] COPY packages ./packages
#47 DONE 0.2s

#48 [admin-ui builder 6/8] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#48 DONE 0.2s

#49 [admin-ui builder 7/8] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#49 3.445 Scope: all 7 workspace projects
#49 3.445 Lockfile is up to date, resolution step is skipped
#49 3.445 Already up to date
#49 3.445 
#49 3.445 ╭ Warning ─────────────────────────────────────────────────────────────────────╮
#49 3.445 │                                                                              │
#49 3.445 │   Ignored build scripts: msgpackr-extract.                                   │
#49 3.445 │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
#49 3.445 │   to run scripts.                                                            │
#49 3.445 │                                                                              │
#49 3.445 ╰──────────────────────────────────────────────────────────────────────────────╯
#49 3.445 
#49 3.445 . prepare$ husky
#49 3.445 . prepare: .git can't be found
#49 3.445 . prepare: Done
#49 3.445 Done in 2.9s using pnpm v10.22.0
#49 DONE 3.6s

#50 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#50 0.892 
#50 0.892 > @slimy/admin-ui@ build /app/apps/admin-ui
#50 0.892 > next build
#50 0.892 
#50 1.643 Attention: Next.js now collects completely anonymous telemetry regarding usage.
#50 1.643 This information is used to shape Next.js' roadmap and prioritize features.
#50 1.643 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
#50 1.643 https://nextjs.org/telemetry
#50 1.643 
#50 1.719   ▲ Next.js 14.2.5
#50 1.719   - Environments: .env.local
#50 1.719 
#50 1.720    Linting and checking validity of types ...
#50 4.717    Creating an optimized production build ...
#50 18.93  ✓ Compiled successfully
#50 18.93    Collecting page data ...
#50 20.20    Generating static pages (0/21) ...
#50 20.47    Generating static pages (5/21) 
#50 20.75    Generating static pages (10/21) 
#50 20.78    Generating static pages (15/21) 
#50 20.89  ✓ Generating static pages (21/21)
#50 23.13    Finalizing page optimization ...
#50 23.13    Collecting build traces ...
#50 42.69 
#50 42.70 Route (pages)                             Size     First Load JS
#50 42.70 ┌ ○ /                                     5.09 kB         118 kB
#50 42.70 ├   /_app                                 0 B            86.5 kB
#50 42.70 ├ ○ /404                                  181 B          86.7 kB
#50 42.70 ├ ○ /admin-api-usage                      876 B           114 kB
#50 42.70 ├ ƒ /api/admin-api/[...path]              0 B            86.5 kB
#50 42.70 ├ ƒ /api/admin-api/api/auth/login         0 B            86.5 kB
#50 42.70 ├ ƒ /api/admin-api/diag                   0 B            86.5 kB
#50 42.70 ├ ƒ /api/admin-api/health                 0 B            86.5 kB
#50 42.70 ├ ƒ /api/auth/discord/authorize-url       0 B            86.5 kB
#50 42.70 ├ ƒ /api/auth/discord/callback            0 B            86.5 kB
#50 42.70 ├ ƒ /api/diagnostics                      0 B            86.5 kB
#50 42.70 ├ ○ /auth-me                              1.08 kB         114 kB
#50 42.70 ├ ○ /chat                                 2.82 kB         116 kB
#50 42.70 ├ ○ /club                                 1.93 kB         115 kB
#50 42.70 ├ ƒ /dashboard                            1.66 kB         115 kB
#50 42.70 ├ ○ /email-login                          560 B           113 kB
#50 42.70 ├ ○ /guilds                               2.49 kB         115 kB
#50 42.70 ├ ○ /guilds/[guildId]                     5.88 kB         119 kB
#50 42.70 ├ ○ /guilds/[guildId]/channels            1.71 kB         115 kB
#50 42.70 ├ ○ /guilds/[guildId]/corrections         1.75 kB         115 kB
#50 42.70 ├ ○ /guilds/[guildId]/personality         890 B           114 kB
#50 42.70 ├ ○ /guilds/[guildId]/rescan              1.23 kB         114 kB
#50 42.70 ├ ○ /guilds/[guildId]/settings            1.26 kB         114 kB
#50 42.70 ├ ○ /guilds/[guildId]/usage               67.5 kB         180 kB
#50 42.70 ├ ○ /login                                781 B          89.8 kB
#50 42.70 ├ ○ /settings                             2.06 kB         115 kB
#50 42.70 ├ ○ /snail                                667 B           114 kB
#50 42.70 ├ ○ /snail/[guildId]                      4.45 kB         117 kB
#50 42.70 └ ○ /status                               1.26 kB         114 kB
#50 42.70 + First Load JS shared by all             89.7 kB
#50 42.70   ├ chunks/framework-8051a8b17472378c.js  45.2 kB
#50 42.70   ├ chunks/main-386d6319e61b79bf.js       36.6 kB
#50 42.70   └ other shared chunks (total)           7.83 kB
#50 42.70 
#50 42.70 ○  (Static)   prerendered as static content
#50 42.70 ƒ  (Dynamic)  server-rendered on demand
#50 42.70 
#50 DONE 42.9s

#51 [admin-ui runner  3/10] RUN addgroup --system --gid 1001 nodejs
#51 CACHED

#52 [admin-ui runner  2/10] WORKDIR /app
#52 CACHED

#53 [admin-ui runner  4/10] RUN adduser --system --uid 1001 nextjs
#53 CACHED

#54 [admin-ui runner  5/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public
#54 CACHED

#55 [admin-ui runner  6/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
#55 DONE 0.1s

#56 [admin-ui runner  7/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
#56 DONE 2.5s

#57 [admin-ui runner  8/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
#57 DONE 0.2s

#58 [admin-ui runner  9/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./.next/static
#58 DONE 0.2s

#59 [admin-ui runner 10/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./public
#59 DONE 0.2s

#60 [admin-ui] exporting to image
#60 exporting layers
#60 exporting layers 0.7s done
#60 writing image sha256:7f01d9bf1b0a8c96c8d72dc26e21f5370473cecbb192e208aacb454a1bbf6b9b done
#60 naming to docker.io/library/slimy-monorepo-admin-ui 0.0s done
#60 DONE 0.8s
```


## docker compose up -d --no-deps --force-recreate admin-api admin-ui
```
 Container slimy-monorepo-admin-api-1  Recreate
 Container slimy-monorepo-admin-api-1  Recreated
 Container slimy-monorepo-admin-ui-1  Recreate
 Container slimy-monorepo-admin-ui-1  Recreated
 Container slimy-monorepo-admin-api-1  Starting
 Container slimy-monorepo-admin-api-1  Started
 Container slimy-monorepo-admin-api-1  Waiting
 Container slimy-monorepo-admin-api-1  Healthy
 Container slimy-monorepo-admin-ui-1  Starting
 Container slimy-monorepo-admin-ui-1  Started
```


## docker compose ps
```
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED          STATUS                   PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   17 seconds ago   Up 6 seconds (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    6 seconds ago    Up Less than a second    0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          26 hours ago     Up 26 hours (healthy)    3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         22 hours ago     Up 22 hours              0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```


## docker compose logs --tail 80 admin-api
```
admin-api-1  | [admin-api] Entrypoint file: /app/apps/admin-api/server.js
admin-api-1  | [database] Resolving @prisma/client: /app/apps/admin-api/node_modules/.prisma/client/index.js
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:39:46.789Z","pid":1,"hostname":"b077af441de0","service":"slimy-admin-api","version":"docker","env":"development","hostname":"b077af441de0","pid":1,"msg":"Configuration validated successfully"}
admin-api-1  | [INFO 2025-12-20T17:39:46.903Z] { env: 'development' } [admin-api] Booting in non-production mode
admin-api-1  | [database] Prisma middleware API unavailable; skipping query instrumentation
admin-api-1  | [database] Connected to MySQL database
admin-api-1  | [INFO 2025-12-20T17:39:47.001Z] [admin-api] Prisma database initialized successfully
admin-api-1  | !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!
admin-api-1  | [INFO 2025-12-20T17:39:48.330Z] { port: 3080, host: '0.0.0.0' } [admin-api] Listening on http://0.0.0.0:3080
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:39:51.744Z","pid":1,"hostname":"b077af441de0","requestId":"db9c83b8-ede9-4980-8a02-a2a36319b1f0","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"b077af441de0","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [20/Dec/2025:17:39:51 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:39:51.747Z","pid":1,"hostname":"b077af441de0","requestId":"db9c83b8-ede9-4980-8a02-a2a36319b1f0","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"development","hostname":"b077af441de0","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:39:51.756Z","pid":1,"hostname":"b077af441de0","requestId":"db9c83b8-ede9-4980-8a02-a2a36319b1f0","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":12,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"b077af441de0","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-20T17:39:51.758Z","pid":1,"hostname":"b077af441de0","requestId":"db9c83b8-ede9-4980-8a02-a2a36319b1f0","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":11,"service":"slimy-admin-api","version":"docker","env":"development","hostname":"b077af441de0","pid":1,"msg":"Request completed"}
```


## docker compose logs --tail 80 admin-ui
```
admin-ui-1  |   ▲ Next.js 14.2.5
admin-ui-1  |   - Local:        http://localhost:3000
admin-ui-1  |   - Network:      http://0.0.0.0:3000
admin-ui-1  | 
admin-ui-1  |  ✓ Starting...
```


## bash -lc 'echo "=== direct admin-api (no Origin) ==="; curl -sS -D- -o /dev/null http://localhost:3080/api/health | rg -in "HTTP/|access-control|vary"'
```
=== direct admin-api (no Origin) ===
1:HTTP/1.1 200 OK
15:Vary: Origin
16:Access-Control-Allow-Credentials: true
```


## bash -lc 'echo "=== direct admin-api (with Origin) ==="; curl -sS -D- -o /dev/null -H "Origin: http://localhost:3001" http://localhost:3080/api/health | rg -in "HTTP/|access-control|vary"'
```
=== direct admin-api (with Origin) ===
1:HTTP/1.1 200 OK
15:Access-Control-Allow-Origin: http://localhost:3001
16:Vary: Origin
17:Access-Control-Allow-Credentials: true
```


## bash -lc 'echo "=== direct admin-api (preflight OPTIONS) ==="; curl -sS -D- -o /dev/null -X OPTIONS -H "Origin: http://localhost:3001" -H "Access-Control-Request-Method: GET" http://localhost:3080/api/health | rg -in "HTTP/|access-control|vary"'
```
=== direct admin-api (preflight OPTIONS) ===
1:HTTP/1.1 204 No Content
15:Access-Control-Allow-Origin: http://localhost:3001
16:Vary: Origin, Access-Control-Request-Headers
17:Access-Control-Allow-Credentials: true
18:Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```


## bash -lc 'echo "=== via admin-ui proxy (with Origin) ==="; curl -sS -D- -o /dev/null -H "Origin: http://localhost:3001" http://localhost:3001/api/admin-api/api/health | rg -in "HTTP/|access-control|vary|x-slimy-proxy"'
```
=== via admin-ui proxy (with Origin) ===
1:HTTP/1.1 200 OK
2:x-slimy-proxy-has-cookie: 0
3:x-slimy-proxy-cookie-names: 
7:Vary: Accept-Encoding
```

admin-api allow-origin: Access-Control-Allow-Origin: http://localhost:3001
proxy    allow-origin: 
[FAIL] proxy path did not reflect Origin

## git diff -- apps/admin-ui/pages/api/admin-api/'[...path]'.js | sed -n '1,260p'
```
diff --git a/apps/admin-ui/pages/api/admin-api/[...path].js b/apps/admin-ui/pages/api/admin-api/[...path].js
index 9024163..45c7585 100644
--- a/apps/admin-ui/pages/api/admin-api/[...path].js
+++ b/apps/admin-ui/pages/api/admin-api/[...path].js
@@ -6,6 +6,19 @@ function isJsonContentType(contentType) {
   return normalized.includes("application/json") || normalized.includes("+json");
 }
 
+function mergeVaryHeader(existing, incoming) {
+  const existingParts = String(existing || "")
+    .split(",")
+    .map((value) => value.trim())
+    .filter(Boolean);
+  const incomingParts = String(incoming || "")
+    .split(",")
+    .map((value) => value.trim())
+    .filter(Boolean);
+  const merged = new Set([...existingParts, ...incomingParts]);
+  return Array.from(merged).join(", ");
+}
+
 function firstHeaderValue(value) {
   if (!value) return "";
   const raw = Array.isArray(value) ? value[0] : String(value);
@@ -96,6 +109,8 @@ export default async function handler(req, res) {
   const cookie = req.headers.cookie || "";
   const contentType = req.headers["content-type"] || "";
   const accept = req.headers.accept || "";
+  const origin = req.headers.origin || "";
+  const referer = req.headers.referer || "";
   const csrfToken = req.headers["x-csrf-token"] || "";
   const forwardedHost = firstHeaderValue(req.headers["x-forwarded-host"]) || firstHeaderValue(req.headers.host);
   const forwardedProto =
@@ -117,6 +132,8 @@ export default async function handler(req, res) {
     ...(cookie ? { cookie } : null),
     ...(contentType ? { "content-type": contentType } : null),
     ...(accept ? { accept } : null),
+    ...(origin ? { origin } : null),
+    ...(referer ? { referer } : null),
     ...(csrfToken ? { "x-csrf-token": csrfToken } : null),
     ...(forwardedHost ? { "x-forwarded-host": forwardedHost } : null),
     ...(forwardedProto ? { "x-forwarded-proto": forwardedProto } : null),
@@ -154,6 +171,16 @@ export default async function handler(req, res) {
 
     const upstreamContentType = upstreamRes.headers.get("content-type") || "";
     const location = upstreamRes.headers.get("location") || "";
+    const corsAllowOrigin = upstreamRes.headers.get("access-control-allow-origin") || "";
+    const corsAllowCredentials =
+      upstreamRes.headers.get("access-control-allow-credentials") || "";
+    const corsAllowMethods =
+      upstreamRes.headers.get("access-control-allow-methods") || "";
+    const corsAllowHeaders =
+      upstreamRes.headers.get("access-control-allow-headers") || "";
+    const corsExposeHeaders =
+      upstreamRes.headers.get("access-control-expose-headers") || "";
+    const upstreamVary = upstreamRes.headers.get("vary") || "";
 
     const setCookies =
       typeof upstreamRes.headers.getSetCookie === "function"
@@ -166,6 +193,20 @@ export default async function handler(req, res) {
 
     if (upstreamContentType) res.setHeader("content-type", upstreamContentType);
     if (location) res.setHeader("location", location);
+    if (corsAllowOrigin) res.setHeader("access-control-allow-origin", corsAllowOrigin);
+    if (corsAllowCredentials) {
+      res.setHeader("access-control-allow-credentials", corsAllowCredentials);
+    }
+    if (corsAllowMethods) res.setHeader("access-control-allow-methods", corsAllowMethods);
+    if (corsAllowHeaders) res.setHeader("access-control-allow-headers", corsAllowHeaders);
+    if (corsExposeHeaders) {
+      res.setHeader("access-control-expose-headers", corsExposeHeaders);
+    }
+    if (upstreamVary) {
+      const existingVary = res.getHeader("vary");
+      const mergedVary = mergeVaryHeader(existingVary, upstreamVary);
+      if (mergedVary) res.setHeader("vary", mergedVary);
+    }
     if (setCookies.length) res.setHeader("set-cookie", setCookies);
     else if (setCookieParsed.length) res.setHeader("set-cookie", setCookieParsed);
     else if (setCookieFallback) res.setHeader("set-cookie", setCookieFallback);
```


## docker compose build --progress=plain admin-ui
```
--progress is a global compose flag, better use `docker compose --progress xx build ...
#0 building with "default" instance using docker driver

#1 [admin-ui internal] load build definition from Dockerfile
#1 transferring dockerfile: 3.27kB done
#1 DONE 0.0s

#2 [admin-ui internal] load metadata for docker.io/library/node:22-slim
#2 DONE 0.2s

#3 [admin-ui base 1/3] FROM docker.io/library/node:22-slim@sha256:773413f36941ce1e4baf74b4a6110c03dcc4f968daffc389d4caef3f01412d2a
#3 DONE 0.0s

#4 [admin-ui internal] load .dockerignore
#4 transferring context: 2.44kB done
#4 DONE 0.0s

#5 [admin-ui internal] load build context
#5 transferring context: 49.88MB 0.8s done
#5 DONE 0.9s

#6 [admin-ui deps  1/10] WORKDIR /app
#6 CACHED

#7 [admin-ui deps 4/9] COPY apps/admin-ui/package.json ./apps/admin-ui/
#7 CACHED

#8 [admin-ui deps 5/9] COPY apps/admin-api/package.json ./apps/admin-api/
#8 CACHED

#9 [admin-ui deps 6/9] COPY apps/admin-api/vendor ./apps/admin-api/vendor
#9 CACHED

#10 [admin-ui deps 7/9] COPY apps/web/package.json ./apps/web/
#10 CACHED

#11 [admin-ui deps 8/9] COPY apps/bot/package.json ./apps/bot/
#11 CACHED

#12 [admin-ui base 3/3] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#12 CACHED

#13 [admin-ui deps  2/10] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#13 CACHED

#14 [admin-ui base 2/3] RUN apt-get update -y && apt-get install -y openssl
#14 CACHED

#15 [admin-ui deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#15 CACHED

#16 [admin-ui deps 3/9] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#16 CACHED

#17 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#17 CACHED

#18 [admin-ui builder 4/8] COPY apps/admin-ui ./apps/admin-ui
#18 DONE 3.4s

#19 [admin-ui builder 5/8] COPY packages ./packages
#19 DONE 0.1s

#20 [admin-ui builder 6/8] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#20 DONE 0.2s

#21 [admin-ui builder 7/8] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#21 4.371 Scope: all 7 workspace projects
#21 4.371 Lockfile is up to date, resolution step is skipped
#21 4.371 Already up to date
#21 4.371 
#21 4.371 ╭ Warning ─────────────────────────────────────────────────────────────────────╮
#21 4.371 │                                                                              │
#21 4.371 │   Ignored build scripts: msgpackr-extract.                                   │
#21 4.371 │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
#21 4.371 │   to run scripts.                                                            │
#21 4.371 │                                                                              │
#21 4.371 ╰──────────────────────────────────────────────────────────────────────────────╯
#21 4.371 
#21 4.371 . prepare$ husky
#21 4.371 . prepare: .git can't be found
#21 4.371 . prepare: Done
#21 4.371 Done in 3.7s using pnpm v10.22.0
#21 DONE 4.6s

#22 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#22 1.133 
#22 1.133 > @slimy/admin-ui@ build /app/apps/admin-ui
#22 1.133 > next build
#22 1.133 
#22 2.457 Attention: Next.js now collects completely anonymous telemetry regarding usage.
#22 2.458 This information is used to shape Next.js' roadmap and prioritize features.
#22 2.458 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
#22 2.459 https://nextjs.org/telemetry
#22 2.459 
#22 2.585   ▲ Next.js 14.2.5
#22 2.585   - Environments: .env.local
#22 2.585 
#22 2.587    Linting and checking validity of types ...
#22 7.443    Creating an optimized production build ...
#22 24.15  ✓ Compiled successfully
#22 24.15    Collecting page data ...
#22 26.33    Generating static pages (0/21) ...
#22 26.56    Generating static pages (5/21) 
#22 26.67    Generating static pages (10/21) 
#22 26.72    Generating static pages (15/21) 
#22 26.77  ✓ Generating static pages (21/21)
#22 30.37    Finalizing page optimization ...
#22 30.37    Collecting build traces ...
#22 53.38 
#22 53.38 Route (pages)                             Size     First Load JS
#22 53.38 ┌ ○ /                                     5.09 kB         118 kB
#22 53.38 ├   /_app                                 0 B            86.5 kB
#22 53.38 ├ ○ /404                                  181 B          86.7 kB
#22 53.38 ├ ○ /admin-api-usage                      876 B           114 kB
#22 53.38 ├ ƒ /api/admin-api/[...path]              0 B            86.5 kB
#22 53.38 ├ ƒ /api/admin-api/api/auth/login         0 B            86.5 kB
#22 53.38 ├ ƒ /api/admin-api/diag                   0 B            86.5 kB
#22 53.38 ├ ƒ /api/admin-api/health                 0 B            86.5 kB
#22 53.38 ├ ƒ /api/auth/discord/authorize-url       0 B            86.5 kB
#22 53.38 ├ ƒ /api/auth/discord/callback            0 B            86.5 kB
#22 53.38 ├ ƒ /api/diagnostics                      0 B            86.5 kB
#22 53.38 ├ ○ /auth-me                              1.08 kB         114 kB
#22 53.38 ├ ○ /chat                                 2.82 kB         116 kB
#22 53.38 ├ ○ /club                                 1.93 kB         115 kB
#22 53.38 ├ ƒ /dashboard                            1.66 kB         115 kB
#22 53.38 ├ ○ /email-login                          560 B           113 kB
#22 53.38 ├ ○ /guilds                               2.49 kB         115 kB
#22 53.38 ├ ○ /guilds/[guildId]                     5.88 kB         119 kB
#22 53.38 ├ ○ /guilds/[guildId]/channels            1.71 kB         115 kB
#22 53.38 ├ ○ /guilds/[guildId]/corrections         1.75 kB         115 kB
#22 53.38 ├ ○ /guilds/[guildId]/personality         890 B           114 kB
#22 53.38 ├ ○ /guilds/[guildId]/rescan              1.23 kB         114 kB
#22 53.38 ├ ○ /guilds/[guildId]/settings            1.26 kB         114 kB
#22 53.38 ├ ○ /guilds/[guildId]/usage               67.5 kB         180 kB
#22 53.38 ├ ○ /login                                781 B          89.8 kB
#22 53.38 ├ ○ /settings                             2.06 kB         115 kB
#22 53.38 ├ ○ /snail                                667 B           114 kB
#22 53.38 ├ ○ /snail/[guildId]                      4.45 kB         117 kB
#22 53.38 └ ○ /status                               1.26 kB         114 kB
#22 53.38 + First Load JS shared by all             89.7 kB
#22 53.38   ├ chunks/framework-8051a8b17472378c.js  45.2 kB
#22 53.38   ├ chunks/main-386d6319e61b79bf.js       36.6 kB
#22 53.38   └ other shared chunks (total)           7.83 kB
#22 53.38 
#22 53.38 ○  (Static)   prerendered as static content
#22 53.38 ƒ  (Dynamic)  server-rendered on demand
#22 53.38 
#22 DONE 54.0s

#23 [admin-ui runner  2/11] WORKDIR /app
#23 CACHED

#24 [admin-ui runner  3/10] RUN addgroup --system --gid 1001 nodejs
#24 CACHED

#25 [admin-ui runner  4/10] RUN adduser --system --uid 1001 nextjs
#25 CACHED

#26 [admin-ui runner  5/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public
#26 CACHED

#27 [admin-ui runner  6/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
#27 DONE 0.4s

#28 [admin-ui runner  7/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
#28 DONE 2.8s

#29 [admin-ui runner  8/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
#29 DONE 0.3s

#30 [admin-ui runner  9/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./.next/static
#30 DONE 0.3s

#31 [admin-ui runner 10/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./public
#31 DONE 0.2s

#32 [admin-ui] exporting to image
#32 exporting layers
#32 exporting layers 0.8s done
#32 writing image sha256:0cec2dfa9c9b443a54e7a929d985cf1fc396bc320a154989e2d019767e6eff35 done
#32 naming to docker.io/library/slimy-monorepo-admin-ui 0.0s done
#32 DONE 0.9s
```


## docker compose up -d --no-deps --force-recreate admin-ui
```
 Container slimy-monorepo-admin-ui-1  Recreate
 Container slimy-monorepo-admin-ui-1  Recreated
 Container slimy-monorepo-admin-ui-1  Starting
 Container slimy-monorepo-admin-ui-1  Started
```


## docker compose ps
```
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED         STATUS                   PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   2 minutes ago   Up 2 minutes (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    1 second ago    Up Less than a second    0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          26 hours ago    Up 26 hours (healthy)    3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         22 hours ago    Up 22 hours              0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```


## docker compose logs --tail 80 admin-ui
```
```


## bash -lc 'echo "=== direct admin-api (no Origin) ==="; curl -sS -D- -o /dev/null http://localhost:3080/api/health | rg -in "HTTP/|access-control|vary"'
```
=== direct admin-api (no Origin) ===
1:HTTP/1.1 200 OK
15:Vary: Origin
16:Access-Control-Allow-Credentials: true
```


## bash -lc 'echo "=== direct admin-api (with Origin) ==="; curl -sS -D- -o /dev/null -H "Origin: http://localhost:3001" http://localhost:3080/api/health | rg -in "HTTP/|access-control|vary"'
```
=== direct admin-api (with Origin) ===
1:HTTP/1.1 200 OK
15:Access-Control-Allow-Origin: http://localhost:3001
16:Vary: Origin
17:Access-Control-Allow-Credentials: true
```


## bash -lc 'echo "=== direct admin-api (preflight OPTIONS) ==="; curl -sS -D- -o /dev/null -X OPTIONS -H "Origin: http://localhost:3001" -H "Access-Control-Request-Method: GET" http://localhost:3080/api/health | rg -in "HTTP/|access-control|vary"'
```
=== direct admin-api (preflight OPTIONS) ===
1:HTTP/1.1 204 No Content
15:Access-Control-Allow-Origin: http://localhost:3001
16:Vary: Origin, Access-Control-Request-Headers
17:Access-Control-Allow-Credentials: true
18:Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```


## bash -lc 'echo "=== via admin-ui proxy (with Origin) ==="; curl -sS -D- -o /dev/null -H "Origin: http://localhost:3001" http://localhost:3001/api/admin-api/api/health | rg -in "HTTP/|access-control|vary|x-slimy-proxy"'
```
=== via admin-ui proxy (with Origin) ===
1:HTTP/1.1 200 OK
2:x-slimy-proxy-has-cookie: 0
3:x-slimy-proxy-cookie-names: 
5:access-control-allow-origin: http://localhost:3001
6:access-control-allow-credentials: true
7:Vary: Origin, Accept-Encoding
```

admin-api allow-origin: Access-Control-Allow-Origin: http://localhost:3001
proxy    allow-origin: access-control-allow-origin: http://localhost:3001
[PASS] CORS reflection OK

## pnpm -w --filter @slimy/admin-api test
```
Scope: 2 of 10 workspace projects
apps/admin-api test$ jest
. test$ pnpm -r run test || echo "TODO: wire tests"
. test: Scope: 9 of 10 workspace projects
. test: apps/admin-api test$ jest
. test: apps/admin-ui test$ node tests/settings-tabs.test.js
. test: apps/bot test$ vitest run
. test: apps/web test$ vitest
. test: apps/admin-ui test: settings-tabs tests passed
. test: apps/admin-ui test: Done
. test: packages/shared-auth test$ vitest run
. test: packages/shared-auth test:  RUN  v4.0.15 /opt/slimy/slimy-monorepo/packages/shared-auth
. test: apps/bot test:  RUN  v1.6.1 /opt/slimy/slimy-monorepo/apps/bot
. test: apps/web test:  RUN  v4.0.15 /opt/slimy/slimy-monorepo/apps/web
. test: packages/shared-auth test:  ✓ src/index.test.ts (41 tests) 166ms
. test: packages/shared-auth test:  Test Files  1 passed (1)
. test: packages/shared-auth test:       Tests  41 passed (41)
. test: packages/shared-auth test:    Start at  17:42:59
. test: packages/shared-auth test:    Duration  1.89s (transform 611ms, setup 0ms, import 807ms, tests 166ms, environment 0ms)
. test: packages/shared-auth test: Done
. test: packages/shared-codes test$ echo "TODO: test shared-codes"
. test: packages/shared-codes test: TODO: test shared-codes
. test: packages/shared-codes test: Done
. test: packages/shared-config test$ echo "TODO: test shared-config"
. test: packages/shared-config test: TODO: test shared-config
. test: packages/shared-config test: Done
. test: packages/shared-db test$ echo "TODO: test shared-db"
. test: packages/shared-db test: TODO: test shared-db
. test: packages/shared-db test: Done
. test: packages/shared-snail test$ echo "TODO: test shared-snail"
. test: packages/shared-snail test: TODO: test shared-snail
. test: packages/shared-snail test: Done
. test: apps/bot test:  ✓ tests/utils/parsing.test.ts  (13 tests) 74ms
. test: apps/bot test:  ✓ tests/logger.test.ts  (13 tests) 148ms
. test: apps/bot test:  ✓ tests/errorHandler.test.ts  (9 tests) 169ms
apps/admin-api test:   console.log
apps/admin-api test:     !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!
apps/admin-api test:       at Object.log (src/routes/auth.js:22:9)
apps/admin-api test:   console.log
apps/admin-api test:     [auth/me] req.user keys: id,username,role,guilds
apps/admin-api test:       at log (src/routes/auth.js:532:13)
apps/admin-api test:   console.log
apps/admin-api test:     [auth/me] rawUser keys: id,username,role,guilds
apps/admin-api test:       at log (src/routes/auth.js:533:13)
apps/admin-api test:   console.log
apps/admin-api test:     [auth/me] Lookup User ID: test-user-id
apps/admin-api test:       at log (src/routes/auth.js:534:13)
apps/admin-api test:   console.log
apps/admin-api test:     [auth/me] DB User Found: true
apps/admin-api test:       at log (src/routes/auth.js:652:13)
apps/admin-api test:   console.warn
apps/admin-api test:     [auth/me] DB guild lookup failed; returning session-only guilds { error: "Cannot read properties of undefined (reading 'findMany')" }
apps/admin-api test:       673 |         warnings.push("db_guilds_lookup_failed");
apps/admin-api test:       674 |         if (shouldDebugAuth()) {
apps/admin-api test:     > 675 |           console.warn("[auth/me] DB guild lookup failed; returning session-only guilds", {
apps/admin-api test:           |                   ^
apps/admin-api test:       676 |             error: err?.message || String(err),
apps/admin-api test:       677 |           });
apps/admin-api test:       678 |         }
apps/admin-api test:       at warn (src/routes/auth.js:675:19)
apps/admin-api test:   console.log
apps/admin-api test:     !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!
apps/admin-api test:       at Object.log (src/routes/auth.js:22:9)
apps/admin-api test:   console.log
apps/admin-api test:     [auth/me] req.user keys: id,username,role,guilds
apps/admin-api test:       at log (src/routes/auth.js:532:13)
apps/admin-api test:   console.log
apps/admin-api test:     [auth/me] rawUser keys: id,username,role,guilds
apps/admin-api test:       at log (src/routes/auth.js:533:13)
apps/admin-api test:   console.log
apps/admin-api test:     [auth/me] Lookup User ID: test-user-id
apps/admin-api test:       at log (src/routes/auth.js:534:13)
apps/admin-api test:   console.warn
apps/admin-api test:     [auth/me] DB user lookup failed; returning session-only response { error: 'DB Error' }
apps/admin-api test:       644 |       warnings.push("db_user_lookup_failed");
apps/admin-api test:       645 |       if (shouldDebugAuth()) {
apps/admin-api test:     > 646 |         console.warn("[auth/me] DB user lookup failed; returning session-only response", {
apps/admin-api test:           |                 ^
apps/admin-api test:       647 |           error: err?.message || String(err),
apps/admin-api test:       648 |         });
apps/admin-api test:       649 |       }
apps/admin-api test:       at warn (src/routes/auth.js:646:17)
apps/admin-api test:   console.log
apps/admin-api test:     [auth/me] DB User Found: false
apps/admin-api test:       at log (src/routes/auth.js:652:13)
apps/admin-api test:   console.warn
apps/admin-api test:     [auth/me] Fallback to cookie guilds: 0
apps/admin-api test:       689 |       // But ensure we at least pass the ID
apps/admin-api test:       690 |       const cookieGuilds = Array.isArray(rawUser?.guilds) ? rawUser.guilds : [];
apps/admin-api test:     > 691 |       console.warn("[auth/me] Fallback to cookie guilds:", cookieGuilds.length);
apps/admin-api test:           |               ^
apps/admin-api test:       692 |       sessionGuilds = cookieGuilds.map((g) => ({
apps/admin-api test:       693 |         id: g?.id,
apps/admin-api test:       694 |         roles: g?.roles,
apps/admin-api test:       at warn (src/routes/auth.js:691:15)
apps/admin-api test: PASS tests/auth/me-context.test.js
apps/admin-api test:   GET /api/auth/me Context Hydration
apps/admin-api test:     ✓ should include lastActiveGuild from DB (207 ms)
apps/admin-api test:     ✓ should handle DB errors gracefully (123 ms)
apps/admin-api test:   console.error
apps/admin-api test:     [guilds/connect] Missing SLIMYAI_BOT_TOKEN
apps/admin-api test:       233 |       const SLIMYAI_BOT_TOKEN = getSlimyBotToken();
apps/admin-api test:       234 |       if (!SLIMYAI_BOT_TOKEN) {
apps/admin-api test:     > 235 |         console.error("[guilds/connect] Missing SLIMYAI_BOT_TOKEN");
apps/admin-api test:           |                 ^
apps/admin-api test:       236 |         return res.status(500).json({ error: "MISSING_SLIMYAI_BOT_TOKEN" });
apps/admin-api test:       237 |       }
apps/admin-api test:       238 |
apps/admin-api test:       at error (src/routes/guilds.js:235:17)
apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
apps/admin-api test:       at next (tests/guild-connect.test.js:24:5)
apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
apps/admin-api test:       at next (tests/guild-connect.test.js:11:5)
apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
apps/admin-api test:       at Route.dispatch (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:119:3)
apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:284:15
apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
apps/admin-api test:       at next (tests/guild-connect.test.js:11:5)
apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
apps/admin-api test:       at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
apps/admin-api test:       at Function.handle (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:175:3)
apps/admin-api test:       at router (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:47:12)
apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
apps/admin-api test:       at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
apps/admin-api test:       at ../../node_modules/.pnpm/body-parser@1.20.4/node_modules/body-parser/lib/read.js:137:5
apps/admin-api test:       at invokeCallback (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:238:16)
apps/admin-api test:       at done (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:227:7)
apps/admin-api test:       at IncomingMessage.onEnd (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:287:7)
apps/admin-api test: PASS tests/auth/active-guild.cookie.test.js
apps/admin-api test:   POST /api/auth/active-guild cookie
apps/admin-api test:     ✓ sets slimy_admin_active_guild_id on success (328 ms)
apps/admin-api test:     ✓ does not set cookie when bot not installed (42 ms)
apps/admin-api test: PASS tests/guild-connect.test.js
apps/admin-api test:   POST /guilds/connect
apps/admin-api test:     ✓ should fail if SLIMYAI_BOT_TOKEN is missing (617 ms)
apps/admin-api test:     ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (20 ms)
apps/admin-api test:     ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (23 ms)
apps/admin-api test:     ✓ should succeed if guild is shared (23 ms)
. test: apps/bot test:  ✓ tests/utils/stats.test.ts  (10 tests) 34ms
. test: apps/bot test:  Test Files  4 passed (4)
. test: apps/bot test:       Tests  45 passed (45)
. test: apps/bot test:    Start at  17:42:59
. test: apps/bot test:    Duration  4.23s (transform 1.42s, setup 8ms, collect 1.97s, tests 425ms, environment 1ms, prepare 3.08s)
. test: apps/bot test: Done
apps/admin-api test: PASS tests/guilds-read.test.js
apps/admin-api test:   GET /api/guilds/:guildId
apps/admin-api test:     ✓ should return guild details for authenticated user (98 ms)
apps/admin-api test:     ✓ should return 404 for non-existent guild (27 ms)
apps/admin-api test: PASS tests/guilds-connect.test.js
apps/admin-api test:   POST /api/guilds/connect
apps/admin-api test:     ✓ should return 200 when connecting with valid frontend payload (154 ms)
apps/admin-api test:     ✓ should return 200 if guild is ALREADY connected (123 ms)
apps/admin-api test:     ✓ should return 400 if guild ID is missing (17 ms)
apps/admin-api test:   guildService.connectGuild
apps/admin-api test:     ✓ upserts owner by discord id and links guild to the owner (4 ms)
apps/admin-api test: PASS tests/central-settings.test.js
apps/admin-api test:   central settings endpoints
apps/admin-api test:     ✓ GET /api/me/settings auto-creates defaults (87 ms)
apps/admin-api test:     ✓ PATCH /api/me/settings merges updates (83 ms)
apps/admin-api test:     ✓ GET /api/guilds/:guildId/settings requires admin/manager (21 ms)
apps/admin-api test:     ✓ PUT /api/guilds/:guildId/settings allows admin and persists (23 ms)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: token verification failed { error: 'jwt malformed' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-user' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-user' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-user' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-user' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-user' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-admin' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-member' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.log
apps/admin-api test:     !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!
apps/admin-api test:       at Object.log (src/routes/auth.js:22:9)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-admin' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-member' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-member' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.warn
apps/admin-api test:     [admin-api] guild membership check failed {
apps/admin-api test:       userId: 'test-member',
apps/admin-api test:       guildId: 'different-guild-456',
apps/admin-api test:       guildIds: [ 'guild-123' ]
apps/admin-api test:     }
apps/admin-api test:       384 |     if (!guild) {
apps/admin-api test:       385 |       if (shouldDebugAuth()) {
apps/admin-api test:     > 386 |         console.warn("[admin-api] guild membership check failed", {
apps/admin-api test:           |                 ^
apps/admin-api test:       387 |           userId: user.id,
apps/admin-api test:       388 |           guildId: guildIdStr,
apps/admin-api test:       389 |           guildIds: guilds.map((g) => String(g?.id)).slice(0, 25),
apps/admin-api test:       at warn (src/middleware/auth.js:386:17)
apps/admin-api test:       at Object.<anonymous> (tests/auth/auth-middleware.test.js:183:7)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.error
apps/admin-api test:     [auth/active-guild] Bot membership check failed: Discord API error
apps/admin-api test:       797 |       botInstalled = await botInstalledInGuild(normalizedGuildId, botToken);
apps/admin-api test:       798 |     } catch (err) {
apps/admin-api test:     > 799 |       console.error("[auth/active-guild] Bot membership check failed:", err?.message || err);
apps/admin-api test:           |               ^
apps/admin-api test:       800 |       return res.status(503).json({
apps/admin-api test:       801 |         ok: false,
apps/admin-api test:       802 |         error: "bot_membership_unverifiable",
apps/admin-api test:       at error (src/routes/auth.js:799:15)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-member' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test:   console.info
apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-member' }
apps/admin-api test:       at info (src/middleware/auth.js:22:13)
apps/admin-api test: PASS tests/auth/auth-middleware.test.js
apps/admin-api test:   Auth Middleware
apps/admin-api test:     resolveUser
apps/admin-api test:       ✓ should return null when no token in cookies (49 ms)
apps/admin-api test:       ✓ should return null when token is invalid (22 ms)
apps/admin-api test:       ✓ should return hydrated user when session exists (12 ms)
apps/admin-api test:       ✓ should return fallback user when no session exists (17 ms)
apps/admin-api test:       ✓ should cache user resolution (14 ms)
apps/admin-api test:     requireAuth
apps/admin-api test:       ✓ should call next when user is authenticated (18 ms)
apps/admin-api test:       ✓ should return 401 when user is not authenticated (13 ms)
apps/admin-api test:     requireRole
apps/admin-api test:       ✓ should call next when user has required role (member) (20 ms)
apps/admin-api test:       ✓ should call next when user has higher role than required (16 ms)
apps/admin-api test:       ✓ should return 403 when user has insufficient role (29 ms)
apps/admin-api test:       ✓ should return 401 when user is not authenticated (16 ms)
apps/admin-api test:     requireGuildMember
apps/admin-api test:       ✓ should call next for admin user regardless of guild membership (26 ms)
apps/admin-api test:       ✓ should call next when user is member of the guild (15 ms)
apps/admin-api test:       ✓ should return 403 when user is not member of the guild (23 ms)
apps/admin-api test:       ✓ should return 400 when guildId parameter is missing (22 ms)
apps/admin-api test:       ✓ should return 401 when user is not authenticated (10 ms)
apps/admin-api test:       ✓ should use custom parameter name (19 ms)
apps/admin-api test: PASS tests/discord-guilds.test.js
apps/admin-api test:   GET /discord/guilds
apps/admin-api test:     ✓ should return shared guilds with role labels (62 ms)
apps/admin-api test:   console.error
apps/admin-api test:     [auth/active-guild] SLIMYAI_BOT_TOKEN not configured
apps/admin-api test:       785 |     const botToken = getSlimyBotToken();
apps/admin-api test:       786 |     if (!botToken) {
apps/admin-api test:     > 787 |       console.error("[auth/active-guild] SLIMYAI_BOT_TOKEN not configured");
apps/admin-api test:           |               ^
apps/admin-api test:       788 |       return res.status(503).json({
apps/admin-api test:       789 |         ok: false,
apps/admin-api test:       790 |         error: "bot_token_missing",
apps/admin-api test:       at error (src/routes/auth.js:787:15)
apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
apps/admin-api test:       at Route.dispatch (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:119:3)
apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:284:15
apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
apps/admin-api test:       at Function.handle (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:175:3)
apps/admin-api test:       at router (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:47:12)
apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
apps/admin-api test:       at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
apps/admin-api test:       at next (tests/auth/active-guild.test.js:43:7)
apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
apps/admin-api test:       at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
apps/admin-api test:       at cookieParser (../../node_modules/.pnpm/cookie-parser@1.4.7/node_modules/cookie-parser/index.js:57:14)
apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
apps/admin-api test:       at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
apps/admin-api test:       at ../../node_modules/.pnpm/body-parser@1.20.4/node_modules/body-parser/lib/read.js:137:5
apps/admin-api test:       at invokeCallback (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:238:16)
apps/admin-api test:       at done (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:227:7)
apps/admin-api test:       at IncomingMessage.onEnd (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:287:7)
apps/admin-api test: PASS tests/auth/active-guild.test.js
apps/admin-api test:   POST /api/auth/active-guild
apps/admin-api test:     ✓ rejects guilds where bot is not installed (O(1) check) (47 ms)
apps/admin-api test:     ✓ returns 503 when bot membership check fails (37 ms)
apps/admin-api test:     ✓ returns 503 when bot token is missing (61 ms)
apps/admin-api test:     ✓ succeeds when bot is installed in guild (29 ms)
apps/admin-api test:     ✓ returns role for primary guild based on policy logic (28 ms)
apps/admin-api test:     ✓ normalizes guildId to string (60 ms)
apps/admin-api test:   console.log
apps/admin-api test:     [requireGuildAccess] Checking access for user discord-user-id to guild guild-123
apps/admin-api test:       at log (src/middleware/rbac.js:33:13)
apps/admin-api test:   console.warn
apps/admin-api test:     [requireGuildAccess] User discord-user-id not found in DB
apps/admin-api test:       38 |
apps/admin-api test:       39 |     if (!user) {
apps/admin-api test:     > 40 |       console.warn(`[requireGuildAccess] User ${req.user.id} not found in DB`);
apps/admin-api test:          |               ^
apps/admin-api test:       41 |       return res.status(403).json({ error: "guild-access-denied" });
apps/admin-api test:       42 |     }
apps/admin-api test:       43 |
apps/admin-api test:       at warn (src/middleware/rbac.js:40:15)
apps/admin-api test:       at Object.<anonymous> (tests/middleware/rbac.test.js:53:5)
apps/admin-api test:   console.log
apps/admin-api test:     [requireGuildAccess] Checking access for user discord-user-id to guild guild-123
apps/admin-api test:       at log (src/middleware/rbac.js:33:13)
apps/admin-api test:   console.warn
apps/admin-api test:     [requireGuildAccess] User db-user-id is not a member of guild guild-123
apps/admin-api test:       56 |
apps/admin-api test:       57 |     if (!userGuild) {
apps/admin-api test:     > 58 |       console.warn(`[requireGuildAccess] User ${user.id} is not a member of guild ${guildId}`);
apps/admin-api test:          |               ^
apps/admin-api test:       59 |       return res.status(403).json({ error: "guild-access-denied" });
apps/admin-api test:       60 |     }
apps/admin-api test:       61 |
apps/admin-api test:       at warn (src/middleware/rbac.js:58:15)
apps/admin-api test:       at Object.<anonymous> (tests/middleware/rbac.test.js:63:5)
apps/admin-api test:   console.log
apps/admin-api test:     [requireGuildAccess] Checking access for user discord-user-id to guild guild-123
apps/admin-api test:       at log (src/middleware/rbac.js:33:13)
apps/admin-api test: PASS tests/middleware/rbac.test.js
apps/admin-api test:   requireGuildAccess Middleware
apps/admin-api test:     ✓ should return 400 if guildId is missing (3 ms)
apps/admin-api test:     ✓ should return 401 if user is not authenticated (6 ms)
apps/admin-api test:     ✓ should return 403 if user not found in DB (21 ms)
apps/admin-api test:     ✓ should return 403 if user is not a member of the guild (22 ms)
apps/admin-api test:     ✓ should call next() and attach guild info if user has access (12 ms)
apps/admin-api test: PASS tests/routes/stats.test.js
apps/admin-api test:   Stats Routes
apps/admin-api test:     ✓ GET /api/stats should return system metrics by default (94 ms)
apps/admin-api test:     ✓ GET /api/stats?action=system-metrics should return metrics (19 ms)
apps/admin-api test:     ✓ GET /api/stats/events/stream should set SSE headers (9 ms)
apps/admin-api test: PASS tests/routes/usage.test.js
apps/admin-api test:   GET /api/usage
apps/admin-api test:     ✓ should return 200 and correct usage data structure (58 ms)
apps/admin-api test: PASS tests/diag.test.js
apps/admin-api test:   diagnostics placeholder
apps/admin-api test:     ✓ skipped in test mode (1 ms)
apps/admin-api test: PASS tests/numparse.test.js
apps/admin-api test:   numparse shim
apps/admin-api test:     ✓ returns numeric values for plain numbers (2 ms)
apps/admin-api test:     ✓ returns null for non-numeric values or suffixed strings (2 ms)
apps/admin-api test: PASS src/lib/auth/post-login-redirect.test.js
apps/admin-api test:   resolvePostLoginRedirectUrl
apps/admin-api test:     ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to (2 ms)
apps/admin-api test:     ✓ falls back to x-forwarded origin when cookie missing (4 ms)
apps/admin-api test:     ✓ falls back to CLIENT_URL when cookie and forwarded origin missing (1 ms)
apps/admin-api test: PASS tests/club-store.test.js
apps/admin-api test:   club-store shim
apps/admin-api test:     ✓ canonicalize lowercases input (6 ms)
apps/admin-api test:     ✓ canonicalize handles nullish values (7 ms)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!
. test: apps/admin-api test:       at Object.log (src/routes/auth.js:22:9)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!
. test: apps/admin-api test:       at Object.log (src/routes/auth.js:22:9)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     [auth/me] req.user keys: id,username,role,guilds
. test: apps/admin-api test:       at log (src/routes/auth.js:532:13)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     [auth/me] rawUser keys: id,username,role,guilds
. test: apps/admin-api test:       at log (src/routes/auth.js:533:13)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     [auth/me] Lookup User ID: test-user-id
. test: apps/admin-api test:       at log (src/routes/auth.js:534:13)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     [auth/me] DB User Found: true
. test: apps/admin-api test:       at log (src/routes/auth.js:652:13)
. test: apps/admin-api test:   console.warn
. test: apps/admin-api test:     [auth/me] DB guild lookup failed; returning session-only guilds { error: "Cannot read properties of undefined (reading 'findMany')" }
. test: apps/admin-api test:       673 |         warnings.push("db_guilds_lookup_failed");
. test: apps/admin-api test:       674 |         if (shouldDebugAuth()) {
. test: apps/admin-api test:     > 675 |           console.warn("[auth/me] DB guild lookup failed; returning session-only guilds", {
. test: apps/admin-api test:           |                   ^
. test: apps/admin-api test:       676 |             error: err?.message || String(err),
. test: apps/admin-api test:       677 |           });
. test: apps/admin-api test:       678 |         }
. test: apps/admin-api test:       at warn (src/routes/auth.js:675:19)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     [auth/me] req.user keys: id,username,role,guilds
. test: apps/admin-api test:       at log (src/routes/auth.js:532:13)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     [auth/me] rawUser keys: id,username,role,guilds
. test: apps/admin-api test:       at log (src/routes/auth.js:533:13)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     [auth/me] Lookup User ID: test-user-id
. test: apps/admin-api test:       at log (src/routes/auth.js:534:13)
. test: apps/admin-api test:   console.warn
. test: apps/admin-api test:     [auth/me] DB user lookup failed; returning session-only response { error: 'DB Error' }
. test: apps/admin-api test:       644 |       warnings.push("db_user_lookup_failed");
. test: apps/admin-api test:       645 |       if (shouldDebugAuth()) {
. test: apps/admin-api test:     > 646 |         console.warn("[auth/me] DB user lookup failed; returning session-only response", {
. test: apps/admin-api test:           |                 ^
. test: apps/admin-api test:       647 |           error: err?.message || String(err),
. test: apps/admin-api test:       648 |         });
. test: apps/admin-api test:       649 |       }
. test: apps/admin-api test:       at warn (src/routes/auth.js:646:17)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     [auth/me] DB User Found: false
. test: apps/admin-api test:       at log (src/routes/auth.js:652:13)
. test: apps/admin-api test: PASS tests/auth/active-guild.cookie.test.js
. test: apps/admin-api test:   POST /api/auth/active-guild cookie
. test: apps/admin-api test:     ✓ sets slimy_admin_active_guild_id on success (86 ms)
. test: apps/admin-api test:     ✓ does not set cookie when bot not installed (16 ms)
. test: apps/admin-api test:   console.warn
. test: apps/admin-api test:     [auth/me] Fallback to cookie guilds: 0
. test: apps/admin-api test:       689 |       // But ensure we at least pass the ID
. test: apps/admin-api test:       690 |       const cookieGuilds = Array.isArray(rawUser?.guilds) ? rawUser.guilds : [];
. test: apps/admin-api test:     > 691 |       console.warn("[auth/me] Fallback to cookie guilds:", cookieGuilds.length);
. test: apps/admin-api test:           |               ^
. test: apps/admin-api test:       692 |       sessionGuilds = cookieGuilds.map((g) => ({
. test: apps/admin-api test:       693 |         id: g?.id,
. test: apps/admin-api test:       694 |         roles: g?.roles,
. test: apps/admin-api test:       at warn (src/routes/auth.js:691:15)
. test: apps/admin-api test: PASS tests/auth/me-context.test.js
. test: apps/admin-api test:   GET /api/auth/me Context Hydration
. test: apps/admin-api test:     ✓ should include lastActiveGuild from DB (119 ms)
. test: apps/admin-api test:     ✓ should handle DB errors gracefully (42 ms)
. test: apps/admin-api test:   console.error
. test: apps/admin-api test:     [guilds/connect] Missing SLIMYAI_BOT_TOKEN
. test: apps/admin-api test:       233 |       const SLIMYAI_BOT_TOKEN = getSlimyBotToken();
. test: apps/admin-api test:       234 |       if (!SLIMYAI_BOT_TOKEN) {
. test: apps/admin-api test:     > 235 |         console.error("[guilds/connect] Missing SLIMYAI_BOT_TOKEN");
. test: apps/admin-api test:           |                 ^
. test: apps/admin-api test:       236 |         return res.status(500).json({ error: "MISSING_SLIMYAI_BOT_TOKEN" });
. test: apps/admin-api test:       237 |       }
. test: apps/admin-api test:       238 |
. test: apps/admin-api test:       at error (src/routes/guilds.js:235:17)
. test: apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
. test: apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
. test: apps/admin-api test:       at next (tests/guild-connect.test.js:24:5)
. test: apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
. test: apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
. test: apps/admin-api test:       at next (tests/guild-connect.test.js:11:5)
. test: apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
. test: apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
. test: apps/admin-api test:       at Route.dispatch (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:119:3)
. test: apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
. test: apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:284:15
. test: apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
. test: apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
. test: apps/admin-api test:       at next (tests/guild-connect.test.js:11:5)
. test: apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
. test: apps/admin-api test:       at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
. test: apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
. test: apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
. test: apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
. test: apps/admin-api test:       at Function.handle (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:175:3)
. test: apps/admin-api test:       at router (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:47:12)
. test: apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
. test: apps/admin-api test:       at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
. test: apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
. test: apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
. test: apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
. test: apps/admin-api test:       at ../../node_modules/.pnpm/body-parser@1.20.4/node_modules/body-parser/lib/read.js:137:5
. test: apps/admin-api test:       at invokeCallback (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:238:16)
. test: apps/admin-api test:       at done (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:227:7)
. test: apps/admin-api test:       at IncomingMessage.onEnd (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:287:7)
apps/admin-api test: A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
apps/admin-api test: Test Suites: 12 skipped, 16 passed, 16 of 28 total
apps/admin-api test: Tests:       12 skipped, 59 passed, 71 total
apps/admin-api test: Snapshots:   0 total
apps/admin-api test: Time:        8.409 s
apps/admin-api test: Ran all test suites.
. test: apps/admin-api test: PASS tests/guild-connect.test.js
. test: apps/admin-api test:   POST /guilds/connect
. test: apps/admin-api test:     ✓ should fail if SLIMYAI_BOT_TOKEN is missing (261 ms)
. test: apps/admin-api test:     ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (14 ms)
. test: apps/admin-api test:     ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (7 ms)
. test: apps/admin-api test:     ✓ should succeed if guild is shared (9 ms)
apps/admin-api test: Done
. test: apps/admin-api test: PASS tests/guilds-read.test.js
. test: apps/admin-api test:   GET /api/guilds/:guildId
. test: apps/admin-api test:     ✓ should return guild details for authenticated user (11 ms)
. test: apps/admin-api test:     ✓ should return 404 for non-existent guild (12 ms)
. test: apps/admin-api test: PASS tests/central-settings.test.js
. test: apps/admin-api test:   central settings endpoints
. test: apps/admin-api test:     ✓ GET /api/me/settings auto-creates defaults (42 ms)
. test: apps/admin-api test:     ✓ PATCH /api/me/settings merges updates (88 ms)
. test: apps/admin-api test:     ✓ GET /api/guilds/:guildId/settings requires admin/manager (14 ms)
. test: apps/admin-api test:     ✓ PUT /api/guilds/:guildId/settings allows admin and persists (21 ms)
. test: apps/admin-api test: PASS tests/guilds-connect.test.js
. test: apps/admin-api test:   POST /api/guilds/connect
. test: apps/admin-api test:     ✓ should return 200 when connecting with valid frontend payload (88 ms)
. test: apps/admin-api test:     ✓ should return 200 if guild is ALREADY connected (75 ms)
. test: apps/admin-api test:     ✓ should return 400 if guild ID is missing (24 ms)
. test: apps/admin-api test:   guildService.connectGuild
. test: apps/admin-api test:     ✓ upserts owner by discord id and links guild to the owner (12 ms)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: token verification failed { error: 'jwt malformed' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-user' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-user' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-user' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-user' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-user' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/web test: stdout | tests/unit/codes-cache.test.ts > CodesCache > connection management > should connect successfully
. test: apps/web test: Redis cache connected
. test: apps/web test: Redis cache connected
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-admin' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-member' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/web test: stderr | tests/unit/codes-cache.test.ts > CodesCache > connection management > should handle connection failures
. test: apps/web test: Failed to connect to Redis: Error: Connection failed
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/codes-cache.test.ts:88:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-admin' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-member' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/web test: stderr | tests/unit/codes-cache.test.ts > CodesCache > cache operations > should handle cache set failures
. test: apps/web test: Cache set attempt 1 failed: Error: Set failed
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/codes-cache.test.ts:143:47
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-member' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.warn
. test: apps/admin-api test:     [admin-api] guild membership check failed {
. test: apps/admin-api test:       userId: 'test-member',
. test: apps/admin-api test:       guildId: 'different-guild-456',
. test: apps/admin-api test:       guildIds: [ 'guild-123' ]
. test: apps/admin-api test:     }
. test: apps/admin-api test:       384 |     if (!guild) {
. test: apps/admin-api test:       385 |       if (shouldDebugAuth()) {
. test: apps/admin-api test:     > 386 |         console.warn("[admin-api] guild membership check failed", {
. test: apps/admin-api test:           |                 ^
. test: apps/admin-api test:       387 |           userId: user.id,
. test: apps/admin-api test:       388 |           guildId: guildIdStr,
. test: apps/admin-api test:       389 |           guildIds: guilds.map((g) => String(g?.id)).slice(0, 25),
. test: apps/admin-api test:       at warn (src/middleware/auth.js:386:17)
. test: apps/admin-api test:       at Object.<anonymous> (tests/auth/auth-middleware.test.js:183:7)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-member' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test:   console.info
. test: apps/admin-api test:     [admin-api] readAuth: user hydrated { userId: 'test-member' }
. test: apps/admin-api test:       at info (src/middleware/auth.js:22:13)
. test: apps/admin-api test: PASS tests/auth/auth-middleware.test.js
. test: apps/admin-api test:   Auth Middleware
. test: apps/admin-api test:     resolveUser
. test: apps/admin-api test:       ✓ should return null when no token in cookies (27 ms)
. test: apps/admin-api test:       ✓ should return null when token is invalid (10 ms)
. test: apps/admin-api test:       ✓ should return hydrated user when session exists (6 ms)
. test: apps/admin-api test:       ✓ should return fallback user when no session exists (8 ms)
. test: apps/admin-api test:       ✓ should cache user resolution (6 ms)
. test: apps/admin-api test:     requireAuth
. test: apps/admin-api test:       ✓ should call next when user is authenticated (15 ms)
. test: apps/admin-api test:       ✓ should return 401 when user is not authenticated (8 ms)
. test: apps/admin-api test:     requireRole
. test: apps/admin-api test:       ✓ should call next when user has required role (member) (17 ms)
. test: apps/admin-api test:       ✓ should call next when user has higher role than required (8 ms)
. test: apps/admin-api test:       ✓ should return 403 when user has insufficient role (7 ms)
. test: apps/admin-api test:       ✓ should return 401 when user is not authenticated (8 ms)
. test: apps/admin-api test:     requireGuildMember
. test: apps/admin-api test:       ✓ should call next for admin user regardless of guild membership (17 ms)
. test: apps/admin-api test:       ✓ should call next when user is member of the guild (8 ms)
. test: apps/admin-api test:       ✓ should return 403 when user is not member of the guild (22 ms)
. test: apps/admin-api test:       ✓ should return 400 when guildId parameter is missing (11 ms)
. test: apps/admin-api test:       ✓ should return 401 when user is not authenticated (5 ms)
. test: apps/admin-api test:       ✓ should use custom parameter name (16 ms)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!
. test: apps/admin-api test:       at Object.log (src/routes/auth.js:22:9)
. test: apps/admin-api test:   console.error
. test: apps/admin-api test:     [auth/active-guild] Bot membership check failed: Discord API error
. test: apps/admin-api test:       797 |       botInstalled = await botInstalledInGuild(normalizedGuildId, botToken);
. test: apps/admin-api test:       798 |     } catch (err) {
. test: apps/admin-api test:     > 799 |       console.error("[auth/active-guild] Bot membership check failed:", err?.message || err);
. test: apps/admin-api test:           |               ^
. test: apps/admin-api test:       800 |       return res.status(503).json({
. test: apps/admin-api test:       801 |         ok: false,
. test: apps/admin-api test:       802 |         error: "bot_membership_unverifiable",
. test: apps/admin-api test:       at error (src/routes/auth.js:799:15)
. test: apps/admin-api test:   console.error
. test: apps/admin-api test:     [auth/active-guild] SLIMYAI_BOT_TOKEN not configured
. test: apps/admin-api test:       785 |     const botToken = getSlimyBotToken();
. test: apps/admin-api test:       786 |     if (!botToken) {
. test: apps/admin-api test:     > 787 |       console.error("[auth/active-guild] SLIMYAI_BOT_TOKEN not configured");
. test: apps/admin-api test:           |               ^
. test: apps/admin-api test:       788 |       return res.status(503).json({
. test: apps/admin-api test:       789 |         ok: false,
. test: apps/admin-api test:       790 |         error: "bot_token_missing",
. test: apps/admin-api test:       at error (src/routes/auth.js:787:15)
. test: apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
. test: apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:149:13)
. test: apps/admin-api test:       at Route.dispatch (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/route.js:119:3)
. test: apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
. test: apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:284:15
. test: apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
. test: apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
. test: apps/admin-api test:       at Function.handle (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:175:3)
. test: apps/admin-api test:       at router (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:47:12)
. test: apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
. test: apps/admin-api test:       at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
. test: apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
. test: apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
. test: apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
. test: apps/admin-api test:       at next (tests/auth/active-guild.test.js:43:7)
. test: apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
. test: apps/admin-api test:       at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
. test: apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
. test: apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
. test: apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
. test: apps/admin-api test:       at cookieParser (../../node_modules/.pnpm/cookie-parser@1.4.7/node_modules/cookie-parser/index.js:57:14)
. test: apps/admin-api test:       at Layer.handle [as handle_request] (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/layer.js:95:5)
. test: apps/admin-api test:       at trim_prefix (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:328:13)
. test: apps/admin-api test:       at ../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:286:9
. test: apps/admin-api test:       at Function.process_params (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:346:12)
. test: apps/admin-api test:       at next (../../node_modules/.pnpm/express@4.22.1/node_modules/express/lib/router/index.js:280:10)
. test: apps/admin-api test:       at ../../node_modules/.pnpm/body-parser@1.20.4/node_modules/body-parser/lib/read.js:137:5
. test: apps/admin-api test:       at invokeCallback (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:238:16)
. test: apps/admin-api test:       at done (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:227:7)
. test: apps/admin-api test:       at IncomingMessage.onEnd (../../node_modules/.pnpm/raw-body@2.5.3/node_modules/raw-body/index.js:287:7)
. test: apps/admin-api test: PASS tests/discord-guilds.test.js
. test: apps/admin-api test:   GET /discord/guilds
. test: apps/admin-api test:     ✓ should return shared guilds with role labels (38 ms)
. test: apps/admin-api test: PASS tests/auth/active-guild.test.js
. test: apps/admin-api test:   POST /api/auth/active-guild
. test: apps/admin-api test:     ✓ rejects guilds where bot is not installed (O(1) check) (21 ms)
. test: apps/admin-api test:     ✓ returns 503 when bot membership check fails (12 ms)
. test: apps/admin-api test:     ✓ returns 503 when bot token is missing (17 ms)
. test: apps/admin-api test:     ✓ succeeds when bot is installed in guild (16 ms)
. test: apps/admin-api test:     ✓ returns role for primary guild based on policy logic (16 ms)
. test: apps/admin-api test:     ✓ normalizes guildId to string (26 ms)
. test: apps/admin-api test: PASS tests/routes/stats.test.js
. test: apps/admin-api test:   Stats Routes
. test: apps/admin-api test:     ✓ GET /api/stats should return system metrics by default (11 ms)
. test: apps/admin-api test:     ✓ GET /api/stats?action=system-metrics should return metrics (8 ms)
. test: apps/admin-api test:     ✓ GET /api/stats/events/stream should set SSE headers (2 ms)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     [requireGuildAccess] Checking access for user discord-user-id to guild guild-123
. test: apps/admin-api test:       at log (src/middleware/rbac.js:33:13)
. test: apps/admin-api test:   console.warn
. test: apps/admin-api test:     [requireGuildAccess] User discord-user-id not found in DB
. test: apps/admin-api test:       38 |
. test: apps/admin-api test:       39 |     if (!user) {
. test: apps/admin-api test:     > 40 |       console.warn(`[requireGuildAccess] User ${req.user.id} not found in DB`);
. test: apps/admin-api test:          |               ^
. test: apps/admin-api test:       41 |       return res.status(403).json({ error: "guild-access-denied" });
. test: apps/admin-api test:       42 |     }
. test: apps/admin-api test:       43 |
. test: apps/admin-api test:       at warn (src/middleware/rbac.js:40:15)
. test: apps/admin-api test:       at Object.<anonymous> (tests/middleware/rbac.test.js:53:5)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     [requireGuildAccess] Checking access for user discord-user-id to guild guild-123
. test: apps/admin-api test:       at log (src/middleware/rbac.js:33:13)
. test: apps/admin-api test:   console.warn
. test: apps/admin-api test:     [requireGuildAccess] User db-user-id is not a member of guild guild-123
. test: apps/admin-api test:       56 |
. test: apps/admin-api test:       57 |     if (!userGuild) {
. test: apps/admin-api test:     > 58 |       console.warn(`[requireGuildAccess] User ${user.id} is not a member of guild ${guildId}`);
. test: apps/admin-api test:          |               ^
. test: apps/admin-api test:       59 |       return res.status(403).json({ error: "guild-access-denied" });
. test: apps/admin-api test:       60 |     }
. test: apps/admin-api test:       61 |
. test: apps/admin-api test:       at warn (src/middleware/rbac.js:58:15)
. test: apps/admin-api test:       at Object.<anonymous> (tests/middleware/rbac.test.js:63:5)
. test: apps/admin-api test:   console.log
. test: apps/admin-api test:     [requireGuildAccess] Checking access for user discord-user-id to guild guild-123
. test: apps/admin-api test:       at log (src/middleware/rbac.js:33:13)
. test: apps/admin-api test: PASS tests/middleware/rbac.test.js
. test: apps/admin-api test:   requireGuildAccess Middleware
. test: apps/admin-api test:     ✓ should return 400 if guildId is missing (2 ms)
. test: apps/admin-api test:     ✓ should return 401 if user is not authenticated (1 ms)
. test: apps/admin-api test:     ✓ should return 403 if user not found in DB (11 ms)
. test: apps/admin-api test:     ✓ should return 403 if user is not a member of the guild (13 ms)
. test: apps/admin-api test:     ✓ should call next() and attach guild info if user has access (8 ms)
. test: apps/admin-api test: PASS tests/diag.test.js
. test: apps/admin-api test:   diagnostics placeholder
. test: apps/admin-api test:     ✓ skipped in test mode (2 ms)
. test: apps/admin-api test: PASS tests/routes/usage.test.js
. test: apps/admin-api test:   GET /api/usage
. test: apps/admin-api test:     ✓ should return 200 and correct usage data structure (11 ms)
. test: apps/admin-api test: PASS src/lib/auth/post-login-redirect.test.js
. test: apps/admin-api test:   resolvePostLoginRedirectUrl
. test: apps/admin-api test:     ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to (2 ms)
. test: apps/admin-api test:     ✓ falls back to x-forwarded origin when cookie missing
. test: apps/admin-api test:     ✓ falls back to CLIENT_URL when cookie and forwarded origin missing (1 ms)
. test: apps/admin-api test: PASS tests/numparse.test.js
. test: apps/admin-api test:   numparse shim
. test: apps/admin-api test:     ✓ returns numeric values for plain numbers (2 ms)
. test: apps/admin-api test:     ✓ returns null for non-numeric values or suffixed strings (6 ms)
. test: apps/admin-api test: PASS tests/club-store.test.js
. test: apps/admin-api test:   club-store shim
. test: apps/admin-api test:     ✓ canonicalize lowercases input (1 ms)
. test: apps/admin-api test:     ✓ canonicalize handles nullish values (1 ms)
. test: apps/web test: stderr | tests/components/usage-page.test.tsx > UsagePage > Error state > should display error message when API fails with 502
. test: apps/web test: Failed to fetch usage: Error: HTTP 502: Bad Gateway
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/components/usage-page.test.tsx:75:9
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: stderr | tests/unit/codes-cache.test.ts > CodesCache > cache operations > should handle cache set failures
. test: apps/web test: Cache set attempt 2 failed: Error: Set failed
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/codes-cache.test.ts:143:47
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: stderr | tests/components/usage-page.test.tsx > UsagePage > Error state > should display error message when API fails with network error
. test: apps/web test: Failed to fetch usage: Error: Network error: Unable to connect to usage API
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/components/usage-page.test.tsx:91:9
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: stderr | tests/components/usage-page.test.tsx > UsagePage > Error state > should not crash the page on error
. test: apps/web test: Failed to fetch usage: Error: Unexpected error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/components/usage-page.test.tsx:103:9
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/admin-api test: A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
. test: apps/admin-api test: Test Suites: 12 skipped, 16 passed, 16 of 28 total
. test: apps/admin-api test: Tests:       12 skipped, 59 passed, 71 total
. test: apps/admin-api test: Snapshots:   0 total
. test: apps/admin-api test: Time:        8.519 s
. test: apps/admin-api test: Ran all test suites.
. test: apps/web test: stderr | tests/components/usage-page.test.tsx > UsagePage > Error state > should handle unknown errors gracefully
. test: apps/web test: Failed to fetch usage: String error
. test: apps/admin-api test: Done
. test: apps/web test:  ✓ tests/components/button.test.tsx (9 tests) 754ms
. test: apps/web test:  ✓ tests/components/usage-page.test.tsx (22 tests) 717ms
. test: apps/web test: stderr | tests/unit/codes-cache.test.ts > CodesCache > cache operations > should handle cache set failures
. test: apps/web test: Cache set attempt 3 failed: Error: Set failed
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/codes-cache.test.ts:143:47
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: Cache set failed after 3 attempts
. test: apps/web test: stderr | tests/unit/codes-cache.test.ts > CodesCache > error handling > should handle redis operation failures gracefully
. test: apps/web test: Cache get attempt 1 failed: Error: Redis error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/codes-cache.test.ts:184:45
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: stderr | tests/unit/codes-cache.test.ts > CodesCache > error handling > should handle redis operation failures gracefully
. test: apps/web test: Cache get attempt 2 failed: Error: Redis error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/codes-cache.test.ts:184:45
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: stderr | tests/components/usage-badge.test.tsx > UsageBadge > Error handling > should not crash on error
. test: apps/web test: Failed to fetch usage: Error: Network error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/components/usage-badge.test.tsx:56:9
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test:  ✓ tests/components/club/results.test.tsx (12 tests) 352ms
. test: apps/web test:  ✓ tests/components/usage-badge.test.tsx (18 tests) 394ms
. test: apps/web test: stderr | tests/unit/codes-cache.test.ts > CodesCache > error handling > should handle redis operation failures gracefully
. test: apps/web test: Cache get attempt 3 failed: Error: Redis error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/codes-cache.test.ts:184:45
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: Cache get failed after 3 attempts
. test: apps/web test: stderr | tests/unit/codes-cache.test.ts > CodesCache > error handling > should retry operations on failure
. test: apps/web test: Cache get attempt 1 failed: Error: First failure
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/codes-cache.test.ts:201:32
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test:  ✓ tests/unit/lib/env.test.ts (5 tests) 136ms
. test: apps/web test: stderr | tests/components/message-bubble.test.tsx > MessageBubble > copies message content to clipboard when copy button is clicked
. test: apps/web test: An update to MessageBubble inside a test was not wrapped in act(...).
. test: apps/web test: When testing, code that causes React state updates should be wrapped into act(...):
. test: apps/web test: act(() => {
. test: apps/web test:   /* fire events that update state */
. test: apps/web test: });
. test: apps/web test: /* assert on the output */
. test: apps/web test: This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act
. test: apps/web test:  ✓ tests/components/message-bubble.test.tsx (11 tests) 227ms
. test: apps/web test:  ✓ tests/unit/codes-cache.test.ts (14 tests) 5094ms
. test: apps/web test:        ✓ should handle cache set failures  2008ms
. test: apps/web test:        ✓ should handle redis operation failures gracefully  2003ms
. test: apps/web test:        ✓ should retry operations on failure  1004ms
. test: apps/web test: stderr | tests/api/club/analyze.test.ts > /api/club/analyze > POST /api/club/analyze > should return 400 when no imageUrls provided
. test: apps/web test: Error occurred: {
. test: apps/web test:   name: 'ValidationError',
. test: apps/web test:   code: 'VALIDATION_ERROR',
. test: apps/web test:   message: 'At least one image URL is required',
. test: apps/web test:   statusCode: 400,
. test: apps/web test:   details: undefined,
. test: apps/web test:   stack: 'ValidationError: At least one image URL is required\n' +
. test: apps/web test:     '    at Module.POST (/opt/slimy/slimy-monorepo/apps/web/app/api/club/analyze/route.ts:17:13)\n' +
. test: apps/web test:     '    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
. test: apps/web test:     '    at /opt/slimy/slimy-monorepo/apps/web/tests/api/club/analyze.test.ts:144:24\n' +
. test: apps/web test:     '    at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:20',
. test: apps/web test:   context: undefined,
. test: apps/web test:   timestamp: '2025-12-20T17:43:13.503Z'
. test: apps/web test: }
. test: apps/web test: stderr | tests/api/club/analyze.test.ts > /api/club/analyze > POST /api/club/analyze > should return 400 when no guildId provided
. test: apps/web test: Error occurred: {
. test: apps/web test:   name: 'ValidationError',
. test: apps/web test:   code: 'VALIDATION_ERROR',
. test: apps/web test:   message: 'Guild ID is required',
. test: apps/web test:   statusCode: 400,
. test: apps/web test:   details: undefined,
. test: apps/web test:   stack: 'ValidationError: Guild ID is required\n' +
. test: apps/web test:     '    at Module.POST (/opt/slimy/slimy-monorepo/apps/web/app/api/club/analyze/route.ts:21:13)\n' +
. test: apps/web test:     '    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
. test: apps/web test:     '    at /opt/slimy/slimy-monorepo/apps/web/tests/api/club/analyze.test.ts:159:24\n' +
. test: apps/web test:     '    at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:20',
. test: apps/web test:   context: undefined,
. test: apps/web test:   timestamp: '2025-12-20T17:43:13.515Z'
. test: apps/web test: }
. test: apps/web test: stderr | tests/api/club/analyze.test.ts > /api/club/analyze > POST /api/club/analyze > should return 400 when no valid image URLs
. test: apps/web test: Error occurred: {
. test: apps/web test:   name: 'ValidationError',
. test: apps/web test:   code: 'VALIDATION_ERROR',
. test: apps/web test:   message: 'No valid image URLs provided',
. test: apps/web test:   statusCode: 400,
. test: apps/web test:   details: undefined,
. test: apps/web test:   stack: 'ValidationError: No valid image URLs provided\n' +
. test: apps/web test:     '    at Module.POST (/opt/slimy/slimy-monorepo/apps/web/app/api/club/analyze/route.ts:35:13)\n' +
. test: apps/web test:     '    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
. test: apps/web test:     '    at /opt/slimy/slimy-monorepo/apps/web/tests/api/club/analyze.test.ts:177:24\n' +
. test: apps/web test:     '    at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:20',
. test: apps/web test:   context: undefined,
. test: apps/web test:   timestamp: '2025-12-20T17:43:13.519Z'
. test: apps/web test: }
. test: apps/web test: stderr | tests/api/club/analyze.test.ts > /api/club/analyze > POST /api/club/analyze > should handle analysis errors gracefully
. test: apps/web test: Analysis error: Error: API Error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/api/club/analyze.test.ts:267:56
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: Error occurred: {
. test: apps/web test:   name: 'AppError',
. test: apps/web test:   code: 'INTERNAL_ERROR',
. test: apps/web test:   message: 'API Error',
. test: apps/web test:   statusCode: 500,
. test: apps/web test:   details: { originalError: 'Error' },
. test: apps/web test:   stack: 'AppError: API Error\n' +
. test: apps/web test:     '    at toAppError (/opt/slimy/slimy-monorepo/apps/web/lib/errors.ts:147:12)\n' +
. test: apps/web test:     '    at errorResponse (/opt/slimy/slimy-monorepo/apps/web/lib/errors.ts:186:20)\n' +
. test: apps/web test:     '    at Module.POST (/opt/slimy/slimy-monorepo/apps/web/app/api/club/analyze/route.ts:119:39)\n' +
. test: apps/web test:     '    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
. test: apps/web test:     '    at /opt/slimy/slimy-monorepo/apps/web/tests/api/club/analyze.test.ts:276:24\n' +
. test: apps/web test:     '    at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:20',
. test: apps/web test:   context: undefined,
. test: apps/web test:   timestamp: '2025-12-20T17:43:13.574Z'
. test: apps/web test: }
. test: apps/web test: stderr | tests/api/club/analyze.test.ts > /api/club/analyze > GET /api/club/analyze > should return 400 when no guildId provided
. test: apps/web test: Error occurred: {
. test: apps/web test:   name: 'ValidationError',
. test: apps/web test:   code: 'VALIDATION_ERROR',
. test: apps/web test:   message: 'Guild ID is required',
. test: apps/web test:   statusCode: 400,
. test: apps/web test:   details: undefined,
. test: apps/web test:   stack: 'ValidationError: Guild ID is required\n' +
. test: apps/web test:     '    at Module.GET (/opt/slimy/slimy-monorepo/apps/web/app/api/club/analyze/route.ts:151:13)\n' +
. test: apps/web test:     '    at /opt/slimy/slimy-monorepo/apps/web/tests/api/club/analyze.test.ts:312:30\n' +
. test: apps/web test:     '    at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11\n' +
. test: apps/web test:     '    at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26\n' +
. test: apps/web test:     '    at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20\n' +
. test: apps/web test:     '    at new Promise (<anonymous>)\n' +
. test: apps/web test:     '    at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)\n' +
. test: apps/web test:     '    at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37\n' +
. test: apps/web test:     '    at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)\n' +
. test: apps/web test:     '    at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)',
. test: apps/web test:   context: undefined,
. test: apps/web test:   timestamp: '2025-12-20T17:43:13.580Z'
. test: apps/web test: }
. test: apps/web test:  ✓ tests/api/club/analyze.test.ts (11 tests) 108ms
. test: apps/web test: stderr | tests/api/club/upload.test.ts > /api/club/upload > should return 400 when no screenshots provided
. test: apps/web test: Error occurred: {
. test: apps/web test:   name: 'ValidationError',
. test: apps/web test:   code: 'VALIDATION_ERROR',
. test: apps/web test:   message: 'No screenshots provided',
. test: apps/web test:   statusCode: 400,
. test: apps/web test:   details: undefined,
. test: apps/web test:   stack: 'ValidationError: No screenshots provided\n' +
. test: apps/web test:     '    at Module.POST (/opt/slimy/slimy-monorepo/apps/web/app/api/club/upload/route.ts:23:13)\n' +
. test: apps/web test:     '    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
. test: apps/web test:     '    at /opt/slimy/slimy-monorepo/apps/web/tests/api/club/upload.test.ts:123:22\n' +
. test: apps/web test:     '    at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:20',
. test: apps/web test:   context: undefined,
. test: apps/web test:   timestamp: '2025-12-20T17:43:13.822Z'
. test: apps/web test: }
. test: apps/web test: stderr | tests/api/club/upload.test.ts > /api/club/upload > should return 400 when no guildId provided
. test: apps/web test: Error occurred: {
. test: apps/web test:   name: 'ValidationError',
. test: apps/web test:   code: 'VALIDATION_ERROR',
. test: apps/web test:   message: 'Guild ID is required',
. test: apps/web test:   statusCode: 400,
. test: apps/web test:   details: undefined,
. test: apps/web test:   stack: 'ValidationError: Guild ID is required\n' +
. test: apps/web test:     '    at Module.POST (/opt/slimy/slimy-monorepo/apps/web/app/api/club/upload/route.ts:27:13)\n' +
. test: apps/web test:     '    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
. test: apps/web test:     '    at /opt/slimy/slimy-monorepo/apps/web/tests/api/club/upload.test.ts:142:22\n' +
. test: apps/web test:     '    at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:20',
. test: apps/web test:   context: undefined,
. test: apps/web test:   timestamp: '2025-12-20T17:43:13.838Z'
. test: apps/web test: }
. test: apps/web test: stderr | tests/api/club/upload.test.ts > /api/club/upload > should handle file upload errors gracefully
. test: apps/web test: Error occurred: {
. test: apps/web test:   name: 'AppError',
. test: apps/web test:   code: 'INTERNAL_ERROR',
. test: apps/web test:   message: 'Disk full',
. test: apps/web test:   statusCode: 500,
. test: apps/web test:   details: { originalError: 'Error' },
. test: apps/web test:   stack: 'AppError: Disk full\n' +
. test: apps/web test:     '    at toAppError (/opt/slimy/slimy-monorepo/apps/web/lib/errors.ts:147:12)\n' +
. test: apps/web test:     '    at errorResponse (/opt/slimy/slimy-monorepo/apps/web/lib/errors.ts:186:20)\n' +
. test: apps/web test:     '    at Module.POST (/opt/slimy/slimy-monorepo/apps/web/app/api/club/upload/route.ts:128:39)\n' +
. test: apps/web test:     '    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
. test: apps/web test:     '    at /opt/slimy/slimy-monorepo/apps/web/tests/api/club/upload.test.ts:228:22\n' +
. test: apps/web test:     '    at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:20',
. test: apps/web test:   context: undefined,
. test: apps/web test:   timestamp: '2025-12-20T17:43:13.857Z'
. test: apps/web test: }
. test: apps/web test: stderr | tests/api/club/upload.test.ts > /api/club/upload > should continue upload even if analysis fails
. test: apps/web test: Analysis failed: Error: Analysis failed
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/api/club/upload.test.ts:243:55
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test:  ✓ tests/api/club/upload.test.ts (6 tests) 54ms
. test: apps/web test: stderr | tests/api/usage-route.test.ts > GET /api/usage > Error handling > should handle errors from getMockUsageData gracefully
. test: apps/web test: Usage API error: Error: Mock error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/api/usage-route.test.ts:82:15
. test: apps/web test:     at Mock (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+spy@4.0.15/node_modules/@vitest/spy/dist/index.js:285:34)
. test: apps/web test:     at Module.GET (/opt/slimy/slimy-monorepo/apps/web/app/api/usage/route.ts:19:23)
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/api/usage-route.test.ts:85:30
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test: stderr | tests/api/usage-route.test.ts > GET /api/usage > Error handling > should return error response with correct structure
. test: apps/web test: Usage API error: Error: Test error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/api/usage-route.test.ts:116:15
. test: apps/web test:     at Mock (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+spy@4.0.15/node_modules/@vitest/spy/dist/index.js:285:34)
. test: apps/web test:     at Module.GET (/opt/slimy/slimy-monorepo/apps/web/app/api/usage/route.ts:19:23)
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/api/usage-route.test.ts:119:30
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:  ✓ tests/api/usage-route.test.ts (14 tests) 51ms
. test: apps/web test: stderr | tests/unit/club/vision.test.ts > Club Vision Library > analyzeClubScreenshot > should handle API errors gracefully
. test: apps/web test: Error analyzing club screenshot: Error: API Error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/club/vision.test.ts:109:60
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: stderr | tests/unit/club/vision.test.ts > Club Vision Library > analyzeClubScreenshot > should handle invalid JSON response
. test: apps/web test: Error analyzing club screenshot: SyntaxError: Unexpected token 'I', "Invalid JS"... is not valid JSON
. test: apps/web test:     at JSON.parse (<anonymous>)
. test: apps/web test:     at Module.analyzeClubScreenshot (/opt/slimy/slimy-monorepo/apps/web/lib/club/vision.ts:90:33)
. test: apps/web test:     at processTicksAndRejections (node:internal/process/task_queues:95:5)
. test: apps/web test: stderr | tests/unit/club/vision.test.ts > Club Vision Library > analyzeClubScreenshot > should handle empty response
. test: apps/web test: Error analyzing club screenshot: Error: No response content from GPT-4 Vision
. test: apps/web test:     at Module.analyzeClubScreenshot (/opt/slimy/slimy-monorepo/apps/web/lib/club/vision.ts:87:13)
. test: apps/web test:     at processTicksAndRejections (node:internal/process/task_queues:95:5)
. test: apps/web test: stderr | tests/unit/club/vision.test.ts > Club Vision Library > analyzeClubScreenshots > should handle partial failures gracefully
. test: apps/web test: Error analyzing club screenshot: Error: API Error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/club/vision.test.ts:189:32
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: stderr | tests/unit/club/vision.test.ts > Club Vision Library > analyzeClubScreenshots > should handle partial failures gracefully
. test: apps/web test: Failed to analyze http://example.com/image2.png: Error: Failed to analyze screenshot: API Error
. test: apps/web test:     at analyzeClubScreenshot (/opt/slimy/slimy-monorepo/apps/web/lib/club/vision.ts:107:11)
. test: apps/web test:     at processTicksAndRejections (node:internal/process/task_queues:95:5)
. test: apps/web test:     at Module.analyzeClubScreenshots (/opt/slimy/slimy-monorepo/apps/web/lib/club/vision.ts:123:22)
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/club/vision.test.ts:192:23
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:20
. test: apps/web test: stderr | tests/unit/club/vision.test.ts > Club Vision Library > validateImageUrl > should return false when fetch fails
. test: apps/web test: Error validating image URL: Error: Network error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/club/vision.test.ts:223:49
. test: apps/web test:     at Mock (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+spy@4.0.15/node_modules/@vitest/spy/dist/index.js:285:34)
. test: apps/web test:     at Module.validateImageUrl (/opt/slimy/slimy-monorepo/apps/web/lib/club/vision.ts:140:28)
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/club/vision.test.ts:225:28
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:  ✓ tests/unit/club/vision.test.ts (13 tests) 48ms
. test: apps/web test: stderr | tests/api/usage.test.ts > Usage API Client > fetchUsageDataSafe > should return null on error (default fallback)
. test: apps/web test: Failed to fetch usage data: UsageApiError: Network error
. test: apps/web test:     at fetchUsageData (/opt/slimy/slimy-monorepo/apps/web/lib/api/usage.ts:108:11)
. test: apps/web test:     at processTicksAndRejections (node:internal/process/task_queues:95:5)
. test: apps/web test:     at fetchUsageDataSafe (/opt/slimy/slimy-monorepo/apps/web/lib/api/usage.ts:126:12)
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/api/usage.test.ts:345:22
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:20 {
. test: apps/web test:   code: 'UNKNOWN_ERROR',
. test: apps/web test:   status: undefined
. test: apps/web test: }
. test: apps/web test: stderr | tests/api/usage.test.ts > Usage API Client > fetchUsageDataSafe > should return custom fallback on error
. test: apps/web test: Failed to fetch usage data: UsageApiError: Network error
. test: apps/web test:     at fetchUsageData (/opt/slimy/slimy-monorepo/apps/web/lib/api/usage.ts:108:11)
. test: apps/web test:     at processTicksAndRejections (node:internal/process/task_queues:95:5)
. test: apps/web test:     at fetchUsageDataSafe (/opt/slimy/slimy-monorepo/apps/web/lib/api/usage.ts:126:12)
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/api/usage.test.ts:359:22
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:20 {
. test: apps/web test:   code: 'UNKNOWN_ERROR',
. test: apps/web test:   status: undefined
. test: apps/web test: }
. test: apps/web test:  ✓ tests/api/usage.test.ts (25 tests) 45ms
. test: apps/web test: stderr | tests/unit/screenshot/analyzer.test.ts > Screenshot Analyzer > analyzeScreenshot > should handle API errors gracefully
. test: apps/web test: Error analyzing screenshot: Error: API Error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/screenshot/analyzer.test.ts:134:60
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: stderr | tests/unit/screenshot/analyzer.test.ts > Screenshot Analyzer > analyzeScreenshots > should handle partial failures
. test: apps/web test: Error analyzing screenshot: Error: API Error
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/screenshot/analyzer.test.ts:190:32
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:145:11
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:26
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1240:20
. test: apps/web test:     at new Promise (<anonymous>)
. test: apps/web test:     at runWithTimeout (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1206:10)
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:37
. test: apps/web test:     at Traces.$ (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/traces.U4xDYhzZ.js:115:27)
. test: apps/web test:     at trace (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@20.19.25_@vitest+ui@4.0.15_jiti@2.6._6f4799287cc307d0b976628207bcb6be/node_modules/vitest/dist/chunks/test.BT8LKgU9.js:239:21)
. test: apps/web test:     at runTest (file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:1650:12)
. test: apps/web test: stderr | tests/unit/screenshot/analyzer.test.ts > Screenshot Analyzer > analyzeScreenshots > should handle partial failures
. test: apps/web test: Failed to analyze http://example.com/image2.png: Error: Failed to analyze screenshot: API Error
. test: apps/web test:     at analyzeScreenshot (/opt/slimy/slimy-monorepo/apps/web/lib/screenshot/analyzer.ts:213:11)
. test: apps/web test:     at processTicksAndRejections (node:internal/process/task_queues:95:5)
. test: apps/web test:     at Module.analyzeScreenshots (/opt/slimy/slimy-monorepo/apps/web/lib/screenshot/analyzer.ts:229:22)
. test: apps/web test:     at /opt/slimy/slimy-monorepo/apps/web/tests/unit/screenshot/analyzer.test.ts:193:23
. test: apps/web test:     at file:///opt/slimy/slimy-monorepo/node_modules/.pnpm/@vitest+runner@4.0.15/node_modules/@vitest/runner/dist/index.js:915:20
. test: apps/web test:  ✓ tests/unit/screenshot/analyzer.test.ts (13 tests) 41ms
. test: apps/web test:  ✓ tests/api/screenshot/route.test.ts (11 tests) 33ms
. test: apps/web test:  ✓ tests/unit/codes-deduplication.test.ts (18 tests) 25ms
. test: apps/web test: stdout | tests/unit/codes-aggregator.test.ts > Codes Aggregator > CodesAggregator > should aggregate codes from all sources
. test: apps/web test: Started auto-refresh for aggregated_codes every 300s
. test: apps/web test: stdout | tests/unit/codes-aggregator.test.ts > Codes Aggregator > CodesAggregator > should handle source failures gracefully
. test: apps/web test: Started auto-refresh for aggregated_codes every 300s
. test: apps/web test: stdout | tests/unit/codes-aggregator.test.ts > Codes Aggregator > CodesAggregator > should get health status
. test: apps/web test: Started auto-refresh for aggregated_codes every 300s
. test: apps/web test: stdout | tests/unit/codes-aggregator.test.ts > Codes Aggregator > CodesAggregator > should deduplicate codes
. test: apps/web test: Started auto-refresh for aggregated_codes every 300s
. test: apps/web test: stdout | tests/unit/codes-aggregator.test.ts > Codes Aggregator > getAggregator > should return singleton instance
. test: apps/web test: Started auto-refresh for aggregated_codes every 300s
. test: apps/web test:  ✓ tests/unit/codes-aggregator.test.ts (14 tests) 34ms
. test: apps/web test:  ✓ tests/api/diag.test.ts (2 tests) 23ms
. test: apps/web test:  ✓ tests/unit/lib/errors.test.ts (18 tests) 24ms
. test: apps/web test:  ✓ tests/unit/lib/config.test.ts (12 tests) 12ms
. test: apps/web test:  ✓ tests/unit/lib/admin-client.test.ts (1 test) 8ms
. test: apps/web test:  ✓ tests/unit/stats-scrubber.test.ts (1 test) 21ms
. test: apps/web test:  ✓ tests/unit/rate-limiter.test.ts (4 tests) 11ms
. test: apps/web test:  ✓ tests/unit/snelp-source.test.ts (2 tests) 8ms
. test: apps/web test:  ✓ tests/unit/usage-thresholds.test.ts (6 tests) 6ms
. test: apps/web test:  ✓ tests/unit/role-mapping.test.ts (5 tests) 4ms
. test: apps/web test:  Test Files  25 passed (25)
. test: apps/web test:       Tests  267 passed (267)
. test: apps/web test:    Start at  17:43:01
. test: apps/web test:    Duration  20.11s (transform 2.24s, setup 4.11s, import 6.33s, tests 8.23s, environment 31.66s)
. test: apps/web test: Done
. test: Done
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
┌ ○ /                                     5.09 kB         118 kB
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
├ ○ /auth-me                              1.08 kB         114 kB
├ ○ /chat                                 2.82 kB         116 kB
├ ○ /club                                 1.93 kB         115 kB
├ ƒ /dashboard                            1.66 kB         115 kB
├ ○ /email-login                          560 B           113 kB
├ ○ /guilds                               2.49 kB         115 kB
├ ○ /guilds/[guildId]                     5.82 kB         119 kB
├ ○ /guilds/[guildId]/channels            1.71 kB         115 kB
├ ○ /guilds/[guildId]/corrections         1.75 kB         115 kB
├ ○ /guilds/[guildId]/personality         890 B           114 kB
├ ○ /guilds/[guildId]/rescan              1.23 kB         114 kB
├ ○ /guilds/[guildId]/settings            1.26 kB         114 kB
├ ○ /guilds/[guildId]/usage               67.5 kB         180 kB
├ ○ /login                                781 B          89.8 kB
├ ○ /settings                             2.06 kB         115 kB
├ ○ /snail                                667 B           114 kB
├ ○ /snail/[guildId]                      4.45 kB         117 kB
└ ○ /status                               1.26 kB         114 kB
+ First Load JS shared by all             89.7 kB
  ├ chunks/framework-8051a8b17472378c.js  45.2 kB
  ├ chunks/main-386d6319e61b79bf.js       36.6 kB
  └ other shared chunks (total)           7.83 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

```


## ./scripts/smoke/stability-gate.sh
```
Preflight: Checking dependencies...
Preflight: OK
Report initialized: /tmp/STABILITY_REPORT_2025-12-20_17-43-56_admin-oauth-guildgate.md

================================
A) BASELINE SANITY
================================
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M apps/admin-api/src/app.js
 M apps/admin-api/tests/auth/auth-middleware.test.js
 M apps/admin-ui/lib/session.js
 M apps/admin-ui/package.json
 M apps/admin-ui/pages/api/admin-api/[...path].js
 M apps/admin-ui/pages/api/auth/discord/authorize-url.js
 M apps/admin-ui/pages/guilds/index.js
 M apps/web/Caddyfile.template
 M docker-compose.yml
 M infra/docker/Caddyfile.slimy-nuc2
 M scripts/smoke/stability-gate.sh
?? apps/admin-ui/lib/settings-tabs.js
?? apps/admin-ui/pages/settings.js
?? apps/admin-ui/tests/
?? docs/buglog/BUG_2025-12-20_16-19-30_cors-proxy-origin-forward.md
?? docs/buglog/BUG_2025-12-20_admin-domain-oauth-redirect-uri.md
?? docs/buglog/BUG_2025-12-20_settings-tabs-gated-guild.md
?? docs/ops/REPORT_2025-12-20_15-59-44_cors-proxy-audit.md
?? docs/reports/REPORT_2025-12-19_admin-subdomain-structure.md
nuc2/verify-role-b33e616
v20.19.6
10.21.0
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED              STATUS                   PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   4 minutes ago        Up 4 minutes (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    About a minute ago   Up About a minute        0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          26 hours ago         Up 26 hours (healthy)    3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         22 hours ago         Up 22 hours              0.0.0.0:3000->3000/tcp, :::3000->3000/tcp

================================
B) SERVICE HEALTH
================================
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "vkatosu28m2vn"
Content-Type: text/html; charset=utf-8
Content-Length: 3755
Vary: Accept-Encoding
Date: Sat, 20 Dec 2025 17:43:57 GMT
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
X-Request-ID: 53e29e07-9c10-4589-947a-ec1b619edaba
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 85
Date: Sat, 20 Dec 2025 17:43:57 GMT
Connection: keep-alive
Keep-Alive: timeout=5


================================
C) CRITICAL BEHAVIOR CHECKS
================================

C1: OAuth authorize-url redirect_uri...
Location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=02a0369af27ae4b505dbbfe615d2c505&prompt=consent

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

  console.log
    [auth/me] req.user keys: id,username,role,guilds

      at log (src/routes/auth.js:532:13)

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

PASS tests/guild-connect.test.js
  POST /guilds/connect
    ✓ should fail if SLIMYAI_BOT_TOKEN is missing (168 ms)
    ✓ should return 403 USER_NOT_IN_GUILD if user is not in guild (8 ms)
    ✓ should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only) (7 ms)
    ✓ should succeed if guild is shared (6 ms)

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
    ✓ should include lastActiveGuild from DB (50 ms)
    ✓ should handle DB errors gracefully (19 ms)

PASS tests/auth/active-guild.cookie.test.js
  POST /api/auth/active-guild cookie
    ✓ sets slimy_admin_active_guild_id on success (58 ms)
    ✓ does not set cookie when bot not installed (9 ms)

PASS tests/guilds-connect.test.js
  POST /api/guilds/connect
    ✓ should return 200 when connecting with valid frontend payload (74 ms)
    ✓ should return 200 if guild is ALREADY connected (40 ms)
    ✓ should return 400 if guild ID is missing (7 ms)
  guildService.connectGuild
    ✓ upserts owner by discord id and links guild to the owner (4 ms)

PASS tests/central-settings.test.js
  central settings endpoints
    ✓ GET /api/me/settings auto-creates defaults (26 ms)
    ✓ PATCH /api/me/settings merges updates (27 ms)
    ✓ GET /api/guilds/:guildId/settings requires admin/manager (10 ms)
    ✓ PUT /api/guilds/:guildId/settings allows admin and persists (23 ms)

PASS tests/guilds-read.test.js
  GET /api/guilds/:guildId
    ✓ should return guild details for authenticated user (27 ms)
    ✓ should return 404 for non-existent guild (6 ms)

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

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

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

PASS tests/discord-guilds.test.js
  GET /discord/guilds
    ✓ should return shared guilds with role labels (29 ms)

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
      ✓ should return null when no token in cookies (16 ms)
      ✓ should return null when token is invalid (7 ms)
      ✓ should return hydrated user when session exists (6 ms)
      ✓ should return fallback user when no session exists (6 ms)
      ✓ should cache user resolution (6 ms)
    requireAuth
      ✓ should call next when user is authenticated (10 ms)
      ✓ should return 401 when user is not authenticated (7 ms)
    requireRole
      ✓ should call next when user has required role (member) (7 ms)
      ✓ should call next when user has higher role than required (6 ms)
      ✓ should return 403 when user has insufficient role (15 ms)
      ✓ should return 401 when user is not authenticated (5 ms)
    requireGuildMember
      ✓ should call next for admin user regardless of guild membership (5 ms)
      ✓ should call next when user is member of the guild (4 ms)
      ✓ should return 403 when user is not member of the guild (8 ms)
      ✓ should return 400 when guildId parameter is missing (10 ms)
      ✓ should return 401 when user is not authenticated (4 ms)
      ✓ should use custom parameter name (6 ms)

PASS tests/auth/active-guild.test.js
  POST /api/auth/active-guild
    ✓ rejects guilds where bot is not installed (O(1) check) (14 ms)
    ✓ returns 503 when bot membership check fails (10 ms)
    ✓ returns 503 when bot token is missing (26 ms)
    ✓ succeeds when bot is installed in guild (7 ms)
    ✓ returns role for primary guild based on policy logic (4 ms)
    ✓ normalizes guildId to string (6 ms)

PASS src/lib/auth/post-login-redirect.test.js
  resolvePostLoginRedirectUrl
    ✓ prefers oauth_redirect_uri cookie origin + oauth_return_to (1 ms)
    ✓ falls back to x-forwarded origin when cookie missing (1 ms)
    ✓ falls back to CLIENT_URL when cookie and forwarded origin missing (1 ms)

PASS tests/routes/usage.test.js
  GET /api/usage
    ✓ should return 200 and correct usage data structure (21 ms)

PASS tests/numparse.test.js
  numparse shim
    ✓ returns numeric values for plain numbers (2 ms)
    ✓ returns null for non-numeric values or suffixed strings (1 ms)

PASS tests/routes/stats.test.js
  Stats Routes
    ✓ GET /api/stats should return system metrics by default (20 ms)
    ✓ GET /api/stats?action=system-metrics should return metrics (7 ms)
    ✓ GET /api/stats/events/stream should set SSE headers (3 ms)

PASS tests/club-store.test.js
  club-store shim
    ✓ canonicalize lowercases input (1 ms)
    ✓ canonicalize handles nullish values

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

PASS tests/diag.test.js
  diagnostics placeholder
    ✓ skipped in test mode (1 ms)

  console.log
    [requireGuildAccess] Checking access for user discord-user-id to guild guild-123

      at log (src/middleware/rbac.js:33:13)

PASS tests/middleware/rbac.test.js
  requireGuildAccess Middleware
    ✓ should return 400 if guildId is missing (2 ms)
    ✓ should return 401 if user is not authenticated (1 ms)
    ✓ should return 403 if user not found in DB (14 ms)
    ✓ should return 403 if user is not a member of the guild (10 ms)
    ✓ should call next() and attach guild info if user has access (2 ms)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 12 skipped, 16 passed, 16 of 28 total
Tests:       12 skipped, 59 passed, 71 total
Snapshots:   0 total
Time:        3.378 s, estimated 4 s
Ran all test suites.

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
┌ ○ /                                     5.09 kB         118 kB
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
├ ○ /auth-me                              1.08 kB         114 kB
├ ○ /chat                                 2.82 kB         116 kB
├ ○ /club                                 1.93 kB         115 kB
├ ƒ /dashboard                            1.66 kB         115 kB
├ ○ /email-login                          560 B           113 kB
├ ○ /guilds                               2.49 kB         115 kB
├ ○ /guilds/[guildId]                     5.82 kB         119 kB
├ ○ /guilds/[guildId]/channels            1.71 kB         115 kB
├ ○ /guilds/[guildId]/corrections         1.75 kB         115 kB
├ ○ /guilds/[guildId]/personality         890 B           114 kB
├ ○ /guilds/[guildId]/rescan              1.23 kB         114 kB
├ ○ /guilds/[guildId]/settings            1.26 kB         114 kB
├ ○ /guilds/[guildId]/usage               67.5 kB         180 kB
├ ○ /login                                781 B          89.8 kB
├ ○ /settings                             2.06 kB         115 kB
├ ○ /snail                                667 B           114 kB
├ ○ /snail/[guildId]                      4.45 kB         117 kB
└ ○ /status                               1.26 kB         114 kB
+ First Load JS shared by all             89.7 kB
  ├ chunks/framework-8051a8b17472378c.js  45.2 kB
  ├ chunks/main-386d6319e61b79bf.js       36.6 kB
  └ other shared chunks (total)           7.83 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand


================================
F) PRE-COMMIT SAFETY
================================
apps/admin-api/src/app.js
apps/admin-api/tests/auth/auth-middleware.test.js
apps/admin-ui/lib/session.js
apps/admin-ui/package.json
apps/admin-ui/pages/api/admin-api/[...path].js
apps/admin-ui/pages/api/auth/discord/authorize-url.js
apps/admin-ui/pages/guilds/index.js
apps/web/Caddyfile.template
docker-compose.yml
infra/docker/Caddyfile.slimy-nuc2
scripts/smoke/stability-gate.sh
[PASS] Safety checks passed

No staged changes detected. Exiting successfully (verification-only).
Report available (SUCCESS): /tmp/STABILITY_REPORT_2025-12-20_17-43-56_admin-oauth-guildgate.md
```


## git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M apps/admin-api/src/app.js
 M apps/admin-api/tests/auth/auth-middleware.test.js
 M apps/admin-ui/lib/session.js
 M apps/admin-ui/package.json
 M apps/admin-ui/pages/api/admin-api/[...path].js
 M apps/admin-ui/pages/api/auth/discord/authorize-url.js
 M apps/admin-ui/pages/guilds/index.js
 M apps/web/Caddyfile.template
 M docker-compose.yml
 M infra/docker/Caddyfile.slimy-nuc2
 M scripts/smoke/stability-gate.sh
?? apps/admin-ui/lib/settings-tabs.js
?? apps/admin-ui/pages/settings.js
?? apps/admin-ui/tests/
?? docs/buglog/BUG_2025-12-20_16-19-30_cors-proxy-origin-forward.md
?? docs/buglog/BUG_2025-12-20_admin-domain-oauth-redirect-uri.md
?? docs/buglog/BUG_2025-12-20_settings-tabs-gated-guild.md
?? docs/ops/REPORT_2025-12-20_15-59-44_cors-proxy-audit.md
?? docs/reports/REPORT_2025-12-19_admin-subdomain-structure.md
```


## git diff --name-only
```
apps/admin-api/src/app.js
apps/admin-api/tests/auth/auth-middleware.test.js
apps/admin-ui/lib/session.js
apps/admin-ui/package.json
apps/admin-ui/pages/api/admin-api/[...path].js
apps/admin-ui/pages/api/auth/discord/authorize-url.js
apps/admin-ui/pages/guilds/index.js
apps/web/Caddyfile.template
docker-compose.yml
infra/docker/Caddyfile.slimy-nuc2
scripts/smoke/stability-gate.sh
```


ready to move on

