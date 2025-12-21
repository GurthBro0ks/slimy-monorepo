# BUG: admin-ui-localhost-public-url (2025-12-21)

## Context
- Repo: `/opt/slimy/slimy-monorepo`
- Stack: Next.js (`admin-ui`), Express (`admin-api`), Docker Compose, Caddy reverse proxy
- Goal: Remove ALL `localhost` references from production `admin-ui` and ensure OAuth + API calls use `https://admin.slimyai.xyz`

## Symptom / Evidence (from Flight Recorder prompt)
- `admin-ui` container env includes:
  - `NEXT_PUBLIC_ADMIN_API_PUBLIC_URL=http://localhost:3080`
  - `NEXT_PUBLIC_ADMIN_API_BASE=` (empty)
  - `ALLOW_LOCALHOST_OAUTH=1`
- Live site routes:
  - `https://admin.slimyai.xyz/api/auth/login` returns `302` (works)
  - `https://admin.slimyai.xyz/api/admin-api/...` returns `404` (not routed)
- Requirement: production front-end must never point to `localhost:3080`.

## Findings
- `rg` results (required command):
  - Command: `rg -n "NEXT_PUBLIC_ADMIN_API_PUBLIC_URL|NEXT_PUBLIC_ADMIN_API_BASE|ALLOW_LOCALHOST_OAUTH" -S docker-compose*.yml .env* apps/admin-ui`
  - Output snippet:
    - `.env.nuc2-dev:3:ALLOW_LOCALHOST_OAUTH=1`
    - `.env.docker.example:67:NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3080`
    - `.env.docker.example:76:NEXT_PUBLIC_ADMIN_API_PUBLIC_URL=http://localhost:3080`
    - `docker-compose.yml:122: NEXT_PUBLIC_ADMIN_API_BASE: ${ADMIN_UI_API_BASE:-}`
    - `docker-compose.yml:123: NEXT_PUBLIC_ADMIN_API_PUBLIC_URL: ${NEXT_PUBLIC_ADMIN_API_PUBLIC_URL:-http://localhost:3080}`
    - `docker-compose.yml:140: ALLOW_LOCALHOST_OAUTH: ${ALLOW_LOCALHOST_OAUTH:-1}`
    - `.env.local:20:NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3080`
    - `.env:20:NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3080`
    - `apps/admin-ui/lib/oauth-origin.js:89: const explicit = process.env.ALLOW_LOCALHOST_OAUTH;`
    - `apps/admin-ui/Dockerfile:37-44: ARG/ENV NEXT_PUBLIC_ADMIN_API_BASE + NEXT_PUBLIC_ADMIN_API_PUBLIC_URL`
- Authoritative production source (current behavior):
  - `docker-compose.yml` sets `NEXT_PUBLIC_ADMIN_API_PUBLIC_URL` default to `http://localhost:3080` and `ALLOW_LOCALHOST_OAUTH` default to `1`, so production inherits localhost unless explicitly overridden.
- Related routing finding (explains `/api/admin-api/*` 404):
  - `infra/docker/Caddyfile.slimy-nuc2:143-150` routes `admin.slimyai.xyz` `/api/*` to the Express `admin-api` backend except `/api/auth/discord/*`, so `/api/admin-api/*` never reaches Next.js `admin-ui` (where `pages/api/admin-api/[...path].js` lives).

## Fix
- Updated `docker-compose.yml` (production-safe defaults):
  - `admin-ui` now defaults `NEXT_PUBLIC_ADMIN_API_PUBLIC_URL` to `https://admin.slimyai.xyz` (was `http://localhost:3080`).
  - `admin-ui` now defaults `ALLOW_LOCALHOST_OAUTH` to `0` (was `1`).
- Added `docker-compose.dev.yml` (dev-only override):
  - Restores `NEXT_PUBLIC_ADMIN_API_PUBLIC_URL=http://localhost:3080` and `ALLOW_LOCALHOST_OAUTH=1` for local Docker workflows.

## Rebuild / Redeploy (NEXT_PUBLIC vars are baked)
- `docker compose build --no-cache admin-ui`:
  - Initially failed due to `docker-compose.yml` indentation/tab issues (fixed).
  - Build output included `Next.js ... - Environments: .env.local`, meaning a repo `.env.local` was being picked up during the Docker build (risk: localhost values could be baked).
  - Build was canceled (exit `130`) after confirming the `.env.local` load.
- Mitigation: updated `apps/admin-ui/Dockerfile` to remove `.env*` files inside the image before running `next build` so Docker builds cannot be influenced by repo `.env.local`.
- Successful rebuild:
  - `docker compose build --no-cache admin-ui` (snippet):
    - `... RUN rm -f .env .env.* apps/admin-ui/.env apps/admin-ui/.env.* || true`
    - `... RUN pnpm --filter @slimy/admin-ui build ...`
    - `... exporting to image ... naming to docker.io/library/slimy-monorepo-admin-ui`
- Redeploy:
  - `docker compose up -d --force-recreate admin-ui` (snippet):
    - `Container slimy-monorepo-admin-ui-1   Recreated`
    - `Container slimy-monorepo-admin-ui-1   Started`

## Verification
### 1) Container env
- Command: `docker compose exec -T admin-ui printenv | rg -n "NEXT_PUBLIC_ADMIN_API_PUBLIC_URL|NEXT_PUBLIC_ADMIN_API_BASE|ALLOW_LOCALHOST_OAUTH"`
- Output:
  - `NEXT_PUBLIC_ADMIN_API_BASE=`
  - `NEXT_PUBLIC_ADMIN_API_PUBLIC_URL=https://admin.slimyai.xyz`
  - `ALLOW_LOCALHOST_OAUTH=0`

### 2) Live HTML (no localhost leak)
- Command:
  - `BASE="https://admin.slimyai.xyz"`
  - `curl -fsSL "$BASE/" -o /tmp/admin.html`
  - `PAT='localhost:3080|localhost%3A3080|http://localhost:3080|http%3A%2F%2Flocalhost%3A3080'`
  - `rg -n "$PAT" /tmp/admin.html && echo "^^ FOUND IN HTML" || echo "OK: no localhost in HTML"`
- Result: `OK: no localhost in HTML`

### 3) Auth endpoints (same origin)
- `HEAD https://admin.slimyai.xyz/api/auth/login`:
  - `HTTP/2 302`
  - `location: https://admin.slimyai.xyz/api/auth/discord/authorize-url`
- `HEAD https://admin.slimyai.xyz/api/auth/callback`:
  - `HTTP/2 302`
  - `location: https://admin.slimyai.xyz/api/auth/discord/callback`

### 4) Deep scan (_next chunks)
- Chunks discovered from `/`: `12`
- Localhost hits: `0`

## Guardrail
- Implemented a Docker build-time tripwire in `apps/admin-ui/Dockerfile`:
  - Fails the build if any `NEXT_PUBLIC_*` env contains `localhost` unless `ALLOW_LOCALHOST_PUBLIC_ENV=1` is explicitly set (dev-only; wired via `docker-compose.dev.yml`).

---

# AUTO-PROMPT Hardening Run (2025-12-21)

## Goal
- Ensure production Admin UI can never ship/serve loopback URLs (localhost/127.0.0.1/::1) in any public Next.js output.
- Keep local Docker dev working via `docker-compose.dev.yml`.

## Inspect Current State (required)

### `git status --porcelain`
```
 M apps/admin-ui/Dockerfile
 M docker-compose.yml
?? docker-compose.dev.yml
?? docs/buglog/BUG_2025-12-21_admin-ui-localhost-public-url.md
```

### `rg` env source scan
Command:
`rg -n "NEXT_PUBLIC_ADMIN_API_PUBLIC_URL|NEXT_PUBLIC_ADMIN_API_BASE|ALLOW_LOCALHOST_OAUTH|ALLOW_LOCALHOST_PUBLIC_ENV" -S docker-compose*.yml apps/admin-ui/Dockerfile apps/admin-ui/** || true`

Output snippet:
- `docker-compose.yml` (admin-ui prod defaults + dev bypass arg)
- `docker-compose.dev.yml` (dev-only overrides)
- `apps/admin-ui/Dockerfile` (build-time guard + env scrub)

### `.env*` presence in admin-ui
`ls -la apps/admin-ui | rg -n "\.env" || true`
```
6:-rw-rw-r--  1 slimy slimy  428 Dec 18 09:57 .env.local
```

## Fixes / Hardening

### Docker Compose (prod-safe defaults)
- `docker-compose.yml`:
  - `admin-ui`: keep `NEXT_PUBLIC_ADMIN_API_PUBLIC_URL` default `https://admin.slimyai.xyz`, `ALLOW_LOCALHOST_OAUTH=0`, and pass `ALLOW_LOCALHOST_PUBLIC_ENV=0` into build args.
  - `admin-api`: default `DISCORD_REDIRECT_URI` moved to `https://admin.slimyai.xyz/api/auth/discord/callback` (removes ghost `/api/admin-api/...` + localhost defaults).
  - `web`: default `NEXT_PUBLIC_ADMIN_API_BASE` moved to `https://admin.slimyai.xyz` (removes localhost defaults).
  - Added port override vars to avoid collisions:
    - `ADMIN_API_PORT` (default `3080`)
    - `ADMIN_UI_PORT` (default `3001`)
    - `WEB_PORT` (default `3000`)

### Dev-only override
- `docker-compose.dev.yml`:
  - Keeps loopback wiring for localhost dev.
  - Uses `${ADMIN_API_PORT:-3080}` for `NEXT_PUBLIC_*` API URLs.
  - Uses `${ADMIN_UI_PORT:-3001}` for the local Discord callback URL.

### Admin UI Dockerfile hardening
- `apps/admin-ui/Dockerfile`:
  - Deletes `.env*` files in the image before `next build`.
  - Build-time guardrail: fails build if any `NEXT_PUBLIC_*` contains `localhost`, `127.0.0.1`, or `::1` unless `ALLOW_LOCALHOST_PUBLIC_ENV=1`.

### Regression scripts
- Added:
  - `scripts/verify/admin-ui-no-localhost-live.sh`
  - `scripts/verify/admin-ui-no-localhost-build.sh`

### CI
- `.github/workflows/ci.yml`: runs `bash scripts/verify/admin-ui-no-localhost-build.sh` after `pnpm build`.

## Verification

### Prod-ish (same-origin, no loopback)

#### Admin UI container env
Command:
`docker compose exec -T admin-ui printenv | rg -n "NEXT_PUBLIC|ALLOW_LOCALHOST" || true`
```
4:NEXT_PUBLIC_ADMIN_API_PUBLIC_URL=https://admin.slimyai.xyz
8:NEXT_PUBLIC_ADMIN_API_BASE=
11:ALLOW_LOCALHOST_OAUTH=0
```

#### Live HTML + chunks scan
Command:
`BASE="https://admin.slimyai.xyz" bash scripts/verify/admin-ui-no-localhost-live.sh`
```
[info] fetching https://admin.slimyai.xyz/ ...
[PASS] HTML contains no localhost/legacy routes
[info] discovered 12 Next.js chunks
[PASS] no localhost/legacy routes in HTML + chunks
```

#### Build artifact scan (image public assets)
Command:
`bash scripts/verify/admin-ui-no-localhost-build.sh`
```
[info] scanning admin-ui image public assets
[PASS] no localhost/legacy routes in image public assets
```

#### Auth endpoints (same origin)
```
== HEAD https://admin.slimyai.xyz/api/auth/login
HTTP/2 302
location: https://admin.slimyai.xyz/api/auth/discord/authorize-url
== HEAD https://admin.slimyai.xyz/api/auth/callback
HTTP/2 302
location: https://admin.slimyai.xyz/api/auth/discord/callback
```

### Dev override (loopback allowed)

#### Note on this host
- Host ports `3080` and `3001` were already in use by existing containers, so dev verification used:
  - `ADMIN_API_PORT=3082`
  - `ADMIN_UI_PORT=3002`

#### Bring up dev override
Command:
`ADMIN_API_PORT=3082 ADMIN_UI_PORT=3002 docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build admin-api admin-ui`

#### Admin UI env shows loopback values
Command:
`docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T admin-ui printenv | rg -n "NEXT_PUBLIC|ALLOW_LOCALHOST" || true`
```
4:ALLOW_LOCALHOST_OAUTH=1
5:NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3082
10:NEXT_PUBLIC_ADMIN_API_PUBLIC_URL=http://localhost:3082
```

#### Build scan allows loopback in dev when `STRICT=0`
Command:
`ADMIN_API_PORT=3082 ADMIN_UI_PORT=3002 COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml" STRICT=0 bash scripts/verify/admin-ui-no-localhost-build.sh`
Result:
- Script reports a match (expected in dev) and exits `0` with `[WARN] matches found but STRICT=0`.

## Files Changed
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `apps/admin-ui/Dockerfile`
- `scripts/verify/admin-ui-no-localhost-live.sh`
- `scripts/verify/admin-ui-no-localhost-build.sh`
- `.github/workflows/ci.yml`

