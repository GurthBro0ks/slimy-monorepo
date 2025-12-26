# Bot (Discord) — Agent Rules

## Settings + Memory integration
- Bot should not be a separate source of truth for settings.
- Bot /commands must read/write settings via admin-api (or shared service) using shared schemas/types.
- Prefer “write-through” behavior: command -> admin-api -> DB -> response.

## Safety
- Never log tokens or secrets.
- Handle Discord rate limits; avoid tight loops.
- Use idempotent command handlers where possible.

## Continuity
- If adding new settings:
  - Add schema/type in shared package
  - Add admin-api endpoints
  - Add bot command wiring
  - Add at least one verification (test or script)

