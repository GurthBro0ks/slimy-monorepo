# BUG 2025-12-17 — port-3080-collision-and-slimyai-bot-token

## Context
- Host: NUC2
- Repo: `/opt/slimy/slimy-monorepo`
- Stack: Docker Compose (db, admin-api, web, admin-ui)
- Current state: `pnpm env:sync` + `pnpm env:check` pass; `pnpm smoke:docker` fails to start stack.

## Symptom
- `pnpm smoke:docker` fails because host port `3080` is already allocated.
- Docker Compose emits a warning that `SLIMYAI_BOT_TOKEN` is unset.

## Exact Error Lines (from failing run)
```text
time="2025-12-17T14:30:03Z" level=warning msg="The \"SLIMYAI_BOT_TOKEN\" variable is not set. Defaulting to a blank string."
Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint slimy-monorepo-admin-api-1 (f001e447875dda8a906c61615f6a2129aadd76f5c0a36ea474471af57c585f7e): Bind for 0.0.0.0:3080 failed: port is already allocated
```

## Timeline / Commands

### Port owner detection
- Command: `sudo ss -ltnp | grep ':3080' || true`
- Output:
```text
NOTE: Not run (would prompt for interactive sudo password). Used non-sudo `ss` + Docker checks instead.
```

- Command: `ss -ltn | grep ':3080' || true`
- Output:
```text
LISTEN 0      4096         0.0.0.0:3080       0.0.0.0:*
LISTEN 0      4096            [::]:3080          [::]:*
```

- Command: `docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep '3080' || true`
- Output:
```text
b13ee04c20d2_slimy-admin-api   0.0.0.0:3080->3080/tcp, [::]:3080->3080/tcp
```

- Command: `docker ps --filter "publish=3080" --format 'table {{.Names}}\t{{.Ports}}' || true`
- Output:
```text
NAMES                          PORTS
b13ee04c20d2_slimy-admin-api   0.0.0.0:3080->3080/tcp, [::]:3080->3080/tcp
```

### Fix applied
- Action: Removed legacy Docker container(s) publishing `3080`:
  - `docker rm -f b13ee04c20d2_slimy-admin-api`
  - Later recurrence: `docker rm -f slimy-admin-api` (image `slimy-nuc2-admin-api`, restart policy `unless-stopped`)

- Action: Ensure Docker smoke uses repo-root `.env.local` for compose substitution to eliminate `SLIMYAI_BOT_TOKEN` unset warnings:
  - Updated `scripts/smoke/docker-smoke.sh` to use `docker compose --env-file .env.local ...` when present.
  - Updated `scripts/dev/migrate-admin-api-db.sh` similarly.
  - Updated `scripts/smoke/docker-smoke.sh` legacy cleanup matcher to also remove compose-prefixed legacy container names like `*_slimy-admin-api`.

- Action: Prevent `.env.local` (local-dev) from overriding internal Docker network routing:
  - Updated `docker-compose.yml` to hardcode internal-only `ADMIN_API_INTERNAL_URL` to `http://admin-api:3080` for `web` and `admin-ui`.

### Bot token warning
- Action: Ensure `SLIMYAI_BOT_TOKEN` is present in repo-root `.env.local` (canonical) without printing values.
- Command: `pnpm env:sync`
- Output:
```text
Wrote apps/web/.env.local (6 keys)
Wrote apps/admin-api/.env.local (10 keys)
Wrote apps/admin-ui/.env.local (5 keys)
env:sync complete (no values printed).
env:check OK (3 required keys present; no values printed).
```

- Command: `grep -q '^SLIMYAI_BOT_TOKEN=' .env.local && echo "SLIMYAI_BOT_TOKEN present" || echo "SLIMYAI_BOT_TOKEN missing"`
- Output:
```text
SLIMYAI_BOT_TOKEN present
```

### Verification
- Command: `pnpm smoke:docker`
- Result:
```text
PASS: Docker baseline smoke test
```

- Command: `docker compose ps`
- Output:
```text
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED              STATUS                        PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   About a minute ago   Up 53 seconds (healthy)       0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    About a minute ago   Up 47 seconds                 0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          About a minute ago   Up About a minute (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         About a minute ago   Up 47 seconds                 0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```

- Command: `curl -sS -i http://localhost:3080/api/health | sed -n '1,20p'`
- Output:
```text
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
X-Request-ID: 058a3f4e-2204-4dd2-8fae-42620d452d79
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 84
```
