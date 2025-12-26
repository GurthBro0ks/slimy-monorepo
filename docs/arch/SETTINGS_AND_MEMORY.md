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

## Endpoints (v0)
- Settings:
  - `GET  /api/settings/user/:userId` (auto-init)
  - `PUT  /api/settings/user/:userId` (full replace; validated)
  - `GET  /api/settings/guild/:guildId` (auto-init; admin only)
  - `PUT  /api/settings/guild/:guildId` (full replace; validated; admin only)
- Memory:
  - `GET  /api/memory/:scopeType/:scopeId?kind=`
  - `POST /api/memory/:scopeType/:scopeId`

## Future: MemoryProvider interface (swap-in)
- Keep admin-api as the single API surface.
- Introduce a `MemoryProvider` abstraction (DB v0 -> Memori or other backend later) behind admin-api,
  without changing client contracts.

