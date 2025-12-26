# Admin UI — Agent Rules

## Build & Env
- Production must not ship any `NEXT_PUBLIC_*` with loopback/localhost.
- Built output must be scanned when env/build logic changes (use verify scripts).

## Settings + Memory
- Admin UI must call admin-api endpoints; do not fork settings/memory logic.
- Prefer `@slimy/admin-api-client` helpers (configured with a non-loopback base URL).

## UI invariants
- Preserve slime.chat widget behavior unless the task explicitly changes it.
- Preserve temporary debug/status area/button policy for UI changes.
