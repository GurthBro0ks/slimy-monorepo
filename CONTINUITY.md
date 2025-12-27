# CONTINUITY LEDGER

## Goal (success criteria)
- Maintain compaction-safe continuity for the Slimy monorepo (Codex/agents can resume work correctly).
- Keep prod builds clean (no `localhost`/loopback in public-facing configs).
- Prepare shared Settings + Memory so Discord (/commands) and Web UI stay in sync.

## Constraints / Non-negotiables
- **No localhost in prod**: Production artifacts must not reference `localhost`, `127.0.0.1`, or internal service DNS in any `NEXT_PUBLIC_*` or other client-visible output.
- **Dev overrides only**: Localhost/loopback belongs in dev-only compose override files (ex: `docker-compose.dev.yml`) or local env—not in base prod defaults.
- **Flight Recorder**: Any non-trivial fix/change gets a buglog entry in `docs/buglog/` with commands + evidence.
- **UI debug/status rule**: Every UI page change should include a temporary debug/status area/button.

## Key decisions
- **Agent Rules**: Use `AGENTS.md` at repo root + per-folder overrides.
- **Continuity Strategy**:
  - `CONTINUITY.md` = canonical *current* state (short).
  - `docs/buglog/` = detailed evidence + timelines.
- **Shared Settings & Memory** (incoming):
  - One canonical `UserSettings` per user and `GuildSettings` per guild (auto-init on first use).
  - Discord bot commands and website UI both read/write the same settings via `admin-api` (or a dedicated shared service behind it).
  - “Memory” starts as structured summaries/state in DB (not raw chat logs by default), then can evolve to Memori or another engine later.

## State

### Done
- Admin UI prod hardening: no localhost public URLs; dev-only override supported; build guardrails to prevent loopback in `NEXT_PUBLIC_*`.
- Added verification scripts for “no localhost” regression (and CI step if present).
- Settings+Memory v0: shared contracts + admin-api persistence/endpoints + regression check.
- Settings+Memory v0 hardening: tightened authz + kind allowlist (blocks cross-user access; blocks `project_state` for `scopeType=user` for non-admins).
- Settings Sync Clients v0.1: bot + admin-ui wired to central settings/memory endpoints (markdown toggle, widget toggle, `profile_summary` write); memory kind policy centralized in `@slimy/contracts`; internal bot auth token support added; CI runs v0.1 verify + no-localhost client source scan.
- Settings Sync Events v0.2: settings update audit trail + cursor endpoint; events written on settings updates; bot + admin-ui consume changes on-demand; CI runs v0.2 regression.
- Web Settings UI v0.3: `apps/web` `/settings` + `/club/[guildId]/settings` JSON editors calling the same admin-api endpoints/contracts; web verify script scans built client artifacts for loopback; client login redirects use `/api/auth/login` (no baked `NEXT_PUBLIC_ADMIN_API_BASE`).
- Web Settings UI v0.31: added “Basic Settings” panels above the JSON editors (theme/chat/snail + widget/channels) while keeping JSON as the advanced/source-of-truth view.
- Web Settings UI v0.32: settings pages polished with save state machine, diff preview, reset, and stale-change warning (via settings change cursor) + v0.32 verify script.
- Web Settings UI v0.33: settings discoverability + drafts/unsaved guards + improved diff + memory panel + v0.33 verify script (CI-safe).
- AGENTS.md + CONTINUITY checks enforced in CI.
- Local preflight: `scripts/verify/compose-ports-available.sh` detects host port collisions before `docker compose up`.
- CI guardrail: `scripts/verify/compose-config-valid.sh` ensures `docker compose config` succeeds (catches compose/env/YAML issues).
- Bot image fix: ensure runtime deps (incl `discord.js`) are included; added local verify `scripts/verify/bot-runtime-deps.sh`.

### Now
- Keep hard safety rails green (no loopback in public output; no secrets in memory).

### Next
- Web Settings UI: polish/UX and deep links (keep non-chat scope).
- Add “MemoryProvider” abstraction behind admin-api (DB v0 -> Memori later) without contract changes.

## Open questions (UNCONFIRMED if needed)
- UNCONFIRMED: Whether “memory” should later move from primary DB to a dedicated service container (after v0).

## Working set (files/ids/commands)
- Root: `CONTINUITY.md`, `AGENTS.md`
- Per-folder: `apps/*/AGENTS.md`, `packages/AGENTS.md`, `scripts/AGENTS.md`, `docs/AGENTS.md`
- Verify scripts: `scripts/verify/*`
- Common commands:
  - `docker compose up -d --build`
  - `pnpm -w test` / `pnpm -w lint` (when available)
  - `scripts/verify/*` (when touching env/auth/build outputs)
