# BUGLOG: web-settings-auth-500-v0 (2025-12-27)

## Symptom / Context
- Prod web (`https://slimyai.xyz`) shows authed 500s for:
  - `GET /api/settings/user/:userId`
  - `GET /api/settings/changes-v0?scopeType=user|guild...`
- `GET /api/discord/guilds` is 200 (guild list loads).
- Unauthed curl returning 401 is expected; this is an AUTHED failure.

## Plan
1) Locate admin-api handlers for `/api/settings/user/:userId` + `/api/settings/changes-v0`.
2) Reproduce via curl (authed), tail logs, capture first stack trace per endpoint.
3) Fix root cause server-side (admin-api) without weakening authz.
4) Add regression coverage + run required verify scripts + focused Jest tests.

## Discovery
### Routes / handlers
Command:
- `rg -n "settings-v0|changes-v0|settings-changes-v0" apps/admin-api/src/routes -S`

Output:
- `apps/admin-api/src/routes/index.js` mounts:
  - `./settings-v0` under `/api/settings`
  - `./settings-changes-v0` under `/api/settings`
- `apps/admin-api/src/routes/settings-v0.js` handles:
  - `GET /user/:userId`
  - `PUT /user/:userId`
  - `GET /guild/:guildId`
  - `PUT /guild/:guildId`
- `apps/admin-api/src/routes/settings-changes-v0.js` handles:
  - `GET /changes-v0`

### Web references (for context only)
Command:
- `rg -n "createWebCentralSettingsClient|SettingsActivityWidget|ActiveClubPickerCard" apps/web -S`

Output:
- `apps/web/components/settings/SettingsActivityWidget.tsx` uses central settings client and calls `/api/settings/changes-v0`.

## Repro (AUTHED)
Local compose repro uses a locally-signed JWT (cookie `slimy_admin_token`) to simulate an authed user.
- Discord user id: `427999592986968074`
- Guild id: `1176605506912141444`

### 1) `GET /api/settings/user/:userId` (local compose) — OK
Command:
- `curl -H "Cookie: slimy_admin_token=<REDACTED>" http://localhost:<ADMIN_API_PORT>/api/settings/user/427999592986968074`

Result:
- `200` with `{ ok: true, settings: ... }`

### 2) `GET /api/settings/changes-v0` (local compose) — 500
Command:
- `curl -H "Cookie: slimy_admin_token=<REDACTED>" "http://localhost:<ADMIN_API_PORT>/api/settings/changes-v0?scopeType=user&scopeId=427999592986968074&limit=10"`

Result:
- `500` with `{ ok: false, error: "server_error" }`

### Server logs (first stack trace)
Command:
- `docker compose logs --tail 80 admin-api`

Output (snippet):
```
Invalid `prisma.settingsChangeEvent.findMany()` invocation in
/app/apps/admin-api/src/routes/settings-changes-v0.js:100:53

The table `settings_change_events` does not exist in the current database.
[settings-changes-v0 GET] failed { code: 'P2021' }
```

## Root Cause
- `settings_change_events` table is missing in the running database.
- Prisma throws `P2021` on `settingsChangeEvent.findMany()` which bubbles to a 500.

Evidence:
- `docker compose exec -T db mysql ... "SHOW TABLES LIKE 'settings_change_events';"` returned no rows (table missing).

## Fix (planned / implemented)
- Ensure Prisma migrations are applied on admin-api startup (`prisma migrate deploy`) so `settings_change_events` exists.
- Add a deterministic verify script to ensure admin-api startup runs `prisma migrate deploy` (CI-safe).
- Add/extend Jest coverage for settings endpoints to prevent regressions.

## Files Changed
- `apps/admin-api/Dockerfile` (run `prisma migrate deploy` before start; avoid copying `.env*` into image)
- `apps/admin-api/tests/settings-auth-500-v0.test.js` (Jest regression coverage for settings + changes endpoints + authz)
- `scripts/verify/admin-api-startup-runs-migrations.sh` (deterministic guardrail)
- `docs/buglog/BUG_2025-12-27_web-settings-auth-500-v0.md` (this file)

## Commands Run (high level)
- `rg -n "settings-v0|changes-v0|settings-changes-v0" apps/admin-api/src/routes -S`
- `docker compose ps`
- `docker compose logs ...`
- `docker compose exec -T admin-api printenv JWT_SECRET`
- `docker compose exec -T db mysql ... SHOW TABLES ...`
- `docker compose exec -T admin-api pnpm prisma migrate deploy`
- `bash /tmp/repro_settings_user.curl.sh`
- `bash /tmp/repro_settings_changes_user.curl.sh`
- `bash /tmp/repro_settings_changes_guild.curl.sh`
- `docker compose build admin-api`
- `docker run --rm --entrypoint sh slimy-monorepo-admin-api -lc 'ls -a | grep -E \"^\\.env\" || true'`

## Verification Evidence
### Before fix (local compose)
- `GET /api/settings/changes-v0?...` returned `500` with Prisma error `P2021`:
  - `The table settings_change_events does not exist in the current database.`

### Apply migrations
Command:
- `docker compose exec -T admin-api pnpm prisma migrate deploy`

Output (snippet):
```
Applying migration `20251226124000_add_memory_records`
Applying migration `20251226203000_add_settings_change_events`
All migrations have been successfully applied.
```

### After fix (local compose)
- `bash /tmp/repro_settings_changes_user.curl.sh` → `200` and `{ ok: true, events: [] }`
- `bash /tmp/repro_settings_changes_guild.curl.sh` → `200` and `{ ok: true, events: [] }`
- `docker compose exec -T db mysql ... "SHOW TABLES LIKE 'settings_change_events';"` → table present

### Guardrails + tests
- `bash scripts/verify/agents-md-present.sh` → PASS
- `bash scripts/verify/continuity-ledger-present.sh` → PASS
- `bash scripts/verify/no-localhost-in-client-sources.sh` → PASS
- `bash scripts/verify/settings-sync-events-v02.sh` → PASS
- `pnpm --filter @slimy/admin-api test -- settings-auth-500-v0.test.js` → PASS
- `bash scripts/verify/admin-api-startup-runs-migrations.sh` → PASS

## Commit
- `fix(admin-api): resolve authed 500 on settings + changes`
