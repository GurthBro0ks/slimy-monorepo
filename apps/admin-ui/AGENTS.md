# Admin UI — Agent Rules

## Build & Env
- Production must not ship any `NEXT_PUBLIC_*` with loopback/localhost.
- Built output must be scanned when env/build logic changes (use verify scripts).

## UI invariants
- Preserve slime.chat widget behavior unless the task explicitly changes it.
- Preserve temporary debug/status area/button policy for UI changes.

