# Settings + Memory (v0)

## Goals
- One canonical `UserSettings` per user and `GuildSettings` per guild, auto-initialized on first access.
- Discord bot (/commands) and Web/Admin UI use the same admin-api endpoints and shared contracts.
- “Memory” is small, structured JSON state/summaries (not raw chat logs by default).

## Canonical source of truth
- **Schemas + defaults + guardrails**: `packages/contracts` (`@slimy/contracts`)
- **Persistence + API surface**: `apps/admin-api`
- **Client helpers**: `packages/admin-api-client` (`@slimy/admin-api-client`)

## What is stored
- `UserSettings`: per-user prefs (theme/chat/snail fields), versioned, with `updatedAt`.
- `GuildSettings`: per-guild prefs (bot enabled / channel IDs / widget flag), versioned, with `updatedAt`.
- `MemoryRecord`: per-scope record(s) keyed by `(scopeType, scopeId, kind)` with:
  - `kind`: `"profile_summary" | "preferences" | "project_state" | "snail_lore"`
  - `content`: small JSON object

## What is forbidden (guardrails)
- Never store or log secrets in Memory `content`.
- The admin-api rejects secret-like keys anywhere in `content` (denylist includes):
  - `token`, `secret`, `password`, `key`, `auth`, `cookie`
- The admin-api enforces a hard max size on `content` (see `MAX_MEMORY_CONTENT_BYTES` in `@slimy/contracts`).
- Kind/scope policy is centralized in `@slimy/contracts` (`MEMORY_KIND_POLICY` + `checkMemoryKindPolicy`) so admin-api and clients cannot drift.
  - `profile_summary` is `scopeType=user` only.
  - `project_state` requires platform admin when `scopeType=user`.

## Endpoints (v0)
- Settings:
  - `GET  /api/settings/user/:userId` (auto-init)
  - `PUT  /api/settings/user/:userId` (full replace; validated)
  - `GET  /api/settings/guild/:guildId` (auto-init; guild admin/manage or platform admin)
  - `PUT  /api/settings/guild/:guildId` (full replace; validated; guild admin/manage or platform admin)
- Memory:
  - `GET  /api/memory/:scopeType/:scopeId?kind=`
  - `POST /api/memory/:scopeType/:scopeId`

## Settings change events (v0.2)
- Purpose: durable “settings changed” cursor + audit trail so clients can refresh without logic drift.
- Storage: `settings_change_events` (Prisma model: `SettingsChangeEvent` in `apps/admin-api/prisma/schema.prisma`)
- Events are written by admin-api on successful settings updates:
  - `kind`: `user_settings_updated` / `guild_settings_updated` (allowlisted in `@slimy/contracts`)
  - `source`: derived from `x-slimy-client` header (`discord` / `admin-ui` / `web` / `api` / `unknown`)
  - `changedKeys`: shallow-ish diff paths under `prefs.*` (best-effort, capped)
- Cursor endpoint:
  - `GET /api/settings/changes-v0?scopeType=user|guild&scopeId=...&sinceId=...&limit=...&kind=...`
  - Response: `{ ok: true, events: [...], nextSinceId }`
  - Semantics: events are returned oldest-first; `nextSinceId` is the last event `id` in the response (or the request `sinceId` when empty)
  - Caps: `limit` is clamped to `<= 200`.
  - Authz mirrors settings:
    - `scopeType=user`: only the authed user (or platform admin)
    - `scopeType=guild`: require guild admin/manage (or platform admin); bot requests can use interaction permissions

## Bot -> admin-api auth (internal)
- Discord bot requests can authenticate to these same endpoints using a shared secret token:
  - Env: `ADMIN_API_INTERNAL_BOT_TOKEN`
  - Headers:
    - `x-slimy-internal-bot-token` (must match env)
    - `x-slimy-bot-actor-discord-id` (the Discord user ID the command is acting for)
    - Guild-only: `x-slimy-bot-interaction-guild-id` + `x-slimy-bot-interaction-permissions` (Discord permissions bitfield)
- This is intended for server-to-server calls; the token must not be exposed to browsers or stored in Memory.

## Future: MemoryProvider interface (swap-in)
- Keep admin-api as the single API surface.
- Introduce a `MemoryProvider` abstraction (DB v0 -> Memori or other backend later) behind admin-api,
  without changing client contracts.

## Note: committed `dist/` artifacts (temporary)
- `packages/contracts/dist/**` and `packages/admin-api-client/dist/**` are currently committed so runtime consumers
  (ex: the admin-api Docker image) can `require("@slimy/contracts")` without adding a package build step yet.
- This is intentionally temporary; prefer moving to “build packages in CI/Docker” and then stop committing `dist/` to avoid drift/noisy diffs.
