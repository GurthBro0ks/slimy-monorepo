# Web App — Agent Rules

## Scope
- Keep public site changes isolated; do not modify admin-ui behavior from here.

## Settings + Memory
- UI must call admin-api endpoints; do not fork settings logic locally.
- Prefer `@slimy/admin-api-client` (or the existing admin-api client wrapper) for consistent calls/contracts.

## Chat module
- Avoid regressions in `/chat` and related components.
- Respect the project rule: UI changes include temporary debug/status area/button.
