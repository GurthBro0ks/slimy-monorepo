# Trader Auth Cutover - NUC2

**Date**: 2026-01-10
**Host**: slimy-nuc2
**Branch**: feat/trader-ui-private @ e92162c
**Status**: Completed (with notes)

## Objective

Apply trader auth migrations, fix TLS for trader.slimyai.xyz, restart services.

## Pre-flight Status

| Item | Status | Details |
|------|--------|---------|
| DNS | OK | trader.slimyai.xyz -> 68.179.170.248 |
| TLS | FAILING | `tlsv1 alert internal error` |
| Web App | OK | 127.0.0.1:3000 healthy |

### Root Cause
- `/etc/caddy/Caddyfile` missing `trader.slimyai.xyz` block
- Repo file `infra/docker/Caddyfile.slimy-nuc2` has it (lines 101-118)

## Phase 1: Buglog
- Created this file

## Phase 2: Prisma Migration
### Finding
Running `prisma db push` from `apps/web` is unsafe because it would attempt to drop shared tables (`users`, `guilds`, etc.) in the shared prod DB.

### Action (admin-api Prisma migration, safe + non-destructive)
- Added trader auth models to `apps/admin-api/prisma/schema.prisma`
- Added migration `apps/admin-api/prisma/migrations/20260110120000_add_trader_auth/migration.sql` (create-only)
- `prisma migrate deploy` initially failed because the tables already existed (created previously via raw SQL)
- Verified trader tables exist via `prisma db pull --print` and resolved the failed migration by marking it applied

### Commands / Receipts
- Validate schema:
  - `cd apps/admin-api && /opt/slimy/slimy-monorepo/apps/web/node_modules/.bin/prisma validate`
- Apply migrations:
  - `cd apps/admin-api && /opt/slimy/slimy-monorepo/apps/web/node_modules/.bin/prisma migrate deploy`
- Verify tables exist (introspection):
  - `cd apps/admin-api && /opt/slimy/slimy-monorepo/apps/web/node_modules/.bin/prisma db pull --print | rg -n 'trader_(users|invites|sessions|login_attempts)' -C 2`
- Resolve migration state (because tables already existed):
  - `cd apps/admin-api && /opt/slimy/slimy-monorepo/apps/web/node_modules/.bin/prisma migrate resolve --applied 20260110120000_add_trader_auth`
- Final check:
  - `cd apps/admin-api && /opt/slimy/slimy-monorepo/apps/web/node_modules/.bin/prisma migrate deploy` => `No pending migrations to apply.`

## Phase 3: Invite Tool Test
- Ran invite generator successfully (plaintext invite code REDACTED):
  - `pnpm tsx scripts/trader_invite_create.ts --note "cutover-test"`
  - Receipt: created invite with note `cutover-test` (ID recorded in terminal output; code not recorded here).

## Phase 4: TLS Fix
- Validated repo Caddyfile and reloaded Caddy with it (no disk change to `/etc/caddy/Caddyfile`):
  - `caddy validate --config infra/docker/Caddyfile.slimy-nuc2`
  - `caddy reload --config infra/docker/Caddyfile.slimy-nuc2 --adapter caddyfile`
- Receipt:
  - `curl -I https://trader.slimyai.xyz/` => `HTTP/2 200`
  - `journalctl -u caddy` shows ACME success for `trader.slimyai.xyz`

**Note**: `/etc/caddy/Caddyfile` is still missing the `trader.slimyai.xyz` block; persisting the fix on disk requires root access.

## Phase 5: Service Verification
- Observed `/trader` was `404` on the existing web upstream at `127.0.0.1:3000` (deployment behind that port does not include the new trader routes).
- Workaround deployed (local standalone server + proxy swap for trader domain only):
  - Built `apps/web` locally (`pnpm build`).
  - Started a standalone Next server on `:3002` (detached) and updated Caddy **in-memory** to route `trader.slimyai.xyz` to `127.0.0.1:3002`.
  - Receipt:
    - `curl -I https://trader.slimyai.xyz/trader` => `307` to `/trader/login?returnTo=/trader`
    - `curl -s -o /dev/null -w '%{http_code}\n' https://trader.slimyai.xyz/trader/auth/me` => `401`

## Phase 6: Final Receipts
- `curl -I https://trader.slimyai.xyz/` => `200`
- `curl -I https://trader.slimyai.xyz/trader` => `307` (expected)
