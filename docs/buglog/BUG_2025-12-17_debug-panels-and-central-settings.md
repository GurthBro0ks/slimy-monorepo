# BUG 2025-12-17 — Debug Panels Everywhere + Central Settings MVP

## Context
- Host: NUC2
- Repo: `/opt/slimy/slimy-monorepo`
- Stack: `db`, `admin-api`, `web`, `admin-ui` (Docker Compose)
- Note: Step 1 “guilds = (user ∩ SlimyAI bot) + roleLabel/roleSource” is already implemented.

## Symptom / Motivation
- Debugging “member/admin wrong” and routing/config issues is slow because there is no always-available status surface in the UIs.
- Settings/config is scattered; need a central per-user and per-guild settings store with safe read/write APIs.

## Safety Rules (No Secrets)
- Never print tokens/cookies/secrets.
- Settings APIs must never accept `userId` from client; always use `req.user.id`.
- Guild settings writes require `admin|manager` access for that guild.

## Work Log
### Commands (outputs captured where relevant, no secrets)
- `pnpm --filter @slimy/admin-api prisma:generate`
- `pnpm --filter @slimy/admin-api test` (PASS)
- `pnpm smoke:docker` (PASS; applied Prisma migrations in Docker)

### Changes
- Added DebugDock UI to `apps/web` (App Router) and `apps/admin-ui` (Pages Router), gated by `NEXT_PUBLIC_DEBUG_UI=1` or `Ctrl+Shift+D` localStorage toggle.
- Added central settings Prisma tables/models: `UserSettings` (keyed by Discord user id) and `GuildSettings` (keyed by guild id), plus migration `20251217190000_add_central_settings`.
- Implemented central settings APIs:
  - `GET/PATCH /api/me/settings` (auto-creates defaults; uses `req.user.id`, CSRF for PATCH)
  - `GET/PATCH/PUT /api/guilds/:guildId/settings` (auto-creates defaults; requires SlimyAI bot in guild + admin/manager access)
- Added tests covering settings auto-create, merge updates, and guild-role gating.

### Verification
- `pnpm --filter @slimy/admin-api test`: PASS (includes `tests/central-settings.test.js`)
- `pnpm smoke:docker`: PASS (baseline stack boots; admin-ui bridge endpoints OK)
