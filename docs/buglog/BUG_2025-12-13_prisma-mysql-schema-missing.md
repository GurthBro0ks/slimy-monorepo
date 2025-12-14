# BUG: prisma-mysql-schema-missing (2025-12-13)

## Context
- Detected repo path: `/home/mint/Desktop/slimy-monorepo` (LOCAL)
- `git rev-parse --short HEAD`: `b302887`
- Architecture rules: `docs/AI_RULES.md`

## Symptom
- After OAuth login, `GET http://localhost:3001/api/admin-api/api/auth/me` returns `200` but includes `warnings[]`.
- `admin-api` logs show Prisma errors like “table doesn’t exist” (e.g. `users`, `user_guilds`).

## Repro (clean-ish)
1. Start docker stack: `pnpm smoke:docker` (or `docker compose up -d db admin-api admin-ui`).
2. Login via browser.
3. Load `/dashboard` (triggers `/api/admin-api/api/auth/me`).
4. Observe: response contains `warnings[]`, and `admin-api` logs show missing-table errors.

## Inventory: migrations + scripts
- Migrations exist under `apps/admin-api/prisma/migrations/`:
  - `20241106000000_init`
  - `20251125162943_add_email_to_user`
  - `20251125174900_add_discord_tokens`
- `apps/admin-api/package.json` contains `prisma:generate` but no migrate script.

## Plan
### Diagnosis signal
- If DB schema is missing, Prisma will error with:
  - `The table \`users\` does not exist...`
  - `The table \`user_guilds\` does not exist...`

### Fix strategy (safe + idempotent)
- Use `prisma migrate deploy` (because migrations exist).
- Implement an idempotent helper script for docker:
  - `scripts/dev/migrate-admin-api-db.sh`
  - Runs inside the `admin-api` container against the docker `DATABASE_URL`.
- Wire it into `scripts/smoke/docker-smoke.sh` after DB is healthy so baseline stacks always have schema.
- Update docs (`docs/docker-setup.md` or `docs/DEV_SANITY_CHECK.md`) to add the migration step.

## Expected outcome
- `prisma migrate deploy` reports successful application (or “no pending migrations”).
- After a real OAuth login:
  - `GET http://localhost:3001/api/admin-api/api/auth/me` is `200`
  - `warnings[]` is empty or absent
  - `docker compose logs admin-api` has no “table doesn’t exist” Prisma errors

## Evidence (to be filled)
### 1) `pnpm smoke:docker` output
- PASS (baseline, logged-out), 2025-12-13.

### 2) `docker compose ps`
```
NAME                         IMAGE                      SERVICE     STATUS                    PORTS
slimy-monorepo-db-1          mysql:8.0                  db          Up (healthy)              3306/tcp, 33060/tcp
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   admin-api   Up (healthy)              0.0.0.0:3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    admin-ui    Up                        0.0.0.0:3001->3000/tcp
slimy-monorepo-web-1         slimy-monorepo-web         web         Up                        0.0.0.0:3000->3000/tcp
```

### 3) `/api/auth/me` shows DB hydration warnings when authenticated
(Synthetic JWT cookie used to force the authenticated code path.)
- `GET http://localhost:3001/api/admin-api/api/auth/me` → `200`
- Body includes: `warnings: ["db_user_lookup_failed"]`

### 4) `docker compose logs --tail 200 admin-api` shows missing-table errors
Observed lines (redacted):
- `The table \`users\` does not exist in the current database.`
- `The table \`user_guilds\` does not exist in the current database.`

## Findings
### 1) Migrations were present but incomplete vs current Prisma schema
After applying the existing migrations, Prisma errors changed from missing tables to a schema drift error:
- `The column \`slimyai.users.last_active_guild_id\` does not exist in the current database.`

This indicates the Prisma schema used by `admin-api` expects newer columns than the committed migration set created.

## Code Changes (Minimum)
### 1) Add an idempotent migration runner script for docker
- `scripts/dev/migrate-admin-api-db.sh`
  - Runs `pnpm prisma migrate deploy` inside the `admin-api` container.

### 2) Ensure smoke applies schema after DB is healthy
- `scripts/smoke/docker-smoke.sh`
  - Calls the migration script after endpoint readiness checks.

### 3) Add the missing migration to align DB with current Prisma datamodel
- `apps/admin-api/prisma/migrations/20251213160000_align_admin_api_schema/migration.sql`
  - Adds `users.last_active_guild_id`
  - Adds `guilds.icon` + `guilds.owner_id`
  - Makes legacy `guilds.discord_id` nullable so inserts via current Prisma model succeed

### 4) Docs update
- `docs/docker-setup.md`
  - Documents `bash scripts/dev/migrate-admin-api-db.sh`
  - Notes that `pnpm smoke:docker` runs migrations automatically

## Verification
### 1) Migration script reports success
Example output:
- `4 migrations found ... Applying migration 20251213160000_align_admin_api_schema ... All migrations have been successfully applied.`

### 2) Authenticated `/auth/me` no longer shows warnings (synthetic auth)
- `GET http://localhost:3001/api/admin-api/api/auth/me` with `slimy_admin_token=<synthetic jwt>`:
  - HTTP `200`
  - `warnings: []`

### 3) No Prisma missing-table/column errors after migration
- `docker compose logs --tail 120 admin-api` shows no `The table ... does not exist` / `The column ... does not exist` lines during `/api/auth/me`.

Concrete post-migration signal:
- `SHOW COLUMNS FROM users LIKE "last_active_guild_id"` returns a row
- `SHOW COLUMNS FROM guilds LIKE "owner_id"` and `... LIKE "icon"` return rows

### 4) REAL OAuth session (manual, required for full closure)
1. Clear cookies for `http://localhost:3001`
2. Login via `http://localhost:3001/status`
3. Confirm in DevTools:
   - `GET /api/admin-api/api/auth/me` is HTTP `200`
   - `warnings[]` is empty or absent
4. Confirm in logs:
   - `docker compose logs --tail 200 admin-api` has no Prisma missing-table/column errors
