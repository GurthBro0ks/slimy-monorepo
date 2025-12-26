# Bot (Discord) — Agent Rules

## Settings + Memory integration
- Bot should not be a separate source of truth for settings.
- Bot /commands must read/write settings via admin-api (or shared service) using shared schemas/types.
- Prefer `@slimy/admin-api-client` helpers and `ADMIN_API_INTERNAL_URL` for server-to-server calls.
- Prefer “write-through” behavior: command -> admin-api -> DB -> response.

## Safety
- Never log tokens or secrets.
- Bot must never store secrets in MemoryRecord `content` (denylist: token/secret/password/key/auth/cookie).
- Handle Discord rate limits; avoid tight loops.
- Use idempotent command handlers where possible.

## Continuity
- If adding new settings:
  - Add schema/type in shared package
  - Add admin-api endpoints
  - Add bot command wiring
  - Add at least one verification (test or script)
