# BUG 2025-12-17 — admin-ui-missing-next-public-env

Host: slimy-nuc2
Repo: /opt/slimy/slimy-monorepo
Timestamp: Wed Dec 17 06:09:03 PM UTC 2025

## Symptom
- admin-ui sees NEXT_PUBLIC_DISCORD_* as undefined
- admin-api sees DISCORD_* correctly

## Evidence (sanity prints)

### admin-api env sanity (DISCORD_* only)

```bash
docker compose exec -T admin-api node -e "console.log('admin-api', { DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID, DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI })"
```

```
admin-api {
  DISCORD_CLIENT_ID: '1431075878586290377',
  DISCORD_REDIRECT_URI: 'http://localhost:3001/auth/discord/callback'
}
```

Exit: 0

### admin-ui env sanity (NEXT_PUBLIC_DISCORD_*)

```bash
docker compose exec -T admin-ui node -e "console.log('admin-ui', { NEXT_PUBLIC_DISCORD_CLIENT_ID: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID, NEXT_PUBLIC_DISCORD_REDIRECT_URI: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI })"
```

```
admin-ui {
  NEXT_PUBLIC_DISCORD_CLIENT_ID: undefined,
  NEXT_PUBLIC_DISCORD_REDIRECT_URI: undefined
}
```

Exit: 0

### Canonical .env.local contains NEXT_PUBLIC_DISCORD_*

```bash
grep -nE '^(NEXT_PUBLIC_DISCORD_CLIENT_ID|NEXT_PUBLIC_DISCORD_REDIRECT_URI)=' .env.local || true
```

```
22:NEXT_PUBLIC_DISCORD_CLIENT_ID=1431075878586290377
23:NEXT_PUBLIC_DISCORD_REDIRECT_URI=http://localhost:3001/auth/discord/callback
```

Exit: 0

### docker-compose.yml admin-ui service (raw)

```bash
awk 'BEGIN{p=0} /^  admin-ui:/{p=1} p{print} p && /^  [a-zA-Z0-9_-]+:/{ if ($1 != "admin-ui:") { exit } }' docker-compose.yml
```

```
  admin-ui:
    build:
      context: .
      dockerfile: apps/admin-ui/Dockerfile
      args:
        NEXT_PUBLIC_ADMIN_API_BASE: ${ADMIN_UI_API_BASE:-}
        NEXT_PUBLIC_ADMIN_API_PUBLIC_URL: ${NEXT_PUBLIC_ADMIN_API_PUBLIC_URL:-http://localhost:3080}
        ADMIN_API_INTERNAL_URL: "http://admin-api:3080"
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3000
      HOSTNAME: "0.0.0.0"
      NEXT_PUBLIC_ADMIN_API_BASE: ${ADMIN_UI_API_BASE:-}
      NEXT_PUBLIC_ADMIN_API_PUBLIC_URL: ${NEXT_PUBLIC_ADMIN_API_PUBLIC_URL:-http://localhost:3080}
      ADMIN_API_INTERNAL_URL: "http://admin-api:3080"
    depends_on:
      admin-api:
        condition: service_healthy
    networks:
      - slimy-network

  # Discord Bot
  bot:
```

Exit: 0

### docker compose config --no-interpolate (admin-ui snippet)

```bash
docker compose config --no-interpolate | awk 'BEGIN{p=0} /^  admin-ui:/{p=1} p{print} p && /^  [a-zA-Z0-9_-]+:/{ if ($1 != "admin-ui:") { exit } }'
```

```
  admin-ui:
    build:
      args:
        ADMIN_API_INTERNAL_URL: http://admin-api:3080
        NEXT_PUBLIC_ADMIN_API_BASE: ${ADMIN_UI_API_BASE:-}
        NEXT_PUBLIC_ADMIN_API_PUBLIC_URL: ${NEXT_PUBLIC_ADMIN_API_PUBLIC_URL:-http://localhost:3080}
      context: /opt/slimy/slimy-monorepo
      dockerfile: apps/admin-ui/Dockerfile
    depends_on:
      admin-api:
        condition: service_healthy
        required: true
    environment:
      ADMIN_API_INTERNAL_URL: http://admin-api:3080
      HOSTNAME: 0.0.0.0
      NEXT_PUBLIC_ADMIN_API_BASE: ${ADMIN_UI_API_BASE:-}
      NEXT_PUBLIC_ADMIN_API_PUBLIC_URL: ${NEXT_PUBLIC_ADMIN_API_PUBLIC_URL:-http://localhost:3080}
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3000
    networks:
      slimy-network: null
    ports:
      - mode: ingress
        protocol: tcp
        published: "3001"
        target: 3000
    restart: unless-stopped
  bot:
```

Exit: 0

### admin-ui runtime env keys present?

```bash
docker compose exec -T admin-ui node -e "console.log('runtime keys', Object.keys(process.env).filter(k=>k.startsWith('NEXT_PUBLIC_DISCORD')).sort())"
```

```
runtime keys []
```

Exit: 0

### apps/admin-ui/Dockerfile

```bash
sed -n '1,220p' apps/admin-ui/Dockerfile
```

```
FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl

ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

FROM base AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Copy monorepo workspace files
# NOTE: Docker build context must be monorepo root (../..)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin-ui/package.json ./apps/admin-ui/
# Copy other workspace package.json files for dependency resolution (needed for pnpm workspace)
COPY apps/admin-api/package.json ./apps/admin-api/
COPY apps/admin-api/vendor ./apps/admin-api/vendor
COPY apps/web/package.json ./apps/web/
COPY apps/bot/package.json ./apps/bot/

# pnpm v10+ requires explicit build script approval (see pnpm-workspace.yaml)
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
WORKDIR /app

# Enable pnpm in this stage
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY apps/admin-ui ./apps/admin-ui
COPY packages ./packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

ARG NEXT_PUBLIC_ADMIN_API_BASE
ARG NEXT_PUBLIC_ADMIN_API_PUBLIC_URL
ARG ADMIN_API_INTERNAL_URL

ENV NEXT_PUBLIC_ADMIN_API_BASE=$NEXT_PUBLIC_ADMIN_API_BASE
ENV NEXT_PUBLIC_ADMIN_API_PUBLIC_URL=$NEXT_PUBLIC_ADMIN_API_PUBLIC_URL
ENV ADMIN_API_INTERNAL_URL=$ADMIN_API_INTERNAL_URL

# Install dependencies and build the admin-ui app
RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true

# Build the app
RUN pnpm --filter @slimy/admin-ui build

FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built artifacts from apps/admin-ui in the builder stage
# Next.js with monorepo generates nested structure in .next/standalone/apps/admin-ui/
# We need to run the server from that nested location since that's where the symlinks are set up
# Copy public assets (images, etc)
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public
# Copy standalone server output
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
# Copy static assets (css, js chunks) - Critical for styling!
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static

# FIX: Copy to Root .next/static so the server finds them at /app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run server from the nested location where symlinks are correct
CMD ["node", "apps/admin-ui/server.js"]
```

Exit: 0

### Compose admin-ui now wires NEXT_PUBLIC_DISCORD_* (no interpolate)

```bash
docker compose config --no-interpolate | awk 'BEGIN{p=0} /^  admin-ui:/{p=1} p{print} p && /^  [a-zA-Z0-9_-]+:/{ if ($1 != "admin-ui:") { exit } }'
```

```
  admin-ui:
    build:
      args:
        ADMIN_API_INTERNAL_URL: http://admin-api:3080
        NEXT_PUBLIC_ADMIN_API_BASE: ${ADMIN_UI_API_BASE:-}
        NEXT_PUBLIC_ADMIN_API_PUBLIC_URL: ${NEXT_PUBLIC_ADMIN_API_PUBLIC_URL:-http://localhost:3080}
        NEXT_PUBLIC_DISCORD_CLIENT_ID: ${NEXT_PUBLIC_DISCORD_CLIENT_ID:-}
        NEXT_PUBLIC_DISCORD_REDIRECT_URI: ${NEXT_PUBLIC_DISCORD_REDIRECT_URI:-}
      context: /opt/slimy/slimy-monorepo
      dockerfile: apps/admin-ui/Dockerfile
    depends_on:
      admin-api:
        condition: service_healthy
        required: true
    environment:
      ADMIN_API_INTERNAL_URL: http://admin-api:3080
      HOSTNAME: 0.0.0.0
      NEXT_PUBLIC_ADMIN_API_BASE: ${ADMIN_UI_API_BASE:-}
      NEXT_PUBLIC_ADMIN_API_PUBLIC_URL: ${NEXT_PUBLIC_ADMIN_API_PUBLIC_URL:-http://localhost:3080}
      NEXT_PUBLIC_DISCORD_CLIENT_ID: ${NEXT_PUBLIC_DISCORD_CLIENT_ID:-}
      NEXT_PUBLIC_DISCORD_REDIRECT_URI: ${NEXT_PUBLIC_DISCORD_REDIRECT_URI:-}
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3000
    networks:
      slimy-network: null
    ports:
      - mode: ingress
        protocol: tcp
        published: "3001"
        target: 3000
    restart: unless-stopped
  bot:
```

Exit: 0

### Rebuild admin-ui

```bash
docker compose up -d --build admin-ui
```

```
#0 building with "default" instance using docker driver

#1 [admin-api internal] load build definition from Dockerfile
#1 transferring dockerfile: 3.35kB done
#1 DONE 0.0s

#2 [admin-api internal] load metadata for docker.io/library/node:20-alpine
#2 DONE 0.4s

#3 [admin-api internal] load .dockerignore
#3 transferring context: 2.44kB done
#3 DONE 0.0s

#4 [admin-api base 1/3] FROM docker.io/library/node:20-alpine@sha256:643e7036aa985317ebfee460005e322aa550c6b6883000d01daefb58689a58e2
#4 DONE 0.0s

#5 [admin-api internal] load build context
#5 transferring context: 643.86kB 0.1s done
#5 DONE 0.1s

#6 [admin-api deps 4/7] COPY packages/ ./packages/
#6 CACHED

#7 [admin-api runner 10/14] COPY --from=builder /app/apps/admin-api/node_modules/.prisma ./apps/admin-api/node_modules/.prisma
#7 CACHED

#8 [admin-api runner  5/14] COPY --from=deps /app/package.json ./
#8 CACHED

#9 [admin-api runner 13/14] COPY apps/admin-api/server.js ./apps/admin-api/server.js
#9 CACHED

#10 [admin-api base 2/3] RUN npm install -g pnpm@latest
#10 CACHED

#11 [admin-api runner  6/14] COPY --from=deps /app/node_modules ./node_modules
#11 CACHED

#12 [admin-api runner  7/14] COPY --from=deps /app/packages ./packages
#12 CACHED

#13 [admin-api base 3/3] WORKDIR /app
#13 CACHED

#14 [admin-api runner 11/14] COPY apps/admin-api/ ./apps/admin-api/
#14 CACHED

#15 [admin-api builder 1/2] COPY apps/admin-api/prisma/ ./apps/admin-api/prisma/
#15 CACHED

#16 [admin-api deps 6/7] COPY apps/admin-api/vendor/ ./apps/admin-api/vendor/
#16 CACHED

#17 [admin-api runner  9/14] COPY --from=deps /app/apps/admin-api/vendor ./apps/admin-api/vendor
#17 CACHED

#18 [admin-api runner  4/14] COPY --from=deps /app/pnpm-workspace.yaml ./
#18 CACHED

#19 [admin-api deps 5/7] COPY apps/admin-api/package.json ./apps/admin-api/
#19 CACHED

#20 [admin-api deps 3/7] COPY package.json ./
#20 CACHED

#21 [admin-api deps 2/7] COPY pnpm-lock.yaml ./
#21 CACHED

#22 [admin-api builder 2/2] RUN cd apps/admin-api && pnpm prisma:generate
#22 CACHED

#23 [admin-api runner 12/14] COPY apps/admin-api/src ./apps/admin-api/src
#23 CACHED

#24 [admin-api deps 7/7] RUN pnpm install --frozen-lockfile --filter @slimy/admin-api...
#24 CACHED

#25 [admin-api runner  8/14] COPY --from=deps /app/apps/admin-api/node_modules ./apps/admin-api/node_modules
#25 CACHED

#26 [admin-api deps 1/7] COPY pnpm-workspace.yaml ./
#26 CACHED

#27 [admin-api runner 14/14] WORKDIR /app/apps/admin-api
#27 CACHED

#28 [admin-api] exporting to image
#28 exporting layers done
#28 writing image sha256:9d36c31a7296c16030d94a82319b5062f432f9aa790ef383a484a9f156bdf72d done
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
#33 transferring context: 55.25MB 0.8s done
#33 DONE 0.8s

#34 [admin-ui base 2/3] RUN apt-get update -y && apt-get install -y openssl
#34 CACHED

#35 [admin-ui deps 4/9] COPY apps/admin-ui/package.json ./apps/admin-ui/
#35 CACHED

#36 [admin-ui deps 2/9] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#36 CACHED

#37 [admin-ui deps 3/9] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#37 CACHED

#38 [admin-ui deps 9/9] RUN pnpm install --frozen-lockfile --prod=false
#38 CACHED

#39 [admin-ui deps 1/9] WORKDIR /app
#39 CACHED

#40 [admin-ui deps 8/9] COPY apps/bot/package.json ./apps/bot/
#40 CACHED

#41 [admin-ui base 3/3] RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
#41 CACHED

#42 [admin-ui deps 6/9] COPY apps/admin-api/vendor ./apps/admin-api/vendor
#42 CACHED

#43 [admin-ui deps 5/9] COPY apps/admin-api/package.json ./apps/admin-api/
#43 CACHED

#44 [admin-ui deps 7/9] COPY apps/web/package.json ./apps/web/
#44 CACHED

#45 [admin-ui builder 3/8] COPY --from=deps /app/node_modules ./node_modules
#45 CACHED

#46 [admin-ui builder 4/8] COPY apps/admin-ui ./apps/admin-ui
#46 DONE 0.6s

#47 [admin-ui builder 5/8] COPY packages ./packages
#47 DONE 0.1s

#48 [admin-ui builder 6/8] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#48 DONE 0.1s

#49 [admin-ui builder 7/8] RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
#49 3.431 Scope: all 7 workspace projects
#49 3.431 Lockfile is up to date, resolution step is skipped
#49 3.431 Already up to date
#49 3.431 
#49 3.431 ╭ Warning ─────────────────────────────────────────────────────────────────────╮
#49 3.431 │                                                                              │
#49 3.431 │   Ignored build scripts: msgpackr-extract.                                   │
#49 3.431 │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
#49 3.431 │   to run scripts.                                                            │
#49 3.431 │                                                                              │
#49 3.431 ╰──────────────────────────────────────────────────────────────────────────────╯
#49 3.431 
#49 3.431 . prepare$ husky
#49 3.431 . prepare: .git can't be found
#49 3.431 . prepare: Done
#49 3.431 Done in 3s using pnpm v10.22.0
#49 DONE 3.7s

#50 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#50 0.853 
#50 0.853 > @slimy/admin-ui@ build /app/apps/admin-ui
#50 0.853 > next build
#50 0.853 
#50 1.717 Attention: Next.js now collects completely anonymous telemetry regarding usage.
#50 1.717 This information is used to shape Next.js' roadmap and prioritize features.
#50 1.717 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
#50 1.717 https://nextjs.org/telemetry
#50 1.718 
#50 1.808   ▲ Next.js 14.2.5
#50 1.808   - Environments: .env.local
#50 1.808 
#50 1.809    Linting and checking validity of types ...
#50 5.500    Creating an optimized production build ...
#50 27.52  ✓ Compiled successfully
#50 27.53    Collecting page data ...
#50 30.21    Generating static pages (0/20) ...
#50 30.97    Generating static pages (5/20) 
#50 31.36    Generating static pages (10/20) 
#50 31.42    Generating static pages (15/20) 
#50 31.48  ✓ Generating static pages (20/20)
#50 33.57    Finalizing page optimization ...
#50 33.57    Collecting build traces ...
#50 60.08 
#50 60.12 Route (pages)                             Size     First Load JS
#50 60.12 ┌ ○ /                                     4.49 kB         116 kB
#50 60.12 ├   /_app                                 0 B            86.2 kB
#50 60.12 ├ ○ /404                                  181 B          86.4 kB
#50 60.12 ├ ○ /admin-api-usage                      874 B           112 kB
#50 60.12 ├ ƒ /api/admin-api/[...path]              0 B            86.2 kB
#50 60.12 ├ ƒ /api/admin-api/diag                   0 B            86.2 kB
#50 60.12 ├ ƒ /api/admin-api/health                 0 B            86.2 kB
#50 60.12 ├ ƒ /api/diagnostics                      0 B            86.2 kB
#50 60.12 ├ ○ /auth-me (302 ms)                     1.1 kB          112 kB
#50 60.12 ├ ○ /chat                                 2.5 kB          114 kB
#50 60.12 ├ ○ /club                                 1.58 kB         113 kB
#50 60.12 ├ ƒ /dashboard                            1.65 kB         113 kB
#50 60.12 ├ ○ /email-login                          557 B           112 kB
#50 60.12 ├ ○ /guilds                               1.89 kB         113 kB
#50 60.12 ├ ○ /guilds/[guildId]                     5.88 kB         117 kB
#50 60.12 ├ ○ /guilds/[guildId]/channels            1.71 kB         113 kB
#50 60.12 ├ ○ /guilds/[guildId]/corrections         1.74 kB         113 kB
#50 60.12 ├ ○ /guilds/[guildId]/personality         888 B           112 kB
#50 60.12 ├ ○ /guilds/[guildId]/rescan              1.23 kB         112 kB
#50 60.12 ├ ○ /guilds/[guildId]/settings            1.26 kB         112 kB
#50 60.12 ├ ○ /guilds/[guildId]/usage               67.5 kB         179 kB
#50 60.12 ├ ○ /login                                489 B          86.7 kB
#50 60.12 ├ ○ /snail                                1 kB            112 kB
#50 60.12 ├ ○ /snail/[guildId]                      4.25 kB         115 kB
#50 60.12 └ ○ /status                               1.28 kB         112 kB
#50 60.12 + First Load JS shared by all             89.4 kB
#50 60.12   ├ chunks/framework-8051a8b17472378c.js  45.2 kB
#50 60.12   ├ chunks/main-386d6319e61b79bf.js       36.6 kB
#50 60.12   └ other shared chunks (total)           7.55 kB
#50 60.12 
#50 60.12 ○  (Static)   prerendered as static content
#50 60.12 ƒ  (Dynamic)  server-rendered on demand
#50 60.12 
#50 DONE 60.6s

#51 [admin-ui runner  2/10] WORKDIR /app
#51 CACHED

#52 [admin-ui runner  4/10] RUN adduser --system --uid 1001 nextjs
#52 CACHED

#53 [admin-ui runner  3/10] RUN addgroup --system --gid 1001 nodejs
#53 CACHED

#54 [admin-ui runner  5/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public
#54 CACHED

#55 [admin-ui runner  6/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
#55 DONE 0.9s

#56 [admin-ui runner  7/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
#56 DONE 3.5s

#57 [admin-ui runner  8/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
#57 DONE 0.3s

#58 [admin-ui runner  9/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./.next/static
#58 DONE 0.3s

#59 [admin-ui runner 10/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./public
#59 DONE 0.2s

#60 [admin-ui] exporting to image
#60 exporting layers
#60 exporting layers 0.7s done
#60 writing image sha256:29b009341ac54a94d6f1ab82b70ec82d6ab3a5eb73ac1af67cd9c06affc6f230 done
#60 naming to docker.io/library/slimy-monorepo-admin-ui done
#60 DONE 0.8s
 Container slimy-monorepo-db-1  Running
 Container slimy-monorepo-admin-api-1  Running
 Container slimy-monorepo-admin-ui-1  Recreate
 Container slimy-monorepo-admin-ui-1  Recreated
 Container slimy-monorepo-db-1  Waiting
 Container slimy-monorepo-db-1  Healthy
 Container slimy-monorepo-admin-api-1  Waiting
 Container slimy-monorepo-admin-api-1  Healthy
 Container slimy-monorepo-admin-ui-1  Starting
 Container slimy-monorepo-admin-ui-1  Started
```

Exit: 0

### Verify runtime env inside admin-ui

```bash
docker compose exec -T admin-ui node -e "console.log('admin-ui', { NEXT_PUBLIC_DISCORD_CLIENT_ID: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID, NEXT_PUBLIC_DISCORD_REDIRECT_URI: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI })"
```

```
admin-ui {
  NEXT_PUBLIC_DISCORD_CLIENT_ID: '1431075878586290377',
  NEXT_PUBLIC_DISCORD_REDIRECT_URI: 'http://localhost:3001/auth/discord/callback'
}
```

Exit: 0

### Verify runtime env keys

```bash
docker compose exec -T admin-ui node -e "console.log('runtime keys', Object.keys(process.env).filter(k=>k.startsWith('NEXT_PUBLIC_DISCORD')).sort())"
```

```
runtime keys [ 'NEXT_PUBLIC_DISCORD_CLIENT_ID', 'NEXT_PUBLIC_DISCORD_REDIRECT_URI' ]
```

Exit: 0

### Smoke docker after admin-ui env fix

```bash
pnpm smoke:docker
```

```
(output trimmed; showing last 220 of 734 lines)
#71 [web runner  4/11] RUN addgroup --system --gid 1001 nodejs
#71 CACHED

#72 [web runner  5/11] RUN adduser --system --uid 1001 nextjs
#72 CACHED

#73 [web runner  2/10] WORKDIR /app
#73 CACHED

#74 [web runner  3/11] RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
#74 CACHED

#75 [web runner  6/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
#75 CACHED

#76 [web runner  7/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone/apps/web ./apps/web/
#76 DONE 0.3s

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 ...

#77 [web runner  8/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone/node_modules ./node_modules
#77 DONE 1.1s

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 ...

#78 [web runner  9/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
#78 DONE 0.1s

#79 [web runner 10/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
#79 DONE 0.1s

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 ...

#80 [web runner 11/11] COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
#80 DONE 0.1s

#81 [web] exporting to image
#81 exporting layers
#81 exporting layers 1.6s done
#81 writing image sha256:ebb92d75e2431ca6d9b9487122f198410659ac42190c89fc7b973c7fcb7f2c87 done
#81 naming to docker.io/library/slimy-monorepo-web done
#81 DONE 1.6s

#66 [admin-ui builder 8/8] RUN pnpm --filter @slimy/admin-ui build
#66 56.71 
#66 56.72 Route (pages)                             Size     First Load JS
#66 56.72 ┌ ○ /                                     4.49 kB         116 kB
#66 56.72 ├   /_app                                 0 B            86.2 kB
#66 56.72 ├ ○ /404                                  181 B          86.4 kB
#66 56.72 ├ ○ /admin-api-usage                      874 B           112 kB
#66 56.72 ├ ƒ /api/admin-api/[...path]              0 B            86.2 kB
#66 56.72 ├ ƒ /api/admin-api/diag                   0 B            86.2 kB
#66 56.72 ├ ƒ /api/admin-api/health                 0 B            86.2 kB
#66 56.72 ├ ƒ /api/diagnostics                      0 B            86.2 kB
#66 56.72 ├ ○ /auth-me                              1.1 kB          112 kB
#66 56.72 ├ ○ /chat                                 2.5 kB          114 kB
#66 56.72 ├ ○ /club                                 1.58 kB         113 kB
#66 56.72 ├ ƒ /dashboard                            1.65 kB         113 kB
#66 56.72 ├ ○ /email-login                          557 B           112 kB
#66 56.72 ├ ○ /guilds                               1.89 kB         113 kB
#66 56.72 ├ ○ /guilds/[guildId]                     5.88 kB         117 kB
#66 56.72 ├ ○ /guilds/[guildId]/channels            1.71 kB         113 kB
#66 56.72 ├ ○ /guilds/[guildId]/corrections         1.74 kB         113 kB
#66 56.72 ├ ○ /guilds/[guildId]/personality         888 B           112 kB
#66 56.72 ├ ○ /guilds/[guildId]/rescan              1.23 kB         112 kB
#66 56.72 ├ ○ /guilds/[guildId]/settings            1.26 kB         112 kB
#66 56.72 ├ ○ /guilds/[guildId]/usage               67.5 kB         179 kB
#66 56.72 ├ ○ /login                                489 B          86.7 kB
#66 56.72 ├ ○ /snail                                1 kB            112 kB
#66 56.72 ├ ○ /snail/[guildId]                      4.25 kB         115 kB
#66 56.72 └ ○ /status                               1.28 kB         112 kB
#66 56.72 + First Load JS shared by all             89.4 kB
#66 56.72   ├ chunks/framework-8051a8b17472378c.js  45.2 kB
#66 56.72   ├ chunks/main-386d6319e61b79bf.js       36.6 kB
#66 56.72   └ other shared chunks (total)           7.55 kB
#66 56.72 
#66 56.72 ○  (Static)   prerendered as static content
#66 56.72 ƒ  (Dynamic)  server-rendered on demand
#66 56.72 
#66 DONE 56.8s

#73 [admin-ui runner  2/10] WORKDIR /app
#73 CACHED

#82 [admin-ui runner  4/10] RUN adduser --system --uid 1001 nextjs
#82 CACHED

#83 [admin-ui runner  3/10] RUN addgroup --system --gid 1001 nodejs
#83 CACHED

#84 [admin-ui runner  5/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public
#84 CACHED

#85 [admin-ui runner  6/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
#85 DONE 0.1s

#86 [admin-ui runner  7/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
#86 DONE 0.6s

#87 [admin-ui runner  8/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
#87 DONE 0.1s

#88 [admin-ui runner  9/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./.next/static
#88 DONE 0.1s

#89 [admin-ui runner 10/10] COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./public
#89 DONE 0.1s

#90 [admin-ui] exporting to image
#90 exporting layers
#90 exporting layers 0.6s done
#90 writing image sha256:d243b792de6f0bde00446d616df0c772db62f74e08f02971d28f1161bbcdffdd done
#90 naming to docker.io/library/slimy-monorepo-admin-ui done
#90 DONE 0.6s
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
 Container slimy-monorepo-db-1  Waiting
 Container slimy-monorepo-admin-api-1  Waiting
 Container slimy-monorepo-admin-api-1  Waiting
 Container slimy-monorepo-db-1  Healthy
 Container slimy-monorepo-admin-api-1  Healthy
 Container slimy-monorepo-admin-ui-1  Starting
 Container slimy-monorepo-admin-api-1  Healthy
 Container slimy-monorepo-web-1  Starting
 Container slimy-monorepo-admin-ui-1  Started
 Container slimy-monorepo-web-1  Started
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
    "timestamp": "2025-12-17T18:14:21.878Z",
    "version": "1.0.0"
  },
  "ts": "2025-12-17T18:14:21.880Z"
}
--- /api/admin-api/diag ---
{
  "ok": true,
  "upstream": {
    "ok": true,
    "authenticated": false
  },
  "ts": "2025-12-17T18:14:21.894Z"
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

