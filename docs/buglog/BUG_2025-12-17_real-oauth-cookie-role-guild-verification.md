# BUG 2025-12-17 — real-oauth-cookie-role-guild-verification

Host: slimy-nuc2
Repo: /opt/slimy/slimy-monorepo
Timestamp: Wed Dec 17 05:17:16 PM UTC 2025

## Goal
- Real Discord OAuth login + cookie-based verification (no cookie value logged).

## Commands + Outputs (No Secrets)

### Env Presence (No Values)

```bash
test -f .env.local && echo ".env.local present" || echo ".env.local missing"; for k in SLIMYAI_BOT_TOKEN DISCORD_BOT_TOKEN; do if grep -q "^${k}=" .env.local 2>/dev/null; then echo "${k}: present"; else echo "${k}: MISSING"; fi; done
```

```
.env.local present
SLIMYAI_BOT_TOKEN: present
DISCORD_BOT_TOKEN: present
```

Exit: 0

### Env Sync + Check

```bash
pnpm env:sync && pnpm env:check
```

```

> slimy-monorepo@ env:sync /opt/slimy/slimy-monorepo
> tsx scripts/env-sync.ts && pnpm env:check

Wrote apps/web/.env.local (6 keys)
Wrote apps/admin-api/.env.local (10 keys)
Wrote apps/admin-ui/.env.local (5 keys)
env:sync complete (no values printed).

> slimy-monorepo@ env:check /opt/slimy/slimy-monorepo
> tsx scripts/env-check.ts

env:check OK (3 required keys present; no values printed).

> slimy-monorepo@ env:check /opt/slimy/slimy-monorepo
> tsx scripts/env-check.ts

env:check OK (3 required keys present; no values printed).
```

Exit: 0

### Smoke Docker

```bash
pnpm smoke:docker
```

```
(output trimmed; showing last 220 of 745 lines)
#73 [web runner  2/10] WORKDIR /app
#73 CACHED

#74 [web runner  5/11] RUN adduser --system --uid 1001 nextjs
#74 CACHED

#75 [web runner  6/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
#75 CACHED

#76 [web runner  7/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone/apps/web ./apps/web/
#76 DONE 1.3s

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 ...

#77 [web runner  8/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone/node_modules ./node_modules
#77 DONE 6.8s

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 ...

#78 [web runner  9/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
#78 ...

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 60.29 
#66 60.29 Route (pages)                             Size     First Load JS
#66 60.29 ┌ ○ /                                     4.49 kB         116 kB
#66 60.29 ├   /_app                                 0 B            86.2 kB
#66 60.29 ├ ○ /404                                  181 B          86.4 kB
#66 60.29 ├ ○ /admin-api-usage                      874 B           112 kB
#66 60.29 ├ ƒ /api/admin-api/[...path]              0 B            86.2 kB
#66 60.29 ├ ƒ /api/admin-api/diag                   0 B            86.2 kB
#66 60.29 ├ ƒ /api/admin-api/health                 0 B            86.2 kB
#66 60.29 ├ ƒ /api/diagnostics                      0 B            86.2 kB
#66 60.29 ├ ○ /auth-me                              1.1 kB          112 kB
#66 60.29 ├ ○ /chat                                 2.5 kB          114 kB
#66 60.29 ├ ○ /club                                 1.58 kB         113 kB
#66 60.29 ├ ƒ /dashboard                            1.65 kB         113 kB
#66 60.29 ├ ○ /email-login                          557 B           112 kB
#66 60.29 ├ ○ /guilds                               1.89 kB         113 kB
#66 60.29 ├ ○ /guilds/[guildId]                     5.88 kB         117 kB
#66 60.29 ├ ○ /guilds/[guildId]/channels            1.71 kB         113 kB
#66 60.29 ├ ○ /guilds/[guildId]/corrections         1.74 kB         113 kB
#66 60.29 ├ ○ /guilds/[guildId]/personality         888 B           112 kB
#66 60.29 ├ ○ /guilds/[guildId]/rescan              1.23 kB         112 kB
#66 60.29 ├ ○ /guilds/[guildId]/settings            1.26 kB         112 kB
#66 60.29 ├ ○ /guilds/[guildId]/usage               67.5 kB         179 kB
#66 60.29 ├ ○ /login                                489 B          86.7 kB
#66 60.29 ├ ○ /snail                                1 kB            112 kB
#66 60.29 ├ ○ /snail/[guildId]                      4.25 kB         115 kB
#66 60.29 └ ○ /status                               1.28 kB         112 kB
#66 60.29 + First Load JS shared by all             89.4 kB
#66 60.29   ├ chunks/framework-8051a8b17472378c.js  45.2 kB
#66 60.29   ├ chunks/main-386d6319e61b79bf.js       36.6 kB
#66 60.29   └ other shared chunks (total)           7.55 kB
#66 60.29 
#66 60.29 ○  (Static)   prerendered as static content
#66 60.29 ƒ  (Dynamic)  server-rendered on demand
#66 60.29 
#66 DONE 60.4s

#78 [web runner  9/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
#78 DONE 0.5s

#79 [web runner 10/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
#79 DONE 0.1s

#80 [web runner 11/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
#80 DONE 0.1s

#81 [web] exporting to image
#81 exporting layers
#81 ...

#82 [admin-ui runner  3/10] RUN addgroup --system --gid 1001 nodejs
#82 CACHED

#73 [admin-ui runner  2/10] WORKDIR /app
#73 CACHED

#83 [admin-ui runner  4/10] RUN adduser --system --uid 1001 nextjs
#83 CACHED

#84 [admin-ui runner  5/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public
#84 CACHED

#85 [admin-ui runner  6/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
#85 DONE 0.3s

#81 [web] exporting to image
#81 ...

#86 [admin-ui runner  7/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
#86 DONE 2.4s

#81 [web] exporting to image
#81 exporting layers 3.7s done
#81 writing image sha256:5599d2466e10169776208434d8d3082197fe14699256d65568d8bb8c6d74cd79 0.0s done
#81 naming to docker.io/library/slimy-monorepo-web
#81 naming to docker.io/library/slimy-monorepo-web 0.0s done
#81 DONE 3.8s

#87 [admin-ui runner  8/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
#87 DONE 0.3s

#88 [admin-ui runner  9/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./.next/static
#88 DONE 0.5s

#89 [admin-ui runner 10/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./public
#89 DONE 0.2s

#90 [admin-ui] exporting to image
#90 exporting layers 0.7s done
#90 writing image sha256:8da80724406d4b323cc125fbaaeccdeafd97b554fda004c670acfa56b0ae8e38 done
#90 naming to docker.io/library/slimy-monorepo-admin-ui 0.0s done
#90 DONE 0.7s
 Network slimy-monorepo_slimy-network  Creating
 Network slimy-monorepo_slimy-network  Created
 Container slimy-monorepo-db-1  Creating
 Container slimy-monorepo-db-1  Created
 Container slimy-monorepo-admin-api-1  Creating
 Container slimy-monorepo-admin-api-1  Created
 Container slimy-monorepo-web-1  Creating
 Container slimy-monorepo-admin-ui-1  Creating
 Container slimy-monorepo-admin-ui-1  Created
 Container slimy-monorepo-web-1  Created
 Container slimy-monorepo-db-1  Starting
 Container slimy-monorepo-db-1  Started
 Container slimy-monorepo-db-1  Waiting
 Container slimy-monorepo-db-1  Healthy
 Container slimy-monorepo-admin-api-1  Starting
 Container slimy-monorepo-admin-api-1  Started
 Container slimy-monorepo-admin-api-1  Waiting
 Container slimy-monorepo-admin-api-1  Waiting
 Container slimy-monorepo-db-1  Waiting
 Container slimy-monorepo-db-1  Healthy
 Container slimy-monorepo-admin-api-1  Healthy
 Container slimy-monorepo-web-1  Starting
 Container slimy-monorepo-admin-api-1  Healthy
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
    "timestamp": "2025-12-17T17:19:39.450Z",
    "version": "1.0.0"
  },
  "ts": "2025-12-17T17:19:39.452Z"
}
--- /api/admin-api/diag ---
{
  "ok": true,
  "upstream": {
    "ok": true,
    "authenticated": false
  },
  "ts": "2025-12-17T17:19:39.465Z"
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

### Docker Compose PS

```bash
docker compose ps
```

```
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED          STATUS                    PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   24 seconds ago   Up 12 seconds (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    23 seconds ago   Up 6 seconds              0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          24 seconds ago   Up 23 seconds (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         23 seconds ago   Up 6 seconds              0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
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
X-Request-ID: 9c64432c-3fa0-4966-93a2-d2fd9c8c3f60
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 83
Date: Wed, 17 Dec 2025 17:19:39 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"status":"ok","uptime":9,"timestamp":"2025-12-17T17:19:39.623Z","version":"1.0.0"}```

Exit: 0

