# Slimy Monorepo — Agent Rules

## Continuity Ledger (compaction-safe)
- `CONTINUITY.md` is canonical for current goal/constraints/decisions/state.
- At the start of every work session/turn:
  1) Read `CONTINUITY.md`
  2) Update it if reality changed (Goal/Constraints/Key decisions/Now/Next/Open questions)
  3) Proceed with work
- Keep it short and stable: facts only, prefer bullets, no transcripts. Mark uncertainty as `UNCONFIRMED`.

## Flight Recorder (required for non-trivial changes)
- Create/update: `docs/buglog/BUG_<YYYY-MM-DD>_<slug>.md`
- Must include:
  - Symptom/context
  - Plan
  - Files changed
  - Commands run + outputs (snippets OK)
  - Verification evidence

## Repo-wide safety rails
- **No localhost in prod**: Never allow `localhost`/`127.0.0.1` in any production client-visible output.
- **Dev overrides only**: Localhost belongs in dev-only compose overrides or local env.
- **Do not bake local env into prod**: `.env*` files must not be included in production images/build artifacts.
- When changing auth/cookies/proxy/build env:
  - Add/adjust a regression test or verify script
  - Record results in buglog

## Shared Settings + Memory (Discord + Web)
- There must be one canonical source of truth for:
  - UserSettings (per user)
  - GuildSettings (per guild)
- Discord bot (/commands) and Web UI must use the same admin-api endpoints/contracts.
- Avoid duplicating settings logic in multiple apps.
- If a change affects settings/memory:
  - Update shared schemas/types (prefer `packages/`)
  - Update admin-api endpoints
  - Update bot command behavior
  - Update web/admin UI behavior
  - Add at least one regression check (test or script)

## Per-folder overrides
- Always check for the closest `AGENTS.md` in the directory tree of files you modify.
- Folder-level rules override/extend root rules.

## Defaults
- Prefer small diffs, scoped changes, and deterministic scripts.
- Never commit secrets (tokens, cookies, client secrets, private keys).

