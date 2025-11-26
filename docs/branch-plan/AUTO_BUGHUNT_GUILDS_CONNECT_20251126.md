# AUTO_BUGHUNT_GUILDS_CONNECT_20251126

## Phase 0 – Orientation
- pwd: /opt/slimy/slimy-monorepo
- git status -sb: `## main...origin/main`
- ls (root): admin-api.log, admin-api.pid, apps, DOCKER_DEPLOYMENT.md, docs, infra, lib, node_modules, package.json, package-lock.json, packages, pnpm-lock.yaml, pnpm-workspace.yaml, README.md, scripts, snailwiki, web.log

## Worklog
- [start] Initialized worklog and captured baseline context.

## Phase 1 – Recon & Repro prep
- Located frontend call site: `apps/web/components/dashboard/guild-list.tsx` posts to `/api/guilds/connect` with `{ guildId, name, icon }`.
- Noted rewrites in `apps/web/next.config.js` proxy `/api/*` to admin-api at `http://127.0.0.1:3080`.
- Backend route: `apps/admin-api/src/routes/guilds.js` POST `/connect` uses `guildService.connectGuild(userId, { guildId, name, icon })`.
- Observed runtime 500 via `docker logs slimy-admin-api --tail 200`: Prisma validation error during `guild.upsert` because `ownerId` is `undefined` in connectGuild. Route currently uses `req.user.sub`, but auth sets `req.user.id`, so ownerId becomes undefined and Prisma complains owner relation missing. Example payload: guildId 1176605506912141444, user 427999592986968074.
- Implemented fix for `/api/guilds/connect`: normalized auth user IDs (id/sub) in `apps/admin-api/src/middleware/auth.js`, validated user presence in `apps/admin-api/src/routes/guilds.js`, and updated `apps/admin-api/src/services/guild.service.js` to upsert the owner via `discordId` before guild/userGuild upserts, returning clear 4xx errors for missing context.
- Added coverage: updated auth middleware expectations (`apps/admin-api/tests/auth/auth-middleware.test.js`) and new unit test `apps/admin-api/tests/guilds-connect.test.js` to ensure owner/guild linking uses the authenticated user.
- Adjusted test mocks to support upserts (`apps/admin-api/jest.setup.js`).
- Tests: `pnpm --filter @slimy/admin-api test -- guilds-connect` (pass), `pnpm --filter @slimy/admin-api test` (pass).
- HTTP checks (no auth): `/api/health` 200, `/api/diag` 200 (unauthenticated flag), `/api/guilds` 401 (expected), `/api/guilds/connect` 401 (expected, no 5xx).
