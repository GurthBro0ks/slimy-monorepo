# BUG: Caddy 502s + admin-api restart loop (Prisma P3009)

## Symptom / context
- Caddy (systemd) serves `slimyai.xyz` + subdomains but intermittently returns `502` with upstream errors (e.g. `dial tcp 127.0.0.1:3000: connect: connection refused`).
- `slimy-nuc2` docker stack shows containers restarting:
  - `slimy-admin-api` restart loop (port `3080` down).
  - `slimy-caddy` (docker) restart loop while systemd Caddy is already running.

## Plan
- Confirm which containers are restarting and why (compose status + logs).
- Fix the `admin-api` restart loop by resolving the failed Prisma migration in `slimyai_prod`.
- Prevent docker Caddy from fighting systemd Caddy by disabling the compose `caddy` service by default.
- Verify:
  - `admin-api` listens on `127.0.0.1:3080` (via host port binding).
  - `web` listens on `127.0.0.1:3000`.
  - systemd Caddy no longer reports upstream dial failures during normal traffic.

## Commands run (key outputs)
- `docker compose -p slimy-nuc2 -f infra/docker/docker-compose.slimy-nuc2.yml ps`
  - `slimy-admin-api` restarting; `slimy-caddy` restarting; `slimy-web`/`slimy-admin-ui` healthy.
- `journalctl -u caddy -n 400 --no-pager | rg -i 'dial tcp 127.0.0.1:3000|tls-alpn'`
  - Observed `dial tcp 127.0.0.1:3000: connect: connection refused` (502s) and `tls-alpn challenge ... no information found`.
- `docker compose -p slimy-nuc2 -f infra/docker/docker-compose.slimy-nuc2.yml logs --tail 120 admin-api`
  - `Error: P3009 ... Duplicate column name 'last_active_guild_id' ... migration 20251213160000_align_admin_api_schema failed`
- `curl http://127.0.0.1:3000/` → `200`
- `curl http://127.0.0.1:3080/api/health` → connection failed (admin-api down)
- Prisma verification (inside `slimy-admin-api` container):
  - `npx prisma migrate status` → `Database schema is up to date!`
  - `npx prisma validate` → schema valid
  - `npx prisma generate` → client generated
  - Drift check (DB vs schema): `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code`
    - Initially returned exit code `2` (non-empty diff) due to missing `@db.VarChar(...)` annotations for short varchar columns.
    - After schema alignment, returned `No difference detected.` and exit code `0`.

## Files changed
- `docs/buglog/BUG_2025-12-28_caddy-502-admin-api-migration-loop.md`
- `infra/docker/docker-compose.slimy-nuc2.yml`
- `apps/admin-api/prisma/schema.prisma`

## Fix applied
- Stopped docker Caddy container (systemd Caddy is canonical on this host):
  - `docker stop slimy-caddy`
- Resolved Prisma migration state and applied missing migrations on `slimyai_prod`:
  - `_prisma_migrations` showed `20251213160000_align_admin_api_schema` failed with `1060 Duplicate column name 'last_active_guild_id'`.
  - `docker compose -p slimy-nuc2 -f infra/docker/docker-compose.slimy-nuc2.yml run --rm --no-deps --entrypoint sh admin-api -lc 'pnpm prisma migrate resolve --applied 20251213160000_align_admin_api_schema'`
  - `docker compose -p slimy-nuc2 -f infra/docker/docker-compose.slimy-nuc2.yml run --rm --no-deps --entrypoint sh admin-api -lc 'pnpm prisma migrate deploy'`
    - Applied: `20251217190000_add_central_settings`, `20251226124000_add_memory_records`, `20251226203000_add_settings_change_events`
- Disabled docker Caddy by default to avoid ACME/storage conflicts:
  - Added `profiles: ["docker-caddy"]` to the `caddy` service in `infra/docker/docker-compose.slimy-nuc2.yml`
- Fixed Prisma schema drift (no DB change):
  - Added `@db.VarChar(16|64|32)` annotations for `MemoryRecord.{scopeType,kind,source}` and `SettingsChangeEvent.{scopeType,kind,source}` to match existing migrations/DB types.

## Verification evidence
- `docker inspect -f 'Health={{.State.Health.Status}} RestartCount={{.RestartCount}}' slimy-admin-api` → `Health=healthy RestartCount=0`
- `curl http://127.0.0.1:3080/api/health` → `200`
- `curl https://slimyai.xyz/api/health` → `200`
- `curl https://admin.slimyai.xyz/api/health` → `200`
- `docker ps | rg slimy-caddy` → no running docker Caddy container
- `journalctl -u caddy --since '15 min ago' | rg -i 'connection refused|tls-alpn'` → no matches
- `pnpm smoke:docker` → `PASS: Docker baseline smoke test`
- `pnpm stability:gate` → success; report: `/tmp/STABILITY_REPORT_2025-12-28_15-36-37_admin-oauth-guildgate.md`
- `cd apps/admin-api && pnpm test` → `19 passed, 12 skipped` (warns about open handles; exit code 0)
