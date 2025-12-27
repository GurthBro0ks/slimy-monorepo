# BUGLOG — web-settings-500-activeclub-guilds-v037 (2025-12-27)

## Symptom / Context
- `/settings`: “Failed to load user settings” + “Active club update failed”; guild identity fetch `GET /api/discord/guilds` returns `500`.
- `/club`: `NO_GUILD_ID_PROVIDED` because active guild cannot be loaded.
- Non-negotiables:
  - No `localhost`/`127.0.0.1`/internal DNS leaks in client-visible output.
  - Do **not** modify `apps/web` `/chat`.
  - Keep debug/status strip on pages we touch.
  - Deterministic verify scripts only; CI-safe.

## Plan
A) Confirm HEAD/branch and locate the web routes/clients involved in `/api/discord/guilds` + settings/active-guild plumbing.
B) Reproduce via deterministic `curl` + container logs; inspect web/admin-api env wiring.
C) Implement minimal server-side fix so `/api/discord/guilds` and user settings return non-500 (401/502 where appropriate).
D) Add CI-safe guardrail verify script for required runtime env/proxy wiring.
E) Run verify scripts + web build; commit.

## Discovery (commands + outputs)

```bash
git rev-parse --short HEAD
git rev-parse --abbrev-ref HEAD
```
Output:
```text
b811e60
nuc2/verify-role-b33e616
```

```bash
rg -n "api/discord/guilds|discord/guilds" apps/web -S
```
Output (snippet):
```text
apps/web/app/api/discord/guilds/route.ts
apps/web/lib/guildIdentity.ts
apps/web/components/debug/DebugDock.tsx
apps/web/components/dashboard/guild-list.tsx
```

```bash
docker compose ps
```
Output (snippet):
```text
slimy-monorepo-admin-api-1   ...   Up ... (healthy)   0.0.0.0:13080->3080/tcp
slimy-monorepo-web-1         ...   Up ...             0.0.0.0:13000->3000/tcp
```

```bash
BASE="http://localhost:13000"
curl -sSik "$BASE/api/health" | rg -n "HTTP/" || true
curl -sSik "$BASE/api/auth/me" | rg -n "HTTP/" || true
curl -sSik "$BASE/api/discord/guilds" | rg -n "HTTP/|content-type:" || true
curl -sSik "$BASE/api/admin-api/health" | rg -n "HTTP/|content-type:" || true
```
Output:
```text
HTTP/1.1 200 OK
HTTP/1.1 401 Unauthorized
HTTP/1.1 401 Unauthorized
content-type: application/json
HTTP/1.1 200 OK
content-type: application/json
```

```bash
docker compose exec -T web printenv | rg -n "ADMIN_API|NEXT_PUBLIC_ADMIN_API_BASE" || true
```
Output (snippet):
```text
ADMIN_API_INTERNAL_URL=http://admin-api:3080
NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3080
```

## Working hypothesis
- `admin-api` `/discord/guilds` can hard-fail with `MISSING_SLIMYAI_BOT_TOKEN` when `SLIMYAI_BOT_TOKEN` is unset, even if `DISCORD_BOT_TOKEN` is present.
  - This would produce a runtime `500` for logged-in users on `GET /api/discord/guilds` (web proxies to admin-api).
  - It also breaks “active club” and any guild-scoped UI relying on shared guilds.

## Implementation notes
- Admin API:
  - `getSlimyBotToken()` now falls back to `DISCORD_BOT_TOKEN` if `SLIMYAI_BOT_TOKEN` is unset.
  - Added regression test covering the fallback behavior.
- Web:
  - `GET /api/discord/guilds` returns stable `401` (no session) and `502` on upstream 5xx, without leaking upstream/internal details.
  - `/club` resolves `guildId` from query → auth `lastActiveGuildId` → central UserSettings `activeGuildId`, with a debug strip + settings fallback.
  - Active Club picker shows a small “guild list unavailable” message when `/api/discord/guilds` fails (401/5xx), while keeping the debug strip.

## Files changed
- `CONTINUITY.md`
- `apps/admin-api/src/services/discord-shared-guilds.js`
- `apps/admin-api/tests/discord-guilds.test.js`
- `apps/web/app/api/discord/guilds/route.ts`
- `apps/web/app/club/page.tsx`
- `apps/web/components/settings/ActiveClubPickerCard.tsx`
- `scripts/verify/web-runtime-env-required-v037.sh`
- `.github/workflows/ci.yml`
- `docs/buglog/BUG_2025-12-27_web-settings-500-activeclub-guilds-v037.md`

## Commands run + outputs (snippets)

```bash
bash scripts/verify/agents-md-present.sh
bash scripts/verify/continuity-ledger-present.sh
bash scripts/verify/no-localhost-in-client-sources.sh
bash scripts/verify/web-guild-identity-v036.sh
bash scripts/verify/web-runtime-env-required-v037.sh
```
Output (tail):
```text
[PASS] no loopback/localhost found in scanned sources
[PASS] web guild identity v0.36 checks passed
[PASS] web runtime env required v0.37 checks passed
```

```bash
pnpm --filter @slimy/admin-api test
```
Output (tail):
```text
Test Suites: 12 skipped, 18 passed, 18 of 30 total
Tests:       12 skipped, 81 passed, 93 total
```

```bash
# NOTE: default ADMIN_API_PORT=3080 conflicted locally; run with explicit, deterministic ports.
ADMIN_API_PORT=13080 WEB_PORT=13000 docker compose up -d --build admin-api web
BASE="http://localhost:13000"
curl -sSik "$BASE/api/admin-api/health" | head
curl -sSik "$BASE/api/discord/guilds" | head
```
Output (snippet):
```text
HTTP/1.1 200 OK
{"status":"ok", ... }
HTTP/1.1 401 Unauthorized
{"error":"unauthorized"}
```

## Verification evidence
- Admin API tests include `DISCORD_BOT_TOKEN` fallback coverage (`apps/admin-api/tests/discord-guilds.test.js`).
- Web build + client artifact scan passed (`scripts/verify/web-runtime-env-required-v037.sh`).

## Commits
- `6255953` fix(web): restore settings + guild fetch (active club) v0.37
